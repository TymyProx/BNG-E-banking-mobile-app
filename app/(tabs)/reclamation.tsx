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

interface CreditRequest {
  id: string
  requestId: string
  customerId: string
  montant: number
  duree: number
  typeCredit: string
  status: string
  createdAt: string
}

interface CheckbookRequest {
  id: string
  orderId: string
  customerId: string
  accountId: string
  nombreCheques: number
  status: string
  createdAt: string
}

type Request = (CreditRequest | CheckbookRequest) & {
  type: "credit" | "checkbook"
}

const MOTIF_OPTIONS = [
  { value: "virement_non_effectif", label: "Virement non effectif" },
  { value: "perception_indue_frais", label: "Perception indue de frais" },
  { value: "operation_contestee", label: "Opération contestatée / Non traitée / Non effective" },
  { value: "debit_tort", label: "Débit à tort GAB /TPE/ B2W/Autres" },
  { value: "produit_non_fonctionnel", label: "Produit ou Service non fonctionnel" },
  { value: "souscription_non_effectif", label: "Souscription non effectif aux Produits et Services" },
]

export default function ReclamationScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { tenantId, user } = useAuth()

  // List state
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [requests, setRequests] = useState<Request[]>([])
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

  // Tab state for segmented control
  const [activeTab, setActiveTab] = useState<"demandes" | "reclamations">("reclamations")

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        setRequests([])
        setIsLoading(false)
        return
      }

      // Fetch credit requests
      const creditResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREDIT.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      // Fetch checkbook requests
      const checkbookResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHECKBOOK.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const allRequests: Request[] = []

      if (creditResponse.ok) {
        const creditData = await creditResponse.json()
        const creditRequests: Request[] = creditData.rows.map((req: any) => ({
          id: req.id,
          requestId: req.requestId || `CREDIT-${req.id.slice(0, 8)}`,
          customerId: req.customerId || "",
          montant: req.montant || 0,
          duree: req.duree || 0,
          typeCredit: req.typeCredit || "Personnel",
          status: req.status || "En attente",
          createdAt: req.createdAt,
          type: "credit" as const,
        }))
        allRequests.push(...creditRequests)
      } else {
        console.error("[v0] Failed to fetch credit requests:", creditResponse.status, await creditResponse.text())
      }

      if (checkbookResponse.ok) {
        const checkbookData = await checkbookResponse.json()
        const checkbookRequests: Request[] = checkbookData.rows.map((req: any) => ({
          id: req.id,
          orderId: req.orderId || `CHK-${req.id.slice(0, 8)}`,
          customerId: req.customerId || "",
          accountId: req.accountId || "",
          nombreCheques: req.nombreCheques || 0,
          status: req.status || "En attente",
          createdAt: req.createdAt,
          type: "checkbook" as const,
        }))
        allRequests.push(...checkbookRequests)
      } else {
        console.error(
          "[v0] Failed to fetch checkbook requests:",
          checkbookResponse.status,
          await checkbookResponse.text(),
        )
      }

      // Sort by creation date (newest first)
      allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setRequests(allRequests)

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
      console.error("[v0] Erreur lors du chargement des demandes:", error)
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

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
    if (activeTab === "demandes") {
      await loadRequests()
    } else {
      await loadReclamations()
    }
    setRefreshing(false)
  }

  useEffect(() => {
    if (activeTab === "demandes") {
      loadRequests()
    } else {
      loadReclamations()
    }
  }, [activeTab])

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
        body: JSON.JSON.stringify(requestBody),
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

  const RequestCard = ({ request }: { request: Request }) => {
    const getStatusDotColor = (status: string) => {
      const normalizedStatus = status.toLowerCase()
      switch (normalizedStatus) {
        case "traité":
        case "resolved":
        case "approuvé":
        case "approved":
          return "#10B981" // Green
        case "en attente":
        case "pending":
          return "#FBBF24" // Yellow
        case "rejeté":
        case "rejected":
          return "#EF4444" // Red
        default:
          return "#9CA3AF" // Gray
      }
    }

    const getRequestTitle = () => {
      if (request.type === "credit") {
        const creditReq = request as CreditRequest
        return `Crédit ${creditReq.typeCredit}`
      } else {
        return "Commande de chéquier"
      }
    }

    const getRequestDetails = () => {
      if (request.type === "credit") {
        const creditReq = request as CreditRequest
        return `${creditReq.montant.toLocaleString("fr-FR")} FCFA - ${creditReq.duree} mois`
      } else {
        const checkbookReq = request as CheckbookRequest
        return `${checkbookReq.nombreCheques} chèques`
      }
    }

    const getRequestId = () => {
      if (request.type === "credit") {
        return (request as CreditRequest).requestId
      } else {
        return (request as CheckbookRequest).orderId
      }
    }

    return (
      <TouchableOpacity activeOpacity={0.7}>
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
          <View style={styles.cardContent}>
            <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(request.status) }]} />
            <View style={styles.cardInfo}>
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Référence</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Type de demande</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
                  {getRequestId()}
                </Text>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={2}>
                  {getRequestTitle()}
                </Text>
              </View>
              <View style={[styles.cardRow, { marginTop: 8 }]}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Détails</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Date</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
                  {getRequestDetails()}
                </Text>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
                  {formatDate(request.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    )
  }

  const ReclamationCard = ({ reclamation }: { reclamation: Reclamation }) => {
    const getStatusDotColor = (status: string) => {
      const normalizedStatus = status.toLowerCase()
      switch (normalizedStatus) {
        case "traité":
        case "resolved":
          return "#10B981" // Green
        case "en attente":
        case "pending":
          return "#FBBF24" // Yellow
        case "rejeté":
        case "rejected":
          return "#EF4444" // Red
        default:
          return "#9CA3AF" // Gray
      }
    }

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
          <View style={styles.cardContent}>
            <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(reclamation.status) }]} />
            <View style={styles.cardInfo}>
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Référence</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Motif de réclamation</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
                  {reclamation.claimId}
                </Text>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={2}>
                  {getMotifLabel(reclamation.motifRecl)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#F9FAFB" }]}>
      <View style={[styles.header, { backgroundColor: "#F9FAFB" }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#FBBF24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demandes et réclamations</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#2D7A4F" }]}
            onPress={() => setShowForm(true)}
          >
            <IconSymbol name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === "demandes" ? styles.segmentButtonActive : styles.segmentButtonInactive,
            ]}
            onPress={() => setActiveTab("demandes")}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === "demandes" ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Demandes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === "reclamations" ? styles.segmentButtonActive : styles.segmentButtonInactive,
            ]}
            onPress={() => setActiveTab("reclamations")}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === "reclamations" ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Réclamations
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.legendText}>Traitée</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FBBF24" }]} />
            <Text style={styles.legendText}>En cours</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.legendText}>Rejetée</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {activeTab === "demandes" ? (
          <>
            {!isLoading && requests.length > 0 && (
              <View style={styles.listContainer}>
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </View>
            )}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            )}

            {!isLoading && requests.length === 0 && (
              <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={[styles.emptyIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <IconSymbol name="doc.text.fill" size={56} color="#10B981" />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune demande</Text>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  Vous n'avez pas encore de demande en cours
                </Text>
              </Animated.View>
            )}
          </>
        ) : (
          <>
            {!isLoading && reclamations.length > 0 && (
              <View style={styles.listContainer}>
                {reclamations.map((reclamation) => (
                  <ReclamationCard key={reclamation.id} reclamation={reclamation} />
                ))}
              </View>
            )}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            )}

            {!isLoading && reclamations.length === 0 && (
              <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={[styles.emptyIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={56} color="#10B981" />
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
                  <Text style={styles.createButtonText}>Réclamation</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: "#F9FAFB" }]}>
          <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modernModalHeader}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modernCloseButton}>
                <IconSymbol name="xmark" size={20} color="#6B7280" />
              </TouchableOpacity>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modernModalTitle}>Réclamation</Text>
                <Text style={styles.modernModalSubtitle}>Décrivez votre problème en détail</Text>
              </View>
            </View>

            <ScrollView style={styles.modernFormScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modernFormSection}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.modernSectionTitle}>Informations de contact</Text>
                </View>

                <View style={styles.modernInputGroup}>
                  <View style={styles.inputLabelRow}>
                    <IconSymbol name="envelope.fill" size={16} color="#6B7280" />
                    <Text style={styles.modernLabel}>Adresse email</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={[styles.modernInputWrapper, email ? styles.inputFocused : null]}>
                    <TextInput
                      style={styles.modernInput}
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
              </View>

              <View style={styles.modernFormSection}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.modernSectionTitle}>Détails de la réclamation</Text>
                </View>

                <View style={styles.modernInputGroup}>
                  <View style={styles.inputLabelRow}>
                    <IconSymbol name="list.bullet.circle.fill" size={16} color="#6B7280" />
                    <Text style={styles.modernLabel}>Motif de réclamation</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.modernPickerButton, motif ? styles.inputFocused : null]}
                    onPress={() => setShowMotifPicker(!showMotifPicker)}
                  >
                    <Text style={[styles.modernPickerText, { color: motif ? "#111827" : "#9CA3AF" }]}>
                      {motif ? getMotifLabel(motif) : "Sélectionner un motif"}
                    </Text>
                    <View style={styles.pickerIconWrapper}>
                      <IconSymbol name={showMotifPicker ? "chevron.up" : "chevron.down"} size={18} color="#6B7280" />
                    </View>
                  </TouchableOpacity>

                  {showMotifPicker && (
                    <View style={styles.modernPickerContainer}>
                      {MOTIF_OPTIONS.map((option, index) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.modernPickerOption,
                            index !== MOTIF_OPTIONS.length - 1 && styles.pickerOptionBorder,
                            motif === option.value && styles.pickerOptionSelected,
                          ]}
                          onPress={() => {
                            setMotif(option.value)
                            setShowMotifPicker(false)
                          }}
                        >
                          <Text
                            style={[
                              styles.modernPickerOptionText,
                              motif === option.value && styles.pickerOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {motif === option.value && (
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.modernInputGroup}>
                  <View style={styles.inputLabelRow}>
                    <IconSymbol name="text.alignleft" size={16} color="#6B7280" />
                    <Text style={styles.modernLabel}>Description détaillée</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View
                    style={[
                      styles.modernInputWrapper,
                      styles.textAreaWrapper,
                      description ? styles.inputFocused : null,
                    ]}
                  >
                    <TextInput
                      style={[styles.modernInput, styles.modernTextArea]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Décrivez votre réclamation en détail..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                  </View>
                  <Text style={styles.characterCount}>{description.length} caractères</Text>
                </View>
              </View>

              <View style={styles.formFooterSpacing} />
            </ScrollView>

            <View style={styles.modernActionButtons}>
              <TouchableOpacity
                style={styles.modernCancelButton}
                onPress={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modernCancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modernSubmitButton, isSubmitting && styles.modernSubmitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
                    <Text style={styles.modernSubmitButtonText}>Envoyer</Text>
                  </>
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
                <IconSymbol name="xmark-circle.fill" size={28} color={colors.textSecondary} />
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonInactive: {
    backgroundColor: "transparent",
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#111827",
  },
  segmentTextInactive: {
    color: "#9CA3AF",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  addActionButton: {
    backgroundColor: "#10B981",
  },
  statusLegend: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  reclamationCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "600",
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
  formScrollView: {
    flex: 1,
  },
  formSection: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
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
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
  modernModalHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modernCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalHeaderContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modernModalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modernModalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  modernFormScrollView: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modernFormSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },

  modernInputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  modernLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  modernInputWrapper: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: "#10B981",
    backgroundColor: "#FFFFFF",
  },
  modernInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  textAreaWrapper: {
    minHeight: 140,
  },
  modernTextArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "right",
    fontWeight: "500",
  },

  modernPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modernPickerText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  pickerIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modernPickerContainer: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modernPickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pickerOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  modernPickerOptionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  pickerOptionTextSelected: {
    color: "#10B981",
    fontWeight: "600",
  },

  formFooterSpacing: {
    height: 24,
  },
  modernActionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  modernCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modernCancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  modernSubmitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#2D7A4F",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernSubmitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  modernSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
})
