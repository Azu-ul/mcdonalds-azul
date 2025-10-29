import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, 
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import api from '../../config/api';
import { useAuth } from '../context/AuthContext';

type SavedAddress = {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
};

export default function Restaurants() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pickup' | 'delivery'>('delivery');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const res = await api.get('/profile/addresses');
      setSavedAddresses(res.data.addresses || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLoading(true);
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
      
      // Guardar en la base de datos
      await api.post('/profile/addresses', {
        address: addressStr,
        latitude,
        longitude,
        is_default: savedAddresses.length === 0
      });

      Alert.alert('Éxito', 'Ubicación guardada');
      loadSavedAddresses();
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'McDonalds-App/1.0', 'Accept-Language': 'es' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const addr = data.address;
          const parts = [
            addr.road, addr.house_number, addr.neighbourhood,
            addr.city || addr.town || addr.village
          ].filter(Boolean);
          return parts.join(', ');
        }
      }
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const handleSelectAddress = async (address: SavedAddress) => {
    try {
      // Actualizar la dirección del usuario
      await updateUser({ 
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude
      });

      // Actualizar en el servidor
      await api.put('/profile/location', {
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude
      });

      Alert.alert('Éxito', 'Dirección seleccionada');
      router.push('/');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la dirección');
    }
  };

  const handleSaveAddress = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Ingresa una dirección');
      return;
    }

    try {
      setLoading(true);
      
      // Geocodificar la dirección ingresada
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      const response = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'McDonalds-App/1.0' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const location = data[0];
          
          // Guardar en la base de datos
          await api.post('/profile/addresses', {
            address: searchQuery.trim(),
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
            is_default: savedAddresses.length === 0
          });

          setSearchQuery('');
          Alert.alert('Éxito', 'Dirección guardada');
          loadSavedAddresses();
        } else {
          Alert.alert('Error', 'No se pudo encontrar la dirección');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la dirección');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = async (id: number) => {
    if (!editAddress.trim()) {
      Alert.alert('Error', 'Ingresa una dirección válida');
      return;
    }

    try {
      await api.put(`/profile/addresses/${id}`, {
        address: editAddress.trim()
      });

      Alert.alert('Éxito', 'Dirección actualizada');
      setEditingId(null);
      setEditAddress('');
      loadSavedAddresses();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la dirección');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    Alert.alert(
      'Eliminar dirección',
      '¿Estás seguro de que quieres eliminar esta dirección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/profile/addresses/${id}`);
              Alert.alert('Éxito', 'Dirección eliminada');
              loadSavedAddresses();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la dirección');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restaurantes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pickup' && styles.tabActive]}
            onPress={() => setActiveTab('pickup')}
          >
            <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive]}>
              🏪 Pedí y Retirá
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'delivery' && styles.tabActive]}
            onPress={() => setActiveTab('delivery')}
          >
            <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive]}>
              🚗 McDelivery
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido según tab activo */}
        {activeTab === 'pickup' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Busca un restaurante para recoger tu pedido
            </Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar un restaurante"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Text style={styles.searchIcon}>🔍</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              Los restaurantes disponibles aparecerán aquí
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ingresa tu dirección para la entrega del pedido
            </Text>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Ingresa una dirección"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSaveAddress}
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSaveAddress}
              >
                <Text style={styles.searchIcon}>💾</Text>
              </TouchableOpacity>
            </View>

            {/* Botón de ubicación actual */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationButtonText}>
                    Usar mi ubicación actual
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Direcciones guardadas */}
            {savedAddresses.length > 0 && (
              <View style={styles.savedSection}>
                <Text style={styles.savedTitle}>Direcciones guardadas</Text>
                
                {savedAddresses.map((addr) => (
                  <View key={addr.id} style={styles.addressCard}>
                    {editingId === addr.id ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editAddress}
                          onChangeText={setEditAddress}
                          placeholder="Nueva dirección"
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.saveEditButton}
                          onPress={() => handleEditAddress(addr.id)}
                        >
                          <Text style={styles.saveEditText}>💾</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelEditButton}
                          onPress={() => {
                            setEditingId(null);
                            setEditAddress('');
                          }}
                        >
                          <Text style={styles.cancelEditText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.addressContent}
                          onPress={() => handleSelectAddress(addr)}
                        >
                          <Text style={styles.addressIcon}>📍</Text>
                          <View style={styles.addressTextContainer}>
                            <Text style={styles.addressText}>{addr.address}</Text>
                            {addr.is_default && (
                              <Text style={styles.defaultBadge}>Predeterminada</Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        <View style={styles.addressMenu}>
                          <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => {
                              setEditingId(addr.id);
                              setEditAddress(addr.address);
                            }}
                          >
                            <Text style={styles.menuIcon}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => handleDeleteAddress(addr.id)}
                          >
                            <Text style={styles.menuIcon}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
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
  backButton: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#FFBC0D',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#292929',
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#292929',
  },
  searchButton: {
    backgroundColor: '#FFBC0D',
    width: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },
  locationButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 24,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  savedSection: {
    marginTop: 8,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addressContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIcon: {
    fontSize: 20,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#292929',
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '600',
  },
  addressMenu: {
    flexDirection: 'row',
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 18,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  saveEditButton: {
    backgroundColor: '#27AE60',
    padding: 8,
    borderRadius: 6,
  },
  saveEditText: {
    fontSize: 16,
  },
  cancelEditButton: {
    backgroundColor: '#DA291C',
    padding: 8,
    borderRadius: 6,
  },
  cancelEditText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
  },
  bottomSpacing: {
    height: 100,
  },
});