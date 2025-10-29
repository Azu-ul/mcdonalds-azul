import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../../config/api';
import { useAuth } from '../context/AuthContext';

type Restaurant = {
  id: number;
  name: string;
  address: string;
  distance: number;
  isOpen: boolean;
};

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
};

type Tab = 'pickup' | 'delivery';

export default function Restaurants() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('delivery');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pedí y Retirá
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  
  // McDelivery
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Modales
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [editAddressText, setEditAddressText] = useState('');
  const [editAddressLabel, setEditAddressLabel] = useState('');

  useEffect(() => {
    loadRestaurants();
    loadSavedAddresses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchQuery, restaurants]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      // Mock data - reemplazar con API real
      const mockRestaurants: Restaurant[] = [
        {
          id: 1,
          name: "McDonald's Azul Centro",
          address: "Av. Colón 123, Azul, Buenos Aires",
          distance: 1.2,
          isOpen: true,
        },
        {
          id: 2,
          name: "McDonald's Azul Norte",
          address: "Av. San Martín 456, Azul, Buenos Aires",
          distance: 3.5,
          isOpen: true,
        },
      ];
      setRestaurants(mockRestaurants);
      setFilteredRestaurants(mockRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem('saved_addresses');
      if (stored) {
        setSavedAddresses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const saveAddressesToStorage = async (addresses: SavedAddress[]) => {
    try {
      await AsyncStorage.setItem('saved_addresses', JSON.stringify(addresses));
      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Error saving addresses:', error);
    }
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    if (!restaurant.isOpen) {
      Alert.alert('Cerrado', 'Este restaurante está cerrado');
      return;
    }

    try {
      // Actualizar la dirección del usuario con el restaurante
      await updateUser({ address: restaurant.name });
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el restaurante');
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos tu ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });

      // Obtener dirección legible
      const address = await getAddressFromBackend(latitude, longitude);

      // Crear nueva dirección guardada
      const newAddress: SavedAddress = {
        id: Date.now().toString(),
        label: address,
        address,
        latitude,
        longitude,
        distance: 0,
      };

      const updatedAddresses = [newAddress, ...savedAddresses];
      await saveAddressesToStorage(updatedAddresses);
      
      Alert.alert('Ubicación guardada', 'Tu ubicación actual fue guardada');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  const getAddressFromBackend = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `${API_URL.replace('/api', '')}/api/geocode?latitude=${lat}&longitude=${lng}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener dirección');
      }

      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        const parts = [
          addr.road,
          addr.house_number,
          addr.neighbourhood,
          addr.suburb,
          addr.city || addr.town || addr.village,
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
      
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const handleSelectAddress = async (address: SavedAddress) => {
    try {
      // Actualizar dirección del usuario en el backend
      await api.put('/profile/location', {
        latitude: address.latitude,
        longitude: address.longitude,
        address: address.address
      });
      
      // Actualizar contexto local
      await updateUser({ address: address.address });
      
      // Volver al home
      router.replace('/');
    } catch (error) {
      console.error('Error selecting address:', error);
      Alert.alert('Error', 'No se pudo seleccionar la dirección');
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setEditAddressText(address.address);
    setEditAddressLabel(address.label);
    setEditModalVisible(true);
  };

  const handleSaveEditedAddress = async () => {
    if (!editingAddress || !editAddressText.trim()) {
      Alert.alert('Error', 'Ingresa una dirección válida');
      return;
    }

    const updatedAddresses = savedAddresses.map(addr =>
      addr.id === editingAddress.id
        ? { ...addr, address: editAddressText.trim(), label: editAddressLabel.trim() }
        : addr
    );

    await saveAddressesToStorage(updatedAddresses);
    setEditModalVisible(false);
    setEditingAddress(null);
    Alert.alert('Guardado', 'Dirección actualizada');
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Eliminar dirección',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
            await saveAddressesToStorage(updatedAddresses);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'pickup' 
            ? 'Busca un restaurante para recoger tu pedido'
            : 'Ingresa tu dirección para la entrega del pedido'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pickup' && styles.tabActive]}
          onPress={() => setActiveTab('pickup')}
        >
          <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive]}>
            Pedí y Retirá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'delivery' && styles.tabActive]}
          onPress={() => setActiveTab('delivery')}
        >
          <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive]}>
            McDelivery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'pickup' ? (
          // PEDÍ Y RETIRÁ
          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar un restaurante"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#FFBC0D" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.restaurantsList}>
                {filteredRestaurants.map((restaurant) => (
                  <TouchableOpacity
                    key={restaurant.id}
                    style={styles.restaurantCard}
                    onPress={() => handleSelectRestaurant(restaurant)}
                  >
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
                      <Text style={styles.restaurantDistance}>
                        {restaurant.distance < 1 
                          ? `A ${(restaurant.distance * 1000).toFixed(0)} m de distancia` 
                          : `A ${restaurant.distance.toFixed(2)} km de distancia`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          // MCDELIVERY
          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Ingresa una dirección"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#292929" />
              ) : (
                <>
                  <Text style={styles.currentLocationText}>Usar mi ubicación actual</Text>
                </>
              )}
            </TouchableOpacity>

            {savedAddresses.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Direcciones guardadas</Text>
                <View style={styles.addressesList}>
                  {savedAddresses.map((address) => (
                    <View key={address.id} style={styles.addressCard}>
                      <TouchableOpacity
                        style={styles.addressContent}
                        onPress={() => handleSelectAddress(address)}
                      >
                        <View style={styles.addressInfo}>
                          <Text style={styles.addressLabel}>{address.label}</Text>
                          <Text style={styles.addressText}>{address.address}</Text>
                          <Text style={styles.addressDistance}>
                            {address.distance < 1 
                              ? `A ${(address.distance * 1000).toFixed(0)} m de distancia` 
                              : `A ${address.distance.toFixed(3)} km de distancia`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => {
                          Alert.alert(
                            address.label,
                            'Selecciona una opción',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Editar',
                                onPress: () => handleEditAddress(address),
                              },
                              {
                                text: 'Eliminar',
                                style: 'destructive',
                                onPress: () => handleDeleteAddress(address.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.menuIcon}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de Edición */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar dirección</Text>

            <Text style={styles.inputLabel}>Etiqueta</Text>
            <TextInput
              style={styles.modalInput}
              value={editAddressLabel}
              onChangeText={setEditAddressLabel}
              placeholder="casa, trabajo, etc."
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={editAddressText}
              onChangeText={setEditAddressText}
              placeholder="Calle, número, ciudad..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEditedAddress}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#292929',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabActive: {
    borderBottomColor: '#FFBC0D',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#292929',
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 16,
    fontSize: 20,
    color: '#FFBC0D',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#292929',
  },
  restaurantsList: {
    gap: 12,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  restaurantInfo: {
    gap: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  restaurantDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  currentLocationButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  locationIcon: {
    fontSize: 20,
  },
  currentLocationText: {
    fontSize: 15,
    color: '#292929',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 16,
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#FFBC0D',
  },
  addressContent: {
    flex: 1,
    padding: 16,
  },
  addressInfo: {
    gap: 6,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  addressDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  menuButton: {
    padding: 16,
  },
  menuIcon: {
    fontSize: 24,
    color: '#666',
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#292929',
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#FFBC0D',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#292929',
    fontSize: 15,
    fontWeight: 'bold',
  },
});