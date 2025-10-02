"use client"

import { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import * as SecureStore from 'expo-secure-store'
import React from "react"

// const { width } = Dimensions.get("window")

const MiniBalanceChart = ({ data }: { data: number[] }) => {
  const bars = useMemo(() => {
    const max = Math.max(...data)
    return data.map((v, i) => ({
      key: i,
      height: (v / max) * 48,
      opacity: i === data.length - 1 ? 1 : 0.7,
    }))
  }, [data])

  return (
    <View style={styles.chartContainer}>
      {bars.map((b) => (
        <View key={b.key} style={[styles.chartBar, { height: b.height, opacity: b.opacity }]} />
      ))}
    </View>
  )
}

interface User {
  id: string
  fullName: string
  firstName: string
  lastName: string | null
  email: string
  phoneNumber: string | null
  emailVerified: boolean
  tenants: Array<{
    id: string
    roles: string[]
    status: string
    tenant: {
      id: string
      name: string
      plan: string
      planStatus: string
    }
  }>
}

export default function Dashboard() {
  const [showBalance, setShowBalance] = useState(true)
  const [chatMessage, setChatMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()

  // Fonction pour récupérer les informations de l'utilisateur
  const fetchUserInfo = async () => {
    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        router.replace("/(auth)/login")
        return
      }

      const response = await fetch("http://192.168.1.200:8080/api/auth/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré ou invalide
          await SecureStore.deleteItemAsync("token")
          router.replace("/(auth)/login")
          return
        }
        throw new Error("Erreur lors de la récupération du profil")
      }

      const userData = await response.json()
      setCurrentUser(userData)
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error)
      // En cas d'erreur, utiliser des données par défaut
      setCurrentUser({
        id: "1",
        fullName: "Utilisateur",
        firstName: "Utilisateur",
        lastName: null,
        email: "user@example.com",
        phoneNumber: null,
        emailVerified: false,
        tenants: []
      })
    } finally {
      setIsLoadingUser(false)
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    console.log("React Native Dashboard mounted")
  }, [])

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle sending message to chatbot
      console.log("Sending message:", chatMessage)
      setChatMessage("")
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Handle voice input logic here
  }

  // Enhanced data with more realistic values
  const balanceHistory = [42000, 44500, 43200, 45200, 47800, 46500, 48200]
  const savingsGoal = { current: 25000, target: 50000 }

  const accounts = [
    {
      id: 1,
      name: "Compte Principal",
      number: "•••• 6483",
      balance: 48200,
      type: "primary",
      change: +2.4,
    },
    {
      id: 2,
      name: "Compte Épargne",
      number: "•••• 7291",
      balance: 25000,
      type: "savings",
      change: +1.8,
    },
    {
      id: 3,
      name: "Compte Courant",
      number: "•••• 8394",
      balance: 12500,
      type: "checking",
      change: -0.5,
    },
    {
      id: 4,
      name: "Compte Investissement",
      number: "•••• 9156",
      balance: 35000,
      type: "investment",
      change: +3.2,
    },
  ]

  const quickActions = [
    {
      icon: "arrow.up.arrow.down",
      label: "Virement",
      route: "transfer",
    },
    {
      icon: "doc.text",
      label: "Factures",
      route: "bills",
    },
    {
      icon: "creditcard",
      label: "Cartes",
      route: "cards",
    },
    {
      icon: "building.columns",
      label: "Comptes",
      route: "accounts",
    },
  ]

  const handleNavigation = (route: string) => {
    console.log(`RN Dashboard: Navigating to ${route}`)
    router.push(`/(tabs)/${route}`as any)
  }

  const handleProfilePress = () => {
    console.log("RN Dashboard: Navigating to profile")
    router.push("/(tabs)/profile")
  }

  const recentTransactions = [
    {
      id: 1,
      title: "Salaire reçu",
      subtitle: "Aujourd'hui • 09:30",
      amount: 850000,
      type: "credit",
      category: "Salaire",
    },
    {
      id: 2,
      title: "Facture CIE",
      subtitle: "Hier • 14:22",
      amount: 33000,
      type: "debit",
      category: "Électricité",
    },
    {
      id: 3,
      title: "Transfert vers Marie",
      subtitle: "Il y a 2 jours • 16:45",
      amount: 50000,
      type: "debit",
      category: "Transfert",
    },
    {
      id: 4,
      title: "Achat Supermarché",
      subtitle: "Il y a 3 jours • 11:15",
      amount: 25000,
      type: "debit",
      category: "Alimentation",
    },
  ]

  const insights = [
    {
      title: "Dépenses ce mois",
      value: "156,000 GNF",
      change: -12,
      trend: "down",
      description: "12% de moins que le mois dernier",
    },
    {
      title: "Épargne mensuelle",
      value: "85,000 GNF",
      change: +8,
      trend: "up",
      description: "Objectif atteint à 170%",
    },
  ]

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  // Fonction pour générer les initiales
  const getInitials = (firstName: string, lastName: string | null) => {
    const first = firstName?.charAt(0) || ""
    const last = lastName?.charAt(0) || ""
    return `${first}${last}`.toUpperCase()
  }

  // Fonction pour obtenir le nom complet
  const getDisplayName = (user: User) => {
    if (user.fullName && user.fullName.trim()) {
      return user.fullName
    }
    
    const firstName = user.firstName || ""
    const lastName = user.lastName || ""
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    
    return firstName || lastName || "Utilisateur"
  }

  // Si les données utilisateur sont en cours de chargement
  if (isLoadingUser) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[{ color: colors.text }]}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} // height of chat
        >
          {/* ===== HEADER ===== */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleProfilePress}
              style={styles.profileContainer}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.profileInitials}>
                  {currentUser ? getInitials(currentUser.firstName, currentUser.lastName) : "U"}
                </Text>
              </View>
              <View style={styles.userNameContainer}>
                <Text style={[styles.userGreeting, { color: colors.textSecondary }]}>Bonjour,</Text>
                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                  {currentUser ? getDisplayName(currentUser) : "Utilisateur"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
                <IconSymbol name="bell" size={20} color={colors.text} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== BALANCE CARD ===== */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceLeft}>
                <View style={styles.balanceTitle}>
                  <IconSymbol name="shield.checkered" size={20} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.balanceTitleText}>Solde total</Text>
                </View>

                <View style={styles.balanceAmount}>
                  <Text style={styles.balanceValue}>{showBalance ? `${formatAmount(73200)} GNF` : "••••••••"}</Text>
                  <TouchableOpacity
                    onPress={() => setShowBalance((v) => !v)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconSymbol name={showBalance ? "eye.slash" : "eye"} size={16} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.balanceRight}>
                <View style={styles.trendContainer}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color="#10B981" />
                  <Text style={styles.trendText}>+2.4%</Text>
                </View>
                <Text style={styles.trendSubtext}>vs mois dernier</Text>
              </View>
            </View>

            <MiniBalanceChart data={balanceHistory} />
            <Text style={styles.chartLabel}>Évolution sur 7 jours</Text>
          </View>

          {/* ===== QUICK ACTIONS ===== */}
          <View style={[styles.section, { paddingTop: 16 }]}>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.route}
                  style={[
                    styles.actionCard,
                    { backgroundColor: colors.cardBackground ?? colors.gradient?.card ?? colors.background },
                  ]}
                  onPress={() => handleNavigation(action.route)}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionIcon}>
                    <IconSymbol name={action.icon as any} size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ===== ACCOUNTS ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes comptes</Text>
              {accounts.length > 2 && (
                <TouchableOpacity onPress={() => handleNavigation("accounts")} activeOpacity={0.7}>
                  <View style={styles.viewAllButton}>
                    <Text style={[styles.sectionAction, { color: colors.primary }]}>Voir tout</Text>
                    <IconSymbol name="chevron.right" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.accountsContainer}>
              {accounts.slice(0, 2).map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountCard,
                    { backgroundColor: colors.cardBackground ?? colors.gradient?.card ?? colors.background },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => console.log(`Navigate to account ${account.id}`)}
                >
                  <View style={styles.accountHeader}>
                    <View style={styles.accountLeft}>
                      <View
                        style={[
                          styles.accountIcon,
                          {
                            backgroundColor:
                              account.type === "primary"
                                ? "#4F46E5"
                                : account.type === "savings"
                                  ? "#10B981"
                                  : account.type === "checking"
                                    ? "#F59E0B"
                                    : "#8B5CF6",
                          },
                        ]}
                      >
                        <IconSymbol
                          name={
                            account.type === "primary"
                              ? "wallet.pass"
                              : account.type === "savings"
                                ? "banknote"
                                : account.type === "checking"
                                  ? "creditcard"
                                  : "chart.bar"
                          }
                          size={20}
                          color="white"
                        />
                      </View>
                      <View style={styles.accountInfo}>
                        <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                        <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>{account.number}</Text>
                      </View>
                    </View>

                    <View style={styles.accountRight}>
                      <Text style={[styles.accountBalance, { color: colors.text }]}>
                        {formatAmount(account.balance)} GNF
                      </Text>
                      <View
                        style={[
                          styles.accountChange,
                          {
                            backgroundColor: account.change > 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          },
                        ]}
                      >
                        <IconSymbol
                          name={account.change > 0 ? "arrow.up" : "arrow.down"}
                          size={10}
                          color={account.change > 0 ? "#10B981" : "#EF4444"}
                        />
                        <Text style={[styles.accountChangeText, { color: account.change > 0 ? "#10B981" : "#EF4444" }]}>
                          {account.change > 0 ? "+" : ""}
                          {account.change}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress bar for account balance visualization */}
                  <View style={styles.accountProgress}>
                    <View style={styles.progressBarAccount}>
                      <View
                        style={[
                          styles.progressFillAccount,
                          {
                            width: `${Math.min((account.balance / 50000) * 100, 100)}%`,
                            backgroundColor:
                              account.type === "primary"
                                ? "#4F46E5"
                                : account.type === "savings"
                                  ? "#10B981"
                                  : account.type === "checking"
                                    ? "#F59E0B"
                                    : "#8B5CF6",
                          },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ===== INSIGHTS ===== */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aperçu financier</Text>

            <View style={styles.insightsContainer}>
              {insights.map((insight) => (
                <View
                  key={insight.title}
                  style={[
                    styles.insightCard,
                    { backgroundColor: colors.cardBackground ?? colors.gradient?.card ?? colors.background },
                  ]}
                >
                  <View style={styles.insightHeader}>
                    <Text style={[styles.insightTitle, { color: colors.textSecondary }]}>{insight.title}</Text>
                    <IconSymbol
                      name={insight.trend === "up" ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis"}
                      size={16}
                      color={insight.trend === "up" ? "#10B981" : "#EF4444"}
                    />
                  </View>
                  <Text style={[styles.insightValue, { color: colors.text }]}>{insight.value}</Text>
                  <Text style={[styles.insightDescription, { color: insight.trend === "up" ? "#10B981" : "#EF4444" }]}>
                    {insight.description}
                  </Text>
                </View>
              ))}

              {/* Saving Goal */}
              <View style={styles.savingsCard}>
                <View style={styles.savingsHeader}>
                  <IconSymbol name="target" size={16} color="#10B981" />
                  <Text style={styles.savingsTitle}>Objectif d'épargne</Text>
                </View>

                <View style={styles.savingsProgress}>
                  <View style={styles.savingsLabels}>
                    <Text style={styles.savingsAmount}>{formatAmount(savingsGoal.current)} GNF</Text>
                    <Text style={styles.savingsTarget}>{formatAmount(savingsGoal.target)} GNF</Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${(savingsGoal.current / savingsGoal.target) * 100}%` }]}
                    />
                  </View>

                  <Text style={styles.savingsPercentage}>
                    {Math.round((savingsGoal.current / savingsGoal.target) * 100)}% de l'objectif atteint
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ===== RECENT TRANSACTIONS ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions récentes</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.sectionAction, { color: colors.textSecondary }]}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsContainer}>
              {recentTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    styles.transactionCard,
                    { backgroundColor: colors.cardBackground ?? colors.gradient?.card ?? colors.background },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.transactionContent}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            transaction.type === "credit" ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
                        },
                      ]}
                    >
                      <IconSymbol
                        name={transaction.type === "credit" ? "arrow.up" : "arrow.down"}
                        size={20}
                        color={transaction.type === "credit" ? "#10B981" : "#6B7280"}
                      />
                    </View>

                    <View style={styles.transactionDetails}>
                      <View style={styles.transactionHeader}>
                        <Text style={[styles.transactionTitle, { color: colors.text }]}>{transaction.title}</Text>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: transaction.type === "credit" ? "#10B981" : colors.text },
                          ]}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatAmount(transaction.amount)} GNF
                        </Text>
                      </View>

                      <View style={styles.transactionFooter}>
                        <Text style={[styles.transactionSubtitle, { color: colors.textSecondary }]}>
                          {transaction.subtitle}
                        </Text>
                        <View style={styles.transactionCategory}>
                          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                            {transaction.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Chatbot Input Interface - Only visible on index.tsx */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={styles.chatAvoid}
      >
        <SafeAreaView style={[styles.chatContainer, { backgroundColor: colors.background }]}>
          <View style={styles.chatContent}>
            {/* Input Row */}
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.attachButton}>
                <IconSymbol name="paperclip" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.inputContainer, { backgroundColor: colors.background || colors.background }]}>
                <TextInput
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Posez votre question sur vos finances..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.textInput, { color: colors.text }]}
                  multiline={false}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={toggleVoiceInput}
                  style={[styles.voiceButton, { backgroundColor: isListening ? "#FEF2F2" : "transparent" }]}
                >
                  <IconSymbol
                    name="mic"
                    size={16}
                    color={isListening ? "#EF4444" : (colors.icon ?? colors.textSecondary)}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!chatMessage.trim()}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: chatMessage.trim() ? 1 : 0.5,
                  },
                ]}
              >
                <IconSymbol name="paperplane" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
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
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#1F2937", // surface
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },

  balanceValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  trendText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  actionCard: {
    width: "22%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  accountCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 16,
    paddingBottom: 16,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileInitials: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  userNameContainer: {
    flex: 1,
  },
  userGreeting: {
    fontSize: 12,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    padding: 4,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: "#EF4444",
    borderRadius: 4,
  },

  balanceHeader: { flexDirection: "row", justifyContent: "space-between" },
  balanceLeft: { flex: 1 },
  balanceTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  balanceTitleText: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  balanceAmount: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyeButton: { padding: 4 },
  balanceRight: { alignItems: "flex-end", justifyContent: "center" },
  trendContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendSubtext: { color: "rgba(255,255,255,0.6)", fontSize: 11 },

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 14,
    height: 48,
  },
  chartBar: { width: 10, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.7)" },
  chartLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 8 },

  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionAction: { fontSize: 13 },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  actionIcon: { justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 12, textAlign: "center" },

  accountsContainer: { gap: 12 },
  accountHeader: { flexDirection: "row", justifyContent: "space-between" },
  accountLeft: { flexDirection: "row", gap: 10, alignItems: "center" },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: "500",
  },
  accountRight: { alignItems: "flex-end", gap: 4 },
  accountBalance: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  accountChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountChangeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  insightsContainer: { gap: 12 },
  insightCard: { borderRadius: 12, padding: 14 },
  insightHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  insightTitle: { fontSize: 12 },
  insightValue: { fontSize: 18, fontWeight: "600", marginBottom: 2 },
  insightDescription: { fontSize: 12 },

  savingsCard: { marginTop: 8, borderRadius: 12, padding: 14, backgroundColor: "#F0FDF4" },
  savingsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  savingsTitle: { color: "#065F46", fontSize: 13, fontWeight: "500" },
  savingsProgress: {},
  savingsLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  savingsAmount: { fontSize: 14, fontWeight: "600", color: "#065F46" },
  savingsTarget: { fontSize: 12, color: "#065F46" },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(6,95,70,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", backgroundColor: "#10B981" },
  savingsPercentage: { fontSize: 11, color: "#065F46" },

  transactionsContainer: { gap: 10, paddingHorizontal: 16 },
  transactionCard: { borderRadius: 12, padding: 12 },
  transactionContent: { flexDirection: "row", gap: 12 },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionDetails: { flex: 1 },
  transactionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  transactionTitle: { fontSize: 14, fontWeight: "500" },
  transactionAmount: { fontSize: 14, fontWeight: "600" },
  transactionFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  transactionSubtitle: { fontSize: 12 },
  transactionCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(107,114,128,0.1)",
  },
  categoryText: { fontSize: 11 },
  chatAvoid: { position: "absolute", bottom: 0, left: 0, right: 0 },

  // Chatbot styles - Only visible on index.tsx
  chatContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(229, 231, 235, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  voiceButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 4,
  },
  accountProgress: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(229, 231, 235, 0.3)",
  },
  progressBarAccount: {
    height: 4,
    backgroundColor: "rgba(229, 231, 235, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFillAccount: {
    height: "100%",
    borderRadius: 2,
  },
})
