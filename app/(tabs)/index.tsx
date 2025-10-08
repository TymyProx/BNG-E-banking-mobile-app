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
  Modal,
  ActivityIndicator,
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

interface Transaction {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById: string
  updatedById: string
  importHash?: string
  tenantId: string
  txnId: string
  accountId: string
  txnType: string
  amount: string
  valueDate: string
  status: string
  description: string
  creditAccount: string
  commentNotes?: string
}

interface TransactionDetails extends Transaction {
  // All fields are already in Transaction interface
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
  const scrollViewRef = useRef<ScrollView>(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

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
        const recentTransactions = (data.rows || [])
          .sort((a: Transaction, b: Transaction) => new Date(b.valueDate).getTime() - new Date(a.valueDate).getTime())
          .slice(0, 3)
        setTransactions(recentTransactions)
      }
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
    }
  }

  const fetchTransactionDetails = async (transactionId: string) => {
    try {
      setLoadingDetails(true)
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] Missing token or tenantId")
        return
      }

      console.log("[v0] Fetching transaction details for:", transactionId)
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTION.DETAILS(tenantId, transactionId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log("[v0] Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Transaction details received:", data)
        setSelectedTransaction(data)
        setModalVisible(true)
      } else {
        console.log("[v0] Failed to fetch transaction details:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching transaction details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleTransactionPress = (transactionId: string) => {
    fetchTransactionDetails(transactionId)
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

  const getTransactionIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("depot") || normalizedType.includes("dépôt")) return "arrow.down.circle.fill"
    if (normalizedType.includes("retrait")) return "arrow.up.circle.fill"
    if (normalizedType.includes("virement")) return "arrow.left.arrow.right.circle.fill"
    return "dollarsign.circle.fill"
  }

  const getTransactionColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("depot") || normalizedType.includes("dépôt")) return "#10B981"
    if (normalizedType.includes("retrait")) return "#EF4444"
    if (normalizedType.includes("virement")) return "#3B82F6"
    return "#6B7280"
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || ""
    if (normalizedStatus.includes("success") || normalizedStatus.includes("réussi")) return "#10B981"
    if (normalizedStatus.includes("pending") || normalizedStatus.includes("attente")) return "#F59E0B"
    if (normalizedStatus.includes("failed") || normalizedStatus.includes("échoué")) return "#EF4444"
    return "#6B7280"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
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
                    onPress={() => handleTransactionPress(transaction.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
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
                        <Text style={[styles.transactionDescription, { color: colors.text }]}>
                          {transaction.description || transaction.txnType}
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
                            color: transaction.txnType?.toLowerCase().includes("depot")
                              ? "#10B981"
                              : transaction.txnType?.toLowerCase().includes("retrait")
                                ? "#EF4444"
                                : colors.text,
                          },
                        ]}
                      >
                        {transaction.txnType?.toLowerCase().includes("depot") ? "+" : "-"}
                        {formatCurrency(Number.parseFloat(transaction.amount))}
                      </Text>
                      <View
                        style={[
                          styles.transactionStatus,
                          { backgroundColor: `${getStatusColor(transaction.status)}15` },
                        ]}
                      >
                        <Text style={[styles.transactionStatusText, { color: getStatusColor(transaction.status) }]}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="list.bullet" size={48} color={colors.tabIconDefault} />
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Détails de la transaction</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={colors.tabIconDefault} />
                </TouchableOpacity>
              </View>

              {loadingDetails ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2D7A4F" />
                  <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Chargement...</Text>
                </View>
              ) : selectedTransaction ? (
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View
                    style={[
                      styles.modalIconContainer,
                      { backgroundColor: `${getTransactionColor(selectedTransaction.txnType)}15` },
                    ]}
                  >
                    <IconSymbol
                      name={getTransactionIcon(selectedTransaction.txnType) as any}
                      size={48}
                      color={getTransactionColor(selectedTransaction.txnType)}
                    />
                  </View>

                  <Text
                    style={[
                      styles.modalAmount,
                      {
                        color: selectedTransaction.txnType?.toLowerCase().includes("depot")
                          ? "#10B981"
                          : selectedTransaction.txnType?.toLowerCase().includes("retrait")
                            ? "#EF4444"
                            : colors.text,
                      },
                    ]}
                  >
                    {selectedTransaction.txnType?.toLowerCase().includes("depot") ? "+" : "-"}
                    {formatCurrency(Number.parseFloat(selectedTransaction.amount))} GNF
                  </Text>

                  <View
                    style={[styles.modalStatus, { backgroundColor: `${getStatusColor(selectedTransaction.status)}15` }]}
                  >
                    <Text style={[styles.modalStatusText, { color: getStatusColor(selectedTransaction.status) }]}>
                      {selectedTransaction.status}
                    </Text>
                  </View>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>ID Transaction</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTransaction.txnId}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Type</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTransaction.txnType}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Description</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={3}>
                        {selectedTransaction.description || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Date de valeur</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatDateTime(selectedTransaction.valueDate)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Compte créditeur</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {selectedTransaction.creditAccount || "N/A"}
                      </Text>
                    </View>

                    {selectedTransaction.commentNotes && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Notes</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={4}>
                          {selectedTransaction.commentNotes}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Créé le</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatDateTime(selectedTransaction.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Mis à jour le</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatDateTime(selectedTransaction.updatedAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 20 }} />
                </ScrollView>
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Aucune donnée disponible</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
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
    backgroundColor: "transparent", // Changed from #2D7A4F to transparent
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
  balanceTitleText: { color: "#111827", fontSize: 16, fontWeight: "700" }, // Changed from white to dark

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
    backgroundColor: "#2D7A4F", // Changed from white to green
    borderRadius: 20,
    padding: 20,
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: "rgba(255,255,255,0.2)", // Semi-transparent white for icon background
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
    color: "#FFFFFF", // Changed from dark to white
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  accountInGreenCardNumber: {
    color: "rgba(255,255,255,0.8)", // Changed from gray to semi-transparent white
    fontSize: 13,
    fontWeight: "600",
  },
  accountInGreenCardBalanceSection: {
    marginTop: 8,
  },
  accountInGreenCardBalanceLabel: {
    color: "rgba(255,255,255,0.8)", // Changed from gray to semi-transparent white
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
    color: "#FFFFFF", // Changed from dark to white
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  accountInGreenCardCurrency: {
    color: "#10B981", // Keep the accent green color
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
    shadowOpacity: 0.05,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
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
    gap: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  transactionStatusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: "85%", // Changed from maxHeight to height
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1, // This will now work properly with the fixed parent height
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalStatus: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 32,
  },
  modalStatusText: {
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
  loadingContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
  },
})
