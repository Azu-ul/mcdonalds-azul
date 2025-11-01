import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Ingredient = {
  id: number;
  name: string;
  is_required: boolean;
  is_default: boolean;
  max_quantity: number;
  extra_price: number;
};

type Props = {
  ingredients: Ingredient[];
  selected: Record<number, number>;
  onChange: (selection: Record<number, number>) => void;
  onClose: () => void;
};

export default function IngredientSelector({ ingredients, selected, onChange, onClose }: Props) {
  const toggle = (id: number, maxQuantity: number, extraPrice: number) => {
    const current = selected[id] || 0;
    let newValue = current + 1;
    
    if (newValue > maxQuantity) {
      newValue = 1;
    }
    
    onChange({ ...selected, [id]: newValue });
  };

  const remove = (id: number) => {
    const newSelected = { ...selected };
    delete newSelected[id];
    onChange(newSelected);
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>¿Cómo querés personalizar?</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {ingredients.map((ing) => {
          const quantity = selected[ing.id] || 0;
          const hasExtra = quantity > 1 && ing.extra_price > 0;
          
          return (
            <View key={ing.id} style={styles.row}>
              <View style={styles.ingredientLeft}>
                <Text style={styles.ingredientName}>
                  {ing.name}
                  {ing.is_required && <Text style={styles.required}> (obligatorio)</Text>}
                </Text>
                {hasExtra && (
                  <Text style={styles.extraPrice}>
                    +$ {(ing.extra_price * (quantity - 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Text>
                )}
              </View>
              
              <View style={styles.controls}>
                {quantity > 0 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{quantity}x</Text>
                  </View>
                )}
                
                {!ing.is_required && quantity > 0 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => remove(ing.id)}
                  >
                    <Text style={styles.removeText}>Quitar</Text>
                  </TouchableOpacity>
                )}
                
                {quantity < ing.max_quantity && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => toggle(ing.id, ing.max_quantity, ing.extra_price)}
                  >
                    <Text style={styles.addText}>
                      {quantity === 0 ? 'Agregar' : 'Más'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonText}>Listo</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  list: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ingredientLeft: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: '#292929',
    marginBottom: 4,
  },
  required: {
    color: '#999',
    fontSize: 14,
  },
  extraPrice: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBadge: {
    backgroundColor: '#FFBC0D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#292929',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  removeText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#FFBC0D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#292929',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  doneButton: {
    backgroundColor: '#292929',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});