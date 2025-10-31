// app/components/CustomModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";

type ModalType = "confirm" | "delete" | "question" | "info";

interface CustomModalProps {
  visible: boolean;
  type?: ModalType;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: (event: GestureResponderEvent) => void;
  onCancel?: (event: GestureResponderEvent) => void;
  children?: React.ReactNode; // 👈 ACEPTAR CHILDREN
}

export default function CustomModal({
  visible,
  type = "info",
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = false,
  onConfirm,
  onCancel,
  children, // 👈 DES ESTRUCTURAR CHILDREN
}: CustomModalProps) {
  const colors = {
    confirm: "#FA8072",
    delete: "#E53935",
    question: "#2196F3",
    info: "#FA8072",
  };

  const color = colors[type];

  // Si se pasan children, renderizamos el modo personalizado
  if (children) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { padding: 0, alignItems: 'flex-start' }]}>
            {children}
          </View>
        </View>
      </Modal>
    );
  }

  // Si no, usamos el modo simple (mensaje + botones)
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={[styles.title, { color }]}>{title || "Aviso"}</Text>
          <Text style={styles.message}>{message || "¿Estás seguro?"}</Text>

          <View style={[styles.buttonContainer, !showCancel && styles.singleButton]}>
            {showCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: color }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end", // Para que aparezca desde abajo (como en tu diseño)
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    alignItems: "center",
    maxHeight: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  singleButton: {
    justifyContent: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FFB6A3",
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  confirmText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
});