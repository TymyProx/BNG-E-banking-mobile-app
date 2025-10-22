"use client"

import { useState, useEffect, useRef } from "react"
import { Animated } from "react-native"
import { useAuth } from "@/contexts/AuthContext"
import { accountService } from "@/services/accountService"
import { logger } from "@/utils/logger"
import { handleError } from "@/utils/errorHandler"

export interface Account {
  id: string
  name: string
  number: string
  balance: number
  type: "primary" | "savings" | "checking" | "credit"
  change: number
  status: "active" | "inactive" | "blocked" | "pending" | "actif" | "en attente" | "attente" | "inactif" | "bloqué"
  currency: string
  lastUpdate: string
}

export const useAccounts = () => {
  const { tenantId } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeTypeIndex, setActiveTypeIndex] = useState(0)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      logger.info("Loading accounts", { tenantId })

      if (!tenantId) {
        setAccounts([])
        setIsLoading(false)
        return
      }

      const data = await accountService.getAccounts(tenantId)

      const mappedAccounts: Account[] = data.rows.map((account: any) => ({
        id: account.id,
        name: account.accountName || "Compte sans nom",
        number: account.accountNumber || "N/A",
        balance: Number.parseFloat(account.availableBalance || "0"),
        type: account.type?.toLowerCase() || "checking",
        change: 0,
        status: account.status?.toLowerCase() || "active",
        currency: account.currency || "GNF",
        lastUpdate: account.updatedAt ? new Date(account.updatedAt).toLocaleDateString("fr-FR") : "N/A",
      }))

      setAccounts(mappedAccounts)

      // Animate
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start()

      logger.success("Accounts loaded successfully", { count: mappedAccounts.length })
    } catch (error) {
      logger.error("Failed to load accounts", error)
      handleError(error, "Impossible de charger les comptes")
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccounts()
    setRefreshing(false)
  }

  const getActiveAccounts = () => {
    return accounts.filter(
      (account) => account.status.toLowerCase() === "actif" || account.status.toLowerCase() === "active",
    )
  }

  const getPendingAccounts = () => {
    return accounts.filter(
      (account) =>
        account.status.toLowerCase() === "en attente" ||
        account.status.toLowerCase() === "pending" ||
        account.status.toLowerCase() === "attente",
    )
  }

  useEffect(() => {
    loadAccounts()
  }, [tenantId])

  return {
    accounts,
    activeAccounts: getActiveAccounts(),
    pendingAccounts: getPendingAccounts(),
    isLoading,
    refreshing,
    activeIndex,
    activeTypeIndex,
    fadeAnim,
    slideAnim,
    setActiveIndex,
    setActiveTypeIndex,
    onRefresh,
    loadAccounts,
  }
}
