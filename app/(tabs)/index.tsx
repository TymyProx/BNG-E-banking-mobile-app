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

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  description: string
  createdAt: string
  status: string
  recipientName?: string
  senderName?: string
}

interface Card {
  id: string
  cardNumber: string
  cardType: string
  status: string
}

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 80
const CARD_SPACING = 16

export default function Dashboard() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const { user, tenantId } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [showBalance, setShowBalance] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const cardScrollViewRef = useRef<ScrollView>(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [cardFadeAnim] = useState(new Animated.Value(0))
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    fetchAccounts()
    fetchTransactions()
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
        const activeCards = data.rows?.filter((card: any) => card.status?.toLowerCase() === "actif") || []
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

  const fetchTransactions = async () => {
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTION.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Get only the 3 most recent transactions
        const recentTransactions = data.rows?.slice(0, 3) || []
        setTransactions(recentTransactions)
      }
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
    }
  }

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveIndex(index)
  }

  const handleCardScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveCardIndex(index)
  }

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveIndex(index)
  }

  const handleCardDotPress = (index: number) => {
    cardScrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveCardIndex(index)
  }

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U"
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount)
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

  const getCardColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("visa")) return "#1A1F71"
    if (normalizedType.includes("mastercard")) return "#EB001B"
    return "#2D7A4F"
  }

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return "•••• •••• •••• ••••"
    const last4 = cardNumber.slice(-4)
    return `•••• •••• •••• ${last4}`
  }

  const getTransactionIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("virement") || normalizedType.includes("transfer")) return "arrow.left.arrow.right"
    if (normalizedType.includes("depot") || normalizedType.includes("deposit")) return "arrow.down.circle.fill"
    if (normalizedType.includes("retrait") || normalizedType.includes("withdrawal")) return "arrow.up.circle.fill"
    return "dollarsign.circle.fill"
  }

  const getTransactionColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("depot") || normalizedType.includes("deposit")) return "#10B981"
    if (normalizedType.includes("retrait") || normalizedType.includes("withdrawal")) return "#EF4444"
    return "#2D7A4F"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
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
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceTitle}>
                <IconSymbol name="checkmark.shield" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.balanceTitleText}>Mes comptes actifs</Text>
              </View>
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
                  contentContainerStyle={styles.accountCarouselContent}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {accounts.map((account) => (
                    <Animated.View key={account.id} style={[styles.accountInGreenCard, { opacity: fadeAnim }]}>
                      <TouchableOpacity
                        style={styles.individualAccountCard}
                        onPress={() => router.push(`/account-details?id=${account.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.accountInGreenCardHeader}>
                          <View
                            style={[styles.accountInGreenCardIcon, { backgroundColor: getAccountColor(account.type) }]}
                          >
                            <IconSymbol name={getAccountIcon(account.type) as any} size={24} color="#FFFFFF" />
                          </View>
                          <View style={styles.accountInGreenCardInfo}>
                            <Text style={styles.accountInGreenCardName}>{account.accountName || account.type}</Text>
                            <Text style={styles.accountInGreenCardNumber}>•••• {account.accountNumber.slice(-4)}</Text>
                          </View>
                        </View>
                        <View style={styles.accountInGreenCardBalanceSection}>
                          <Text style={styles.accountInGreenCardBalanceLabel}>Solde disponible</Text>
                          <View style={styles.accountInGreenCardBalanceRow}>
                            <Text style={styles.accountInGreenCardBalance}>
                              {formatCurrency(Number.parseFloat(account.availableBalance) || 0)}
                            </Text>
                            <Text style={styles.accountInGreenCardCurrency}>{account.currency}</Text>
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
                            backgroundColor: index === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                            width: index === activeIndex ? 32 : 8,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyInGreenCard}>
                <IconSymbol name="creditcard.fill" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyInGreenCardText}>Aucun compte actif trouvé</Text>
              </View>
            )}
          </View>

          {/* Cards Carousel */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceTitle}>
                <IconSymbol name="creditcard" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.balanceTitleText}>Mes cartes actives</Text>
              </View>
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
                  contentContainerStyle={styles.accountCarouselContent}
                  onScroll={handleCardScroll}
                  scrollEventThrottle={16}
                >
                  {cards.map((card) => (
                    <Animated.View key={card.id} style={[styles.cardItem, { opacity: cardFadeAnim }]}>
                      <TouchableOpacity
                        style={styles.individualAccountCard}
                        onPress={() => router.push(`/card-details?id=${card.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.cardHeader}>
                          <View style={[styles.cardChip, { backgroundColor: getCardColor(card.cardType) }]} />
                          <View style={styles.cardHolderSection}>
                            <Text style={styles.cardLabel}>Titulaire</Text>
                            <Text style={styles.cardHolderName}>John Doe</Text>
                          </View>
                          <View style={styles.cardExpirySection}>
                            <Text style={styles.cardLabel}>Expiration</Text>
                            <Text style={styles.cardExpiry}>12/24</Text>
                          </View>
                        </View>
                        <View style={styles.cardMiddle}>
                          <Text style={styles.cardNumber}>{maskCardNumber(card.cardNumber)}</Text>
                        </View>
                        <View style={styles.cardFooter}>
                          <Text style={styles.cardLabel}>Type de carte</Text>
                          <Text style={styles.cardType}>{card.cardType}</Text>
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
                            backgroundColor: index === activeCardIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                            width: index === activeCardIndex ? 32 : 8,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyInGreenCard}>
                <IconSymbol name="creditcard" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyInGreenCardText}>Aucune carte active trouvée</Text>
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions récentes</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
                <Text style={[styles.sectionAction, { color: "#2D7A4F" }]}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {transactions.length > 0 ? (
              <View style={styles.transactionsContainer}>
                {transactions.map((transaction) => (
                  <TouchableOpacity
                    key={transaction.id}
                    style={[styles.transactionCard, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          { backgroundColor: `${getTransactionColor(transaction.type)}15` },
                        ]}
                      >
                        <IconSymbol
                          name={getTransactionIcon(transaction.type) as any}
                          size={20}
                          color={getTransactionColor(transaction.type)}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionTitle, { color: colors.text }]}>
                          {transaction.description || transaction.type}
                        </Text>
                        <Text style={[styles.transactionDate, { color: colors.tabIconDefault }]}>
                          {formatDate(transaction.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color: transaction.type?.toLowerCase().includes("depot")
                              ? "#10B981"
                              : transaction.type?.toLowerCase().includes("retrait")
                                ? "#EF4444"
                                : colors.text,
                          },
                        ]}
                      >
                        {transaction.type?.toLowerCase().includes("depot") ? "+" : "-"}
                        {formatCurrency(transaction.amount)} {transaction.currency}
                      </Text>
                      <Text
                        style={[
                          styles.transactionStatus,
                          {
                            color:
                              transaction.status?.toLowerCase() === "completed" ||
                              transaction.status?.toLowerCase() === "reussi"
                                ? "#10B981"
                                : "#F59E0B",
                          },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="arrow.left.arrow.right" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyCardText, { color: colors.tabIconDefault }]}>Aucune transaction récente</Text>
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

  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#2D7A4F",
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  balanceValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  trendText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "700",
  },

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

  balanceHeader: { marginBottom: 16 },
  balanceLeft: { flex: 1 },
  balanceTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  balanceTitleText: { color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: "700" },
  balanceAmount: { flexDirection: "row", alignItems: "center", gap: 10 },
  eyeButton: { padding: 6 },
  balanceRight: { alignItems: "flex-end", justifyContent: "center" },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendSubtext: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4, fontWeight: "500" },

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginTop: 20,
    height: 56,
    paddingHorizontal: 4,
  },
  chartBar: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    minWidth: 8,
  },
  chartLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 12, fontWeight: "500" },

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
  accountCarouselContent: {
    gap: CARD_SPACING,
    paddingRight: 24,
  },
  accountInGreenCard: {
    width: CARD_WIDTH,
  },
  individualAccountCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  accountInGreenCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  accountInGreenCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  accountInGreenCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  accountInGreenCardName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  accountInGreenCardNumber: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  accountInGreenCardBalanceSection: {
    marginTop: 8,
  },
  accountInGreenCardBalanceLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountInGreenCardBalanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  accountInGreenCardBalance: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  accountInGreenCardCurrency: {
    color: "#2D7A4F",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyInGreenCard: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyInGreenCardText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  cardItem: {
    borderRadius: 20,
    padding: 24,
    height: 200,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardChip: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  cardType: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardMiddle: {
    justifyContent: "center",
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardHolderSection: {
    flex: 1,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardHolderName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cardExpirySection: {
    alignItems: "flex-end",
  },
  cardExpiry: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  transactionsContainer: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCardText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
})
