import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import CustomModal from '../components/CustomModal';

type Item = {
    id: number;
    [key: string]: any;
};

type ModalState = {
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'delete';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
};

const AdminScreen = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('usuarios');
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<ModalState>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
        showCancel: false,
    });
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

    const tabs = [
        { key: 'usuarios', label: '👥 Usuarios', icon: 'people' },
        { key: 'repartidores', label: '🚴 Repartidores', icon: 'bicycle' },
        { key: 'productos', label: '🍕 Productos', icon: 'fast-food' },
        { key: 'restaurantes', label: '🏪 Restaurantes', icon: 'restaurant' },
        { key: 'cupones', label: '🎫 Cupones', icon: 'pricetag' },
        { key: 'flyers', label: '📢 Flyers', icon: 'megaphone' },
    ];

    // --- Cargar datos ---
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

            if (['usuarios', 'repartidores'].includes(activeTab)) data = res.data.usuarios || res.data;
            else if (activeTab === 'productos') data = res.data.products || res.data;
            else if (activeTab === 'restaurantes') data = res.data.restaurants || res.data;
            else if (activeTab === 'cupones') data = res.data.coupons || res.data;
            else if (activeTab === 'flyers') data = res.data.flyers || res.data;

            setItems(data);
        } catch (err) {
            console.error('Error:', err);
            showModal({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los datos',
                showCancel: false,
                confirmText: 'Aceptar'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // --- Manejo del Modal ---
    const showModal = (modalConfig: Omit<ModalState, 'visible'>) => {
        setModal({
            visible: true,
            ...modalConfig
        });
    };

    const hideModal = () => {
        setModal(prev => ({ ...prev, visible: false }));
        setItemToDelete(null);
    };

    // --- Acciones ---
    const handleCreate = () => {
        router.push(`/admin/create/${activeTab}`);
    };

    const handleEdit = (item: Item) => {
        router.push(`/admin/edit/${activeTab}/${item.id}`);
    };

    const handleDelete = (item: Item) => {
        const itemName = getItemDisplayName(item);
        setItemToDelete(item);
        
        showModal({
            type: 'delete',
            title: 'Confirmar eliminación',
            message: `¿Estás seguro de que quieres eliminar "${itemName}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            showCancel: true,
            onConfirm: confirmDelete
        });
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const itemName = getItemDisplayName(itemToDelete);

        try {
            await api.delete(`/admin/${activeTab}/${itemToDelete.id}`);
            
            showModal({
                type: 'success',
                title: 'Éxito',
                message: `${itemName} eliminado correctamente`,
                showCancel: false,
                confirmText: 'Aceptar'
            });
            
            fetchData(); // Recargar datos
        } catch (err: any) {
            console.error('Delete error:', err);
            const errorMessage = err.response?.data?.error || 'No se pudo eliminar';
            
            showModal({
                type: 'error',
                title: 'Error',
                message: errorMessage,
                showCancel: false,
                confirmText: 'Aceptar'
            });
        }
    };

    // Función auxiliar para obtener nombre del item
    const getItemDisplayName = (item: Item) => {
        if (['usuarios', 'repartidores'].includes(activeTab)) {
            return item.full_name || item.username || item.email;
        } else if (['productos', 'restaurantes'].includes(activeTab)) {
            return item.name;
        } else if (activeTab === 'cupones') {
            return item.title || item.code;
        } else if (activeTab === 'flyers') {
            return item.title;
        }
        return 'el elemento';
    };

    // Obtener el texto del botón crear según la pestaña activa
    const getCreateButtonText = () => {
        switch (activeTab) {
            case 'usuarios':
                return 'Crear Usuario';
            case 'repartidores':
                return 'Crear Repartidor';
            case 'productos':
                return 'Crear Producto';
            case 'restaurantes':
                return 'Crear Restaurante';
            case 'cupones':
                return 'Crear Cupón';
            case 'flyers':
                return 'Crear Flyer';
            default:
                return 'Crear';
        }
    };

    // --- Render Tabs ---
    const renderTab = ({ item }: { item: typeof tabs[0] }) => (
        <TouchableOpacity
            style={[
                styles.tabButton,
                activeTab === item.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(item.key)}
        >
            <Ionicons
                name={item.icon as any}
                size={16}
                color={activeTab === item.key ? '#FFFFFF' : '#666'}
                style={styles.tabIcon}
            />
            <Text style={[
                styles.tabText,
                activeTab === item.key && styles.activeTabText
            ]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item, index }: { item: Item; index: number }) => {
        let displayText = '';
        let subtitle = '';

        if (activeTab === 'usuarios') {
            displayText = item.full_name || item.username || item.email;
            subtitle = item.email || (item.roles ? item.roles.join(', ') : 'Usuario');
        } else if (activeTab === 'repartidores') {
            displayText = item.full_name || item.username || item.email;
            subtitle = item.email || `Tel: ${item.phone || 'No disponible'}`;
        } else if (activeTab === 'productos') {
            displayText = item.name;
            subtitle = `$${item.price?.toLocaleString() || '0'} • ${item.category || 'Producto'}`;
        } else if (activeTab === 'restaurantes') {
            displayText = item.name;
            subtitle = `${item.address || 'Sin dirección'} • ${item.is_open ? 'Abierto' : 'Cerrado'}`;
        } else if (activeTab === 'cupones') {
            displayText = item.title || item.code;
            const discount = item.discount_type === 'percentage'
                ? `${item.discount_value}%`
                : `$${item.discount_value}`;
            subtitle = `Descuento: ${discount} • ${item.is_active ? 'Activo' : 'Inactivo'}`;
        } else if (activeTab === 'flyers') {
            displayText = item.title;
            subtitle = `${item.description || 'Sin descripción'} • ${item.is_active ? 'Activo' : 'Inactivo'}`;
        }

        return (
            <View style={[
                styles.itemCard,
                index === 0 && styles.firstItem,
                index === items.length - 1 && styles.lastItem
            ]}>
                <View style={styles.itemContent}>
                    <View style={styles.itemMain}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                            {displayText}
                        </Text>
                        <Text style={styles.itemSubtitle} numberOfLines={2}>
                            {subtitle}
                        </Text>
                    </View>
                    <View style={styles.itemActions}>
                        <TouchableOpacity
                            onPress={() => handleEdit(item)}
                            style={[styles.actionButton, styles.editButton]}
                        >
                            <Ionicons name="create-outline" size={18} color="#4A90E2" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            style={[styles.actionButton, styles.deleteButton]}
                        >
                            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // --- UI ---
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Panel de Administración</Text>
                <Text style={styles.subtitle}>Gestiona tu plataforma</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <FlatList
                    data={tabs}
                    horizontal
                    renderItem={renderTab}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={styles.tabContainer}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Header de la lista con botón crear */}
                <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>
                        {tabs.find(tab => tab.key === activeTab)?.label} ({items.length})
                    </Text>
                    <TouchableOpacity 
                        style={styles.createButton}
                        onPress={handleCreate}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.createButtonText}>
                            {getCreateButtonText()}
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B6B" />
                        <Text style={styles.loadingText}>Cargando datos...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="file-tray-outline" size={64} color="#CCCCCC" />
                                <Text style={styles.emptyTitle}>Sin datos</Text>
                                <Text style={styles.emptySubtitle}>
                                    No hay {activeTab} disponibles
                                </Text>
                                <TouchableOpacity 
                                    style={styles.createEmptyButton}
                                    onPress={handleCreate}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                    <Text style={styles.createEmptyButtonText}>
                                        {getCreateButtonText()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Modal Personalizado */}
            <CustomModal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                cancelText={modal.cancelText}
                showCancel={modal.showCancel}
                onConfirm={modal.onConfirm}
                onCancel={hideModal}
            />
        </View>
    );
};

// --- Estilos Actualizados ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3436',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#636E72',
        textAlign: 'center',
        marginTop: 4,
    },
    tabsWrapper: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        marginHorizontal: 16,
        marginTop: -10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    tabContainer: {
        paddingHorizontal: 8,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        marginHorizontal: 4,
        minWidth: 120,
    },
    activeTab: {
        backgroundColor: '#FF6B6B',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    tabIcon: {
        marginRight: 6,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    list: {
        flex: 1,
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        marginVertical: 4,
        marginHorizontal: 4,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
    },
    firstItem: {
        marginTop: 8,
    },
    lastItem: {
        marginBottom: 8,
    },
    itemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemMain: {
        flex: 1,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#636E72',
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    editButton: {
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    deleteButton: {
        borderWidth: 1,
        borderColor: '#E74C3C',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#636E72',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3436',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#636E72',
        marginTop: 4,
        textAlign: 'center',
        marginBottom: 24,
    },
    createEmptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    createEmptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default AdminScreen;