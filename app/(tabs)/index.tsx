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
    <View style={styles.container}>
      <LinearGradient colors={["#10b981", "#059669", "#34d399"]} style={styles.gradientBackground} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{getUserInitials()}</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.headerHello}>Bonjour,</Text>
                <Text style={styles.headerName}>{user?.firstName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuButton}>
              <IconSymbol name="bell" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardSection}>
              {accounts.length > 0 ? (
                <>
                  <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    decelerationRate="fast"
                    contentContainerStyle={[
                      styles.accountCarouselContent,
                      accounts.length === 1 && { justifyContent: "center", flexGrow: 1 },
                    ]}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {accounts.map((account) => (
                      <Animated.View key={account.id} style={[styles.cardWrapper, { opacity: fadeAnim }]}>
                        <TouchableOpacity
                          style={styles.glassCard}
                          onPress={() => router.push(`/account-details?id=${account.id}`)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={["rgba(16, 185, 129, 0.3)", "rgba(52, 211, 153, 0.3)"]}
                            style={styles.cardGradient}
                          >
                            <View style={styles.cardHeader}>
                              <View style={styles.cardTypeContainer}>
                                <Text style={styles.cardTypeText}>{account.accountName}</Text>
                                <Text style={styles.cardTierText}>{account.type}</Text>
                              </View>
                              <View style={styles.cardBrandLogo}>
                                <View style={[styles.masterCardCircle, { backgroundColor: "#EB001B" }]} />
                                <View
                                  style={[styles.masterCardCircle, { backgroundColor: "#F79E1B", marginLeft: -8 }]}
                                />
                              </View>
                            </View>
                            <View style={styles.cardBody}>
                              <Text style={styles.cardNumber}>•••• •••• •••• {account.accountNumber.slice(-4)}</Text>
                              <View style={styles.balanceRow}>
                                <Text style={styles.balanceAmount}>
                                  {formatCurrency(Number.parseFloat(account.availableBalance) || 0)}
                                </Text>
                                <Text style={styles.currencySymbol}>{account.currency}</Text>
                              </View>
                              <Text style={styles.cardExpiry}>12/24</Text>
                            </View>
                          </LinearGradient>
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
                              width: index === activeIndex ? 24 : 8,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyCard}>
                  <IconSymbol name="creditcard.fill" size={48} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyCardText}>Aucun compte actif trouvé</Text>
                </View>
              )}
            </View>

            <View style={styles.quickActionsSection}>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/transfer")}>
                  <View style={[styles.actionCircle, { backgroundColor: "#10B981" }]}>
                    <IconSymbol name="arrow.right.arrow.left" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionLabel}>Virement</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/cards")}>
                  <View style={[styles.actionCircle, { backgroundColor: "#F97316" }]}>
                    <IconSymbol name="creditcard" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionLabel}>Mes{"\n"}Cartes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/menu")}>
                  <View style={[styles.actionCircle, { backgroundColor: "#FBBF24" }]}>
                    <IconSymbol name="line.3.horizontal" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionLabel}>Menu</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.whiteSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transactions récentes</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/statements")}>
                  <Text style={styles.viewAllText}>Voir tout</Text>
                </TouchableOpacity>
              </View>

              {transactions.length > 0 ? (
                <View style={styles.transactionsContainer}>
                  {transactions.map((transaction) => (
                    <TouchableOpacity
                      key={transaction.id}
                      style={styles.transactionCard}
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
                          <Text style={styles.transactionDescription}>
                            {transaction.description || transaction.txnType}
                          </Text>
                          <Text style={styles.transactionDate}>{formatDate(transaction.valueDate)}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color: transaction.txnType?.toLowerCase().includes("depot") ? "#10B981" : "#EF4444",
                            },
                          ]}
                        >
                          {transaction.txnType?.toLowerCase().includes("depot") ? "+" : "-"}
                          {formatCurrency(Number.parseFloat(transaction.amount))}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTransactions}>
                  <IconSymbol name="list.bullet" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTransactionsText}>Aucune transaction récente</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.chatContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.chatContent}>
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.attachButton}>
                  <IconSymbol name="paperclip" size={20} color="#10B981" />
                </TouchableOpacity>
                <View
                  style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
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
                <TouchableOpacity style={[styles.sendButton, { backgroundColor: "#10B981" }]}>
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
                      style={[
                        styles.modalStatus,
                        { backgroundColor: `${getStatusColor(selectedTransaction.status)}15` },
                      ]}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Changed from gradient color to white so bottom is white
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "75%", // Increased from 60% to 75% to cover quick actions area
  },
  screen: { flex: 1, backgroundColor: "transparent" }, // Make screen transparent
  safeArea: { flex: 1, backgroundColor: "transparent" }, // Make safe area transparent
  scrollView: { flex: 1, backgroundColor: "transparent" }, // Make scroll view transparent
  scrollContent: { paddingBottom: 120, backgroundColor: "transparent" }, // Added padding for fixed chat input

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    width: "100%", // ✅ le conteneur occupe toute la largeur
    alignItems: "stretch", // ✅ permet aux enfants (texte) de s’étirer sur toute la largeur
    justifyContent: "center", // 🔹 centre verticalement le contenu
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    width: "100%", // ✅ prend toute la largeur du parent
    marginLeft: 12, // 🔹 espace à gauche pour éviter le collage avec l'avatar
    textAlign: "left", // 🔹 ou "left" / "right" selon ton besoin
  },
  headerHello: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
    width: "100%", //prend toute la largeur du parent
    marginLeft: 14, //espace à gauche pour éviter le collage avec l'avatar
    textAlign: "left", //ou "left" / "right" selon ton besoin
  },
  headerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    width: "100%", //prend toute la largeur du parent
    marginLeft: 14, //espace à gauche pour éviter le collage avec l'avatar
    textAlign: "left", //ou "left" / "right" selon ton besoin
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 0,
    borderRadius: 24,
    backgroundColor: "transparent",
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

  cardSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  glassCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  cardTypeContainer: {
    gap: 4,
  },
  cardTypeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardTierText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
  },
  cardBrandLogo: {
    flexDirection: "row",
    alignItems: "center",
  },
  masterCardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  cardBody: {
    gap: 12,
  },
  cardNumber: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  currencySymbol: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  cardExpiry: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
  },

  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    backgroundColor: "transparent", // Ensure quick actions section is transparent
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  actionButton: {
    alignItems: "center",
    gap: 12,
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 14,
  },

  whiteSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    minHeight: 400,
    paddingBottom: 24,
  },

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

  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EC4899",
  },

  transactionsContainer: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  transactionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  transactionDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  transactionRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  chatContainer: {
    position: "absolute",
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
    backgroundColor: "rgba(16, 185, 129, 0.1)",
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
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  emptyCard: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  emptyCardText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  accountCarouselContent: {
    gap: CARD_SPACING,
    paddingHorizontal: 20,
  },
  accountInGreenCard: {
    width: CARD_WIDTH,
  },
  individualAccountCard: {
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  accountInGreenCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  accountInGreenCardBalanceSection: {
    marginTop: 8,
  },
  accountInGreenCardNumber: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: 2,
  },
  accountInGreenCardBalanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  accountInGreenCardBalance: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  accountInGreenCardCurrency: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
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
  emptyTransactions: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTransactionsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
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
