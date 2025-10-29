import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../../config/api';

type Coupon = {
  id: number;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  image: string;
};

export default function Cupones() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [coupons] = useState<Coupon[]>([
    {
      id: 1,
      title: '2x1 en Big Mac',
      description: 'Comprá una Big Mac y llevate otra gratis',
      discount: '50% OFF',
      validUntil: '31/12/2024',
      image: '🍔',
    },
    {
      id: 2,
      title: 'McFlurry a mitad de precio',
      description: 'Disfrutá de tu postre favorito con descuento',
      discount: '50% OFF',
      validUntil: '15/12/2024',
      image: '🍦',
    },
    {
      id: 3,
      title: 'Combo McNuggets',
      description: '20 McNuggets + Papas grandes',
      discount: '30% OFF',
      validUntil: '20/12/2024',
      image: '🍗',
    },
  ]);

  const getProfileImageUrl = () => {
    if (!user?.profile_image_url) return null;
    let url = user.profile_image_url;
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+-c/, '=s400-c');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  };

  return (
    <View style={styles.container}>
      {/* Header con logo y usuario/botones */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Mc Donald's Azul</Text>
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
          <TouchableOpacity 
            style={styles.profileContainer}
            onPress={() => router.push('/profile')}
          >
            {user?.profile_image_url ? (
              <Image 
                source={{ uri: getProfileImageUrl()! }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Mis Cupones</Text>
          <Text style={styles.subtitle}>
            Aprovechá estas ofertas exclusivas
          </Text>

          <View style={styles.couponsContainer}>
            {coupons.map((coupon) => (
              <TouchableOpacity
                key={coupon.id}
                style={styles.couponCard}
                onPress={() => {
                  console.log('Cupón seleccionado:', coupon.title);
                }}
              >
                <View style={styles.couponHeader}>
                  <View style={styles.couponIcon}>
                    <Text style={styles.couponIconText}>{coupon.image}</Text>
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{coupon.discount}</Text>
                  </View>
                </View>

                <View style={styles.couponBody}>
                  <Text style={styles.couponTitle}>{coupon.title}</Text>
                  <Text style={styles.couponDescription}>{coupon.description}</Text>
                  <Text style={styles.couponValidity}>
                    Válido hasta: {coupon.validUntil}
                  </Text>
                </View>

                <View style={styles.couponFooter}>
                  <TouchableOpacity style={styles.useButton}>
                    <Text style={styles.useButtonText}>Usar cupón</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Espaciado inferior para tabs */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
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
  profileContainer: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFBC0D',
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFBC0D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  couponsContainer: {
    gap: 16,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  couponHeader: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponIconText: {
    fontSize: 32,
  },
  discountBadge: {
    backgroundColor: '#DA291C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  couponBody: {
    padding: 16,
  },
  couponTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  couponValidity: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  couponFooter: {
    padding: 16,
    paddingTop: 0,
  },
  useButton: {
    backgroundColor: '#FFBC0D',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#292929',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 100,
  },
});