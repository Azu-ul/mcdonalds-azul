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
}

export default function CustomModal({
  visible,
  type = "info",
  title = "Aviso",
  message = "¿Estás seguro?",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = false,
  onConfirm,
  onCancel,
}: CustomModalProps) {
  const colors = {
    confirm: "#FA8072", // rosa (del documento)
    delete: "#E53935", // rojo
    question: "#2196F3", // azul
    info: "#FA8072", // rosa (del documento)
  };

  const color = colors[type];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={[styles.buttonContainer, !showCancel && styles.singleButton]}>
            {showCancel && (
              <TouchableOpacity style={[styles.cancelButton]} onPress={onCancel}>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    elevation: 10,
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