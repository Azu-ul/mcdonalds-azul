import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api, { API_URL } from '../../config/api';
import CustomModal from "../components/CustomModal";
import ImagePickerModal from "../components/ImagePickerModal";
import { useAuth } from '../context/AuthContext';

// Components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileImageSection from '../components/profile/ProfileImageSection';
import PersonalInfoCard from '../components/profile/PersonalInfoCard';
import AddressCard from '../components/profile/AddressCard';
import DocumentCard from '../components/profile/DocumentCard';

type User = {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  profile_image_url?: string;
  document_image_url?: string | null;
  auth_provider: string;
};

type ProfileFormData = {
  full_name?: string;
  phone?: string;
  email?: string;
};

const profileSchema = yup.object({
  email: yup.string()
    .transform((value) => value?.trim() || '')
    .test('valid-email', 'Email inválido', function (value) {
      if (!value || value.length === 0) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }),
  full_name: yup.string()
    .transform((value) => value?.trim() || '')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]*$/, 'Solo letras'),
  phone: yup.string()
    .transform((value) => value?.trim() || '')
    .test('min-if-filled', 'Mínimo 8 caracteres', function (value) {
      if (!value || value.length === 0) return true;
      return value.length >= 8;
    })
    .max(20, 'Máximo 20 caracteres')
    .matches(/^[\+\d\s\-()]*$/, 'Solo números, espacios, paréntesis y guiones'),
}).required();

export default function Profile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateUser, logout } = useAuth();

  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    location: false,
    document: false,
    deletingDocument: false,
    profileImage: false,
    updatingProfile: false,
    updatingLocation: false,
  });
  const [saveStates, setSaveStates] = useState({
    profile: false,
    location: false,
  });
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState(''); // Siempre inicializado como string vacío
  const [modals, setModals] = useState({
    logout: false,
    deleteAccount: false,
    deleteDocument: false,
    imagePicker: false,
  });
  const [deleteCountdown, setDeleteCountdown] = useState(10);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: { email: '', full_name: '', phone: '' }
  });

  // Helper para actualizar loading states
  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const updateSaveState = (key: keyof typeof saveStates, value: boolean) => {
    setSaveStates(prev => ({ ...prev, [key]: value }));
    if (value) setTimeout(() => setSaveStates(prev => ({ ...prev, [key]: false })), 5000);
  };

  const updateModal = (key: keyof typeof modals, value: boolean) => {
    setModals(prev => ({ ...prev, [key]: value }));
  };

  // Token management
  const getToken = async () => {
    if (params.token) {
      const urlToken = Array.isArray(params.token) ? params.token[0] : params.token;
      await AsyncStorage.setItem('token', urlToken);
      return urlToken;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) router.replace('/');
    return token;
  };

  // Effects
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modals.deleteAccount && deleteCountdown > 0) {
      interval = setInterval(() => setDeleteCountdown(prev => prev - 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [modals.deleteAccount, deleteCountdown]);

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return router.replace('/');

      const res = await api.get('/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = res.data.user;

      setUser(userData);
      setUsername(userData.username || '');
      setAddress(userData.address || '');
      setValue('email', userData.email || '');
      setValue('full_name', userData.full_name || '');
      setValue('phone', userData.phone || '');

      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error loading profile:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim() || username.length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return;
    }

    try {
      updateLoadingState('updatingProfile', true);
      const res = await api.put('/profile/username', { username: username.trim() });
      const updatedUser = { ...user, username: res.data.user.username };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser({ username: res.data.user.username });
      setEditingUsername(false);
      Alert.alert('Éxito', 'Nombre actualizado');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Error al actualizar');
      setUsername(user?.username || '');
    } finally {
      updateLoadingState('updatingProfile', false);
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      updateLoadingState('updatingProfile', true);
      const payload: any = {};
      if (user?.auth_provider === 'local' && data.email?.trim()) payload.email = data.email.trim();
      if (data.full_name?.trim()) payload.full_name = data.full_name.trim();
      if (data.phone?.trim()) payload.phone = data.phone.trim();

      if (Object.keys(payload).length === 0) {
        Alert.alert('Error', 'No hay datos para actualizar');
        return;
      }

      const res = await api.put('/profile', payload);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      setValue('email', updatedUser.email || '');
      setValue('full_name', updatedUser.full_name || '');
      setValue('phone', updatedUser.phone || '');
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser(payload);
      Alert.alert('Éxito', 'Perfil actualizado');
      updateSaveState('profile', true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Error al actualizar');
    } finally {
      updateLoadingState('updatingProfile', false);
    }
  };

  const uploadProfileImageFile = async (file: File | { uri: string; name: string; type: string }) => {
    try {
      updateLoadingState('profileImage', true);
      const formData = new FormData();

      if ('uri' in file) {
        formData.append('image', {
          uri: Platform.OS === 'ios' && !file.uri.startsWith('file://') ? `file://${file.uri}` : file.uri,
          name: file.name,
          type: file.type,
        } as any);
      } else {
        formData.append('image', file);
      }

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Error al subir imagen');

      const data = await response.json();
      const updatedUser = { ...user, profile_image_url: data.profile_image_url };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser({ profile_image_url: data.profile_image_url });
      Alert.alert('Éxito', 'Foto actualizada');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo subir la imagen');
    } finally {
      updateLoadingState('profileImage', false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        await uploadProfileImageFile({ uri, name: filename, type });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        await uploadProfileImageFile({ uri, name: filename, type });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleGetLocation = async () => {
    try {
      updateLoadingState('location', true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const addressStr = await getAddressFromCoords(latitude, longitude);
      await api.put('/profile/location', { latitude, longitude, address: addressStr });

      const updatedUser = { ...user, latitude, longitude, address: addressStr };
      setUser(updatedUser as User);
      setAddress(addressStr);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Éxito', `Ubicación actualizada\n${addressStr}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      updateLoadingState('location', false);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AuthApp/1.0', 'Accept-Language': 'es' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const addr = data.address;
          const parts = [
            addr.road, addr.house_number, addr.neighbourhood, addr.suburb,
            addr.city || addr.town || addr.village, addr.state,
            addr.postcode ? `CP ${addr.postcode}` : null, addr.country
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(', ') : data.display_name;
        }
      }
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const handleUpdateLocation = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Ingresa una dirección');
      return;
    }

    try {
      updateLoadingState('updatingLocation', true);
      await api.put('/profile/location', {
        latitude: user?.latitude || 0,
        longitude: user?.longitude || 0,
        address: address.trim()
      });

      const updatedUser = { ...user, address: address.trim() };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Éxito', 'Ubicación actualizada');
      updateSaveState('location', true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Error al actualizar');
    } finally {
      updateLoadingState('updatingLocation', false);
    }
  };

  const handleLogout = async () => {
    updateModal('logout', false);
    await logout();
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile');
      updateModal('deleteAccount', false);
      await logout();
      Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada permanentemente');
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const getProfileImageUrl = () => {
    if (!user?.profile_image_url) return null;
    let url = user.profile_image_url;
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+-c/, '=s400-c');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <ProfileHeader onBack={() => router.push('/')} />

      <ProfileImageSection
        imageUrl={getProfileImageUrl()}
        username={user?.username}
        email={user?.email}
        editingUsername={editingUsername}
        usernameValue={username}
        onUsernameChange={setUsername}
        onEdit={() => setEditingUsername(true)}
        onSave={handleUpdateUsername}
        onCancel={() => {
          setUsername(user?.username || '');
          setEditingUsername(false);
        }}
        onImagePress={() => updateModal('imagePicker', true)}
        loading={loadingStates.updatingProfile}
      />

      <PersonalInfoCard
        control={control}
        errors={errors}
        authProvider={user?.auth_provider || 'local'}
        onSave={handleSubmit(handleUpdateProfile)}
        loading={loadingStates.updatingProfile}
        saved={saveStates.profile}
      />

      <AddressCard
        address={address}
        onAddressChange={setAddress}
        onSave={handleUpdateLocation}
        onGetLocation={handleGetLocation}
        loadingLocation={loadingStates.location}
        loadingUpdate={loadingStates.updatingLocation}
        saved={saveStates.location}
      />

      <DocumentCard
        documentUrl={user?.document_image_url}
        onUpload={async () => {/* implement */ }}
        onDelete={() => updateModal('deleteDocument', true)}
        loading={loadingStates.document}
        deleting={loadingStates.deletingDocument}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={() => updateModal('logout', true)}>
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={() => {
        setDeleteCountdown(10);
        updateModal('deleteAccount', true);
      }}>
        <Text style={styles.deleteButtonText}>🗑️ Eliminar cuenta</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modals.logout}
        type="delete"
        title="Cerrar sesión"
        message="¿Seguro que querés salir?"
        confirmText="Sí, salir"
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={handleLogout}
        onCancel={() => updateModal('logout', false)}
      />

      <CustomModal
        visible={modals.deleteAccount}
        type="delete"
        title="⚠️ Eliminar cuenta"
        message={`Esta acción es IRREVERSIBLE.\n\n${deleteCountdown > 0 ? `Espera ${deleteCountdown} segundos...` : 'Ahora puedes confirmar.'}`}
        confirmText={deleteCountdown > 0 ? `Espera (${deleteCountdown}s)` : "Sí, eliminar"}
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={deleteCountdown === 0 ? handleDeleteAccount : undefined}
        onCancel={() => {
          updateModal('deleteAccount', false);
          setDeleteCountdown(10);
        }}
      />

      <ImagePickerModal
        visible={modals.imagePicker}
        onClose={() => updateModal('imagePicker', false)}
        onTakePhoto={takePhoto}
        onChooseGallery={pickImage}
        onCaptureWebcam={uploadProfileImageFile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#DA291C',
    margin: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: { color: '#DA291C', fontSize: 15, fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#DA291C',
    margin: 12,
    marginTop: 0,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    shadowColor: '#DA291C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});