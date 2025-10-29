import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../../config/api';
import CustomModal from '../components/CustomModal';

type Coupon = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  discount_value: number;
  discount_type: 'percentage' | 'fixed';
  product_id: number;
};

const COUPON_SECTIONS = [
  { id: 1, title: 'Ofertas del Día' },
  { id: 2, title: 'Combos con Descuento' },
  { id: 3, title: 'Para Compartir' },
  { id: 4, title: 'Desayunos' },
  { id: 5, title: 'Cajita Feliz' },
  { id: 6, title: 'Postres' },
  { id: 7, title: 'Bebidas McCafé' },
  { id: 8, title: 'Menús McCafé' },
];

export default function Cupones() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons/active');
      setCoupons(res.data.coupons || []);
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      setModal({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || 'No se pudieron cargar los cupones.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCouponPress = (coupon: Coupon) => {
    router.push({
      pathname: '/product',
      params: { id: coupon.product_id, couponId: coupon.id },
    });
  };

  const couponsBySection = COUPON_SECTIONS.map((section, index) => ({
    ...section,
    items: coupons.slice(index * 2, index * 2 + 3).filter(Boolean),
  })).filter(section => section.items.length > 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header con logo y autenticación */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>M</Text>
          </View>
          <Text style={styles.headerTitle}>Cupones</Text>
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

        {/* Barra de búsqueda */}
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>Buscar cupones</Text>
        </View>

        {/* Secciones de cupones */}
        {couponsBySection.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {section.items.map((coupon) => (
                <TouchableOpacity
                  key={coupon.id}
                  style={styles.couponCard}
                  onPress={() => handleCouponPress(coupon)}
                >
                  <View style={styles.couponImagePlaceholder} />
                  <Text style={styles.couponTitle} numberOfLines={2}>
                    {coupon.title}
                  </Text>
                  <Text style={styles.couponDiscount}>
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}% OFF`
                      : `$${coupon.discount_value} OFF`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
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
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchPlaceholder: {
    color: '#999',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
  },
  section: {
    marginBottom: 24,
  },
  couponCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginLeft: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  couponImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  couponDiscount: {
    fontSize: 12,
    color: '#DA291C',
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 80,
  },
});