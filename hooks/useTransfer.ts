"use client"

import { useState, useEffect, useRef } from "react"
import { Animated, Vibration, Alert, Dimensions } from "react-native"
import { useAuth } from "@/contexts/AuthContext"
import { accountService } from "@/services/accountService"
import { transactionService } from "@/services/transactionService"
import { beneficiaryService } from "@/services/beneficiaryService"
import { validateAmount as validateAmountUtil, validateTransferForm } from "@/utils/validators"
import { formatAmount as formatAmountUtil } from "@/utils/formatters"
import { logger } from "@/utils/logger"
import { handleError } from "@/utils/errorHandler"

const { width } = Dimensions.get("window")

interface Account {
  id: string
  name: string
  number: string
  availableBalance: number
  type: "courant" | "epargne" | "terme"
  currency: string
}

interface Beneficiary {
  id: string
  name: string
  bank: string
  rib: string
  accountNumber: string
}

type TransferType = "beneficiary" | "account"

export const useTransfer = () => {
  const { user, tenantId } = useAuth()

  // State
  const [transferType, setTransferType] = useState<TransferType | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [selectedDestinationAccount, setSelectedDestinationAccount] = useState<Account | null>(null)
  const [amount, setAmount] = useState("")
  const [motif, setMotif] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState({ message: "", type: "" })
  const [isFormValid, setIsFormValid] = useState(false)
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  // Load accounts
  const fetchAccounts = async () => {
    try {
      if (!tenantId) {
        setIsLoadingAccounts(false)
        return
      }

      logger.info("Fetching accounts for transfer")
      const data = await accountService.getAccounts(tenantId)

      const mappedAccounts: Account[] = (data.rows || [])
        .filter((acc: any) => acc.status === "ACTIF")
        .map((acc: any) => ({
          id: acc.id,
          name: acc.accountName || "Compte sans nom",
          number: acc.accountNumber || "Non attribué",
          availableBalance: Number.parseFloat(acc.availableBalance || "0"),
          type: acc.type?.toLowerCase() || "courant",
          currency: acc.currency || "GNF",
        }))

      setAccounts(mappedAccounts)
      logger.success("Accounts fetched", { count: mappedAccounts.length })
    } catch (error) {
      logger.error("Failed to fetch accounts", error)
      handleError(error)
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  // Load beneficiaries
  const fetchBeneficiaries = async () => {
    try {
      if (!tenantId) {
        setIsLoadingBeneficiaries(false)
        return
      }

      logger.info("Fetching beneficiaries")
      const data = await beneficiaryService.getBeneficiaries(tenantId)

      const mappedBeneficiaries: Beneficiary[] = (data.rows || []).map((ben: any) => ({
        id: ben.id,
        name: ben.name || "Bénéficiaire sans nom",
        bank: ben.bankName || "Banque inconnue",
        rib: ben.accountNumber || "",
        accountNumber: ben.accountNumber || "",
      }))

      setBeneficiaries(mappedBeneficiaries)
      logger.success("Beneficiaries fetched", { count: mappedBeneficiaries.length })
    } catch (error) {
      logger.error("Failed to fetch beneficiaries", error)
      handleError(error)
    } finally {
      setIsLoadingBeneficiaries(false)
    }
  }

  // Validate amount
  const validateAmount = (): boolean => {
    return validateAmountUtil(amount, selectedAccount?.availableBalance)
  }

  // Format amount
  const formatAmount = (value: string): string => {
    return formatAmountUtil(value)
  }

  // Shake animation
  const shakeAnimation = () => {
    Vibration.vibrate(100)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start()
  }

  // Button press animation
  const buttonPressAnimation = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
  }

  // Validate form
  const validateForm = (): boolean => {
    const validation = validateTransferForm({
      transferType,
      selectedAccount,
      selectedDestinationAccount,
      selectedBeneficiary,
      amount,
      motif,
    })

    if (!validation.isValid) {
      setFeedback({ message: validation.error || "", type: "error" })
      return false
    }

    return validateAmount()
  }

  // Send OTP
  const sendOTP = () => {
    if (!validateForm()) {
      shakeAnimation()
      return
    }

    buttonPressAnimation()
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      setShowOtpModal(true)
      setFeedback({
        message: "Code OTP envoyé par SMS au +224 XXX XXX 789",
        type: "success",
      })
    }, 1500)
  }

  // Validate transfer
  const validateTransfer = async () => {
    if (otpCode !== "123456") {
      shakeAnimation()
      setFeedback({ message: "Code OTP incorrect", type: "error" })
      return
    }

    buttonPressAnimation()
    setIsLoading(true)

    try {
      if (!tenantId || !selectedAccount) {
        throw new Error("Authentication required")
      }

      const txnId = `TXN${Date.now()}`
      const txnType = transferType === "account" ? "TRANSFERT" : "VIREMENT"
      const creditAccount =
        transferType === "account" ? selectedDestinationAccount?.number || "" : selectedBeneficiary?.accountNumber || ""

      logger.info("Creating transaction", { txnId, txnType })

      await transactionService.createTransaction(tenantId, {
        txnId,
        accountId: selectedAccount.id,
        txnType,
        amount: amount.replace(/\s/g, ""),
        valueDate: new Date().toISOString(),
        status: "EN ATTENTE",
        description: motif,
        creditAccount,
        commentNotes: `${transferType === "account" ? "Transfert" : "Virement"} vers ${
          transferType === "account" ? selectedDestinationAccount?.name : selectedBeneficiary?.name
        }`,
      })

      // Update balances
      const transferAmount = Number.parseFloat(amount.replace(/\s/g, ""))
      await accountService.updateAccountBalance(tenantId, selectedAccount.id, -transferAmount)

      if (transferType === "account" && selectedDestinationAccount) {
        await accountService.updateAccountBalance(tenantId, selectedDestinationAccount.id, transferAmount)
      }

      // Refresh accounts
      await fetchAccounts()

      setIsLoading(false)
      setShowOtpModal(false)

      const transferTypeText = transferType === "account" ? "Transfert" : "Virement"
      const destinationText = transferType === "account" ? selectedDestinationAccount?.name : selectedBeneficiary?.name

      Alert.alert(
        "Succès",
        `${transferTypeText} de ${amount} GNF vers ${destinationText} effectué avec succès.\n\nRéférence: ${txnId}`,
        [{ text: "OK", onPress: () => resetForm() }],
      )

      logger.success("Transfer completed", { txnId })
    } catch (error) {
      logger.error("Transfer failed", error)
      setIsLoading(false)
      handleError(error, "Erreur lors de la création du virement")
      shakeAnimation()
    }
  }

  // Reset form
  const resetForm = () => {
    setTransferType(null)
    setSelectedAccount(null)
    setSelectedBeneficiary(null)
    setSelectedDestinationAccount(null)
    setAmount("")
    setMotif("")
    setOtpCode("")
    setFeedback({ message: "", type: "" })
  }

  // Get available destination accounts
  const getAvailableDestinationAccounts = () => {
    return accounts.filter(
      (account) => account.id !== selectedAccount?.id && account.currency === selectedAccount?.currency,
    )
  }

  // Select transfer type
  const selectTransferType = (type: TransferType) => {
    setTransferType(type)
    setSelectedBeneficiary(null)
    setSelectedDestinationAccount(null)
    setFeedback({ message: "", type: "" })
  }

  // Handle add beneficiary success
  const handleAddBeneficiarySuccess = () => {
    setShowAddBeneficiaryModal(false)
    fetchBeneficiaries()
  }

  // Initialize
  useEffect(() => {
    fetchAccounts()
    fetchBeneficiaries()

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [tenantId])

  // Update form validity and progress
  useEffect(() => {
    let valid = false
    let progress = 0

    if (transferType) progress += 0.2
    if (selectedAccount) progress += 0.2
    if (
      (transferType === "account" && selectedDestinationAccount) ||
      (transferType === "beneficiary" && selectedBeneficiary)
    )
      progress += 0.2
    if (amount && validateAmount()) progress += 0.2
    if (motif.trim()) progress += 0.2

    valid =
      transferType !== null &&
      selectedAccount !== null &&
      ((transferType === "account" && selectedDestinationAccount !== null) ||
        (transferType === "beneficiary" && selectedBeneficiary !== null)) &&
      amount.trim() !== "" &&
      validateAmount() &&
      motif.trim() !== ""

    setIsFormValid(valid)

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [transferType, selectedAccount, selectedDestinationAccount, selectedBeneficiary, amount, motif])

  return {
    // State
    transferType,
    selectedAccount,
    selectedBeneficiary,
    selectedDestinationAccount,
    amount,
    motif,
    otpCode,
    showOtpModal,
    isLoading,
    feedback,
    isFormValid,
    showAddBeneficiaryModal,
    accounts,
    beneficiaries,
    isLoadingAccounts,
    isLoadingBeneficiaries,

    // Animations
    fadeAnim,
    slideAnim,
    shakeAnim,
    buttonScaleAnim,
    progressAnim,

    // Actions
    setTransferType: selectTransferType,
    setSelectedAccount,
    setSelectedBeneficiary,
    setSelectedDestinationAccount,
    setAmount,
    setMotif,
    setOtpCode,
    setShowOtpModal,
    setShowAddBeneficiaryModal,
    formatAmount,
    validateAmount,
    sendOTP,
    validateTransfer,
    resetForm,
    getAvailableDestinationAccounts,
    handleAddBeneficiarySuccess,
  }
}
