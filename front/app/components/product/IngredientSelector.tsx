// src/components/product/IngredientSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Props = {
  ingredients: { id: string; name: string; required?: boolean; maxCount?: number }[];
  selected: Record<string, number>;
  
  onChange: (selection: Record<string, number>) => void;
  onClose: () => void;
};

const IngredientSelector = ({ ingredients, selected, onChange, onClose }: Props) => {
  const toggle = (id: string, max = 1) => {
    const current = selected[id] || 0;
    const newValue = current === 0 ? 1 : current >= max ? 0 : current + 1;
    onChange({ ...selected, [id]: newValue });
  };

  return (
    <View style={styles.modalContent}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.title}>¿Cómo querés personalizar?</Text>
      <ScrollView style={styles.list}>
        {ingredients.map((ing) => (
          <View key={ing.id} style={styles.row}>
            <Text style={styles.ingredientName}>
              {ing.name}
              {ing.required && ' (obligatorio)'}
            </Text>
            <TouchableOpacity onPress={() => toggle(ing.id, ing.maxCount)}>
              <View style={styles.checkbox}>
                {selected[ing.id] ? <Text>✓</Text> : null}
              </View>
            </TouchableOpacity>
            {(ing.id === 'carne' || ing.id === 'cheddar' || ing.id === 'bacon') &&
              selected[ing.id] > 0 && (
                <View style={styles.counter}>
                  <Text style={styles.counterText}>{selected[ing.id]}</Text>
                </View>
              )}
          </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientName: {
    fontSize: 16,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  counter: {
    backgroundColor: '#FFBC0D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  counterText: {
    color: '#292929',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default IngredientSelector;