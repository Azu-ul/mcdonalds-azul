// src/screens/ProductDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import IngredientSelector from './IngredientSelector';
import SideSelector from './SideSelector';
import DrinkSelector from './DrinkSelector';
import CondimentSelector from './CondimentSelector';
import AddToCartButton from './AddToCartButton';
import CustomModal from '../CustomModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Ingredient = {
    id: string;
    name: string;
    required?: boolean;
    maxCount?: number;

};

type SideOption = { label: string; price: number };
type DrinkOption = { label: string; price: number };
type Condiment = { id: string; name: string };

const ProductDetailScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isAuthenticated } = useAuth();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de selección
    const [size, setSize] = useState<'Mediano' | 'Grande'>('Mediano');
    const [ingredients, setIngredients] = useState<Record<string, number>>({
        pan: 1,
        carne: 1,
    });
    const [side, setSide] = useState<SideOption | null>(null);
    const [drink, setDrink] = useState<DrinkOption | null>(null);
    const [condiments, setCondiments] = useState<Record<string, boolean>>({});

    // Modales
    const [modalType, setModalType] = useState<
        'ingredients' | 'sides' | 'drinks' | 'condiments' | null
    >(null);

    const basePrice = product?.price || 0;

    // Ingredientes fijos
    const ingredientList: Ingredient[] = [
        { id: 'pan', name: 'Pan', required: true },
        { id: 'carne', name: 'Carne', required: true, maxCount: 4 },
        { id: 'cheddar', name: 'Cheddar', maxCount: 3 },
        { id: 'bacon', name: 'Bacon', maxCount: 3 },
    ];

    const sideOptions: SideOption[] = [
        { label: 'Papas Fritas Medianas', price: 0 },
        { label: 'Papas Tasty Bacon', price: 3900 },
        { label: 'Ensalada', price: 0 },
        { label: 'Papas Tasty', price: 3200 },
    ];

    const drinkOptions: DrinkOption[] = [
        { label: 'Coca Cola Zero', price: 0 },
        { label: 'Coca Cola', price: 0 },
        { label: 'Sprite Zero', price: 0 },
        { label: 'Fanta Zero', price: 0 },
        { label: 'Agua', price: 300 },
        { label: 'Jugo de Naranja', price: 0 },
    ];

    const condimentList: Condiment[] = [
        { id: 'ketchup', name: 'Ketchup' },
        { id: 'mostaza', name: 'Mostaza' },
        { id: 'mayonesa', name: 'Mayonesa' },
    ];

    // Cargar producto
    useEffect(() => {
        if (!id) {
            setError('Producto no especificado');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data);
            } catch (err: any) {
                console.log('id recibido:', id);

                setError('No se pudo cargar el producto');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const closeModal = () => setModalType(null);

    const isFormValid = () => {
        // Verificar ingredientes obligatorios
        if (!ingredients.pan || !ingredients.carne) return false;
        // Verificar acompañamiento y bebida obligatorios
        return !!side && !!drink;
    };

    const calculateTotalPrice = () => {
        let total = basePrice;

        // Ajuste por tamaño (ejemplo: +$500 si es Grande)
        if (size === 'Grande') total += 500;

        // Ingredientes adicionales
        if (ingredients.cheddar) total += ingredients.cheddar * 200;
        if (ingredients.bacon) total += ingredients.bacon * 300;
        if (ingredients.carne && ingredients.carne > 1)
            total += (ingredients.carne - 1) * 400;

        // Acompañamiento
        total += side?.price || 0;

        // Bebida
        total += drink?.price || 0;

        return total;
    };

    const handleAddToCart = () => {
        // Aquí iría la lógica para agregar al carrito (usando contexto o API)
        // Por ahora, redirigimos como solicitaste
        router.replace('/(tabs)/home'); // "Home con pedido pendiente"
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text>Cargando...</Text>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error || 'Producto no encontrado'}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.link}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalPrice = calculateTotalPrice();
    const canAdd = isFormValid();

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Imagen y datos básicos */}
                <Image source={{ uri: product.image_url }} style={styles.image} />
                <Text style={styles.title}>{product.name}</Text>
                <Text style={styles.price}>${basePrice.toLocaleString()}</Text>
                <Text style={styles.description}>{product.description}</Text>

                {/* Tamaño */}
                <View style={styles.section}>
                    <Text style={styles.label}>Selecciona un tamaño:</Text>
                    <View style={styles.sizeButtons}>
                        {(['Mediano', 'Grande'] as const).map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.sizeButton, size === s && styles.sizeButtonActive]}
                                onPress={() => setSize(s)}
                            >
                                <Text style={size === s ? styles.sizeTextActive : styles.sizeText}>
                                    {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Personalización */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setModalType('ingredients')}>
                        <Text style={styles.customizeLabel}>{product.name}</Text>
                        <Text style={styles.customizeSublabel}>Personalizar</Text>
                    </TouchableOpacity>
                </View>

                {/* Acompañamiento */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setModalType('sides')}>
                        <Text style={styles.selectionLabel}>
                            {side ? side.label : 'Acompañamiento (obligatorio)'}
                        </Text>
                        {!side && <Text style={styles.selectButton}>Seleccionar</Text>}
                    </TouchableOpacity>
                </View>

                {/* Bebida */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setModalType('drinks')}>
                        <Text style={styles.selectionLabel}>
                            {drink ? drink.label : 'Bebida (obligatorio)'}
                        </Text>
                        {!drink && <Text style={styles.selectButton}>Seleccionar</Text>}
                    </TouchableOpacity>
                </View>

                {/* Condimentos */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setModalType('condiments')}>
                        <Text style={styles.customizeLabel}>Condimentos adicionales</Text>
                    </TouchableOpacity>
                </View>

                {/* Botón final */}
                {canAdd && (
                    <AddToCartButton
                        price={totalPrice}
                        onAdd={handleAddToCart}
                        maxQuantity={5}
                    />
                )}
            </ScrollView>

            <CustomModal visible={!!modalType}>
                {modalType === 'ingredients' && (
                    <IngredientSelector
                        ingredients={ingredientList}
                        selected={ingredients}
                        onChange={setIngredients}
                        onClose={closeModal}
                    />
                )}
                {modalType === 'sides' && (
                    <SideSelector
                        options={sideOptions}
                        onSelect={(opt) => {
                            setSide(opt);
                            closeModal();
                        }}
                        onClose={closeModal}
                    />
                )}
                {modalType === 'drinks' && (
                    <DrinkSelector
                        options={drinkOptions}
                        onSelect={(opt) => {
                            setDrink(opt);
                            closeModal();
                        }}
                        onClose={closeModal}
                    />
                )}
                {modalType === 'condiments' && (
                    <CondimentSelector
                        condiments={condimentList}
                        selected={condiments}
                        onChange={setCondiments}
                        onClose={closeModal}
                    />
                )}
            </CustomModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    scrollContent: {
        paddingBottom: 80,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: 'red',
        fontSize: 16,
    },
    link: {
        color: '#DA291C',
        marginTop: 10,
    },
    image: {
        width: '100%',
        height: SCREEN_WIDTH * 0.7,
        borderRadius: 12,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        color: 'gray',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 13,
        color: 'gray',
        textAlign: 'center',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sizeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    sizeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
    },
    sizeButtonActive: {
        backgroundColor: '#FFBC0D',
        borderColor: '#FFBC0D',
    },
    sizeText: {
        color: '#333',
    },
    sizeTextActive: {
        color: '#292929',
        fontWeight: 'bold',
    },
    customizeLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    customizeSublabel: {
        fontSize: 14,
        color: 'gray',
        textDecorationLine: 'underline',
        marginTop: 4,
    },
    selectionLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectButton: {
        color: '#FFBC0D',
        fontWeight: '600',
        marginTop: 4,
    },
});

export default ProductDetailScreen;