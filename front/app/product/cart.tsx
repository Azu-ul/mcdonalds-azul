import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../../config/api';

type CartItem = {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  unit_price: number;
  total_price: number;
  quantity: number;
  size?: string;
  side?: string;
  drink?: string;
  customizations?: any;
};
export default function Cart() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AGREGAR este check para evitar navegar antes del mount
    if (!isAuthenticated && !loading) {
      Alert.alert('Error', 'Debes iniciar sesión', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
      return;
    }

    if (isAuthenticated) {
      loadCart();
      loadRecommendations();
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCartItems(res.data.cart?.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      Alert.alert('Error', 'No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      console.log('🔍 Cargando cupones...');
      const couponsRes = await api.get('/coupons/active');
      console.log('🏷️ Coupons response:', couponsRes.data);

      setCoupons(couponsRes.data.coupons || []);
      console.log('✅ Cupones seteados:', couponsRes.data.coupons || []);
    } catch (error) {
      console.error('❌ Error loading coupons:', error);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    // Límite de 5 productos
    if (newQuantity > 5) {
      Alert.alert('Límite alcanzado', 'Máximo 5 unidades por producto');
      return;
    }

    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });

      // Actualizar estado local
      setCartItems(prev =>
        prev.map(item => {
          if (item.id === itemId) {
            const newTotalPrice = item.unit_price * newQuantity;
            return { ...item, quantity: newQuantity, total_price: newTotalPrice };
          }
          return item;
        })
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    }
  };

  const handleEditItem = (item: CartItem) => {
    // Construir query params con las selecciones actuales
    const params: any = {
      edit: 'true',
      cartItemId: item.id,
      quantity: item.quantity,
    };

    if (item.size) params.size = item.size;
    if (item.side) params.side = item.side;
    if (item.drink) params.drink = item.drink;
    if (item.customizations) {
      params.customizations = JSON.stringify(item.customizations);
    }

    // Navegar al producto con los parámetros
    const queryString = new URLSearchParams(params).toString();
    router.push(`/product/${item.product_id}?${queryString}`);
  };

  const removeItem = async (itemId: number) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el producto');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos para continuar');
      return;
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>Agrega productos para comenzar tu pedido</Text>
        <TouchableOpacity style={styles.shopButton} onPress={handleContinueShopping}>
          <Text style={styles.shopButtonText}>Ver menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.locationSection}
          onPress={() => router.push('/(tabs)/restaurants')}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Entregar en</Text>
            <Text style={styles.locationText}>Cambiar restaurante →</Text>
          </View>
        </TouchableOpacity>

        {cartItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image
              source={{ uri: item.product_image || 'https://via.placeholder.com/80' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemPrice}>
                  $ {item.total_price.toLocaleString('es-AR')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleEditItem(item)}>
                <Text style={styles.editLink}>Editar →</Text>
              </TouchableOpacity>
              {(item.size || item.side || item.drink) && (
                <Text style={styles.customizations}>
                  {[item.size, item.side, item.drink].filter(Boolean).join('\n')}
                </Text>
              )}
            </View>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                style={styles.quantityButton}
              >
                <Text style={item.quantity > 1 ? styles.quantityText : styles.quantityIcon}>
                  {item.quantity > 1 ? '-' : '🗑️'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                style={[
                  styles.quantityButton,
                  item.quantity >= 5 && styles.quantityButtonDisabled
                ]}
                disabled={item.quantity >= 5}
              >
                <Text style={[
                  styles.quantityText,
                  item.quantity >= 5 && styles.quantityTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}


        {coupons.length > 0 && (
          <TouchableOpacity
            style={styles.promoSection}
            onPress={() => router.push('/coupons')}
          >
            <Text style={styles.promoIcon}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoText}>Descuentos y promociones</Text>
              <Text style={styles.promoSubtext}>
                {coupons.length} cupon{coupons.length !== 1 ? 'es' : ''} disponible{coupons.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.promoArrow}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            $ {calculateTotal().toLocaleString('es-AR')}
          </Text>
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={handleContinueShopping}
          >
            <Text style={styles.continueShoppingText}>Seguir pidiendo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#292929', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 24 },
  shopButton: { backgroundColor: '#FFBC0D', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  shopButtonText: { color: '#292929', fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#292929' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#292929' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  promoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  promoIcon: { fontSize: 20, marginRight: 12 },
  promoText: { fontSize: 16, color: '#292929', fontWeight: '500' },
  promoArrow: { fontSize: 18, color: '#666' },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationIcon: { fontSize: 20, marginRight: 12 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  locationText: { fontSize: 16, color: '#464646ff', fontWeight: '500' },
  promoSubtext: { fontSize: 13, color: '#666', marginTop: 2 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#292929', flex: 1 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#292929' },
  editLink: { fontSize: 14, color: '#007AFF', marginBottom: 4 },
  customizations: { fontSize: 13, color: '#666', marginTop: 4 },
  quantityControls: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityIcon: { fontSize: 16 },
  quantityText: { fontSize: 20, fontWeight: '600', color: '#292929' },
  quantity: { fontSize: 16, fontWeight: '600', color: '#292929', marginVertical: 8 },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 20, fontWeight: '700', color: '#292929' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#292929' },
  footerButtons: { flexDirection: 'row', gap: 12 },
  continueShoppingButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  continueShoppingText: { fontSize: 16, fontWeight: '600', color: '#292929' },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#FFBC0D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutText: { fontSize: 16, fontWeight: '600', color: '#292929' },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityTextDisabled: {
    color: '#999',
  },
});