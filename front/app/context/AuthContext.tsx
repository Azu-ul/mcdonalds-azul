import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

type User = {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  profile_image_url?: string;
  auth_provider?: string;
  roles?: string[];
  address?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isJugador: boolean;
  isSeguidor: boolean;
  onPlayerUpdate?: (callback: (updatedUser: User) => void) => void;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setAsGuest: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [playerUpdateCallbacks, setPlayerUpdateCallbacks] = useState<((updatedUser: User) => void)[]>([]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const registerPlayerUpdate = (callback: (updatedUser: User) => void) => {
    setPlayerUpdateCallbacks(prev => [...prev, callback]);
  };

  const notifyPlayerUpdate = (updatedUser: User) => {
    playerUpdateCallbacks.forEach(cb => cb(updatedUser));
  };

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsGuest(false);

        // Configurar el token en las peticiones API
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        // Refrescar datos del usuario en segundo plano
        refreshUserData().catch(err =>
          console.log('No se pudo refrescar datos del usuario:', err)
        );
      } else {
        const guestMode = await AsyncStorage.getItem('guest_mode');
        if (guestMode === 'true') {
          setIsGuest(true);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      const updatedUser = res.data.user;

      // Obtener roles del usuario
      const rolesRes = await api.get(`/user/${updatedUser.id}/roles`);
      updatedUser.roles = rolesRes.data.roles || [];

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const login = async (newToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.removeItem('guest_mode');

      setToken(newToken);
      setUser(userData);
      setIsGuest(false);

      // Configurar el token en las peticiones API
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user', 'guest_mode']);
      setToken(null);
      setUser(null);
      setIsGuest(false);

      // Limpiar el token de las peticiones API
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      // Actualizamos el estado y obtenemos el usuario actualizado
      let updatedUser: User | undefined;
      setUser(prev => {
        if (!prev) return prev; // si prev es undefined
        updatedUser = { ...prev, ...data };

        if (updatedUser.roles?.includes('player')) {
          notifyPlayerUpdate(updatedUser);
        }

        return updatedUser;
      });

      // Guardamos en AsyncStorage
      if (updatedUser) {
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };


  const setAsGuest = async () => {
    try {
      await AsyncStorage.setItem('guest_mode', 'true');
      setIsGuest(true);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  const isAuthenticated = !!token && !!user && !isGuest;
  const isAdmin = user?.roles?.includes('admin') || false;
  const isJugador = user?.roles?.includes('jugador') || false;
  const isSeguidor = user?.roles?.includes('seguidor') || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isGuest,
        isAdmin,
        isJugador,
        isSeguidor,
        login,
        logout,
        updateUser,
        setAsGuest,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};