import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
  email: string;
  password: string;
};

const schema = yup.object({
  email: yup.string()
    .required('El email es requerido')
    .email('Email inválido'),
  password: yup.string()
    .required('Contraseña requerida')
    .min(6, 'Mínimo 6 caracteres'),
}).required();

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login: authLogin } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('Aviso');
  const [loading, setLoading] = useState(false);

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
        if (params.error === 'email_conflict') {
          const provider = params.provider as string;
          setModalTitle('Cuenta Existente');
          setModalMessage(
            `Este email ya está registrado con ${provider === 'local' ? 'contraseña' : 'Google'}. ` +
            `Por favor inicia sesión con ${provider === 'local' ? 'tu contraseña' : 'Google'}.`
          );
        } else {
          setModalTitle('Error');
          setModalMessage('No se pudo completar la autenticación');
        }
        setModalVisible(true);
      }
    }
  }, [params]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        const clientUrl = API_URL.replace('/api', '');
        if (event.origin !== clientUrl && event.origin !== window.location.origin) {
          console.warn('Mensaje de origen no confiable:', event.origin);
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleOAuthCallback(event.data.token, event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          setModalTitle('Error');
          setModalMessage('No se pudo completar la autenticación con Google');
          setModalVisible(true);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

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
      console.error('Error al procesar autenticación:', error);
      setModalTitle('Error');
      setModalMessage('Error al procesar autenticación');
      setModalVisible(true);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      const { token, user } = res.data;
      
      const rolesRes = await api.get(`/user/${user.id}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      user.roles = rolesRes.data.roles || [];
      
      await authLogin(token, user);
      router.replace('/');
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Error en el servidor';
      setModalTitle('Error');
      setModalMessage(message);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === 'web') {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          `${API_URL}/auth/google`,
          'Google Login',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup) {
          setModalTitle('Error');
          setModalMessage('No se pudo abrir la ventana de autenticación. Verifica que no estés bloqueando popups.');
          setModalVisible(true);
        }
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          `${API_URL}/auth/google`,
          'rn3azul://'
        );
      }
    } catch (error) {
      console.error('Error en Google login:', error);
      setModalTitle('Error');
      setModalMessage('No se pudo iniciar sesión con Google');
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Logo McDonald's */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>M</Text>
        </View>

        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

        <Controller
          control={control}
          name="email"
          defaultValue=""
          render={({ field: { onChange, value, onBlur } }) => (
            <>
              <TextInput
                placeholder="Email"
                style={[styles.input, errors.email && styles.inputError]}
                onChangeText={onChange}
                value={value}
                onBlur={onBlur}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
              {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
            </>
          )}
        />

        <Controller
          control={control}
          name="password"
          defaultValue=""
          render={({ field: { onChange, value, onBlur } }) => (
            <>
              <TextInput
                placeholder="Contraseña"
                style={[styles.input, errors.password && styles.inputError]}
                secureTextEntry
                onChangeText={onChange}
                value={value}
                onBlur={onBlur}
                onSubmitEditing={handleSubmit(onSubmit)}
                placeholderTextColor="#999"
              />
              {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
            </>
          )}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
          <Image source={GoogleIcon} style={styles.googleIcon} />
          <Text style={styles.socialButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>¿No tenés cuenta? <Text style={styles.linkBold}>Registrate</Text></Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.backButtonText}>← Volver al inicio</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        type={modalTitle === 'Error' ? 'delete' : 'info'}
        title={modalTitle}
        message={modalMessage}
        confirmText="Aceptar"
        onConfirm={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
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
    marginBottom: 8,
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
});