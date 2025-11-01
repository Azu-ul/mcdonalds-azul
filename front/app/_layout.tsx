import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

export default function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      </CartProvider>
    </AuthProvider>
  );
}
