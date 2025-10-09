"use client"

import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import React from "react"

interface Reclamation {
  id: string
  claimId: string
  customerId: string
  description: string
  dateRecl: string
  status: string
  email: string
  motifRecl: string
  createdAt: string
}

interface ReclamationDetails extends Reclamation {
  updatedAt?: string
  deletedAt?: string
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
}

const MOTIF_OPTIONS = [
  { value: "virement_non_effectif", label: "Virement non effectif" },
  { value: "perception_indue_frais", label: "Perception indue de frais" },
  { value: "operation_contestee", label: "Opération contestatée / Non traitée / Non effective" },
  { value: "debit_tort", label: "Débit à tort GAB /TPE/ B2W/ Autres" },
  { value: "produit_non_fonctionnel", label: "Produit ou Service non fonctionnel" },
  { value: "souscription_non_effectif", label: "Souscription non effectif aux Produits et Services" },
]

export default function ReclamationScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { tenantId, user } = useAuth()

  // List state
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [motif, setMotif] = useState("")
  const [description, setDescription] = useState("")
  const [showMotifPicker, setShowMotifPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Details modal state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedReclamation, setSelectedReclamation] = useState<ReclamationDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const loadReclamations = async () => {
    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        setReclamations([])
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.RECLAMATION.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const mappedReclamations: Reclamation[] = data.rows.map((reclamation: any) => ({
        id: reclamation.id,
        claimId: reclamation.claimId || "N/A",
        customerId: reclamation.customerId || "",
        description: reclamation.description || "Aucune description",
        dateRecl: reclamation.dateRecl || reclamation.createdAt,
        status: reclamation.status || "En attente",
        email: reclamation.email || "",
        motifRecl: reclamation.motifRecl || "",
        createdAt: reclamation.createdAt,
      }))

      setReclamations(mappedReclamations)

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start()
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des réclamations:", error)
      Alert.alert("Erreur", "Impossible de charger les réclamations. Veuillez réessayer.")
      setReclamations([])
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReclamations()
    setRefreshing(false)
  }

  useEffect(() => {
    loadReclamations()
  }, [])

  const handleSubmit = async () => {
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
        data: {
          customerId: user.id,
          email: email.trim(),
          motifRecl: motif,
          description: description.trim(),
          dateRecl: new Date().toISOString(),
          status: "En attente",
        },
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const contentType = response.headers.get("content-type")
      const isJson = contentType && contentType.includes("application/json")

      if (!isJson) {
        const textResponse = await response.text()
        console.log("[v0] Non-JSON response:", textResponse)
        throw new Error("Le serveur a renvoyé une réponse invalide")
      }

      const data = await response.json()

      if (response.ok) {
        Alert.alert("Succès", "Votre réclamation a été envoyée avec succès")
        setEmail("")
        setMotif("")
        setDescription("")
        setShowForm(false)
        await loadReclamations()
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

  const fetchReclamationDetails = async (reclamationId: string) => {
    console.log("[v0] fetchReclamationDetails called with ID:", reclamationId)
    try {
      setLoadingDetails(true)
      console.log("[v0] Set loadingDetails to true")

      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] Missing token or tenantId - token:", !!token, "tenantId:", !!tenantId)
        return
      }

      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.RECLAMATION.DETAILS(tenantId, reclamationId)}`
      console.log("[v0] Fetching from URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Reclamation details received:", JSON.stringify(data, null, 2))
        setSelectedReclamation(data)
        console.log("[v0] Set selectedReclamation")
        setDetailsModalVisible(true)
        console.log("[v0] Set detailsModalVisible to true")
      } else {
        const errorText = await response.text()
        console.log("[v0] Failed to fetch reclamation details. Status:", response.status, "Error:", errorText)
        Alert.alert("Erreur", "Impossible de charger les détails de la réclamation")
      }
    } catch (error) {
      console.error("[v0] Error fetching reclamation details:", error)
      Alert.alert("Erreur", "Une erreur est survenue lors du chargement des détails")
    } finally {
      setLoadingDetails(false)
      console.log("[v0] Set loadingDetails to false")
    }
  }

  const handleReclamationPress = (reclamationId: string) => {
    console.log("[v0] handleReclamationPress called with ID:", reclamationId)
    fetchReclamationDetails(reclamationId)
  }

  const getMotifLabel = (value: string) => {
    const option = MOTIF_OPTIONS.find((opt) => opt.value === value)
    return option ? option.label : value
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case "en attente":
      case "pending":
        return {
          background: "#FEF3C7",
          color: "#F59E0B",
        }
      case "traité":
      case "resolved":
        return {
          background: colors.successBackground,
          color: colors.success,
        }
      case "rejeté":
      case "rejected":
        return {
          background: colors.errorBackground,
          color: colors.error,
        }
      default:
        return {
          background: colors.borderLight,
          color: colors.textSecondary,
        }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const ReclamationCard = ({ reclamation }: { reclamation: Reclamation }) => {
    return (
      <TouchableOpacity onPress={() => handleReclamationPress(reclamation.id)} activeOpacity={0.7}>
        <Animated.View
          style={[
            styles.reclamationCard,
            {
              backgroundColor: colors.cardBackground,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FBBF24" />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {getMotifLabel(reclamation.motifRecl)}
              </Text>
              <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{formatDate(reclamation.dateRecl)}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(reclamation.status).background,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(reclamation.status).color }]}>
                {reclamation.status}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {reclamation.description}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <IconSymbol name="envelope.fill" size={14} color={colors.textSecondary} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                {reclamation.email}
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#FBBF24" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Réclamations</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérez vos réclamations</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#2D7A4F" }]}
            onPress={() => setShowForm(true)}
          >
            <IconSymbol name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FBBF24" />}
      >
        {!isLoading && reclamations.length > 0 && (
          <View style={styles.listContainer}>
            {reclamations.map((reclamation) => (
              <ReclamationCard key={reclamation.id} reclamation={reclamation} />
            ))}
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FBBF24" />
          </View>
        )}

        {!isLoading && reclamations.length === 0 && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.emptyIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={56} color="#FBBF24" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune réclamation</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Vous n'avez pas encore de réclamation. Créez-en une en appuyant sur le bouton +
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: "#2D7A4F" }]}
              onPress={() => setShowForm(true)}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Nouvelle réclamation</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View
              style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
            >
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modalCloseButton}>
                <IconSymbol name="chevron.left" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle réclamation</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
              <View style={[styles.formSection, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: "#1E40AF" }]}>Informations personnelles</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="exemple@email.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={[styles.formSection, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: "#1E40AF" }]}>Réclamation</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Motif de réclamation <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowMotifPicker(!showMotifPicker)}
                  >
                    <Text style={[styles.pickerButtonText, { color: motif ? colors.text : colors.textSecondary }]}>
                      {motif ? getMotifLabel(motif) : "Sélectionner"}
                    </Text>
                    <IconSymbol
                      name={showMotifPicker ? "chevron.up" : "chevron.down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {showMotifPicker && (
                    <View
                      style={[
                        styles.pickerContainer,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      ]}
                    >
                      {MOTIF_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.pickerOption, { borderBottomColor: colors.borderLight }]}
                          onPress={() => {
                            setMotif(option.value)
                            setShowMotifPicker(false)
                          }}
                        >
                          <Text style={[styles.pickerOptionText, { color: colors.text }]}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Commentaire <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                    ]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Commentaire"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View
              style={[styles.actionButtons, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}
            >
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
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
      </Modal>

      {/* Details modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailsModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.detailsModalHeader}>
              <Text style={[styles.detailsModalTitle, { color: colors.text }]}>Détails de la réclamation</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeButton}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FBBF24" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
              </View>
            ) : selectedReclamation ? (
              <ScrollView style={styles.detailsModalBody} showsVerticalScrollIndicator={false}>
                <View style={[styles.detailsIconContainer, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#FBBF24" />
                </View>

                <View
                  style={[
                    styles.detailsStatusBadge,
                    { backgroundColor: getStatusColor(selectedReclamation.status).background },
                  ]}
                >
                  <Text style={[styles.detailsStatusText, { color: getStatusColor(selectedReclamation.status).color }]}>
                    {selectedReclamation.status}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  {selectedReclamation.claimId && selectedReclamation.claimId !== "N/A" && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ID Réclamation</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedReclamation.claimId}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Motif</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={3}>
                      {getMotifLabel(selectedReclamation.motifRecl)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={5}>
                      {selectedReclamation.description || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedReclamation.email}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date de réclamation</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDateTime(selectedReclamation.dateRecl)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Créé le</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDateTime(selectedReclamation.createdAt)}
                    </Text>
                  </View>

                  {selectedReclamation.updatedAt && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Mis à jour le</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatDateTime(selectedReclamation.updatedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Aucune donnée disponible</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 16,
  },
  reclamationCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FBBF24",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    lineHeight: 22,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 60,
  },
  modalContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  formScrollView: {
    flex: 1,
  },
  formSection: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 14,
    flex: 1,
  },
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 300,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  detailsModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  detailsModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  detailsModalBody: {
    flex: 1,
  },
  detailsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  detailsStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 32,
  },
  detailsStatusText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailsContainer: {
    gap: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1.5,
    textAlign: "right",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
  },
})
