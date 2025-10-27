  import { Stack } from 'expo-router';
  import React from 'react';
  import { AuthProvider } from './context/AuthContext';

  export default function Layout() {
    return (
      <AuthProvider>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
          initialRouteName="welcome"
        />
      </AuthProvider>
    );
  }