// src/components/product/DrinkSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type DrinkOption = {
  label: string;
  price: number;
};

type Props = {
  options: DrinkOption[];
  onSelect: (option: DrinkOption) => void;
  onClose: () => void;
};

const DrinkSelector = ({ options, onSelect, onClose }: Props) => {
  return (
    <View style={styles.modalContent}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Bebida</Text>
      <ScrollView style={styles.list}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.optionText}>
              {option.label}
              {option.price > 0 && ` +$${option.price.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
  },
});

export default DrinkSelector;