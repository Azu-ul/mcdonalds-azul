import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { API_URL } from '../../../config/api';

type DocumentCardProps = {
  documentUrl?: string | null;
  onUpload: () => void;
  onDelete: () => void;
  loading: boolean;
  deleting: boolean;
};

export default function DocumentCard({
  documentUrl,
  onUpload,
  onDelete,
  loading,
  deleting
}: DocumentCardProps) {
  const getDocumentUrl = () => {
    if (!documentUrl) return null;
    if (documentUrl.startsWith('http')) return documentUrl;
    return `${API_URL.replace('/api', '')}${documentUrl}`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🪪 Documento de Identidad</Text>

      {documentUrl ? (
        <View style={styles.documentPreview}>
          <Text style={styles.documentText}>✓ Documento cargado</Text>
          <Image
            source={{ uri: getDocumentUrl()! }}
            style={styles.documentThumbnail}
            resizeMode="cover"
          />

          <View style={styles.documentButtonsRow}>
            <TouchableOpacity
              style={[styles.documentButton, styles.changeDocumentButton]}
              onPress={onUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.documentButtonText}>🔄 Cambiar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.documentButton, styles.deleteDocumentButton]}
              onPress={onDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.documentButtonText}>🗑️ Eliminar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={onUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>📄 Subir documento</Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.helperText}>
        Imágenes (JPEG, PNG) o PDF - Máx. 5MB
      </Text>
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
  documentPreview: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  documentText: {
    color: '#27AE60',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 14,
  },
  documentThumbnail: {
    width: 180,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#27AE60',
    marginBottom: 12,
  },
  documentButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  documentButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeDocumentButton: {
    backgroundColor: '#FFBC0D',
  },
  deleteDocumentButton: {
    backgroundColor: '#DA291C',
  },
  documentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#FFBC0D',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FFBC0D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});