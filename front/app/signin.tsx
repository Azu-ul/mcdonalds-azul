import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import api from '../config/api';
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
  const { login: authLogin } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('Aviso');
  const [loading, setLoading] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [urlChecked, setUrlChecked] = useState(false);

  // DEBUG: Descubrir información de la app
  useEffect(() => {
    console.log('🐛 DEBUG INFO:');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 App Config:', Constants.expoConfig);
    console.log('👤 Owner:', Constants.expoConfig?.owner);
    console.log('📛 Slug:', Constants.expoConfig?.slug);
    console.log('🔗 Scheme:', Constants.expoConfig?.scheme);
    
    // Calcular redirect URI manualmente
    const owner = Constants.expoConfig?.owner || 'anonymous';
    const slug = Constants.expoConfig?.slug || 'my-app';
    const expoRedirectUri = `https://auth.expo.io/@${owner}/${slug}`;
    console.log('🎯 Calculated Expo Redirect URI:', expoRedirectUri);
    
    // URL actual (para web)
    if (Platform.OS === 'web') {
      console.log('🌐 Current URL:', window.location.href);
      console.log('🌐 Origin:', window.location.origin);
    }
  }, []);

  // Configuración para Android - SIN redirectUri explícito
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    // NO especificar redirectUri - dejar que Expo lo maneje automáticamente
  });

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onTouched'
  });

  // Para mobile - manejar respuesta de Google
  useEffect(() => {
    console.log('🔍 Google Response:', response);
    
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('✅ Authentication success');
      
      if (authentication?.idToken) {
        handleGoogleAuth(authentication.idToken);
      }
    } else if (response?.type === 'error') {
      console.error('❌ Google Auth Error:', response.error);
      
      // Mostrar error detallado
      let errorMessage = 'Error de autenticación con Google';
      if (response.error?.message) {
        errorMessage += `: ${response.error.message}`;
      }
      
      setModalTitle('Error de Autenticación');
      setModalMessage(errorMessage);
      setModalVisible(true);
      setLoading(false);
    }
  }, [response]);

  // Para web - verificar URL
  useEffect(() => {
    if (Platform.OS === 'web' && !urlChecked) {
      checkURLForToken();
    }
  }, [urlChecked]);

  const checkURLForToken = () => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const idToken = hashParams.get('id_token');
      
      if (idToken) {
        console.log('✅ Token encontrado en URL');
        setUrlChecked(true);
        handleGoogleAuth(idToken);
        return;
      }
    }
    setUrlChecked(true);
  };

  const handleGoogleAuth = async (idToken: string) => {
    if (processingAuth) return;

    try {
      setProcessingAuth(true);
      setLoading(true);
      
      // Limpiar URL (solo web)
      if (Platform.OS === 'web') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      const res = await api.post('/auth/google', { id_token: idToken });
      const { token, user } = res.data;
      console.log('✅ Usuario autenticado:', user.email);
      
      // Obtener roles
      try {
        const rolesRes = await api.get(`/user/${user.id}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        user.roles = rolesRes.data.roles || [];
      } catch (rolesError) {
        console.warn('No se pudieron obtener los roles:', rolesError);
        user.roles = [];
      }
      
      await authLogin(token, user);
      console.log('🔀 Redirigiendo a home...');
      router.replace('/');
      
    } catch (err: any) {
      console.error('❌ Error en autenticación Google:', err);
      let message = 'Error al autenticar con Google';
      
      if (err?.response?.data?.error) {
        message = err.response.data.error;
      }
      
      setModalTitle('Error');
      setModalMessage(message);
      setModalVisible(true);
      
    } finally {
      setLoading(false);
      setProcessingAuth(false);
    }
  };

  // FUNCIÓN ONSUBMIT QUE FALTABA
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      const { token, user } = res.data;
      
      // Obtener roles del usuario
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

  const handleGoogleLoginWeb = () => {
    console.log('🔗 Iniciando Google OAuth para web...');
    
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const redirectUri = window.location.origin;
    const scope = 'openid profile email';
    const responseType = 'id_token';
    const nonce = Math.random().toString(36).substring(7);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `nonce=${nonce}&` +
      `prompt=select_account`;

    // Redirigir en la misma ventana
    window.location.href = authUrl;
  };

  const handleGoogleLoginMobile = async () => {
    try {
      console.log('📱 Iniciando Google OAuth en mobile...');
      console.log('Request disponible:', !!request);
      
      if (!request) {
        console.log('⚠️ Request no disponible');
        setModalTitle('Error');
        setModalMessage('La autenticación no está disponible en este momento');
        setModalVisible(true);
        setLoading(false);
        return;
      }
      
      await promptAsync();
      
    } catch (error) {
      console.error('❌ Error al iniciar Google OAuth:', error);
      setModalTitle('Error');
      setModalMessage('Error al iniciar la autenticación con Google');
      setModalVisible(true);
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('🎯 Iniciando login con Google, plataforma:', Platform.OS);
    setLoading(true);
    
    if (Platform.OS === 'web') {
      handleGoogleLoginWeb();
    } else {
      handleGoogleLoginMobile();
    }
  };

  // Mostrar loader durante la autenticación automática
  if (processingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
        <Text style={styles.loadingText}>Iniciando sesión con Google...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scaledContainer}>
        <View style={styles.card}>
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

          <TouchableOpacity 
            style={[
              styles.socialButton, 
              (loading || !request) && styles.buttonDisabled
            ]} 
            onPress={handleGoogleLogin}
            disabled={loading || !request}
          >
            <Image source={GoogleIcon} style={styles.googleIcon} />
            <Text style={styles.socialButtonText}>
              {loading ? 'Cargando...' : 'Continuar con Google'}
            </Text>
          </TouchableOpacity>

          {/* BOTÓN DEBUG TEMPORAL */}
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: '#f0f0f0', marginTop: 10 }]}
            onPress={() => {
              const owner = Constants.expoConfig?.owner || 'anonymous';
              const slug = Constants.expoConfig?.slug || 'my-app';
              const redirectUri = `https://auth.expo.io/@${owner}/${slug}`;
              setModalTitle('DEBUG - Redirect URI');
              setModalMessage(`Copia esta URI y pégala en Google Cloud Console:\n\n${redirectUri}`);
              setModalVisible(true);
            }}
          >
            <Text style={[styles.socialButtonText, { color: '#666' }]}>
              🔧 Mostrar Redirect URI para Google Console
            </Text>
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
      </View>

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

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20
  },
  scaledContainer: {
    transform: [{ scale: 0.85 }],
    width: '100%',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#636363ff',
  },
});