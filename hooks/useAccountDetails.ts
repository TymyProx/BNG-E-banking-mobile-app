"use client"

import { useState, useEffect } from "react"
import { Alert } from "react-native"
import { useAuth } from "@/contexts/AuthContext"
import { accountService } from "@/services/accountService"
import { transactionService } from "@/services/transactionService"
import { logger } from "@/utils/logger"
import { handleError } from "@/utils/errorHandler"
import { formatAmount, formatDate } from "@/utils/formatters"

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

export const useAccountDetails = (accountId: string) => {
  const { tenantId } = useAuth()
  const [account, setAccount] = useState<AccountDetails | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showBalance, setShowBalance] = useState(true)

  const loadAccountDetails = async () => {
    setIsLoading(true)
    try {
      if (!tenantId || !accountId) {
        logger.warn("Missing tenantId or accountId")
        Alert.alert("Erreur", "Informations d'authentification manquantes")
        setIsLoading(false)
        return
      }

      logger.info("Loading account details", { accountId })

      // Load account details
      const accountData = await accountService.getAccountDetails(tenantId, accountId)
      setAccount(accountData)

      // Load transactions
      const transactionsData = await transactionService.getTransactions(tenantId)

      let allTransactions: any[] = []
      if (Array.isArray(transactionsData)) {
        allTransactions = transactionsData
      } else if (transactionsData && Array.isArray(transactionsData.data)) {
        allTransactions = transactionsData.data
      } else if (transactionsData && Array.isArray(transactionsData.rows)) {
        allTransactions = transactionsData.rows
      }

      const accountTransactions = allTransactions
        .filter(
          (transaction: any) =>
            transaction.accountId === accountId || transaction.accountNumber === accountData.accountNumber,
        )
        .map((transaction: any) => ({
          id: transaction.id || String(Math.random()),
          type: transaction.type === "credit" || transaction.type === "CREDIT" ? "credit" : "debit",
          amount: Number.parseFloat(transaction.amount || "0"),
          description: transaction.description || transaction.label || "Transaction",
          date: transaction.date || transaction.createdAt || new Date().toISOString(),
          time: transaction.time || new Date(transaction.date || transaction.createdAt).toLocaleTimeString("fr-FR"),
          balance: Number.parseFloat(transaction.balance || "0"),
          category: transaction.category || "Autre",
          reference: transaction.reference || transaction.id || "N/A",
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setTransactions(accountTransactions)
      logger.success("Account details loaded", { transactionCount: accountTransactions.length })
    } catch (error) {
      logger.error("Failed to load account details", error)
      handleError(error, "Impossible de charger les détails du compte")
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccountDetails()
    setRefreshing(false)
  }

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance)
  }

  useEffect(() => {
    loadAccountDetails()
  }, [accountId, tenantId])

  return {
    account,
    transactions,
    isLoading,
    refreshing,
    showBalance,
    onRefresh,
    toggleBalanceVisibility,
    formatAmount,
    formatDate,
  }
}
