"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface SelectOption {
  label: string
  value: string
}

interface SelectFieldProps {
  options: SelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  style?: any
}

export default function SelectField({ options, value, onValueChange, placeholder, style }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setIsOpen(false)
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.selectButton} onPress={() => setIsOpen(true)}>
        <Text style={[styles.selectText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une option</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, item.value === value && styles.selectedOption]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[styles.optionText, item.value === value && styles.selectedOptionText]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Ionicons name="checkmark" size={20} color="#4a5d4a" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
  },
  selectText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedOption: {
    backgroundColor: "#4a5d4a10",
  },
  optionText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  selectedOptionText: {
    color: "#4a5d4a",
    fontWeight: "500",
  },
})
