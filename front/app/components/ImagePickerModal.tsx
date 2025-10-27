// app/components/ImagePickerModal.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";

interface ImagePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onChooseGallery: () => void;
    onCaptureWebcam?: (file: File) => void;
}

export default function ImagePickerModal({
    visible,
    onClose,
    onTakePhoto,
    onChooseGallery,
    onCaptureWebcam,
}: ImagePickerModalProps) {
    const [showWebcam, setShowWebcam] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!visible) {
            stopWebcam();
            setShowWebcam(false);
        }
    }, [visible]);

    const startWebcam = async () => {
        if (Platform.OS !== 'web') return;

        try {
            console.log('📷 Starting webcam...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false,
            });

            streamRef.current = stream;

            // Esperar un momento para asegurar que el video ref esté disponible
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(err => {
                        console.error('Error playing video:', err);
                    });
                    console.log('✅ Webcam started and playing');
                }
            }, 100);

            setShowWebcam(true);
        } catch (error) {
            console.error('❌ Error starting webcam:', error);
            alert('No se pudo acceder a la cámara. Verifica los permisos.');
            setShowWebcam(false);
            onClose();
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            console.log('🛑 Stopping webcam...');
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || Platform.OS !== 'web') return;

        console.log('📸 Capturing photo...');
        console.log('Video element:', videoRef.current);
        console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            console.error('❌ Video not ready');
            alert('El video no está listo. Espera un momento e intenta de nuevo.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 🔄 Invertir la imagen antes de dibujar
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            console.log('✅ Image drawn to canvas');

            canvas.toBlob((blob) => {
                console.log('📦 Blob created:', blob);
                if (blob && onCaptureWebcam) {
                    const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });
                    console.log('✅ Photo captured:', file.name, file.size, 'bytes');
                    onCaptureWebcam(file);
                    stopWebcam();
                    setShowWebcam(false);
                    onClose();
                } else {
                    console.error('❌ Failed to create blob');
                    alert('Error al capturar la foto. Intenta de nuevo.');
                }
            }, 'image/jpeg', 0.8);
        } else {
            console.error('❌ Failed to get canvas context');
        }
    };

    const handleTakePhoto = () => {
        if (Platform.OS === 'web') {
            startWebcam();
        } else {
            onTakePhoto();
            onClose();
        }
    };

    const handleChooseGallery = () => {
        onChooseGallery();
        onClose();
    };

    // Vista de cámara web (solo web)
    if (Platform.OS === 'web' && showWebcam) {
        return (
            <Modal visible={visible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.webcamContainer}>
                        <Text style={styles.webcamTitle}>📷 Tomar foto</Text>

                        <View style={styles.videoWrapper}>
                            <video
                                ref={(ref) => {
                                    videoRef.current = ref;
                                    console.log('📹 Video ref set:', ref);
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 12,
                                    backgroundColor: '#000',
                                    transform: 'scaleX(-1)',
                                }}
                                autoPlay
                                playsInline
                                muted
                            />
                        </View>
                        <View style={[styles.buttonContainer, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    stopWebcam();
                                    setShowWebcam(false);
                                }}
                            >
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={capturePhoto}
                            >
                                <Text style={styles.confirmText}>📸 Capturar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    // Vista de selección (igual que CustomModal)
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Foto de perfil</Text>
                    <Text style={styles.message}>Selecciona una opción</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={handleTakePhoto}
                        >
                            <Text style={styles.optionText}>
                                {Platform.OS === 'web' ? '📷 Usar cámara' : '📷 Tomar foto'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={handleChooseGallery}
                        >
                            <Text style={styles.optionText}>🖼️ Elegir de galería</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
        width: "40%",
        minWidth: 320,
        maxWidth: 400, // ← Agregar máximo para desktop
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FA8072",
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
    },
    buttonContainer: {
        width: "100%",
        gap: 10,
    },
    optionButton: {
        width: "100%",
        backgroundColor: "#FA8072",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    optionText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 10,
    },
    closeText: {
        textAlign: "center",
        color: "#666",
        fontWeight: "600",
    },
    // Estilos para cámara web - MEJORADOS PARA RESPONSIVE
    webcamContainer: {
        width: '90%', // ← Cambiado a porcentaje responsive
        maxWidth: 500, // ← Tamaño máximo en desktop
        minWidth: 300, // ← Tamaño mínimo
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        elevation: 10,
        // Para mobile
        ...Platform.select({
            web: {
                // En web mantenemos el comportamiento actual
            },
            default: {
                width: '95%', // ← Más ancho en mobile nativo
                maxWidth: 400,
            }
        })
    },
    webcamTitle: {
        fontSize: 18, // ← Un poco más grande
        fontWeight: "700",
        color: "#FA8072",
        marginBottom: 16,
    },
    videoWrapper: {
        width: '100%', // ← Ancho responsive
        maxWidth: 400, // ← Máximo para desktop
        aspectRatio: 1, // ← Mantener relación cuadrada
        backgroundColor: "#000",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
        // Para mobile
        ...Platform.select({
            web: {
                height: 300, // ← Altura fija en web
            },
            default: {
                height: 300, // ← Altura fija en mobile nativo
            }
        })
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#e0e0e0",
        paddingVertical: 12, // ← Un poco más de padding
        borderRadius: 8,
        marginHorizontal: 5, // ← Espaciado entre botones
    },
    confirmButton: {
        flex: 1,
        backgroundColor: "#FA8072",
        paddingVertical: 12, // ← Un poco más de padding
        borderRadius: 8,
        marginHorizontal: 5, // ← Espaciado entre botones
    },
    cancelText: {
        textAlign: "center",
        color: "#333",
        fontWeight: "600",
        fontSize: 14, // ← Tamaño consistente
    },
    confirmText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: 14, // ← Tamaño consistente
    },
});