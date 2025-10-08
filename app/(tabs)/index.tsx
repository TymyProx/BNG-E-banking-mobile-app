"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useAuth } from "@/contexts/AuthContext"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"
import React from "react"

interface Account {
  id: string
  accountNumber: string
  accountName: string
  type: string
  balance: number
  currency: string
  status: string
  availableBalance: string
}

interface Card {
  id: string
  cardNumber: string
  cardType: string
  status: string
  expiryDate: string
  cardHolderName: string
  cvv?: string
}

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 48
const CARD_SPACING = 16

export default function Dashboard() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const { user, tenantId } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [showBalance, setShowBalance] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const cardScrollViewRef = useRef<ScrollView>(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [cardFadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchAccounts()
    fetchCards()
  }, [])

  useEffect(() => {
    if (accounts.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % accounts.length
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_SPACING),
            animated: true,
          })
          return nextIndex
        })
      }, 4000)

      return () => clearInterval(interval)
    }
  }, [accounts.length])

  useEffect(() => {
    if (cards.length > 1) {
      const interval = setInterval(() => {
        setActiveCardIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % cards.length
          cardScrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_SPACING),
            animated: true,
          })
          return nextIndex
        })
      }, 4000)

      return () => clearInterval(interval)
    }
  }, [cards.length])

  const fetchAccounts = async () => {
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] No token or tenantId available")
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const activeAccounts = data.rows?.filter((acc: any) => acc.status?.toLowerCase() === "actif") || []
        setAccounts(activeAccounts)

        const total = activeAccounts.reduce((sum: number, acc: any) => {
          return sum + (Number.parseFloat(acc.availableBalance) || 0)
        }, 0)
        setTotalBalance(total)

        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start()
      }
    } catch (error) {
      console.error("[v0] Error fetching accounts:", error)
    }
  }

  const fetchCards = async () => {
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] No token or tenantId available for cards")
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CARD.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const activeCards = data.rows?.filter((card: any) => card.status?.toLowerCase() === "active") || []
        setCards(activeCards)

        // Fade in animation
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start()
      }
    } catch (error) {
      console.error("[v0] Error fetching cards:", error)
    }
  }

  const handleCardScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveCardIndex(index)
  }

  const handleCardDotPress = (index: number) => {
    cardScrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveCardIndex(index)
  }

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveIndex(index)
  }

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveIndex(index)
  }

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U"
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount)
  }

  const getCardColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("visa")) return "#1A1F71"
    if (normalizedType.includes("mastercard")) return "#EB001B"
    if (normalizedType.includes("debit")) return "#2D7A4F"
    return "#4F46E5"
  }

  const getCardIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("visa") || normalizedType.includes("mastercard")) return "creditcard.fill"
    if (normalizedType.includes("debit")) return "creditcard"
    return "wallet.pass.fill"
  }

  const formatCardNumber = (cardNumber: string) => {
    return `•••• •••• •••• ${cardNumber.slice(-4)}`
  }

  const getAccountIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("courant")) return "creditcard.fill"
    if (normalizedType.includes("épargne") || normalizedType.includes("epargne")) return "banknote.fill"
    return "wallet.pass.fill"
  }

  const getAccountColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("courant")) return "#2D7A4F"
    if (normalizedType.includes("épargne") || normalizedType.includes("epargne")) return "#10B981"
    return "#4F46E5"
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <View style={[styles.profileAvatar, { backgroundColor: "#2D7A4F" }]}>
              <Text style={styles.profileInitials}>{getUserInitials()}</Text>
            </View>
            <View style={styles.userNameContainer}>
              <Text style={[styles.userGreeting, { color: colors.tabIconDefault }]}>Bonjour,</Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName || user?.lastName || "Utilisateur"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <IconSymbol name="bell" size={22} color="#2D7A4F" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}></Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/accounts")}>
                <Text style={[styles.sectionAction, { color: "#2D7A4F" }]}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {accounts.length > 0 ? (
              <>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={CARD_WIDTH + CARD_SPACING}
                  decelerationRate="fast"
                  contentContainerStyle={styles.carouselContent}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {accounts.map((account) => (
                    <Animated.View key={account.id} style={[styles.carouselCard, { opacity: fadeAnim }]}>
                      <TouchableOpacity
                        style={[styles.accountCard, { backgroundColor: colors.surface }]}
                        onPress={() => router.push(`/account-details?id=${account.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.accountHeader}>
                          <View style={styles.accountLeft}>
                            <View style={[styles.accountIcon, { backgroundColor: getAccountColor(account.type) }]}>
                              <IconSymbol name={getAccountIcon(account.type) as any} size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.accountInfo}>
                              <Text style={[styles.accountName, { color: colors.text }]}>
                                {account.accountName || account.type}
                              </Text>
                              <Text style={[styles.accountNumber, { color: colors.tabIconDefault }]}>
                                •••• {account.accountNumber.slice(-4)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.accountBalanceSection}>
                          <Text style={[styles.balanceLabel, { color: colors.tabIconDefault }]}>Solde disponible</Text>
                          <View style={styles.accountBalanceRow}>
                            <Text style={[styles.accountBalance, { color: colors.text }]}>
                              {formatCurrency(Number.parseFloat(account.availableBalance) || 0)}
                            </Text>
                            <Text style={[styles.accountCurrency, { color: colors.tabIconDefault }]}>
                              {account.currency}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>

                {accounts.length > 1 && (
                  <View style={styles.paginationContainer}>
                    {accounts.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleDotPress(index)}
                        style={[
                          styles.paginationDot,
                          {
                            backgroundColor: index === activeIndex ? "#2D7A4F" : colors.border,
                            width: index === activeIndex ? 32 : 8,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.emptyAccountsCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="creditcard.fill" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyAccountsText, { color: colors.tabIconDefault }]}>
                  Aucun compte actif trouvé
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/(tabs)/transfer")}
              >
                <View style={styles.actionIcon}>
                  <IconSymbol name="arrow.up.arrow.down" size={24} color="#2D7A4F" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Virement</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/(tabs)/cards")}
              >
                <View style={styles.actionIcon}>
                  <IconSymbol name="creditcard" size={24} color="#2D7A4F" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Cartes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/(tabs)/menu")}
              >
                <View style={styles.actionIcon}>
                  <IconSymbol name="ellipsis.circle.fill" size={24} color="#2D7A4F" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Menu</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cards Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes Cartes</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/cards")}>
                <Text style={[styles.sectionAction, { color: "#2D7A4F" }]}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {cards.length > 0 ? (
              <>
                <ScrollView
                  ref={cardScrollViewRef}
                  horizontal
                  pagingEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={CARD_WIDTH + CARD_SPACING}
                  decelerationRate="fast"
                  contentContainerStyle={styles.carouselContent}
                  onScroll={handleCardScroll}
                  scrollEventThrottle={16}
                >
                  {cards.map((card) => (
                    <Animated.View key={card.id} style={[styles.carouselCard, { opacity: cardFadeAnim }]}>
                      <TouchableOpacity
                        style={[styles.cardItem, { backgroundColor: getCardColor(card.cardType) }]}
                        onPress={() => router.push(`/card-details?id=${card.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.cardTypeContainer}>
                            <IconSymbol name={getCardIcon(card.cardType) as any} size={32} color="#FFFFFF" />
                          </View>
                          <Text style={styles.cardTypeText}>{card.cardType}</Text>
                        </View>
                        <View style={styles.cardNumberSection}>
                          <Text style={styles.cardNumber}>{formatCardNumber(card.cardNumber)}</Text>
                        </View>
                        <View style={styles.cardFooter}>
                          <View style={styles.cardHolderSection}>
                            <Text style={styles.cardLabel}>Titulaire</Text>
                            <Text style={styles.cardHolderName}>{card.cardHolderName}</Text>
                          </View>
                          <View style={styles.cardExpirySection}>
                            <Text style={styles.cardLabel}>Expire</Text>
                            <Text style={styles.cardExpiryDate}>{card.expiryDate}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>

                {cards.length > 1 && (
                  <View style={styles.paginationContainer}>
                    {cards.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleCardDotPress(index)}
                        style={[
                          styles.paginationDot,
                          {
                            backgroundColor: index === activeCardIndex ? "#2D7A4F" : colors.border,
                            width: index === activeCardIndex ? 32 : 8,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.emptyAccountsCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="creditcard" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyAccountsText, { color: colors.tabIconDefault }]}>
                  Aucune carte active trouvée
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Chat Input */}
        <View style={[styles.chatContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.chatContent}>
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.attachButton}>
                <IconSymbol name="paperclip" size={20} color="#2D7A4F" />
              </TouchableOpacity>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Posez votre question sur votre compte..."
                  placeholderTextColor={colors.tabIconDefault}
                  value={chatInput}
                  onChangeText={setChatInput}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity style={styles.voiceButton}>
                  <IconSymbol name="mic" size={20} color={colors.tabIconDefault} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: "#2D7A4F" }]}>
                <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  actionCard: {
    width: "30%",
    paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  accountCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  cardItem: {
    borderRadius: 24,
    padding: 24,
    height: 200,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTypeContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTypeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardNumberSection: {
    marginVertical: 8,
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardHolderSection: {
    flex: 1,
  },
  cardExpirySection: {
    alignItems: "flex-end",
  },
  cardLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardHolderName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardExpiryDate: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 16,
    paddingBottom: 16,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  profileInitials: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  userNameContainer: {
    flex: 1,
  },
  userGreeting: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: "500",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    padding: 8,
    position: "relative",
    backgroundColor: "rgba(45, 122, 79, 0.1)",
    borderRadius: 12,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    backgroundColor: "#EF4444",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },

  section: { marginBottom: 28, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionAction: { fontSize: 14, fontWeight: "600" },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  actionIcon: {
    justifyContent: "center",
    alignItems: "center",
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(45, 122, 79, 0.08)",
  },
  actionLabel: { fontSize: 13, textAlign: "center", fontWeight: "600", marginTop: 4 },

  accountsContainer: { gap: 16 },
  accountHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  accountLeft: { flexDirection: "row", gap: 12, alignItems: "center", flex: 1 },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: "600",
  },
  accountRight: { alignItems: "flex-end", gap: 6 },
  accountBalance: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  accountChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  accountChangeText: {
    fontSize: 13,
    fontWeight: "700",
  },

  chatContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(229, 231, 235, 0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    backgroundColor: "#FFFFFF",
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(45, 122, 79, 0.08)",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
    fontWeight: "500",
  },
  voiceButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 4,
  },

  carouselContent: {
    paddingHorizontal: 16,
    gap: CARD_SPACING,
  },
  carouselCard: {
    width: CARD_WIDTH,
  },
  accountBalanceSection: {
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountBalanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  accountCurrency: {
    fontSize: 14,
    fontWeight: "600",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  emptyAccountsCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  emptyAccountsText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
})
