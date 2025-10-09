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
import { useAuth } from "@/contexts/AuthContext"
import * as DocumentPicker from "expo-document-picker"
import React from "react"

interface ReclamationMotif {
  id: string
  label: string
}

const RECLAMATION_MOTIFS: ReclamationMotif[] = [
  { id: "virement_non_effectif", label: "Virement non effectif" },
  { id: "perception_indue_frais", label: "Perception indue de frais" },
  { id: "operation_contestee", label: "Opération contestatée / Non traitée / Non effective" },
  { id: "debit_tort", label: "Débit à tort GAB /TPE/ B2W/ Autres" },
  { id: "produit_non_fonctionnel", label: "Produit ou Service non fonctionnel" },
  { id: "souscription_non_effectif", label: "Souscription non effectif aux Produits et Services" },
]

export default function ReclamationScreen() {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [selectedMotif, setSelectedMotif] = useState<string | null>(null)
  const [showMotifPicker, setShowMotifPicker] = useState(false)
  const [commentaire, setCommentaire] = useState("")
  const [attachment, setAttachment] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachment(result.assets[0])
      }
    } catch (error) {
      console.error("Error picking document:", error)
      Alert.alert("Erreur", "Impossible de sélectionner le fichier")
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre email")
      return
    }

    if (!selectedMotif) {
      Alert.alert("Erreur", "Veuillez sélectionner un motif de réclamation")
      return
    }

    if (!commentaire.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un commentaire")
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
      const tenantId = user?.tenants?.[0]?.id || API_CONFIG.TENANT_ID
      const customerId = user?.id || "default-customer-id"

      const requestBody = {
        customerId,
        email: email.trim(),
        motifRecl: selectedMotif,
        description: commentaire.trim(),
        dateRecl: new Date().toISOString(),
        status: "EN_ATTENTE",
      }

      console.log("[v0] Submitting reclamation:", requestBody)

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.RECLAMATION.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la soumission de la réclamation")
      }

      console.log("[v0] Reclamation submitted successfully:", data)

      Alert.alert("Succès", "Votre réclamation a été soumise avec succès", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setEmail("")
            setSelectedMotif(null)
            setCommentaire("")
            setAttachment(null)
            router.back()
          },
        },
      ])
    } catch (error: any) {
      console.error("[v0] Error submitting reclamation:", error)
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la soumission de votre réclamation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    Alert.alert("Annuler", "Voulez-vous vraiment annuler cette réclamation ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        style: "destructive",
        onPress: () => {
          setEmail("")
          setSelectedMotif(null)
          setCommentaire("")
          setAttachment(null)
          router.back()
        },
      },
    ])
  }

  const getSelectedMotifLabel = () => {
    const motif = RECLAMATION_MOTIFS.find((m) => m.id === selectedMotif)
    return motif?.label || "Sélectionner"
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FBBF24" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Demande de réclamation</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "ios" ? 120 : 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Informations personnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
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

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Motif de réclamation <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowMotifPicker(!showMotifPicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerButtonText, !selectedMotif && styles.placeholderText]}>
                  {getSelectedMotifLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>

              {showMotifPicker && (
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TextInput style={styles.searchInput} placeholder="Rechercher" placeholderTextColor="#9CA3AF" />
                    <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                  </View>
                  <ScrollView style={styles.pickerList} nestedScrollEnabled>
                    {RECLAMATION_MOTIFS.map((motif) => (
                      <TouchableOpacity
                        key={motif.id}
                        style={styles.pickerItem}
                        onPress={() => {
                          setSelectedMotif(motif.id)
                          setShowMotifPicker(false)
                        }}
                      >
                        <Text style={styles.pickerItemText}>{motif.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Commentaire <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={commentaire}
                onChangeText={setCommentaire}
                placeholder="Commentaire"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Pièce jointe</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument} activeOpacity={0.7}>
                <Ionicons name="cloud-upload-outline" size={24} color="#2563EB" />
                <Text style={styles.uploadButtonText}>{attachment ? attachment.name : "Téléverser un fichier"}</Text>
                <Text style={styles.uploadButtonSubtext}>JPEG PNG PDF</Text>
              </TouchableOpacity>
              {attachment && (
                <View style={styles.attachmentInfo}>
                  <Ionicons name="document-outline" size={20} color="#2563EB" />
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <TouchableOpacity onPress={() => setAttachment(null)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { paddingBottom: Platform.OS === "ios" ? 40 : 20 }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.7}
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
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
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
    overflow: "hidden",
  },
  pickerHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    position: "relative",
  },
  searchInput: {
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  searchIcon: {
    position: "absolute",
    left: 24,
    top: 22,
  },
  pickerList: {
    maxHeight: 240,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemText: {
    fontSize: 14,
    color: "#111827",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2563EB",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#EFF6FF",
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    gap: 8,
  },
  attachmentName: {
    flex: 1,
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
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#111827",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  submitButton: {
    backgroundColor: "#111827",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
})
