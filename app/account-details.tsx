"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  time: string
  balance: number
  category: string
  reference: string
}

interface AccountDetails {
  id: string
  accountId: string
  customerId: string
  accountNumber: string
  accountName: string
  currency: string
  bookBalance: string | null
  availableBalance: string | null
  status: string
  type: string
  agency: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  tenantId: string
}

export default function AccountDetailsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const params = useLocalSearchParams()
  const [account, setAccount] = useState<AccountDetails | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const { tenantId } = useAuth()

  const mockTransactions: Transaction[] = [
    {
      id: "1",
      type: "credit",
      amount: 250000,
      description: "Virement reçu - Salaire",
      date: "2024-01-15",
      time: "09:30",
      balance: 2400000,
      category: "Salaire",
      reference: "VIR240115001",
    },
    {
      id: "2",
      type: "debit",
      amount: 75000,
      description: "Retrait DAB - Agence Kaloum",
      date: "2024-01-14",
      time: "14:20",
      balance: 2150000,
      category: "Retrait",
      reference: "RET240114002",
    },
    {
      id: "3",
      type: "debit",
      amount: 45000,
      description: "Paiement - Orange Money",
      date: "2024-01-14",
      time: "11:15",
      balance: 2225000,
      category: "Mobile Money",
      reference: "PAY240114003",
    },
    {
      id: "4",
      type: "credit",
      amount: 120000,
      description: "Virement reçu - Remboursement",
      date: "2024-01-13",
      time: "16:45",
      balance: 2270000,
      category: "Virement",
      reference: "VIR240113004",
    },
    {
      id: "5",
      type: "debit",
      amount: 25000,
      description: "Frais de tenue de compte",
      date: "2024-01-12",
      time: "00:01",
      balance: 2150000,
      category: "Frais bancaires",
      reference: "FRA240112005",
    },
  ]

  const loadAccountDetails = async () => {
    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")
      const accountId = params.id as string

      if (!token || !tenantId || !accountId) {
        console.log("[v0] Missing token, tenantId, or accountId")
        Alert.alert("Erreur", "Informations d'authentification manquantes")
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.DETAILS(tenantId, accountId)}`, {
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
      console.log("[v0] Account details loaded:", data)

      setAccount(data)
      setTransactions(mockTransactions)
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des détails:", error)
      Alert.alert("Erreur", "Impossible de charger les détails du compte. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccountDetails()
    setRefreshing(false)
  }

  useEffect(() => {
    loadAccountDetails()
  }, [])

  const formatAmount = (amount: number | string | null) => {
    if (amount === null || amount === undefined) {
      return "En attente"
    }
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("fr-FR").format(Math.abs(numAmount))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    })
  }

  const getTransactionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "salaire":
        return "banknote"
      case "retrait":
        return "minus.circle"
      case "mobile money":
        return "phone"
      case "virement":
        return "arrow.left.arrow.right"
      case "frais bancaires":
        return "building.columns"
      default:
        return "creditcard"
    }
  }

  const handleStatementRequest = () => {
    if (!account) return

    router.push({
      pathname: "/(tabs)/statements",
      params: {
        preselectedAccount: JSON.stringify({
          id: account.id,
          name: account.accountName,
          number: account.accountNumber,
          type: account.type,
          balance: account.availableBalance,
          currency: account.currency,
        }),
        fromAccountDetails: "true",
      },
    })
  }

  const handleRIBRequest = () => {
    if (!account) return

    if (!account.accountNumber) {
      Alert.alert(
        "Compte en attente",
        "Le numéro de compte n'est pas encore attribué. Veuillez attendre la validation de votre compte.",
      )
      return
    }

    router.push({
      pathname: "/rib-request",
      params: {
        accountId: account.id,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
      },
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!account) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Compte introuvable</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(tabs)/accounts")}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Détails du compte</Text>
        <TouchableOpacity style={styles.moreButton}>
          <IconSymbol name="ellipsis.circle" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Account Card */}
        <View style={[styles.accountCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.accountHeader}>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.text }]}>{account.accountName}</Text>
              <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                {account.accountNumber
                  ? account.accountNumber.slice(-4).padStart(account.accountNumber.length, "•")
                  : "Numéro non attribué"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <IconSymbol name={showBalance ? "eye.fill" : "eye.slash.fill"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceSection}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
            <Text
              style={[
                styles.balanceAmount,
                {
                  color:
                    account.availableBalance === null
                      ? colors.textSecondary
                      : Number.parseFloat(account.availableBalance) >= 0
                        ? "#059669"
                        : "#DC2626",
                },
              ]}
            >
              {showBalance
                ? account.availableBalance === null
                  ? "En attente"
                  : `${Number.parseFloat(account.availableBalance) >= 0 ? "" : "-"}${formatAmount(account.availableBalance)} ${account.currency}`
                : "••••••"}
            </Text>
            <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
              Dernière mise à jour: {new Date(account.updatedAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>

          <View style={styles.accountActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={handleStatementRequest}
            >
              <IconSymbol name="doc.text" size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Demander Relevé</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: account.accountNumber ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderColor: account.accountNumber ? colors.primary : colors.border,
                  opacity: account.accountNumber ? 1 : 0.5,
                },
              ]}
              onPress={handleRIBRequest}
              disabled={!account.accountNumber}
            >
              <IconSymbol name="creditcard" size={16} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>Demander RIB</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Informations du compte</Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ID Compte</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.accountId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.accountNumber || "Non attribué"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ID Client</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.customerId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Agence</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.agency || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Devise</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.currency}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Solde comptable</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {account.bookBalance === null
                  ? "En attente"
                  : `${formatAmount(account.bookBalance)} ${account.currency}`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {account.availableBalance === null
                  ? "En attente"
                  : `${formatAmount(account.availableBalance)} ${account.currency}`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Créé le</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(account.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Statut</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      account.status.toLowerCase() === "active" || account.status.toLowerCase() === "actif"
                        ? "#059669"
                        : account.status.toLowerCase() === "en attente"
                          ? "#F59E0B"
                          : "#DC2626",
                  },
                ]}
              >
                <Text style={styles.statusText}>{account.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.transactionsCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.text }]}>Dernières transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor: transaction.type === "credit" ? "#059669" + "15" : "#DC2626" + "15",
                      },
                    ]}
                  >
                    <IconSymbol
                      name={getTransactionIcon(transaction.category) as any}
                      size={16}
                      color={transaction.type === "credit" ? "#059669" : "#DC2626"}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionDescription, { color: colors.text }]}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                      {formatDate(transaction.date)} • {transaction.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[styles.transactionAmount, { color: transaction.type === "credit" ? "#059669" : "#DC2626" }]}
                  >
                    {transaction.type === "credit" ? "+" : "-"}
                    {formatAmount(transaction.amount)} GNF
                  </Text>
                  <Text style={[styles.transactionBalance, { color: colors.textSecondary }]}>
                    Solde: {formatAmount(transaction.balance)} GNF
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
  },
  accountCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 12,
  },
  accountActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  transactionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionsList: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionBalance: {
    fontSize: 10,
  },
})
