import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import IngredientSelector from './IngredientSelector';
import SideSelector from './SideSelector';
import DrinkSelector from './DrinkSelector';
import CondimentSelector from './CondimentSelector';
import CustomModal from '../components/CustomModal';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../../config/api';

type Ingredient = {
    id: number;
    name: string;
    is_required: boolean;
    is_default: boolean;
    max_quantity: number;
    extra_price: number;
};

type SizeOption = {
    id: number;
    name: string;
    price_modifier: number;
};

type SideOption = {
    id: number;
    name: string;
    extra_price: number;
    image_url?: string;
};

type DrinkOption = {
    id: number;
    name: string;
    extra_price: number;
    image_url?: string;
};

type Product = {
    id: number;
    name: string;
    description: string;
    base_price: number;
    category: string;
    image_url?: string;
    sizes: SizeOption[];
    ingredients: Ingredient[];
    sides: SideOption[];
    drinks: DrinkOption[];
};

type ModalType = 'ingredients' | 'sides' | 'drinks' | 'condiments' | null;

export default function ProductDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isAuthenticated } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de selección
    const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
    const [selectedSide, setSelectedSide] = useState<SideOption | null>(null);
    const [selectedDrink, setSelectedDrink] = useState<DrinkOption | null>(null);
    const [ingredients, setIngredients] = useState<Record<number, number>>({});
    const [condiments, setCondiments] = useState<Record<number, boolean>>({});

    // Modales
    const [modalType, setModalType] = useState<ModalType>(null);

    useEffect(() => {
        if (!id) {
            setError('Producto no especificado');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                const res = await api.get(`/home/products/${id}`);
                const productData = res.data.product;
                setProduct(productData);

                // Seleccionar tamaño por defecto (Mediano)
                if (productData.sizes && productData.sizes.length > 0) {
                    setSelectedSize(productData.sizes[0]);
                }

                // Inicializar ingredientes por defecto
                if (productData.ingredients) {
                    const defaultIngredients: Record<number, number> = {};
                    productData.ingredients.forEach((ing: Ingredient) => {
                        if (ing.is_default) {
                            defaultIngredients[ing.id] = 1;
                        }
                    });
                    setIngredients(defaultIngredients);
                }
            } catch (err: any) {
                setError('No se pudo cargar el producto');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const calculateTotalPrice = () => {
        if (!product) return 0;

        let total = product.base_price;

        // Agregar modificador de tamaño
        if (selectedSize) {
            total += selectedSize.price_modifier;
        }

        // Agregar precio de acompañamiento
        if (selectedSide) {
            total += selectedSide.extra_price;
        }

        // Agregar precio de bebida
        if (selectedDrink) {
            total += selectedDrink.extra_price;
        }

        // Agregar extras de ingredientes
        if (product.ingredients) {
            product.ingredients.forEach((ing: Ingredient) => {
                const quantity = ingredients[ing.id] || 0;
                if (quantity > 1) {
                    total += ing.extra_price * (quantity - 1);
                }
            });
        }

        return total;
    };

    const isFormValid = () => {
        return !!selectedSize && !!selectedSide && !!selectedDrink;
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            alert('Debes iniciar sesión para agregar productos al carrito');
            return;
        }

        console.log('Agregando al carrito:', {
            product,
            size: selectedSize,
            side: selectedSide,
            drink: selectedDrink,
            ingredients,
            condiments,
            total: calculateTotalPrice()
        });

        router.replace('/');
    };

    const getImageUrl = (imageUrl?: string | null) => {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${API_URL.replace('/api', '')}${imageUrl}`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFBC0D" />
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'Producto no encontrado'}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>← Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalPrice = calculateTotalPrice();
    const obligatorySelections = [
        selectedSide !== null,
        selectedDrink !== null
    ].filter(Boolean).length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{product.category}</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Imagen del producto */}
                <Image
                    source={{ uri: getImageUrl(product.image_url) }}
                    style={styles.productImage}
                    resizeMode="contain"
                />

                {/* Nombre y precio */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>
                        $ {product.base_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                </View>

                {/* Selector de tamaño */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Selecciona un tamaño</Text>
                    <View style={styles.sizeContainer}>
                        {product.sizes?.map((size: SizeOption) => (
                            <TouchableOpacity
                                key={size.id}
                                style={[
                                    styles.sizeButton,
                                    selectedSize?.id === size.id && styles.sizeButtonActive
                                ]}
                                onPress={() => setSelectedSize(size)}
                            >
                                <View style={styles.sizeCircle}>
                                    <Text style={styles.sizeLetter}>
                                        {size.name === 'Mediano' ? 'M' : 'G'}
                                    </Text>
                                </View>
                                <Text style={styles.sizeName}>{size.name}</Text>
                                {size.price_modifier > 0 && selectedSize?.id !== size.id && (
                                    <Text style={styles.sizeExtra}>
                                        Solo por +$ {size.price_modifier.toLocaleString('es-AR')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Completá tu producto */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Completá tu producto</Text>
                        <View style={styles.obligatoryBadge}>
                            <Text style={styles.obligatoryText}>Obligatorio</Text>
                        </View>
                    </View>

                    {/* Personalizar hamburguesa */}
                    {product.ingredients && product.ingredients.length > 0 && (
                        <TouchableOpacity
                            style={styles.customizeCard}
                            onPress={() => setModalType('ingredients')}
                        >
                            <Image
                                source={{ uri: getImageUrl(product.image_url) }}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{product.name}</Text>
                                <Text style={styles.cardSubtitle}>Personalizar</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Acompañamiento */}
                    <TouchableOpacity
                        style={styles.selectionCard}
                        onPress={() => setModalType('sides')}
                    >
                        <View style={styles.cardLeft}>
                            <Text style={styles.cardTitle}>Acompañamiento</Text>
                            <Text style={styles.cardDescription}>
                                {selectedSide
                                    ? selectedSide.name
                                    : 'Elegí una opción (obligatorio)'}
                            </Text>
                        </View>
                        <View style={styles.selectButton}>
                            <Text style={styles.selectButtonText}>Seleccionar</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Bebida */}
                    <TouchableOpacity
                        style={styles.selectionCard}
                        onPress={() => setModalType('drinks')}
                    >
                        <View style={styles.cardLeft}>
                            <Text style={styles.cardTitle}>Bebida</Text>
                            <Text style={styles.cardDescription}>
                                {selectedDrink
                                    ? selectedDrink.name
                                    : 'Elegí una opción (obligatorio)'}
                            </Text>
                        </View>
                        <View style={styles.selectButton}>
                            <Text style={styles.selectButtonText}>Seleccionar</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Condimentos adicionales */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setModalType('condiments')}>
                        <Text style={styles.sectionTitle}>Condimentos adicionales</Text>
                        <Text style={styles.personalizeLink}>Personalizar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Botón flotante inferior */}
            {isFormValid() && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddToCart}
                    >
                        <Text style={styles.addButtonText}>
                            {obligatorySelections} selecciones obligatorias
                        </Text>
                        <Text style={styles.addButtonPrice}>
                            $ {totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modales */}
            <CustomModal visible={!!modalType}>
                {modalType === 'ingredients' && product.ingredients && (
                    <IngredientSelector
                        ingredients={product.ingredients}
                        selected={ingredients}
                        onChange={setIngredients}
                        onClose={() => setModalType(null)}
                    />
                )}
                {modalType === 'sides' && product.sides && (
                    <SideSelector
                        options={product.sides}
                        selected={selectedSide}
                        onSelect={(side) => {
                            setSelectedSide(side);
                            setModalType(null);
                        }}
                        onClose={() => setModalType(null)}
                    />
                )}
                {modalType === 'drinks' && product.drinks && (
                    <DrinkSelector
                        options={product.drinks}
                        selected={selectedDrink}
                        onSelect={(drink) => {
                            setSelectedDrink(drink);
                            setModalType(null);
                        }}
                        onClose={() => setModalType(null)}
                    />
                )}
                {modalType === 'condiments' && (
                    <CondimentSelector
                        condiments={[
                            { id: 1, name: 'Ketchup' },
                            { id: 2, name: 'Mostaza' },
                            { id: 3, name: 'Mayonesa' }
                        ]}
                        selected={condiments}
                        onChange={setCondiments}
                        onClose={() => setModalType(null)}
                    />
                )}
            </CustomModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#DA291C',
        textAlign: 'center',
        marginBottom: 20,
    },
    backLink: {
        fontSize: 16,
        color: '#FFBC0D',
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 16,
    },
    backArrow: {
        fontSize: 24,
        color: '#292929',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
    },
    scrollView: {
        flex: 1,
    },
    productImage: {
        width: '100%',
        height: 300,
        backgroundColor: '#fff',
    },
    infoContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F5F5F5',
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 12,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 16,
    },
    obligatoryBadge: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    obligatoryText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    sizeContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    sizeButton: {
        alignItems: 'center',
    },
    sizeCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    sizeButtonActive: {},
    sizeLetter: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#292929',
    },
    sizeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 4,
    },
    sizeExtra: {
        fontSize: 12,
        color: '#27AE60',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    customizeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    cardIcon: {
        width: 60,
        height: 60,
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'underline',
    },
    selectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    cardLeft: {
        flex: 1,
    },
    cardDescription: {
        fontSize: 14,
        color: '#999',
    },
    selectButton: {
        backgroundColor: '#FFBC0D',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    selectButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#292929',
    },
    personalizeLink: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'underline',
    },
    bottomSpacing: {
        height: 100,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    addButton: {
        backgroundColor: '#292929',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButtonPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});