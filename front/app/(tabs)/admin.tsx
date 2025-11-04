// /app/(tabs)/admin.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../../config/api';
import { useRouter } from 'expo-router';

type Item = {
  id: number;
  [key: string]: any;
};

const AdminScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('usuarios');

  const tabs = [
    { key: 'usuarios', label: 'Usuarios' },
    { key: 'repartidores', label: 'Repartidores' },
    { key: 'productos', label: 'Productos' },
    { key: 'restaurantes', label: 'Restaurantes' },
    { key: 'cupones', label: 'Cupones' },
    { key: 'flyers', label: 'Flyers' },
  ];

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'repartidores') {
        endpoint = '/admin/usuarios?role=repartidor';
      } else {
        endpoint = `/admin/${activeTab}`;
      }
      const res = await api.get(endpoint);
      let data = [];

      if (activeTab === 'usuarios' || activeTab === 'repartidores') {
        data = res.data.usuarios || res.data;
      } else if (activeTab === 'productos') {
        data = res.data.products || res.data;
      } else if (activeTab === 'restaurantes') {
        data = res.data.restaurants || res.data;
      } else if (activeTab === 'cupones') {
        data = res.data.coupons || res.data;
      } else if (activeTab === 'flyers') {
        data = res.data.flyers || res.data;
      }

      setItems(data);
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleEdit = (item: Item) => {
    // Ej: router.push(`/admin/edit/${activeTab}/${item.id}`);
    Alert.alert('Editar', `Editar ${activeTab}: ${item.id}`);
  };

  const handleDelete = async (item: Item) => {
    Alert.alert(
      'Confirmar',
      `¿Eliminar ${activeTab.slice(0, -1)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/${activeTab}/${item.id}`);
              fetchData();
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const renderTab = ({ item }: { item: typeof tabs[0] }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === item.key && styles.activeTab]}
      onPress={() => setActiveTab(item.key)}
    >
      <Text style={[styles.tabText, activeTab === item.key && styles.activeTabText]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Item }) => {
    let displayText = '';
    if (activeTab === 'usuarios' || activeTab === 'repartidores') {
      displayText = item.full_name || item.username || item.email;
    } else if (activeTab === 'productos') {
      displayText = item.name;
    } else if (activeTab === 'restaurantes') {
      displayText = item.name;
    } else if (activeTab === 'cupones') {
      displayText = item.code || item.title;
    } else if (activeTab === 'flyers') {
      displayText = item.title;
    }

    return (
      <View style={styles.itemRow}>
        <Text style={styles.itemText} numberOfLines={1}>
          {displayText}
        </Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
            <Text style={styles.editText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administración</Text>

      {/* Tabs */}
      <FlatList
        data={tabs}
        horizontal
        renderItem={renderTab}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.tabContainer}
        showsHorizontalScrollIndicator={false}
      />

      {/* Lista */}
      {loading ? (
        <Text style={styles.loadingText}>Cargando...</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Sin datos</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  tabContainer: { marginBottom: 16 },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  activeTab: { backgroundColor: '#DA291C' },
  tabText: { fontSize: 14, color: '#000' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemText: { flex: 1, fontSize: 16 },
  itemActions: { flexDirection: 'row', gap: 12 },
  actionButton: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  editText: { fontSize: 16 },
  deleteText: { fontSize: 16 },
  loadingText: { textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
});

export default AdminScreen;