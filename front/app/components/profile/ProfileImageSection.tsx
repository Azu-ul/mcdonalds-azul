import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';

type ProfileImageSectionProps = {
  imageUrl: string | null;
  username?: string;
  email?: string;
  editingUsername: boolean;
  usernameValue: string;
  onUsernameChange: (text: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onImagePress: () => void;
  loading: boolean;
};

export default function ProfileImageSection({
  imageUrl,
  username,
  email,
  editingUsername,
  usernameValue,
  onUsernameChange,
  onEdit,
  onSave,
  onCancel,
  onImagePress,
  loading
}: ProfileImageSectionProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onImagePress} style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImageText}>
              {username?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✏️</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.usernameContainer}>
        {editingUsername ? (
          <View style={styles.usernameEditContainer}>
            <TextInput
              style={styles.usernameInput}
              value={usernameValue}
              onChangeText={onUsernameChange}
              placeholder="Tu nombre..."
              autoCapitalize="words"
              autoFocus
              onSubmitEditing={onSave}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.iconButton} onPress={onSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#27AE60" />
              ) : (
                <Text style={styles.saveIcon}>💾</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onCancel}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.usernameViewContainer}>
            <Text style={styles.username}>{username}</Text>
            <TouchableOpacity style={styles.editIconButton} onPress={onEdit}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.email}>{email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFBC0D',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DA291C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFBC0D',
  },
  profileImageText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFBC0D',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  editBadgeText: {
    fontSize: 16,
  },
  usernameContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  usernameViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#292929',
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    borderWidth: 2,
    borderColor: '#FFBC0D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 150,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  editIconButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveIcon: {
    fontSize: 18,
  },
  cancelIcon: {
    fontSize: 18,
    color: '#DA291C',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});