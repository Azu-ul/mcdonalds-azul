import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type AddressBarProps = {
  address: string;
  onPress: () => void;
  isRestaurant?: boolean; // Nueva prop para identificar si es restaurante
};

export default function AddressBar({ address, onPress, isRestaurant = false }: AddressBarProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.label}>
          {isRestaurant ? 'Retirar en' : 'Enviar a'} {/* Cambia el texto según el tipo */}
        </Text>
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>{address}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: '#292929',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: '#666',
    marginLeft: 8,
  },
});