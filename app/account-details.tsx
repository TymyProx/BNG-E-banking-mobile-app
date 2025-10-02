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
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import React from "react"

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
  name: string
  number: string
  balance: number
  type: string
  currency: string
  status: string
  lastUpdate: string
  iban: string
  bic: string
  openingDate: string
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

  // Simulation des données de transactions
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
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const accountDetails: AccountDetails = {
        id: params.id as string,
        name: params.name as string,
        number: params.number as string,
        balance: Number.parseInt(params.balance as string),
        type: params.type as string,
        currency: params.currency as string,
        status: params.status as string,
        lastUpdate: params.lastUpdate as string,
        iban: `GN82 BNG0 ${(params.number as string).slice(-10)}`,
        bic: "BNGNGN33",
        openingDate: "15 Mars 2023",
      }

      setAccount(accountDetails)
      setTransactions(mockTransactions)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
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
          name: account.name,
          number: account.number,
          type: account.type,
          balance: account.balance,
          currency: account.currency,
        }),
        fromAccountDetails: "true",
      },
    })
  }

  const handleRIBRequest = () => {
    if (!account) return

    router.push({
      pathname: "/rib-request",
      params: {
        accountId: account.id,
        accountName: account.name,
        accountNumber: account.number,
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
              <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
              <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                {account.number.slice(-4).padStart(account.number.length, "•")}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <IconSymbol name={showBalance ? "eye.fill" : "eye.slash.fill"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceSection}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
            <Text style={[styles.balanceAmount, { color: account.balance >= 0 ? "#059669" : "#DC2626" }]}>
              {showBalance
                ? `${account.balance >= 0 ? "" : "-"}${formatAmount(account.balance)} ${account.currency}`
                : "••••••"}
            </Text>
            <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
              Dernière mise à jour: {account.lastUpdate}
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
                { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
              ]}
              onPress={handleRIBRequest}
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
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>IBAN</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.iban}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>BIC</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.bic}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ouvert le</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.openingDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Statut</Text>
              <View style={[styles.statusBadge, { backgroundColor: "#059669" }]}>
                <Text style={styles.statusText}>Actif</Text>
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
