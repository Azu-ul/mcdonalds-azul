import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

type AddressCardProps = {
  address: string;
  onAddressChange: (text: string) => void;
  onSave: () => void;
  onGetLocation: () => void;
  loadingLocation: boolean;
  loadingUpdate: boolean;
  saved: boolean;
};

export default function AddressCard({
  address,
  onAddressChange,
  onSave,
  onGetLocation,
  loadingLocation,
  loadingUpdate,
  saved
}: AddressCardProps) {
  const controlledAddress = address || '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Dirección</Text>
      </View>

      <TextInput
        style={styles.input}
        value={controlledAddress}
        onChangeText={onAddressChange}
        placeholder="Calle, número, ciudad..."
        multiline
        placeholderTextColor="#999"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, saved && styles.buttonSuccess]}
          onPress={onSave}
          disabled={loadingUpdate || saved}
        >
          {loadingUpdate ? (
            <ActivityIndicator color="#292929" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {saved ? '✓ Guardado' : 'Guardar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onGetLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#666" size="small" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>📍</Text>
              <Text style={styles.buttonTextSecondary}>Ubicación actual</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 420,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292929',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#292929',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#FFBC0D',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonSecondary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    color: '#292929',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  buttonTextSecondary: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
});