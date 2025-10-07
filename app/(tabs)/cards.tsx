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
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

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

  const [cards] = useState<Card[]>([
    {
      id: "1",
      name: "GOLD",
      number: "4386 •••• •••• 2624",
      type: "Visa",
      expiry: "08/26",
      status: "active",
      balance: 48200,
      isBlocked: false,
      cardholderName: "Mr YOLOGO MOHAMED YACINE T",
    },
  ])

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
          dateExpiration: "N/A",
          idClient: user.id,
          accountNumber: selectedAccount.accountNumber,
        },
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CARD.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la demande de carte")
      }

      Alert.alert("Succès", "Votre demande de carte a été enregistrée avec succès", [
        {
          text: "OK",
          onPress: () => {
            setShowRequestModal(false)
            setSelectedCardType("")
            setSelectedAccountId("")
          },
        },
      ])
    } catch (error: any) {
      console.error("Error submitting card request:", error)
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cartes</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            {cards.map((card, index) => (
              <View key={card.id} style={[styles.cardContainer, { width: CARD_WIDTH }]}>
                <LinearGradient
                  colors={["#F4D03F", "#F9E79F", "#F4D03F"]}
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
                    {/* Bank logo and GOLD text */}
                    <View style={styles.cardHeader}>
                      <View style={styles.bankLogo}>
                        <Text style={styles.bankLogoText}>BNG</Text>
                        <Text style={styles.bankLogoSubtext}>BANK</Text>
                      </View>
                      <Text style={styles.goldText}>{card.name}</Text>
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
                      <Text style={styles.visaLogo}>VISA</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.ScrollView>

          {/* Pagination dots */}
          {cards.length > 1 && (
            <View style={styles.pagination}>
              {cards.map((_, index) => (
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

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.actionIconContainer, { backgroundColor: "#FFE5E5" }]}>
              <IconSymbol name="lock.fill" size={20} color="#FF4444" />
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Bloquer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.actionIconContainer, { backgroundColor: "#E5F0FF" }]}>
              <IconSymbol name="eye.fill" size={20} color="#0066FF" />
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Détails de la carte</Text>
          </TouchableOpacity>
        </View>

        {/* Request card section */}
        <TouchableOpacity
          style={[styles.requestCardContainer, { backgroundColor: "#0066FF" }]}
          onPress={() => setShowRequestModal(true)}
        >
          <View style={styles.requestCardContent}>
            <View style={styles.requestCardIcon}>
              <IconSymbol name="creditcard.fill" size={32} color="white" />
            </View>
            <View style={styles.requestCardText}>
              <Text style={styles.requestCardTitle}>Demande d'une carte</Text>
              <Text style={styles.requestCardSubtitle}>Obtenez votre carte en quelques clics</Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color="white" />
          </View>
        </TouchableOpacity>

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
                        colors={cardType.colors}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  content: {
    flex: 1,
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carouselContent: {
    paddingHorizontal: 24,
  },
  cardContainer: {
    paddingRight: 0,
  },
  goldCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 220,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  cardPattern: {
    position: "absolute",
    inset: 0,
  },
  patternCircle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -75,
  },
  patternCircle3: {
    width: 100,
    height: 100,
    top: 60,
    right: 80,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
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
  goldText: {
    fontSize: 24,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 2,
  },
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
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
    fontSize: 22,
    fontWeight: "600",
    color: "white",
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  expiryDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  visaLogo: {
    fontSize: 28,
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
    marginBottom: 24,
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
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
})
