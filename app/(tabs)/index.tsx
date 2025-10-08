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
import { LinearGradient } from "expo-linear-gradient"
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

interface Transaction {
  id: string
  txnId: string
  accountId: string
  txnType: string
  amount: string
  valueDate: string
  status: string
  description: string
  creditAccount: string
  commentNotes: string
}

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 32
const CARD_SPACING = 20

export default function Dashboard() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const { user, tenantId } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [showBalance, setShowBalance] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnims] = useState(accounts.map(() => new Animated.Value(1)))
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetchAccounts()
    fetchTransactions()
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

  const fetchTransactions = async () => {
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] No token or tenantId available for transactions")
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
        // Get the 3 most recent transactions
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const getTransactionIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("debit") || normalizedType.includes("retrait")) return "arrow.up.circle.fill"
    if (normalizedType.includes("credit") || normalizedType.includes("depot")) return "arrow.down.circle.fill"
    return "arrow.left.arrow.right.circle.fill"
  }

  const getTransactionColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("debit") || normalizedType.includes("retrait")) return "#EF4444"
    if (normalizedType.includes("credit") || normalizedType.includes("depot")) return "#10B981"
    return "#6366F1"
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

  const getAccountGradient = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("courant")) return ["#2D7A4F", "#1E5A3A", "#0F3D26"]
    if (normalizedType.includes("épargne") || normalizedType.includes("epargne"))
      return ["#10B981", "#059669", "#047857"]
    return ["#6366F1", "#4F46E5", "#4338CA"]
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
          {/* Accounts Carousel Section */}
          <View style={styles.section}>
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
                  {accounts.map((account, index) => (
                    <Animated.View
                      key={account.id}
                      style={[
                        styles.carouselCard,
                        {
                          opacity: fadeAnim,
                          transform: [{ scale: index === activeIndex ? 1 : 0.95 }],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.modernAccountCard}
                        onPress={() => router.push(`/account-details?id=${account.id}`)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={getAccountGradient(account.type)}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientCard}
                        >
                          {/* Decorative circles */}
                          <View style={styles.decorativeCircle1} />
                          <View style={styles.decorativeCircle2} />

                          <View style={styles.cardContent}>
                            {/* Top section */}
                            <View style={styles.cardTop}>
                              <View style={styles.cardTopLeft}>
                                <View style={styles.modernAccountIcon}>
                                  <IconSymbol name={getAccountIcon(account.type) as any} size={28} color="#FFFFFF" />
                                </View>
                                <View style={styles.cardTypeInfo}>
                                  <Text style={styles.cardTypeLabel}>Type de compte</Text>
                                  <Text style={styles.cardTypeName}>{account.type}</Text>
                                </View>
                              </View>
                              <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Actif</Text>
                              </View>
                            </View>

                            {/* Middle section - Balance */}
                            <View style={styles.balanceSection}>
                              <Text style={styles.modernBalanceLabel}>Solde disponible</Text>
                              <View style={styles.balanceAmountRow}>
                                <Text style={styles.modernBalanceAmount}>
                                  {formatCurrency(Number.parseFloat(account.availableBalance) || 0)}
                                </Text>
                                <Text style={styles.modernBalanceCurrency}>{account.currency}</Text>
                              </View>
                            </View>

                            {/* Bottom section */}
                            <View style={styles.cardBottom}>
                              <View style={styles.accountNameSection}>
                                <Text style={styles.accountNameLabel}>Nom du compte</Text>
                                <Text style={styles.modernAccountName} numberOfLines={1}>
                                  {account.accountName || "Compte principal"}
                                </Text>
                              </View>
                              <View style={styles.accountNumberSection}>
                                <Text style={styles.modernAccountNumber}>
                                  •••• •••• •••• {account.accountNumber.slice(-4)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>

                {/* Enhanced Pagination Dots */}
                {accounts.length > 1 && (
                  <View style={styles.paginationContainer}>
                    {accounts.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleDotPress(index)}
                        style={[
                          styles.modernPaginationDot,
                          {
                            backgroundColor: index === activeIndex ? "#2D7A4F" : "rgba(45, 122, 79, 0.2)",
                            width: index === activeIndex ? 40 : 10,
                            height: index === activeIndex ? 10 : 10,
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
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}></Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/accounts")}>
                <Text style={[styles.sectionAction, { color: "#2D7A4F" }]}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
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
            </View>

            <View style={[styles.transactionsCard, { backgroundColor: colors.surface }]}>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <View key={transaction.id}>
                    <TouchableOpacity
                      style={styles.transactionItem}
                      onPress={() => router.push(`/transaction-details?id=${transaction.id}`)}
                    >
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.transactionIconContainer,
                            { backgroundColor: `${getTransactionColor(transaction.txnType)}15` },
                          ]}
                        >
                          <IconSymbol
                            name={getTransactionIcon(transaction.txnType) as any}
                            size={24}
                            color={getTransactionColor(transaction.txnType)}
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={[styles.transactionDescription, { color: colors.text }]} numberOfLines={1}>
                            {transaction.description || "Transaction"}
                          </Text>
                          <Text style={[styles.transactionDate, { color: colors.tabIconDefault }]}>
                            {formatDate(transaction.valueDate)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color: transaction.txnType?.toLowerCase().includes("credit")
                                ? "#10B981"
                                : transaction.txnType?.toLowerCase().includes("debit")
                                  ? "#EF4444"
                                  : colors.text,
                            },
                          ]}
                        >
                          {transaction.txnType?.toLowerCase().includes("credit") ? "+" : "-"}
                          {formatCurrency(Number.parseFloat(transaction.amount) || 0)}
                        </Text>
                        <View
                          style={[
                            styles.transactionStatusBadge,
                            {
                              backgroundColor:
                                transaction.status?.toLowerCase() === "completed" ||
                                transaction.status?.toLowerCase() === "success"
                                  ? "#10B98115"
                                  : transaction.status?.toLowerCase() === "pending"
                                    ? "#F59E0B15"
                                    : "#EF444415",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.transactionStatus,
                              {
                                color:
                                  transaction.status?.toLowerCase() === "completed" ||
                                  transaction.status?.toLowerCase() === "success"
                                    ? "#10B981"
                                    : transaction.status?.toLowerCase() === "pending"
                                      ? "#F59E0B"
                                      : "#EF4444",
                              },
                            ]}
                          >
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < transactions.length - 1 && (
                      <View style={[styles.transactionDivider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyTransactions}>
                  <IconSymbol name="doc.text" size={40} color={colors.tabIconDefault} />
                  <Text style={[styles.emptyTransactionsText, { color: colors.tabIconDefault }]}>
                    Aucune transaction récente
                  </Text>
                </View>
              )}
            </View>
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

  carouselContent: {
    paddingHorizontal: 0,
    gap: CARD_SPACING,
  },
  carouselCard: {
    width: CARD_WIDTH,
  },
  modernAccountCard: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  gradientCard: {
    padding: 24,
    minHeight: 240,
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -80,
    right: -60,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: -40,
    left: -40,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modernAccountIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cardTypeInfo: {
    flex: 1,
  },
  cardTypeLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTypeName: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  balanceSection: {
    marginBottom: 24,
  },
  modernBalanceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  modernBalanceAmount: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -1,
  },
  modernBalanceCurrency: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  accountNameSection: {
    flex: 1,
  },
  accountNameLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modernAccountName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  accountNumberSection: {
    alignItems: "flex-end",
  },
  modernAccountNumber: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  modernPaginationDot: {
    height: 10,
    borderRadius: 5,
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },

  transactionsCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  transactionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transactionDivider: {
    height: 1,
    marginVertical: 4,
  },
  emptyTransactions: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyTransactionsText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
})
