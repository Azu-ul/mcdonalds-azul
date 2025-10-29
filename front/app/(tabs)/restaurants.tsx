import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../../config/api';

type Restaurant = {
  id: number;
  name: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  is_open: boolean;
  opening_hours?: string;
};

export default function Restaurants() {
  const router = useRouter();
  const { user, updateUser, isAuthenticated } = useAuth();
  const [address, setAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [saved, setSaved] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
    loadRestaurants();
  }, [user]);

  const loadRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const res = await api.get('/restaurants');
      setRestaurants(res.data.restaurants || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'McDonaldsApp/1.0', 'Accept-Language': 'es' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const addr = data.address;
          const parts = [
            addr.road,
            addr.house_number,
            addr.neighbourhood,
            addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
            addr.postcode ? `CP ${addr.postcode}` : null,
            addr.country
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(', ') : data.display_name;
        }
      }
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const handleGetLocation = async () => {
    try {
      setLoadingLocation(true);
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

      setAddress(addressStr);
      await updateUser({ address: addressStr, latitude, longitude });
      Alert.alert('Éxito', `Ubicación actualizada\n${addressStr}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Ingresa una dirección');
      return;
    }

    try {
      setLoadingUpdate(true);
      await api.put('/profile/location', {
        latitude: user?.latitude || 0,
        longitude: user?.longitude || 0,
        address: address.trim()
      });

      await updateUser({ address: address.trim() });
      Alert.alert('Éxito', 'Ubicación actualizada');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Error al actualizar');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const getImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL.replace('/api', '')}${imageUrl}`;
  };

  return (
    <View style={styles.container}>
      {/* Header con logo y autenticación */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>M</Text>
        </View>
        <Text style={styles.headerTitle}>Restaurantes</Text>
        {!isAuthenticated ? (
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/signin')}
            >
              <Text style={styles.loginButtonText}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerButtonText}>Registrarse</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              ¡Hola, {user?.username || user?.email}! 👋
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Card de dirección */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Tu Dirección de Entrega</Text>
          <Text style={styles.helperText}>
            Ingresa tu dirección para encontrar los restaurantes cercanos
          </Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Calle, número, ciudad..."
              multiline
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonHalf,
                saved && styles.saveButtonSuccess
              ]}
              onPress={handleUpdateLocation}
              disabled={loadingUpdate || saved}
            >
              {loadingUpdate ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {saved ? '✓ ¡Guardado!' : '💾 Guardar'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonHalf, styles.actionButtonGPS]}
              onPress={handleGetLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>📍 Mi ubicación</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de restaurantes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restaurantes Disponibles</Text>
        </View>

        {loadingRestaurants ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFBC0D" />
            <Text style={styles.loadingText}>Cargando restaurantes...</Text>
          </View>
        ) : restaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏪</Text>
            <Text style={styles.emptyTitle}>No hay restaurantes disponibles</Text>
            <Text style={styles.emptyText}>
              Próximamente agregaremos más ubicaciones
            </Text>
          </View>
        ) : (
          restaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.restaurantCard}>
              {restaurant.image_url && (
                <Image
                  source={{ uri: getImageUrl(restaurant.image_url)! }}
                  style={styles.restaurantImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeader}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    restaurant.is_open ? styles.statusOpen : styles.statusClosed
                  ]}>
                    <Text style={styles.statusText}>
                      {restaurant.is_open ? '🟢 Abierto' : '🔴 Cerrado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.restaurantDetail}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{restaurant.address}</Text>
                </View>

                {restaurant.phone && (
                  <View style={styles.restaurantDetail}>
                    <Text style={styles.detailIcon}>📞</Text>
                    <Text style={styles.detailText}>{restaurant.phone}</Text>
                  </View>
                )}

                {restaurant.opening_hours && (
                  <View style={styles.restaurantDetail}>
                    <Text style={styles.detailIcon}>🕐</Text>
                    <Text style={styles.detailText}>{restaurant.opening_hours}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    !restaurant.is_open && styles.selectButtonDisabled
                  ]}
                  disabled={!restaurant.is_open}
                  onPress={() => {
                    Alert.alert('Restaurante seleccionado', `Pedirás desde ${restaurant.name}`);
                  }}
                >
                  <Text style={styles.selectButtonText}>
                    {restaurant.is_open ? '🛍️ Hacer pedido' : '⏰ Cerrado'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#DA291C',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFBC0D',
    textShadowColor: '#292929',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  authButtonsContainer: {
    display: 'flex',
    gap: 8,
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  loginButtonText: {
    color: '#DA291C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  registerButton: {
    backgroundColor: '#FFBC0D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFBC0D',
  },
  registerButtonText: {
    color: '#292929',
    fontWeight: 'bold',
    fontSize: 14,
  },
  welcomeContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#292929',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonHalf: {
    flex: 1,
    backgroundColor: '#FFBC0D',
  },
  actionButtonGPS: {
    backgroundColor: '#27AE60',
  },
  saveButtonSuccess: {
    backgroundColor: '#27AE60',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F5',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#E8F5E9',
  },
  statusClosed: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  restaurantDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#FFBC0D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  selectButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#292929',
  },
  bottomSpacing: {
    height: 80,
  },
});