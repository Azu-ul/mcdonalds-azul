// /app/restaurants.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../../config/api';
import * as Location from 'expo-location';
import CustomModal from '../components/CustomModal';
import { reverseGeocode } from '../utils/geocoding';

type Address = {
  id: number;
  label: string;
  street: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

type Restaurant = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export default function Restaurants() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [addressesRes, restaurantsRes] = await Promise.all([
        api.get('/user/addresses'),
        api.get('/restaurants'),
      ]);
      setSavedAddresses(addressesRes.data.addresses || []);
      setRestaurants(restaurantsRes.data.restaurants || []);
    } catch (error: any) {
      console.error('Error en Restaurants:', error);
      setModal({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || 'No se pudieron cargar los datos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    // Guardar en contexto o localStorage para usar en Home
    updateUser({ selectedRestaurant: restaurant });
    router.push('/'); // Vuelve a Home con el restaurante seleccionado
  };

  const handleSelectAddress = (address: Address) => {
    updateUser({
      address: `${address.street}, ${address.city}`,
      latitude: address.latitude,
      longitude: address.longitude,
    });
    router.push('/');
  };

  const handleUseCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      setModal({
        visible: true,
        title: 'Ubicación',
        message: 'La ubicación actual no está disponible en navegador.',
      });
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setModal({
          visible: true,
          title: 'Permiso denegado',
          message: 'Necesitamos acceso a tu ubicación para continuar.',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Geocodificar
      // Geocodificar usando TU backend (sin CORS)
      const displayAddress = await reverseGeocode(latitude, longitude);

      // Guardar dirección
      await api.post('/user/addresses', {
        street: displayAddress,
        city: '',
        latitude,
        longitude,
        is_default: false,
      });

      updateUser({ address: displayAddress, latitude, longitude });
      router.push('/');
    } catch (error) {
      setModal({
        visible: true,
        title: 'Error',
        message: 'No se pudo obtener tu ubicación.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Botones de tipo de pedido */}
        <View style={styles.orderTypeContainer}>
          <TouchableOpacity style={[styles.orderButton, styles.pickupButton]}>
            <Text style={styles.orderButtonText}>Pedí y Retirá</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.orderButton, styles.deliveryButton]}>
            <Text style={styles.orderButtonText}>McDelivery</Text>
          </TouchableOpacity>
        </View>

        {/* Buscar restaurante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Busca un restaurante para recoger tu pedido</Text>
          <View style={styles.searchBar}>
            <Text style={styles.searchPlaceholder}>Buscar un restaurante</Text>
          </View>
          {restaurants.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.restaurantItem}
              onPress={() => handleSelectRestaurant(r)}
            >
              <Text style={styles.restaurantName}>{r.name}</Text>
              <Text style={styles.restaurantAddress}>{r.address}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dirección de entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingresa tu dirección para la entrega del pedido</Text>
          <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
            <Text style={styles.locationButtonText}>📍 Usar mi ubicación actual</Text>
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Text style={styles.searchPlaceholder}>Ingresa una dirección</Text>
          </View>

          {savedAddresses.length > 0 && (
            <View style={styles.savedAddressesSection}>
              <Text style={styles.savedTitle}>Direcciones guardadas</Text>
              {savedAddresses.map((addr) => (
                <View key={addr.id} style={styles.addressRow}>
                  <TouchableOpacity
                    style={styles.addressTouchable}
                    onPress={() => handleSelectAddress(addr)}
                  >
                    <Text>{addr.street}</Text>
                  </TouchableOpacity>
                  {/* Tres puntos verticales simulados */}
                  <TouchableOpacity>
                    <Text>⋮</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onConfirm={() => setModal({ ...modal, visible: false })}
        confirmText="Aceptar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  orderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickupButton: {
    backgroundColor: '#DA291C',
    marginRight: 8,
  },
  deliveryButton: {
    backgroundColor: '#FFBC0D',
    marginLeft: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#292929',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchPlaceholder: {
    color: '#999',
  },
  restaurantItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  restaurantName: {
    fontWeight: 'bold',
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#666',
  },
  locationButton: {
    padding: 12,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationButtonText: {
    color: '#006064',
    fontWeight: '600',
  },
  savedAddressesSection: {
    marginTop: 16,
  },
  savedTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addressTouchable: {
    flex: 1,
  },
});