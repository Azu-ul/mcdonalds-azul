import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { API_URL } from '../../config/api';

type SideOption = {
  id: number;
  name: string;
  extra_price: number;
  image_url?: string;
};

type Props = {
  options: SideOption[];
  selected: SideOption | null;
  onSelect: (option: SideOption) => void;
  onClose: () => void;
};

export default function SideSelector({ options, selected, onSelect, onClose }: Props) {
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL.replace('/api', '')}${imageUrl}`;
  };

  // Emojis por defecto para acompañamientos
  const getSideEmoji = (name: string) => {
    if (name.toLowerCase().includes('papa')) return '🍟';
    if (name.toLowerCase().includes('ensalada')) return '🥗';
    return '🍽️';
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Acompañamiento</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              selected?.id === option.id && styles.optionSelected
            ]}
            onPress={() => onSelect(option)}
          >
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.emoji}>{getSideEmoji(option.name)}</Text>
              </View>
              <Text style={styles.optionText}>{option.name}</Text>
            </View>
            {option.extra_price > 0 && (
              <Text style={styles.priceText}>
                +$ {option.extra_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
  },
  placeholder: {
    width: 32,
  },
  list: {
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#FFF8E1',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 16,
    color: '#292929',
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});