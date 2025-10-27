import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';
import api from '../config/api';

// Componentes
import AddressBar from './components/home/AddressBar';
import CategoryCarousel from './components/home/CategoryCarousel';
import ProductCarousel from './components/home/ProductCarousel';
import FlyerCarousel from './components/home/FlyerCarousel';
import BottomTabs from './components/home/BottomTabs';
import FloatingCart from './components/home/FloatingCart';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
};

type CartItem = {
  product: Product;
  quantity: number;
  total: number;
};

const CATEGORIES = [
  { id: 1, name: 'McCombos', icon: '🍔' },
  { id: 2, name: 'Hamburguesas', icon: '🍔' },
  { id: 3, name: 'Cajita Feliz', icon: '🎁' },
  { id: 4, name: 'Pollo y McNuggets', icon: '🍗' },
  { id: 5, name: 'Para Acompañar', icon: '🍟' },
  { id: 6, name: 'McShakes', icon: '🥤' },
  { id: 7, name: 'Postres', icon: '🍦' },
  { id: 8, name: 'Ensaladas', icon: '🥗' },
  { id: 9, name: 'Bebidas', icon: '🥤' },
  { id: 10, name: 'Sin TACC', icon: '🌾' },
  { id: 11, name: 'Menús McCafé', icon: '☕' },
  { id: 12, name: 'Bebidas McCafé', icon: '☕' },
  { id: 13, name: 'Comidas McCafé', icon: '🥐' },
];

const FLYERS = [
  { id: 1, image: 'https://via.placeholder.com/400x200/FFBC0D/292929?text=McCombo+Mediano+$14499', title: 'McCombo Mediano' },
  { id: 2, image: 'https://via.placeholder.com/400x200/DA291C/fff?text=2+Cajita+Feliz+20%25+OFF', title: '2 Cajita Feliz' },
  { id: 3, image: 'https://via.placeholder.com/400x200/27AE60/fff?text=McFlurry+Oreo+$4500', title: 'McFlurry Oreo' },
  { id: 4, image: 'https://via.placeholder.com/400x200/292929/FFBC0D?text=AutoMac+30%25+OFF', title: 'AutoMac' },
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('McCombos');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadProducts();
    loadUserAddress();
    loadCart();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.products || res.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddress = () => {
    if (user?.address) {
      setAddress(user.address);
    } else {
      setAddress('Ingresa tu dirección de entrega');
    }
  };

  const loadCart = async () => {
    try {
      setCart([]);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/product',
      params: { id: product.id }
    });
  };

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalCartPrice = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const filteredProducts = products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Contenido Principal */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header con logo y botones de autenticación */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>M</Text>
          </View>
          
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

        {/* Barra de Dirección */}
        <AddressBar 
          address={address}
          onPress={() => router.push('/restaurants')}
        />

        {/* Carrusel de Categorías */}
        <CategoryCarousel 
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryPress={handleCategoryPress}
        />

        {/* Título de Sección */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>McCombos</Text>
          <TouchableOpacity onPress={() => router.push('/category/mccombos')}>
            <Text style={styles.seeAllText}>Ver todo →</Text>
          </TouchableOpacity>
        </View>

        {/* Carrusel de Productos McCombos */}
        <ProductCarousel 
          products={filteredProducts}
          onProductPress={handleProductPress}
        />

        {/* Título de Promociones */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Promociones</Text>
        </View>

        {/* Carrusel de Flyers */}
        <FlyerCarousel 
          flyers={FLYERS}
          onFlyerPress={(flyer) => {
            console.log('Flyer pressed:', flyer);
          }}
        />

        {/* Espaciado inferior para tabs */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Carrito Flotante */}
      {cart.length > 0 && (
        <FloatingCart
          itemCount={getTotalCartItems()}
          totalPrice={getTotalCartPrice()}
          onPress={() => router.push('/cart')}
        />
      )}

      {/* Tabs Inferiores */}
      <BottomTabs currentTab="home" />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  authButtonsContainer: {
    flexDirection: 'row',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#292929',
  },
  seeAllText: {
    fontSize: 14,
    color: '#DA291C',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});