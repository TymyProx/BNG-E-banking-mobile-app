"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { PageHeader } from "@/components/ui/PageHeader"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import React from "react"
import { useFocusEffect } from "@react-navigation/native"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 48

interface Card {
  id: string
  name: string
  number: string
  type: "Visa" | "Mastercard"
  expiry: string
  status: "active" | "blocked" | "expired"
  balance: number
  isBlocked: boolean
  cardholderName: string
  rawStatus: string // Added to store original API status
  typCard?: string // Added to store original card type from API
  dateExpiration: string // Added to store original expiry date from API
  numCard?: string // Added to store original card number from API
}

interface CardDetails {
  id: string
  numCard: string
  typCard: string
  status: string
  dateEmission: string
  dateExpiration: string
  idClient: string
  accountNumber: string
  createdAt: string
  updatedAt: string
}

interface Account {
  id: string
  accountNumber: string
  accountName: string
  currency: string
  status: string
}

const CARD_TYPES = [
  {
    id: "OPEN",
    name: "OPEN",
    value: "OPEN",
    fee: "5 500 XOF/An",
    colors: ["#8B9556", "#A8B566"],
    description: "Carte idéale pour les transactions quotidiennes",
  },
  {
    id: "CHALLENGE",
    name: "CHALLENGE",
    value: "CHALLENGE",
    fee: "8 250 XOF/An",
    colors: ["#4A90E2", "#5BA3F5"],
    description: "Carte pour les clients actifs",
  },
  {
    id: "VISA_LEADER",
    name: "VISA LEADER",
    value: "VISA_LEADER",
    fee: "16 500 XOF/An",
    colors: ["#1E3A5F", "#2C5282"],
    description: "Carte premium avec avantages exclusifs",
  },
  {
    id: "VISA_GOLD",
    name: "VISA GOLD",
    value: "VISA_GOLD",
    fee: "55 290 XOF/An",
    colors: ["#F4D03F", "#F9E79F"],
    description: "Carte haut de gamme avec services privilégiés",
  },
  {
    id: "VISA_INFINITE",
    name: "VISA INFINITE",
    value: "VISA_INFINITE",
    fee: "286 000 XOF/An",
    colors: ["#1A1A1A", "#2D2D2D"],
    description: "La carte la plus prestigieuse",
  },
]

export default function CardsScreen() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current

  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const [showRequestModal, setShowRequestModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCardType, setSelectedCardType] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user, tenantId, isLoading: authLoading } = useAuth()

  const [cards, setCards] = useState<Card[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [cardsError, setCardsError] = useState<string | null>(null)

  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)
  const flipAnimations = useRef<{ [key: string]: Animated.Value }>({}).current

  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCardDetails, setSelectedCardDetails] = useState<CardDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const getFlipAnimation = (cardId: string) => {
    if (!flipAnimations[cardId]) {
      flipAnimations[cardId] = new Animated.Value(0)
    }
    return flipAnimations[cardId]
  }

  const handleCardFlip = (cardId: string) => {
    const flipAnim = getFlipAnimation(cardId)
    const isFlipped = flippedCardId === cardId

    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start()

    setFlippedCardId(isFlipped ? null : cardId)
  }

  useFocusEffect(
    React.useCallback(() => {
      if (tenantId) {
        fetchCards()
      }
    }, [tenantId]),
  )

  const fetchCards = async () => {
    if (!tenantId) return

    setIsLoadingCards(true)
    setCardsError(null)

    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token) {
        setCardsError("Vous devez être connecté pour voir vos cartes")
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CARD.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des cartes")
      }

      const data = await response.json()

      const mappedCards: Card[] = (data.rows || []).map((card: any) => {
        // Format card number - mask if not "N/A"
        let formattedNumber = card.numCard
        if (card.numCard && card.numCard !== "N/A" && card.numCard.length >= 16) {
          const first4 = card.numCard.substring(0, 4)
          const last4 = card.numCard.substring(card.numCard.length - 4)
          formattedNumber = `${first4} •••• •••• ${last4}`
        }

        // Format expiry date from "2025-10-07" to "10/25"
        let formattedExpiry = "N/A"
        if (card.dateExpiration && card.dateExpiration !== "N/A") {
          try {
            const date = new Date(card.dateExpiration)
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const year = String(date.getFullYear()).substring(2)
            formattedExpiry = `${month}/${year}`
          } catch (e) {
            formattedExpiry = "N/A"
          }
        }

        // Map status
        let status: "active" | "blocked" | "expired" = "active"
        if (card.status === "BLOQUE") {
          status = "blocked"
        } else if (card.status === "EXPIRE") {
          status = "expired"
        } else if (card.status === "EN ATTENTE") {
          status = "expired" // Use expired styling for pending cards
        }

        // Determine card type (Visa or Mastercard) based on typCard
        const cardType: "Visa" | "Mastercard" = card.typCard?.includes("MASTER") ? "Mastercard" : "Visa"

        return {
          id: card.id,
          name: card.typCard || "CARD",
          number: formattedNumber,
          type: cardType,
          expiry: formattedExpiry,
          status: status,
          balance: 0, // Balance not provided by API
          isBlocked: card.status === "BLOQUE",
          cardholderName: user?.fullName || "Titulaire de carte",
          rawStatus: card.status, // Store original status for filtering
          typCard: card.typCard, // Store original type
          dateExpiration: card.dateExpiration, // Store original expiry
          numCard: card.numCard, // Store original number
        }
      })

      setCards(mappedCards)
    } catch (error: any) {
      console.error("[v0] Error fetching cards:", error)
      setCardsError(error.message || "Impossible de récupérer vos cartes")
    } finally {
      setIsLoadingCards(false)
    }
  }

  useEffect(() => {
    if (showRequestModal && tenantId) {
      fetchAccounts()
    }
  }, [showRequestModal, tenantId])

  const fetchAccounts = async () => {
    if (!tenantId) return

    setIsLoadingAccounts(true)
    try {
      const token = await SecureStore.getItemAsync("token")

      console.log("[v0] Fetching accounts - token exists:", !!token)
      console.log("[v0] Fetching accounts - tenantId:", tenantId)

      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour continuer")
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des comptes")
      }

      const data = await response.json()
      const activeAccounts = (data.rows || [])
        .filter((acc: any) => acc.status === "ACTIF")
        .map((acc: any) => ({
          id: acc.id,
          accountNumber: acc.accountNumber || "N/A",
          accountName: acc.accountName || "Compte",
          currency: acc.currency || "",
          status: acc.status,
        }))

      setAccounts(activeAccounts)
    } catch (error) {
      console.error("Error fetching accounts:", error)
      Alert.alert("Erreur", "Impossible de récupérer vos comptes")
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const handleSubmitCardRequest = async () => {
    if (!selectedCardType) {
      Alert.alert("Erreur", "Veuillez sélectionner un type de carte")
      return
    }

    if (!selectedAccountId) {
      Alert.alert("Erreur", "Veuillez sélectionner un compte")
      return
    }

    if (authLoading) {
      Alert.alert("Erreur", "Chargement des informations utilisateur en cours...")
      return
    }

    console.log("[v0] Submit card request - user:", user)
    console.log("[v0] Submit card request - user.id:", user?.id)
    console.log("[v0] Submit card request - tenantId:", tenantId)
    console.log("[v0] Submit card request - authLoading:", authLoading)

    if (!user?.id || !tenantId) {
      Alert.alert("Erreur", "Informations utilisateur manquantes")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await SecureStore.getItemAsync("token")

      console.log("[v0] Submit card request - token exists:", !!token)

      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour continuer")
        return
      }

      const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId)
      if (!selectedAccount) {
        Alert.alert("Erreur", "Compte sélectionné introuvable")
        return
      }

      const currentDate = new Date().toISOString().split("T")[0]

      const requestBody = {
        data: {
          numCard: "N/A",
          typCard: selectedCardType,
          status: "EN ATTENTE",
          dateEmission: currentDate,
          dateExpiration: currentDate, //"N/A",
          idClient: user.id,
          accountNumber: selectedAccount.accountNumber,
        },
      }

      console.log("[v0] Request URL:", `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CARD.CREATE(tenantId)}`)
      console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CARD.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", response.headers)

      // Get the response text first
      const responseText = await response.text()
      console.log("[v0] Response text:", responseText)

      if (!response.ok) {
        // Try to parse as JSON, but handle cases where it's not JSON
        let errorMessage = "Erreur lors de la demande de carte"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If parsing fails, use the raw text as the error message
          errorMessage = responseText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] Failed to parse success response:", parseError)
        // If we can't parse the response but the status was OK, consider it a success
        responseData = {}
      }

      Alert.alert("Succès", "Votre demande de carte a été enregistrée avec succès", [
        {
          text: "OK",
          onPress: () => {
            setShowRequestModal(false)
            setCurrentStep(1)
            setSelectedCardType("")
            setSelectedAccountId("")
            fetchCards()
          },
        },
      ])
    } catch (error: any) {
      console.error("[v0] Error submitting card request:", error)
      Alert.alert("Erreur", error.message || "Impossible de soumettre votre demande")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  })

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH)
    setActiveCardIndex(index)
  }

  const handleNextStep = () => {
    if (currentStep === 1 && selectedCardType) {
      setCurrentStep(2)
      if (!accounts.length && tenantId) {
        fetchAccounts()
      }
    }
  }

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      setShowRequestModal(false)
      setCurrentStep(1)
      setSelectedCardType("")
      setSelectedAccountId("")
    }
  }

  const getCardColors = (cardType: string): string[] => {
    const type = CARD_TYPES.find((t) => t.value === cardType)
    return type?.colors || ["#F4D03F", "#F9E79F"]
  }

  const fetchCardDetails = async (cardId: string) => {
    if (!tenantId) return

    setIsLoadingDetails(true)
    setShowDetailsModal(true)

    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour voir les détails")
        setShowDetailsModal(false)
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CARD.DETAILS(tenantId, cardId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails")
      }

      const data = await response.json()
      setSelectedCardDetails(data)
    } catch (error: any) {
      console.error("[v0] Error fetching card details:", error)
      Alert.alert("Erreur", error.message || "Impossible de récupérer les détails de la carte")
      setShowDetailsModal(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  const filteredCards = cards.filter((card) => card.rawStatus === "ACTIF")
  const pendingCards = cards.filter((card) => card.rawStatus !== "ACTIF") // Show all non-active cards instead of just EN ATTENTE

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        title="Mes Cartes"
        description="Gérez vos cartes bancaires"
        showBackButton={true} // Changed from false to true to show back button
        showAddButton={true}
        onAddPress={() => setShowRequestModal(true)}
        addButtonColor="#2D7A4F"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoadingCards ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement de vos cartes...</Text>
          </View>
        ) : cardsError ? (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.text }]}>{cardsError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCards}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : filteredCards.length === 0 && pendingCards.length === 0 ? (
          <View style={styles.emptyCardsContainer}>
            <IconSymbol name="creditcard" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyCardsText, { color: colors.text }]}>Aucune carte</Text>
            <Text style={[styles.emptyCardsSubtext, { color: colors.textSecondary }]}>
              Demandez votre première carte bancaire
            </Text>
          </View>
        ) : (
          <>
            {/* Cards Carousel */}
            <View style={styles.carouselContainer}>
              <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContent}
              >
                {filteredCards.map((card, index) => {
                  const flipAnim = getFlipAnimation(card.id)
                  const isFlipped = flippedCardId === card.id

                  const frontInterpolate = flipAnim.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["0deg", "180deg"],
                  })

                  const backInterpolate = flipAnim.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["180deg", "360deg"],
                  })

                  const frontOpacity = flipAnim.interpolate({
                    inputRange: [0, 90, 90, 180],
                    outputRange: [1, 1, 0, 0],
                  })

                  const backOpacity = flipAnim.interpolate({
                    inputRange: [0, 90, 90, 180],
                    outputRange: [0, 0, 1, 1],
                  })

                  return (
                    <View key={card.id} style={[styles.cardContainer, { width: CARD_WIDTH }]}>
                      <TouchableOpacity activeOpacity={0.95} onPress={() => handleCardFlip(card.id)}>
                        <View style={styles.cardFlipContainer}>
                          <Animated.View
                            style={[
                              styles.cardFace,
                              {
                                transform: [{ rotateY: frontInterpolate }],
                                opacity: frontOpacity,
                              },
                            ]}
                          >
                            <LinearGradient
                              colors={
                                getCardColors(card.name) as [
                                  import("react-native").ColorValue,
                                  import("react-native").ColorValue,
                                ]
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.goldCard}
                            >
                              {/* Card pattern overlay */}
                              <View style={styles.cardPattern}>
                                <View style={[styles.patternCircle, styles.patternCircle1]} />
                                <View style={[styles.patternCircle, styles.patternCircle2]} />
                                <View style={[styles.patternCircle, styles.patternCircle3]} />
                              </View>

                              {/* Card content */}
                              <View style={styles.cardContent}>
                                {/* Bank logo and card type */}
                                <View style={styles.cardHeader}>
                                  <View style={styles.bankLogo}>
                                    <Text style={styles.bankLogoText}>BNG</Text>
                                    <Text style={styles.bankLogoSubtext}>BANK</Text>
                                  </View>
                                  <View style={styles.goldTextContainer}>
                                    {(card.status === "expired" || card.isBlocked) && (
                                      <View
                                        style={[
                                          styles.statusBadge,
                                          {
                                            backgroundColor: card.isBlocked ? "#FF4444" : "#FFA500",
                                          },
                                        ]}
                                      >
                                        <Text style={styles.statusBadgeText}>
                                          {card.isBlocked ? "BLOQUÉE" : "EN ATTENTE"}
                                        </Text>
                                      </View>
                                    )}
                                    <Text style={styles.goldText}>{card.name}</Text>
                                  </View>
                                </View>

                                {/* Chip and contactless */}
                                <View style={styles.chipContainer}>
                                  <View style={styles.chip}>
                                    <View style={styles.chipPattern} />
                                  </View>
                                  <IconSymbol name="wave.3.right" size={24} color="rgba(255,255,255,0.9)" />
                                </View>

                                {/* Card number */}
                                <Text style={styles.cardNumber}>{card.number}</Text>

                                {/* Expiry date */}
                                <Text style={styles.expiryDate}>{card.expiry}</Text>

                                {/* Cardholder name */}
                                <View style={styles.cardFooter}>
                                  <View>
                                    <Text style={styles.cardholderLabel}>CARDHOLDER NAME</Text>
                                    <Text style={styles.cardholderName}>{card.cardholderName}</Text>
                                  </View>
                                  <Text style={styles.visaLogo}>{card.type.toUpperCase()}</Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </Animated.View>

                          <Animated.View
                            style={[
                              styles.cardFace,
                              styles.cardBack,
                              {
                                transform: [{ rotateY: backInterpolate }],
                                opacity: backOpacity,
                              },
                            ]}
                          >
                            <LinearGradient
                              colors={
                                getCardColors(card.name) as [
                                  import("react-native").ColorValue,
                                  import("react-native").ColorValue,
                                ]
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.goldCard}
                            >
                              {/* Magnetic stripe */}
                              <View style={styles.magneticStripe} />

                              {/* Card back content */}
                              <View style={styles.cardBackContent}>
                                {/* Signature panel */}
                                <View style={styles.signaturePanel}>
                                  <Text style={styles.signatureText}>Signature</Text>
                                </View>

                                {/* CVV section */}
                                <View style={styles.cvvSection}>
                                  <View style={styles.cvvBox}>
                                    <Text style={styles.cvvLabel}>CVV</Text>
                                    <Text style={styles.cvvValue}>•••</Text>
                                  </View>
                                </View>

                                {/* Bank info */}
                                <View style={styles.backBankInfo}>
                                  <View style={styles.backBankLogo}>
                                    <Text style={styles.backBankLogoText}>BNG BANK</Text>
                                  </View>
                                  <Text style={styles.backInfoText}>
                                    Pour toute question, contactez le service client au +225 XX XX XX XX XX
                                  </Text>
                                  <Text style={styles.visaLogo}>{card.type.toUpperCase()}</Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </Animated.View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </Animated.ScrollView>

              {/* Pagination dots */}
              {filteredCards.length > 1 && (
                <View style={styles.pagination}>
                  {filteredCards.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        {
                          backgroundColor: index === activeCardIndex ? colors.text : colors.textSecondary,
                          opacity: index === activeCardIndex ? 1 : 0.3,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Action buttons - Only show for active cards */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
                <View style={[styles.actionIconContainer, { backgroundColor: "#FFE5E5" }]}>
                  <IconSymbol name="lock.fill" size={20} color="#FF4444" />
                </View>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Bloquer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => {
                  if (filteredCards.length > 0) {
                    fetchCardDetails(filteredCards[activeCardIndex].id)
                  }
                }}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: "#E5F0FF" }]}>
                  <IconSymbol name="eye.fill" size={20} color="#0066FF" />
                </View>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Détails de la carte</Text>
              </TouchableOpacity>
            </View>

            {/* Pending card requests section */}
            {pendingCards.length > 0 && (
              <View style={styles.pendingRequestsContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes demandes</Text> {/* CHANGED */}
                {pendingCards.map((card) => {
                  const cardType = CARD_TYPES.find((type) => type.value === card.typCard)
                  // Get status config based on actual status
                  const getStatusConfig = (status: string) => {
                    switch (status) {
                      case "EN ATTENTE":
                        return {
                          color: "#FF9500",
                          backgroundColor: "#FFF3E0",
                          icon: "clock.fill" as const,
                          text: "EN ATTENTE",
                        }
                      case "REJETÉ":
                      case "REJETE":
                        return {
                          color: "#FF4444",
                          backgroundColor: "#FFE5E5",
                          icon: "xmark.circle.fill" as const,
                          text: "REJETÉ",
                        }
                      case "APPROUVÉ":
                      case "APPROUVE":
                        return {
                          color: "#10B981",
                          backgroundColor: "#E0F7EF",
                          icon: "checkmark.circle.fill" as const,
                          text: "APPROUVÉ",
                        }
                      default:
                        return {
                          color: "#6B7280",
                          backgroundColor: "#F3F4F6",
                          icon: "info.circle.fill" as const,
                          text: status,
                        }
                    }
                  }

                  const statusConfig = getStatusConfig(card.rawStatus || card.status)

                  return (
                    <View key={card.id} style={[styles.pendingCard, { backgroundColor: colors.cardBackground }]}>
                      <LinearGradient
                        colors={
                          (cardType?.colors as [
                            import("react-native").ColorValue,
                            import("react-native").ColorValue,
                          ]) || ["#8B9556", "#A8B566"]
                        }
                        style={styles.pendingCardIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.pendingCardChip} />
                      </LinearGradient>
                      <View style={styles.pendingCardInfo}>
                        <Text style={[styles.pendingCardName, { color: colors.text }]}>
                          {cardType?.name || card.typCard}
                        </Text>
                        <Text style={[styles.pendingCardNumber, { color: colors.textSecondary }]}>
                          {card.numCard !== "N/A" ? card.numCard : "En cours d'attribution"}
                        </Text>
                        <Text style={[styles.pendingCardExpiry, { color: colors.textSecondary }]}>
                          Expire le {new Date(card.dateExpiration).toLocaleDateString("fr-FR")}
                        </Text>
                      </View>
                      <View style={styles.pendingCardStatus}>
                        <View
                          style={[styles.statusBadgeWithBackground, { backgroundColor: statusConfig.backgroundColor }]}
                        >
                          <IconSymbol name={statusConfig.icon} size={14} color={statusConfig.color} />
                          <Text style={[styles.statusTextColored, { color: statusConfig.color }]}>
                            {statusConfig.text}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </>
        )}

        {/* Info section */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.infoContent}>
            <View style={styles.infoImagePlaceholder}>
              <IconSymbol name="creditcard" size={48} color={colors.textSecondary} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>BNG VISA INFINITE</Text>
              <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                est la carte bancaire la plus prestigieuse du réseau VISA émise par BNG Bank International.
              </Text>
              <TouchableOpacity>
                <Text style={[styles.infoLink, { color: "#0066FF" }]}>Voir plus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowRequestModal(false)
          setCurrentStep(1)
          setSelectedCardType("")
          setSelectedAccountId("")
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={handlePreviousStep} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Demander une carte</Text>
            <View style={{ width: 24 }} />
          </View>

          {currentStep === 1 ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Step indicator */}
              <View style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>01</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Choisir une carte</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    Veuillez choisir votre carte
                  </Text>
                </View>
              </View>

              {/* Card options */}
              <View style={styles.cardOptionsContainer}>
                {CARD_TYPES.map((cardType) => (
                  <TouchableOpacity
                    key={cardType.id}
                    style={[
                      styles.cardOption,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: selectedCardType === cardType.value ? "#0066FF" : colors.border,
                        borderWidth: selectedCardType === cardType.value ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedCardType(cardType.value)}
                  >
                    <View style={styles.cardOptionContent}>
                      {/* Card preview */}
                      <LinearGradient
                        colors={
                          cardType.colors as [import("react-native").ColorValue, import("react-native").ColorValue]
                        }
                        style={styles.miniCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.miniCardContent}>
                          <View style={styles.miniCardLogo}>
                            <Text style={styles.miniCardLogoText}>BNG</Text>
                          </View>
                          <View style={styles.miniCardChip} />
                          <IconSymbol name="wave.3.right" size={16} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.miniCardNumber}>•••• •••• •••• ••••</Text>
                          <Text style={styles.miniCardVisa}>VISA</Text>
                        </View>
                      </LinearGradient>

                      {/* Card info */}
                      <View style={styles.cardOptionInfo}>
                        <Text style={[styles.cardOptionName, { color: colors.text }]}>{cardType.name}</Text>
                        <Text style={[styles.cardOptionFee, { color: "#0066FF" }]}>{cardType.fee}</Text>
                        <TouchableOpacity>
                          <Text style={[styles.cardOptionLink, { color: "#0066FF" }]}>Voir les avantages</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Radio button */}
                      <View
                        style={[
                          styles.radioButton,
                          {
                            borderColor: selectedCardType === cardType.value ? "#0066FF" : colors.border,
                          },
                        ]}
                      >
                        {selectedCardType === cardType.value && <View style={styles.radioButtonInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Step indicator */}
              <View style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>02</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Choisir un compte</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
                    Sélectionnez le compte à rattacher
                  </Text>
                </View>
              </View>

              {/* Account Selection */}
              {isLoadingAccounts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0066FF" />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des comptes...</Text>
                </View>
              ) : accounts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>Aucun compte actif disponible</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Veuillez créer un compte d'abord.
                  </Text>
                </View>
              ) : (
                <View style={styles.accountOptionsContainer}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        {
                          backgroundColor: colors.cardBackground,
                          borderColor: selectedAccountId === account.id ? "#0066FF" : colors.border,
                          borderWidth: selectedAccountId === account.id ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedAccountId(account.id)}
                    >
                      <View style={styles.accountOptionContent}>
                        <View style={[styles.accountIcon, { backgroundColor: "#E5F0FF" }]}>
                          <IconSymbol name="building.columns.fill" size={24} color="#0066FF" />
                        </View>
                        <View style={styles.accountInfo}>
                          <Text style={[styles.accountName, { color: colors.text }]}>{account.accountName}</Text>
                          <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                            {account.accountNumber}
                          </Text>
                          <Text style={[styles.accountCurrency, { color: colors.textSecondary }]}>
                            {account.currency}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioButton,
                            {
                              borderColor: selectedAccountId === account.id ? "#0066FF" : colors.border,
                            },
                          ]}
                        >
                          {selectedAccountId === account.id && <View style={styles.radioButtonInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Info box */}
              <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
                <IconSymbol name="info.circle.fill" size={20} color="#0066FF" />
                <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
                  Votre demande sera traitée sous 48h. Vous recevrez une notification une fois votre carte prête.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Footer buttons */}
          <View style={[styles.modalFooter, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handlePreviousStep}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                {currentStep === 1 ? "Annuler" : "Précédent"}
              </Text>
            </TouchableOpacity>

            {currentStep === 1 ? (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  {
                    backgroundColor: selectedCardType ? "#0066FF" : colors.border,
                  },
                ]}
                onPress={handleNextStep}
                disabled={!selectedCardType}
              >
                <Text style={styles.nextButtonText}>Suivant</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  {
                    backgroundColor: selectedAccountId && !isSubmitting ? "#10B981" : colors.border,
                  },
                ]}
                onPress={handleSubmitCardRequest}
                disabled={!selectedAccountId || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.nextButtonText}>Soumettre</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowDetailsModal(false)
          setSelectedCardDetails(null)
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={() => {
                setShowDetailsModal(false)
                setSelectedCardDetails(null)
              }}
              style={styles.backButton}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Détails de la carte</Text>
            <View style={{ width: 24 }} />
          </View>

          {isLoadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066FF" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des détails...</Text>
            </View>
          ) : selectedCardDetails ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Card Info Section */}
              <View style={[styles.detailsSection, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Informations de la carte</Text>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Numéro de carte</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCardDetails.numCard}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type de carte</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCardDetails.typCard}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Statut</Text>
                  <View
                    style={[
                      styles.detailStatusBadge,
                      {
                        backgroundColor:
                          selectedCardDetails.status === "ACTIF"
                            ? "#10B981"
                            : selectedCardDetails.status === "BLOQUE"
                              ? "#FF4444"
                              : "#FFA500",
                      },
                    ]}
                  >
                    <Text style={styles.detailStatusText}>{selectedCardDetails.status}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date d'émission</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(selectedCardDetails.dateEmission)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date d'expiration</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(selectedCardDetails.dateExpiration)}
                  </Text>
                </View>
              </View>

              {/* Account Info Section */}
              <View style={[styles.detailsSection, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Compte associé</Text>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCardDetails.accountNumber}</Text>
                </View>
              </View>

              {/* Additional Info Section */}
              <View style={[styles.detailsSection, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Informations supplémentaires</Text>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ID Client</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                    {selectedCardDetails.idClient}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Créée le</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(selectedCardDetails.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dernière mise à jour</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(selectedCardDetails.updatedAt)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  cardFlipContainer: {
    position: "relative",
  },
  cardFace: {
    backfaceVisibility: "hidden",
  },
  cardBack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  filterButtonActive: {
    shadowColor: "#2D7A4F", // Updated shadow color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  filterButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  filterButtonInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  filterButtonTextActive: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.3,
  },
  filterButtonTextInactive: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  cardContainer: {
    paddingRight: 0,
  },
  goldCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  magneticStripe: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "#000",
  },
  cardBackContent: {
    flex: 1,
    marginTop: 60,
    gap: 16,
  },
  signaturePanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  signatureText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  cvvSection: {
    alignItems: "flex-end",
  },
  cvvBox: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cvvLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  cvvValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 4,
  },
  backBankInfo: {
    marginTop: "auto",
    gap: 8,
  },
  backBankLogo: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBankLogoText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 1,
  },
  backInfoText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardPattern: {
    position: "absolute",
    inset: 0,
  },
  patternCircle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.15,
    backgroundColor: "#fff",
  },
  patternCircle1: {
    width: 120,
    height: 120,
    top: -40,
    left: -40,
  },
  patternCircle2: {
    width: 80,
    height: 80,
    bottom: -20,
    right: 20,
  },
  patternCircle3: {
    width: 60,
    height: 60,
    bottom: 30,
    left: 40,
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  bankLogo: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bankLogoText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F4D03F",
    letterSpacing: 1,
  },
  bankLogoSubtext: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 2,
  },
  goldTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goldText: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.5,
  },
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  chip: {
    width: 48,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chipPattern: {
    width: 32,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 4,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: "monospace",
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
    fontFamily: "monospace",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardholderLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  visaLogo: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  demandesButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  demandesButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingRequestsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingCardChip: {
    width: 24,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  pendingCardInfo: {
    flex: 1,
  },
  pendingCardName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  pendingCardNumber: {
    fontSize: 13,
    marginBottom: 2,
    fontFamily: "monospace",
  },
  pendingCardExpiry: {
    fontSize: 12,
  },
  pendingCardStatus: {
    alignItems: "flex-end",
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadgeWithBackground: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextColored: {
    fontSize: 11,
    fontWeight: "700",
  },
  requestCardContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  requestCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  requestCardIcon: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  requestCardText: {
    flex: 1,
  },
  requestCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  requestCardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  infoContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoContent: {
    flexDirection: "row",
    gap: 20,
  },
  infoImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoLink: {
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  stepNumber: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
  },
  cardOptionsContainer: {
    gap: 16,
  },
  cardOption: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  miniCard: {
    width: 100,
    height: 64,
    borderRadius: 8,
    padding: 8,
    justifyContent: "space-between",
  },
  miniCardContent: {
    flex: 1,
  },
  miniCardLogo: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  miniCardLogoText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#666",
  },
  miniCardChip: {
    width: 16,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginTop: 4,
  },
  miniCardNumber: {
    fontSize: 8,
    color: "white",
    fontFamily: "monospace",
    marginTop: 4,
  },
  miniCardVisa: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
    fontStyle: "italic",
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  cardOptionInfo: {
    flex: 1,
  },
  cardOptionName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardOptionFee: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardOptionLink: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0066FF",
  },
  accountOptionsContainer: {
    gap: 16,
  },
  accountOption: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    marginBottom: 2,
  },
  accountCurrency: {
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyCardsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyCardsText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyCardsSubtext: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  detailsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
})
