// src/components/product/CondimentSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Condiment = {
  id: string;
  name: string;
};

type Props = {
  condiments: Condiment[]; // 👈 ¡AGREGA ESTA LÍNEA!
  selected: Record<string, boolean>;
  onChange: (selection: Record<string, boolean>) => void;
  onClose: () => void;
};

const CondimentSelector = ({ condiments, selected, onChange, onClose }: Props) => {
  const toggle = (id: string) => {
    onChange({ ...selected, [id]: !selected[id] });
  };

  return (
    <View style={styles.modalContent}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.title}>¿Cómo querés personalizar?</Text>
      <ScrollView style={styles.list}>
        {condiments.map((condiment) => (
          <View key={condiment.id} style={styles.row}>
            <Text style={styles.ingredientName}>{condiment.name}</Text>
            <TouchableOpacity onPress={() => toggle(condiment.id)}>
              <View style={styles.checkbox}>
                {selected[condiment.id] && <Text>✓</Text>}
              </View>
            </TouchableOpacity>
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
    maxHeight: 200,
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
});

export default CondimentSelector;