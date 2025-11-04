// /app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

// 👇 NUEVA FUNCIÓN AUXILIAR
const isAdmin = (user: any): boolean => {
  if (!user || !user.roles) return false;
  return Array.isArray(user.roles)
    ? user.roles.includes('admin')
    : (user.roles as string).split(',').includes('admin');
};

export default function TabsLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const showAdminTab = isAuthenticated && isAdmin(user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DA291C',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="coupons"
        options={{
          title: 'Cupones',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>🎫</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Restaurantes',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>📍</Text>
            </View>
          ),
        }}
      />
      {/* 👇 NUEVO TAB DE ADMIN */}
      {showAdminTab && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ focused }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>🛠️</Text>
              </View>
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi cuenta',
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              router.push('/signin');
            }
          },
        }}
      />
    </Tabs>
  );
}