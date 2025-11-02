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

type PickerMode = 'image' | 'document';

interface ImagePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onChooseGallery: () => void;
    onCaptureWebcam?: (file: File) => void;
    mode?: PickerMode;
}

export default function ImagePickerModal({
    visible,
    onClose,
    onTakePhoto,
    onChooseGallery,
    onCaptureWebcam,
    mode = 'image',
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
        if (Platform.OS !== 'web' || mode !== 'image') return;

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
        if (!videoRef.current || Platform.OS !== 'web' || mode !== 'image') return;

        console.log('📸 Capturing photo...');
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
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob && onCaptureWebcam) {
                    const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCaptureWebcam(file);
                    stopWebcam();
                    setShowWebcam(false);
                    onClose();
                } else {
                    console.error('❌ Failed to create blob');
                    alert('Error al capturar la foto. Intenta de nuevo.');
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const handleTakePhoto = () => {
        if (Platform.OS === 'web' && mode === 'image') {
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

    // Vista de cámara web (solo web + modo imagen)
    if (Platform.OS === 'web' && showWebcam && mode === 'image') {
        return (
            <Modal visible={visible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.webcamContainer}>
                        <Text style={styles.webcamTitle}>📷 Tomar foto</Text>
                        <View style={styles.videoWrapper}>
                            <video
                                ref={(ref) => {
                                    videoRef.current = ref;
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

    // Vista principal de selección
    const isDocument = mode === 'document';
    const title = isDocument ? '🪪 Subir documento' : '📷 Foto de perfil';
    const message = isDocument
        ? (Platform.OS === 'web'
            ? 'Selecciona un archivo (JPG, PNG o PDF)'
            : 'Selecciona una imagen del documento')
        : 'Selecciona una opción';
    const galleryText = isDocument ? '📎 Elegir archivo' : '🖼️ Elegir de galería';

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {/* Cámara solo para imágenes */}
                        {!isDocument && (
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={handleTakePhoto}
                            >
                                <Text style={styles.optionText}>
                                    {Platform.OS === 'web' ? '📷 Usar cámara' : '📷 Tomar foto'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {isDocument && Platform.OS === 'web' ? (
                            <>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    style={{
                                        position: 'absolute',
                                        opacity: 0,
                                        width: 1,
                                        height: 1,
                                        overflow: 'hidden',
                                    }}
                                    id="file-input-doc"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        console.log('📁 Archivo seleccionado:', file);
                                        if (file) {
                                            if (onCaptureWebcam) {
                                                console.log('📤 Enviando archivo:', file.name, file.type, file.size);
                                                onCaptureWebcam(file);
                                            }
                                            onClose();
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <label
                                    htmlFor="file-input-doc"
                                    style={{
                                        backgroundColor: "#FA8072",
                                        padding: 12,
                                        borderRadius: 8,
                                        width: '100%',
                                        textAlign: 'center',
                                        color: '#fff',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        display: 'block',
                                    }}
                                >
                                    {galleryText}
                                </label>
                            </>
                        ) : !isDocument ? (
                            // Esto es para la foto de perfil (imagen)
                            Platform.OS === 'web' ? (
                                <>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{
                                            position: 'absolute',
                                            opacity: 0,
                                            width: 1,
                                            height: 1,
                                            overflow: 'hidden',
                                        }}
                                        id="file-input-image"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            console.log('🖼️ Imagen seleccionada:', file);
                                            if (file) {
                                                if (onCaptureWebcam) {
                                                    console.log('📤 Enviando imagen:', file.name, file.type, file.size);
                                                    onCaptureWebcam(file);
                                                }
                                                onClose();
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                    <label
                                        htmlFor="file-input-image"
                                        style={{
                                            backgroundColor: "#FA8072",
                                            padding: 12,
                                            borderRadius: 8,
                                            width: '100%',
                                            textAlign: 'center',
                                            color: '#fff',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            display: 'block',
                                        }}
                                    >
                                        {galleryText}
                                    </label>
                                </>
                            ) : (
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={handleChooseGallery}
                                >
                                    <Text style={styles.optionText}>{galleryText}</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={handleChooseGallery}
                            >
                                <Text style={styles.optionText}>{galleryText}</Text>
                            </TouchableOpacity>
                        )}
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
        maxWidth: 400,
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
    webcamContainer: {
        width: '90%',
        maxWidth: 500,
        minWidth: 300,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        elevation: 10,
    },
    webcamTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FA8072",
        marginBottom: 16,
    },
    videoWrapper: {
        width: '100%',
        maxWidth: 400,
        aspectRatio: 1,
        backgroundColor: "#000",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
        height: 300,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#e0e0e0",
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: "#FA8072",
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    cancelText: {
        textAlign: "center",
        color: "#333",
        fontWeight: "600",
        fontSize: 14,
    },
    confirmText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    // Estilos web-only (usados condicionalmente)
    webInput: {
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1,
        overflow: 'hidden',
    },
    webInputLabel: {
        backgroundColor: "#FA8072",
        padding: 12,
        borderRadius: 8,
        width: '100%',
        textAlign: 'center',
        color: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
        userSelect: 'none',
    },
});