import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';

type PersonalInfoCardProps = {
  control: any;
  errors: any;
  authProvider: string;
  onSave: () => void;
  loading: boolean;
  saved: boolean;
};

export default function PersonalInfoCard({
  control,
  errors,
  authProvider,
  onSave,
  loading,
  saved
}: PersonalInfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📋 Información Personal</Text>

      {authProvider === 'local' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </>
            )}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre y apellido</Text>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.full_name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Juan Pérez"
                placeholderTextColor="#999"
              />
              {errors.full_name && (
                <Text style={styles.errorText}>{errors.full_name.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="+54 9 11 1234-5678"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saved && styles.saveButtonSuccess]}
        onPress={onSave}
        disabled={loading || saved}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>
            {saved ? '✓ ¡Guardado!' : '💾 Guardar cambios'}
          </Text>
        )}
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#292929',
  },
  inputError: {
    borderColor: '#DA291C',
  },
  errorText: {
    color: '#DA291C',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FFBC0D',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FFBC0D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonSuccess: {
    backgroundColor: '#27AE60',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});