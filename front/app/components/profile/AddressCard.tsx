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
  // Asegurarse de que el valor siempre sea una string, nunca undefined
  const controlledAddress = address || '';

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📍 Dirección</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={controlledAddress}
          onChangeText={onAddressChange}
          placeholder="Calle, número, ciudad..."
          multiline
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonHalf,
            saved && styles.saveButtonSuccess
          ]}
          onPress={onSave}
          disabled={loadingUpdate || saved}
        >
          {loadingUpdate ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>
              {saved ? '✓ ¡Guardado!' : '💾 Guardar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonHalf, styles.actionButtonGPS]}
          onPress={onGetLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>📍 Mi ubicación</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 480,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#292929',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonHalf: {
    flex: 1,
    backgroundColor: '#FFBC0D',
  },
  actionButtonGPS: {
    backgroundColor: '#27AE60',
  },
  saveButtonSuccess: {
    backgroundColor: '#27AE60',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});