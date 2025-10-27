import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as WebBrowser from 'expo-web-browser';
import api, { API_URL } from '../config/api';
import { Platform } from 'react-native';
import GoogleIcon from '../assets/google-icon.png';
import CustomModal from './components/CustomModal';
import { useAuth } from './context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

type FormData = {
  username: string;
  email: string;
  full_name: string;
  password: string;
  password2: string;
};

const schema = yup.object({
  username: yup.string()
    .required('Nombre requerido')
    .min(3, 'Mínimo 3 caracteres'),
  email: yup.string()
    .required('Email requerido')
    .email('Email inválido')
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'El email debe contener @ y un dominio válido'
    ),
  full_name: yup.string()
    .required('Nombre completo requerido')
    .min(3, 'Mínimo 3 caracteres'),
  password: yup.string()
    .required('Contraseña requerida')
    .min(6, 'Mínimo 6 caracteres'),
  password2: yup.string()
    .required('Confirmación requerida')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
});

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login: authLogin } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'delete'>('info');
  const [modalTitle, setModalTitle] = useState('Aviso');
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isMobile = screenWidth < 768;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onTouched'
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (params.token && params.user) {
        handleOAuthCallback(params.token as string, params.user as string);
      }
      if (params.error) {
        if (params.error === 'account_exists') {
          const provider = params.provider as string;
          showModal(
            'delete',
            'Cuenta Existente',
            `Esta cuenta ya está registrada con ${provider === 'local' ? 'contraseña' : 'Google'}. Por favor, inicia sesión en lugar de registrarte.`
          );
        } else {
          showModal('delete', 'Error', 'No se pudo completar el registro con Google');
        }
      }
    }
  }, [params]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        const clientUrl = API_URL.replace('/api', '');
        if (event.origin !== clientUrl && event.origin !== window.location.origin) {
          console.warn('⚠️ Message from untrusted origin:', event.origin);
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleOAuthCallback(event.data.token, event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          if (event.data.error === 'account_exists') {
            const provider = event.data.provider || 'local';
            showModal(
              'delete',
              'Cuenta Existente',
              `Esta cuenta ya está registrada con ${provider === 'local' ? 'contraseña' : 'Google'}. Por favor, inicia sesión en lugar de registrarte.`
            );
          } else {
            showModal('delete', 'Error', 'No se pudo completar el registro con Google');
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const showModal = (type: 'info' | 'delete', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleOAuthCallback = async (token: string, userStr: string) => {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));
      
      const rolesRes = await api.get(`/user/${user.id}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      user.roles = rolesRes.data.roles || [];
      
      await authLogin(token, user);
      router.replace('/');
    } catch (error) {
      showModal('delete', 'Error', 'Error al procesar el registro');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const payload = {
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        password: data.password
      };
      const res = await api.post('/auth/register', payload);
      const { token, user } = res.data;
      
      const rolesRes = await api.get(`/user/${user.id}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      user.roles = rolesRes.data.roles || [];
      
      await authLogin(token, user);
      router.replace('/');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Error al registrar';
      showModal('delete', 'Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      if (Platform.OS === 'web') {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          `${API_URL}/auth/google`,
          'Google Register',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup) {
          showModal(
            'delete',
            'Error',
            'No se pudo abrir la ventana de autenticación. Verifica que no estés bloqueando popups.'
          );
        }
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          `${API_URL}/auth/google`,
          'mcdonalds-azul://'
        );
      }
    } catch (error) {
      showModal('delete', 'Error', 'No se pudo registrar con Google');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Contenedor escalado al 85% */}
        <View style={styles.scaledContainer}>
          <View style={styles.card}>
            {/* Logo McDonald's */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>M</Text>
            </View>

            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Unite y empezá a disfrutar</Text>

            <View style={isMobile ? styles.columnLayout : styles.rowLayout}>
              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="username"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.username && styles.inputError]}
                        placeholder="Usuario"
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                      {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="full_name"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.full_name && styles.inputError]}
                        placeholder="Nombre y apellido"
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                      {errors.full_name && <Text style={styles.error}>{errors.full_name.message}</Text>}
                    </>
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              defaultValue=""
              render={({ field: { onChange, value, onBlur } }) => (
                <>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Email"
                    keyboardType="email-address"
                    onChangeText={onChange}
                    value={value}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                  {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
                </>
              )}
            />

            <View style={isMobile ? styles.columnLayout : styles.rowLayout}>
              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="password"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="Contraseña"
                        secureTextEntry
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        placeholderTextColor="#999"
                      />
                      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="password2"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.password2 && styles.inputError]}
                        placeholder="Repetir contraseña"
                        secureTextEntry
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        onSubmitEditing={handleSubmit(onSubmit)}
                        placeholderTextColor="#999"
                      />
                      {errors.password2 && <Text style={styles.error}>{errors.password2.message}</Text>}
                    </>
                  )}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#292929" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleRegister}>
              <Image source={GoogleIcon} style={styles.googleIcon} />
              <Text style={styles.socialButtonText}>Registrarse con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signin')}>
              <Text style={styles.link}>¿Ya tenés cuenta? <Text style={styles.linkBold}>Ingresá acá</Text></Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </View>

        <CustomModal
          visible={modalVisible}
          type={modalType}
          title={modalTitle}
          message={modalMessage}
          confirmText="Aceptar"
          onConfirm={() => setModalVisible(false)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Cambiado de 'center' a 'flex-start'
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10, // Reducido el padding vertical
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  scaledContainer: {
    transform: [{ scale: 0.80 }],
    width: '100%',
    alignItems: 'center',
    marginTop: -50, // Agregado margen superior
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFBC0D',
    textShadowColor: '#DA291C',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    color: '#292929',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    fontSize: 15,
    color: '#292929',
  },
  inputError: {
    borderColor: '#DA291C',
  },
  error: {
    color: '#DA291C',
    alignSelf: 'flex-start',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FFBC0D',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#FFBC0D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#292929',
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0'
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  socialButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 15,
    color: '#292929',
    fontWeight: '600'
  },
  link: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  linkBold: {
    color: '#DA291C',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    padding: 12,
  },
  backButtonText: {
    color: '#DA291C',
    fontSize: 15,
    fontWeight: '600',
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 0,
  },
  columnLayout: {
    flexDirection: 'column',
    gap: 0,
    marginBottom: 0,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
});