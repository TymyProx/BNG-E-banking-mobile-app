"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useAuth } from "@/contexts/AuthContext"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"
import React from "react"

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  description: string
  date: string
  status: string
}

export default function Dashboard() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const { user, tenantId } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [showBalance, setShowBalance] = useState(true)
  const [chatInput, setChatInput] = useState("")

  useEffect(() => {
    if (tenantId) {
      fetchTransactions()
    }
  }, [tenantId])

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
        setTransactions(data.rows?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U"
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()
  }

  const getUserFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user?.firstName || user?.lastName || "Utilisateur"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN").format(amount)
  }

  const getTransactionIcon = (type: string) => {
    const normalizedType = type?.toLowerCase() || ""
    if (normalizedType.includes("virement") || normalizedType.includes("transfer")) return "arrow.up.arrow.down"
    if (normalizedType.includes("paiement") || normalizedType.includes("payment")) return "creditcard.fill"
    if (normalizedType.includes("retrait") || normalizedType.includes("withdrawal")) return "arrow.down.circle.fill"
    return "banknote.fill"
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
              <Text style={[styles.userName, { color: colors.text }]}>{getUserFullName()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <IconSymbol name="bell" size={22} color="#FBBF24" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceLeft}>
                <View style={styles.balanceTitle}>
                  <IconSymbol name="checkmark.shield" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.balanceTitleText}>Solde total</Text>
                </View>
                <View style={styles.balanceAmount}>
                  <Text style={styles.balanceValue}>
                    {showBalance ? `${formatCurrency(totalBalance)} GNF` : "••••••"}
                  </Text>
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowBalance(!showBalance)}>
                    <IconSymbol name={showBalance ? "eye" : "eye.slash"} size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.balanceRight}>
                <View style={styles.trendContainer}>
                  <IconSymbol name="arrow.up.right" size={14} color="#10B981" />
                  <Text style={styles.trendText}>+2.4%</Text>
                </View>
                <Text style={styles.trendSubtext}>vs mois dernier</Text>
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              {[40, 55, 45, 70, 60, 80, 75].map((height, index) => (
                <View key={index} style={[styles.chartBar, { height: `${height}%` }]} />
              ))}
            </View>
            <Text style={styles.chartLabel}>Évolution sur 7 jours</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/(tabs)/transfer")}
              >
                <View style={[styles.actionIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                  <IconSymbol name="arrow.up.arrow.down" size={24} color="#FBBF24" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Virement</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/(tabs)/cards")}
              >
                <View style={[styles.actionIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                  <IconSymbol name="creditcard" size={24} color="#FBBF24" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Cartes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/(tabs)/menu")}
              >
                <View style={[styles.actionIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                  <IconSymbol name="ellipsis.circle.fill" size={24} color="#FBBF24" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Menu</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
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
                      <View style={[styles.transactionIcon, { backgroundColor: "rgba(45, 122, 79, 0.1)" }]}>
                        <IconSymbol name={getTransactionIcon(transaction.type) as any} size={20} color="#2D7A4F" />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionDescription, { color: colors.text }]}>
                          {transaction.description}
                        </Text>
                        <Text style={[styles.transactionDate, { color: colors.tabIconDefault }]}>
                          {new Date(transaction.date).toLocaleDateString("fr-FR")}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color: transaction.type?.toLowerCase().includes("retrait") ? "#EF4444" : "#10B981",
                          },
                        ]}
                      >
                        {transaction.type?.toLowerCase().includes("retrait") ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text style={[styles.transactionCurrency, { color: colors.tabIconDefault }]}>
                        {transaction.currency}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="banknote.fill" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>Aucune transaction récente</Text>
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
                <IconSymbol name="paperclip" size={20} color="#FBBF24" />
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
              <TouchableOpacity style={[styles.sendButton, { backgroundColor: "#FBBF24" }]}>
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
    backgroundColor: "rgba(251, 191, 36, 0.15)",
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
  balanceHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  balanceLeft: { flex: 1 },
  balanceTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  balanceTitleText: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600" },
  balanceAmount: { flexDirection: "row", alignItems: "center", gap: 10 },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
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
  trendText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "700",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sectionAction: { fontSize: 14, fontWeight: "600" },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  actionCard: {
    width: "30%",
    paddingVertical: 20,
    borderRadius: 20,
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
  actionIcon: {
    justifyContent: "center",
    alignItems: "center",
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  actionLabel: { fontSize: 13, textAlign: "center", fontWeight: "600", marginTop: 4 },

  transactionsContainer: { gap: 12 },
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
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  transactionCurrency: {
    fontSize: 12,
    fontWeight: "500",
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
    backgroundColor: "rgba(251, 191, 36, 0.15)",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    shadowColor: "#FBBF24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
})
