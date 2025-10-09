"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"
import { useAuth } from "@/contexts/AuthContext"
import React from "react"

const MOTIF_OPTIONS = [
  { value: "virement_non_effectif", label: "Virement non effectif" },
  { value: "perception_indue_frais", label: "Perception indue de frais" },
  { value: "operation_contestee", label: "Opération contestatée / Non traitée / Non effective" },
  { value: "debit_tort", label: "Débit à tort GAB /TPE/ B2W/ Autres" },
  { value: "produit_non_fonctionnel", label: "Produit ou Service non fonctionnel" },
  { value: "souscription_non_effectif", label: "Souscription non effectif aux Produits et Services" },
]

export default function ReclamationScreen() {
  const { tenantId, user } = useAuth()
  const [email, setEmail] = useState("")
  const [motif, setMotif] = useState("")
  const [description, setDescription] = useState("")
  const [showMotifPicker, setShowMotifPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre email")
      return
    }

    if (!motif) {
      Alert.alert("Erreur", "Veuillez sélectionner un motif de réclamation")
      return
    }

    if (!description.trim()) {
      Alert.alert("Erreur", "Veuillez entrer une description")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer un email valide")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token || !tenantId) {
        Alert.alert("Erreur", "Vous devez être connecté pour soumettre une réclamation")
        setIsSubmitting(false)
        return
      }

      if (!user || !user.id) {
        Alert.alert("Erreur", "Impossible de récupérer les informations utilisateur")
        setIsSubmitting(false)
        return
      }

      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.RECLAMATION.CREATE(tenantId)}`

      const requestBody = {
        customerId: user.id,
        email: email.trim(),
        motifRecl: motif,
        description: description.trim(),
        dateRecl: new Date().toISOString(),
        status: "En attente",
      }

      console.log("[v0] Submitting reclamation to:", url)
      console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

      const contentType = response.headers.get("content-type")
      const isJson = contentType && contentType.includes("application/json")

      if (!isJson) {
        const textResponse = await response.text()
        console.log("[v0] Non-JSON response:", textResponse)
        throw new Error("Le serveur a renvoyé une réponse invalide")
      }

      const data = await response.json()
      console.log("[v0] Response data:", JSON.stringify(data, null, 2))

      if (response.ok) {
        Alert.alert("Succès", "Votre réclamation a été envoyée avec succès", [
          {
            text: "OK",
            onPress: () => {
              setEmail("")
              setMotif("")
              setDescription("")
              router.back()
            },
          },
        ])
      } else {
        Alert.alert("Erreur", data.message || "Une erreur est survenue lors de l'envoi de votre réclamation")
      }
    } catch (error) {
      console.error("[v0] Error submitting reclamation:", error)
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Impossible de soumettre votre réclamation. Veuillez réessayer.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (email || motif || description) {
      Alert.alert("Annuler", "Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues.", [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: () => {
            setEmail("")
            setMotif("")
            setDescription("")
            router.back()
          },
        },
      ])
    } else {
      router.back()
    }
  }

  const getSelectedMotifLabel = () => {
    const selected = MOTIF_OPTIONS.find((option) => option.value === motif)
    return selected ? selected.label : "Sélectionner"
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demande de réclamation</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Informations personnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="exemple@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Réclamation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Réclamation</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Motif de réclamation <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowMotifPicker(!showMotifPicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerButtonText, !motif && styles.placeholderText]}>
                  {getSelectedMotifLabel()}
                </Text>
                <Ionicons name={showMotifPicker ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
              </TouchableOpacity>

              {showMotifPicker && (
                <View style={styles.pickerContainer}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6B7280" />
                    <Text style={styles.searchPlaceholder}>Rechercher</Text>
                  </View>
                  {MOTIF_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.pickerOption}
                      onPress={() => {
                        setMotif(option.value)
                        setShowMotifPicker(false)
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Commentaire <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Commentaire"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { paddingBottom: Platform.OS === "ios" ? 40 : 20 }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Valider</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#111827",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})
