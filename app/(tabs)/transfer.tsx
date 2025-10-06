"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  Vibration,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { router } from "expo-router"
import AddBeneficiaryForm from "@/components/AddBeneficiaryForm"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

const { width } = Dimensions.get("window")

interface Account {
  id: string
  name: string
  number: string
  balance: number
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

export default function TransferScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { user, tenantId } = useAuth()

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
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: "",
    bank: "",
    rib: "",
    accountNumber: "",
  })

  const [accounts, setAccounts] = useState<Account[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  const amountRef = useRef<TextInput>(null)
  const motifRef = useRef<TextInput>(null)
  const otpRef = useRef<TextInput>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = await SecureStore.getItemAsync("token")
        if (!token || !tenantId) {
          console.log("[v0] No token or tenantId available")
          setIsLoadingAccounts(false)
          return
        }

        console.log("[v0] Fetching accounts...")
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.LIST(tenantId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.status}`)
        }

        const data = await response.json()
        console.log("[v0] Accounts fetched:", data)

        // Map API response to Account interface
        const mappedAccounts: Account[] = (data.rows || [])
          .filter((acc: any) => acc.status === "ACTIF") // Only show active accounts
          .map((acc: any) => ({
            id: acc.id,
            name: acc.accountName || "Compte sans nom",
            number: acc.accountNumber || "Non attribué",
            balance: Number.parseFloat(acc.availableBalance || "0"),
            type: acc.type?.toLowerCase() || "courant",
            currency: acc.currency || "GNF",
          }))

        setAccounts(mappedAccounts)
      } catch (error) {
        console.error("[v0] Error fetching accounts:", error)
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [tenantId])

  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        const token = await SecureStore.getItemAsync("token")
        if (!token || !tenantId) {
          console.log("[v0] No token or tenantId available")
          setIsLoadingBeneficiaries(false)
          return
        }

        console.log("[v0] Fetching beneficiaries...")
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.LIST(tenantId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch beneficiaries: ${response.status}`)
        }

        const data = await response.json()
        console.log("[v0] Beneficiaries fetched:", data)

        // Map API response to Beneficiary interface
        const mappedBeneficiaries: Beneficiary[] = (data.rows || []).map((ben: any) => ({
          id: ben.id,
          name: ben.nomBeneficiaire || "Bénéficiaire sans nom",
          bank: ben.banque || "Banque inconnue",
          rib: ben.rib || "",
          accountNumber: ben.numeroCompte || "",
        }))

        setBeneficiaries(mappedBeneficiaries)
      } catch (error) {
        console.error("[v0] Error fetching beneficiaries:", error)
      } finally {
        setIsLoadingBeneficiaries(false)
      }
    }

    fetchBeneficiaries()
  }, [tenantId])

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    const valid = false
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

    setIsFormValid(valid)

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [transferType, selectedAccount, selectedDestinationAccount, selectedBeneficiary, amount, motif])

  const validateAmount = (): boolean => {
    const numAmount = Number.parseFloat(amount.replace(/\s/g, ""))
    if (!numAmount || numAmount <= 0) return false
    if (selectedAccount && numAmount > selectedAccount.balance) return false
    return true
  }

  const formatAmount = (value: string): string => {
    const numValue = value.replace(/\D/g, "")
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  const shakeAnimation = () => {
    Vibration.vibrate(100)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start()
  }

  const buttonPressAnimation = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
  }

  const dismissKeyboard = () => {
    Keyboard.dismiss()
  }

  const validateForm = (): boolean => {
    if (!transferType) {
      setFeedback({ message: "Veuillez choisir le type de transfert", type: "error" })
      return false
    }
    if (!selectedAccount) {
      setFeedback({ message: "Veuillez sélectionner un compte débiteur", type: "error" })
      return false
    }
    if (transferType === "account" && !selectedDestinationAccount) {
      setFeedback({ message: "Veuillez sélectionner un compte créditeur", type: "error" })
      return false
    }
    if (transferType === "beneficiary" && !selectedBeneficiary) {
      setFeedback({ message: "Veuillez sélectionner un bénéficiaire", type: "error" })
      return false
    }
    if (!amount.trim()) {
      setFeedback({ message: "Veuillez saisir un montant", type: "error" })
      return false
    }
    if (!motif.trim()) {
      setFeedback({ message: "Veuillez saisir un motif", type: "error" })
      return false
    }
    return validateAmount()
  }

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

  const validateTransfer = async () => {
    if (otpCode !== "123456") {
      shakeAnimation()
      setFeedback({ message: "Code OTP incorrect", type: "error" })
      return
    }

    buttonPressAnimation()
    setIsLoading(true)

    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token || !tenantId || !selectedAccount) {
        throw new Error("Authentication required")
      }

      const txnId = `TXN${Date.now()}`
      const txnType = transferType === "account" ? "TRANSFERT" : "VIREMENT"
      const creditAccount =
        transferType === "account" ? selectedDestinationAccount?.number || "" : selectedBeneficiary?.accountNumber || ""

      const transactionData = {
        data: {
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
        },
      }

      console.log("[v0] Creating transaction:", transactionData)

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTION.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Transaction created successfully:", result)

      setIsLoading(false)
      setShowOtpModal(false)

      const transferTypeText = transferType === "account" ? "Transfert" : "Virement"
      const destinationText = transferType === "account" ? selectedDestinationAccount?.name : selectedBeneficiary?.name

      Alert.alert(
        "Succès",
        `${transferTypeText} de ${amount} GNF vers ${destinationText} effectué avec succès.\n\nRéférence: ${txnId}`,
        [
          {
            text: "OK",
            onPress: () => resetForm(),
          },
        ],
      )
    } catch (error) {
      console.error("[v0] Transaction error:", error)
      setIsLoading(false)
      setFeedback({
        message: error instanceof Error ? error.message : "Erreur lors de la création du virement",
        type: "error",
      })
      shakeAnimation()
    }
  }

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

  const closeOtpModal = () => {
    setShowOtpModal(false)
    setOtpCode("")
    setFeedback({ message: "", type: "" })
    Keyboard.dismiss()
  }

  const getAvailableDestinationAccounts = () => {
    return accounts.filter((account) => account.id !== selectedAccount?.id)
  }

  const selectTransferType = (type: TransferType) => {
    setTransferType(type)
    setSelectedBeneficiary(null)
    setSelectedDestinationAccount(null)
    setFeedback({ message: "", type: "" })
  }

  const handleAddBeneficiarySuccess = () => {
    setShowAddBeneficiaryModal(false)
    const fetchBeneficiaries = async () => {
      try {
        const token = await SecureStore.getItemAsync("token")
        if (!token || !tenantId) return

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.LIST(tenantId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const mappedBeneficiaries: Beneficiary[] = (data.rows || []).map((ben: any) => ({
            id: ben.id,
            name: ben.nomBeneficiaire || "Bénéficiaire sans nom",
            bank: ben.banque || "Banque inconnue",
            rib: ben.rib || "",
            accountNumber: ben.numeroCompte || "",
          }))
          setBeneficiaries(mappedBeneficiaries)
        }
      } catch (error) {
        console.error("[v0] Error refreshing beneficiaries:", error)
      }
    }
    fetchBeneficiaries()
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                router.back()
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Nouveau Transfert</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <View style={[styles.progressContainer]}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {feedback.message ? (
          <Animated.View
            style={[
              styles.feedbackContainer,
              {
                backgroundColor: feedback.type === "success" ? `${colors.success}15` : `${colors.error}15`,
                borderColor: feedback.type === "success" ? colors.success : colors.error,
              },
            ]}
          >
            <IconSymbol
              name={feedback.type === "success" ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"}
              size={20}
              color={feedback.type === "success" ? colors.success : colors.error}
            />
            <Text style={[styles.feedbackText, { color: feedback.type === "success" ? colors.success : colors.error }]}>
              {feedback.message}
            </Text>
          </Animated.View>
        ) : null}

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de transfert *</Text>

            <TouchableOpacity
              style={[
                styles.transferTypeCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: transferType === "account" ? colors.primary : colors.border,
                  borderWidth: transferType === "account" ? 2 : 1,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => selectTransferType("account")}
              activeOpacity={0.8}
            >
              <View style={styles.transferTypeInfo}>
                <View style={[styles.transferTypeIcon, { backgroundColor: `${colors.secondary}20` }]}>
                  <IconSymbol name="arrow.triangle.2.circlepath" size={24} color={colors.secondary} />
                </View>
                <View style={styles.transferTypeDetails}>
                  <Text style={[styles.transferTypeName, { color: colors.text }]}>Transfert entre mes comptes</Text>
                  <Text style={[styles.transferTypeDescription, { color: colors.textSecondary }]}>
                    Transférer des fonds entre vos comptes BNG
                  </Text>
                </View>
              </View>
              {transferType === "account" && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.transferTypeCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: transferType === "beneficiary" ? colors.primary : colors.border,
                  borderWidth: transferType === "beneficiary" ? 2 : 1,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => selectTransferType("beneficiary")}
              activeOpacity={0.8}
            >
              <View style={styles.transferTypeInfo}>
                <View style={[styles.transferTypeIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <IconSymbol name="person.fill" size={24} color={colors.primary} />
                </View>
                <View style={styles.transferTypeDetails}>
                  <Text style={[styles.transferTypeName, { color: colors.text }]}>Virement vers bénéficiaire</Text>
                  <Text style={[styles.transferTypeDescription, { color: colors.textSecondary }]}>
                    Envoyer de l'argent à un bénéficiaire enregistré
                  </Text>
                </View>
              </View>
              {transferType === "beneficiary" && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {transferType && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Compte débiteur *</Text>
              {isLoadingAccounts ? (
                <View style={styles.loadingSection}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des comptes...</Text>
                </View>
              ) : accounts.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun compte actif disponible</Text>
                </View>
              ) : (
                accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: selectedAccount?.id === account.id ? colors.primary : colors.border,
                        borderWidth: selectedAccount?.id === account.id ? 2 : 1,
                        shadowColor: colors.shadow,
                      },
                    ]}
                    onPress={() => setSelectedAccount(account)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.accountInfo}>
                      <View style={[styles.accountIcon, { backgroundColor: `${colors.primary}20` }]}>
                        <IconSymbol name="creditcard.fill" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.accountDetails}>
                        <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                        <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>{account.number}</Text>
                        <Text style={[styles.accountBalance, { color: colors.text }]}>
                          Solde: {account.balance.toLocaleString()} {account.currency}
                        </Text>
                      </View>
                    </View>
                    {selectedAccount?.id === account.id && (
                      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </Animated.View>
          )}

          {transferType === "beneficiary" && selectedAccount && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Bénéficiaire *</Text>
                <TouchableOpacity
                  style={[styles.addBeneficiaryBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAddBeneficiaryModal(true)}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="plus" size={16} color="white" />
                  <Text style={styles.addBeneficiaryBtnText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              {isLoadingBeneficiaries ? (
                <View style={styles.loadingSection}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Chargement des bénéficiaires...
                  </Text>
                </View>
              ) : beneficiaries.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun bénéficiaire enregistré</Text>
                </View>
              ) : (
                beneficiaries.map((beneficiary) => (
                  <TouchableOpacity
                    key={beneficiary.id}
                    style={[
                      styles.beneficiaryCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: selectedBeneficiary?.id === beneficiary.id ? colors.primary : colors.border,
                        borderWidth: selectedBeneficiary?.id === beneficiary.id ? 2 : 1,
                        shadowColor: colors.shadow,
                      },
                    ]}
                    onPress={() => setSelectedBeneficiary(beneficiary)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.beneficiaryInfo}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{beneficiary.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.beneficiaryDetails}>
                        <Text style={[styles.beneficiaryName, { color: colors.text }]}>{beneficiary.name}</Text>
                        <Text style={[styles.beneficiaryBank, { color: colors.textSecondary }]}>
                          {beneficiary.bank}
                        </Text>
                        <Text style={[styles.beneficiaryRib, { color: colors.textSecondary }]}>{beneficiary.rib}</Text>
                      </View>
                    </View>
                    {selectedBeneficiary?.id === beneficiary.id && (
                      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </Animated.View>
          )}

          {transferType === "account" && selectedAccount && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Compte créditeur *</Text>
              {getAvailableDestinationAccounts().map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: selectedDestinationAccount?.id === account.id ? colors.primary : colors.border,
                      borderWidth: selectedDestinationAccount?.id === account.id ? 2 : 1,
                      shadowColor: colors.shadow,
                    },
                  ]}
                  onPress={() => setSelectedDestinationAccount(account)}
                  activeOpacity={0.8}
                >
                  <View style={styles.accountInfo}>
                    <View style={[styles.accountIcon, { backgroundColor: `${colors.secondary}20` }]}>
                      <IconSymbol name="plus.circle.fill" size={24} color={colors.secondary} />
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                      <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>{account.number}</Text>
                      <Text style={[styles.accountBalance, { color: colors.text }]}>
                        Solde: {account.balance.toLocaleString()} {account.currency}
                      </Text>
                    </View>
                  </View>
                  {selectedDestinationAccount?.id === account.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {((transferType === "account" && selectedAccount && selectedDestinationAccount) ||
            (transferType === "beneficiary" && selectedAccount && selectedBeneficiary)) && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails du transfert</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Montant *</Text>
                <View
                  style={[
                    styles.amountInputContainer,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: amount && validateAmount() ? colors.success : amount ? colors.error : colors.border,
                      borderWidth: amount ? 2 : 1,
                    },
                  ]}
                >
                  <TextInput
                    ref={amountRef}
                    style={[styles.amountInput, { color: colors.text }]}
                    value={amount}
                    onChangeText={(text) => setAmount(formatAmount(text))}
                    placeholder="0"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => motifRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  <Text style={[styles.currency, { color: colors.text }]}>GNF</Text>
                  {amount && validateAmount() && (
                    <IconSymbol name="checkmark.circle" size={20} color={colors.success} />
                  )}
                </View>
                {selectedAccount && (
                  <Text style={[styles.balanceInfo, { color: colors.textSecondary }]}>
                    Solde disponible: {selectedAccount.balance.toLocaleString()} GNF
                  </Text>
                )}
              </View>

              <View style={styles.quickAmountsContainer}>
                <Text style={[styles.quickAmountsLabel, { color: colors.textSecondary }]}>Montants suggérés</Text>
                <View style={styles.quickAmountsGrid}>
                  {["50000", "100000", "250000", "500000"].map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={[
                        styles.quickAmountButton,
                        {
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setAmount(formatAmount(quickAmount))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickAmountText, { color: colors.text }]}>
                        {Number.parseInt(quickAmount).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Motif du {transferType === "account" ? "transfert" : "virement"} *
                </Text>
                <TextInput
                  ref={motifRef}
                  style={[
                    styles.motifInput,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: motif.trim() ? colors.success : colors.border,
                      borderWidth: motif.trim() ? 2 : 1,
                    },
                  ]}
                  value={motif}
                  onChangeText={setMotif}
                  placeholder={
                    transferType === "account"
                      ? "Ex: Épargne mensuelle, Provision..."
                      : "Ex: Paiement facture, Remboursement..."
                  }
                  placeholderTextColor={colors.icon}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
                {motif.trim() && (
                  <View style={styles.inputValidIcon}>
                    <IconSymbol name="checkmark.circle" size={16} color={colors.success} />
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.validateButton,
                {
                  backgroundColor: isFormValid ? colors.primary : colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={sendOTP}
              disabled={isLoading || !isFormValid}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={styles.loadingDot} />
                  <Animated.View style={[styles.loadingDot, { marginLeft: 8 }]} />
                  <Animated.View style={[styles.loadingDot, { marginLeft: 8 }]} />
                </View>
              ) : (
                <Text style={[styles.validateButtonText, { color: isFormValid ? "#FFFFFF" : colors.icon }]}>
                  Valider le {transferType === "account" ? "transfert" : "virement"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Modal visible={showOtpModal} animationType="slide" presentationStyle="pageSheet">
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Validation OTP</Text>
                <TouchableOpacity onPress={closeOtpModal} style={styles.closeButton} activeOpacity={0.7}>
                  <IconSymbol name="xmark" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={styles.otpContainer}>
                  <View style={[styles.otpIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <IconSymbol name="lock.shield.fill" size={64} color={colors.primary} />
                  </View>

                  <Text style={[styles.otpDescription, { color: colors.text }]}>
                    Saisissez le code de validation reçu par SMS
                  </Text>

                  <TextInput
                    ref={otpRef}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: otpCode.length === 6 ? colors.success : colors.border,
                        borderWidth: otpCode.length === 6 ? 2 : 1,
                      },
                    ]}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="123456"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    maxLength={6}
                    textAlign="center"
                    autoFocus={true}
                    selectTextOnFocus
                    blurOnSubmit={true}
                    onSubmitEditing={validateTransfer}
                  />

                  <Text style={[styles.otpHint, { color: colors.textSecondary }]}>Code de test: 123456</Text>

                  <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                    <TouchableOpacity
                      style={[
                        styles.otpValidateButton,
                        {
                          backgroundColor: otpCode.length === 6 ? colors.primary : colors.border,
                          shadowColor: colors.shadow,
                        },
                      ]}
                      onPress={validateTransfer}
                      disabled={otpCode.length !== 6 || isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <Animated.View style={styles.loadingDot} />
                          <Animated.View style={[styles.loadingDot, { marginLeft: 8 }]} />
                          <Animated.View style={[styles.loadingDot, { marginLeft: 8 }]} />
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.otpValidateButtonText,
                            { color: otpCode.length === 6 ? "#FFFFFF" : colors.icon },
                          ]}
                        >
                          Valider
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  <TouchableOpacity onPress={closeOtpModal} style={styles.cancelOtpButton} activeOpacity={0.7}>
                    <Text style={[styles.cancelOtpButtonText, { color: colors.primary }]}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal visible={showAddBeneficiaryModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.addBeneficiaryModal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ajouter un bénéficiaire</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddBeneficiaryModal(false)
                  setNewBeneficiary({ name: "", bank: "", rib: "", accountNumber: "" })
                }}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addBeneficiaryContent} keyboardShouldPersistTaps="handled">
              <AddBeneficiaryForm onSuccess={handleAddBeneficiarySuccess} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerSpacer: {
    width: 44,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  loadingSection: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  emptySection: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  transferTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transferTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transferTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  transferTypeDetails: {
    flex: 1,
  },
  transferTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  transferTypeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  accountNumber: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: "500",
  },
  beneficiaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  beneficiaryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  beneficiaryDetails: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  beneficiaryBank: {
    fontSize: 14,
    marginBottom: 4,
  },
  beneficiaryRib: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  inputGroup: {
    marginBottom: 24,
    position: "relative",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "right",
    letterSpacing: -0.5,
  },
  currency: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  balanceInfo: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
    fontWeight: "500",
  },
  quickAmountsContainer: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  motifInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  inputValidIcon: {
    position: "absolute",
    right: 16,
    top: 50,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  validateButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  otpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  otpIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  otpDescription: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: "500",
  },
  otpInput: {
    width: 240,
    height: 64,
    borderRadius: 16,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  otpHint: {
    fontSize: 12,
    marginBottom: 40,
    fontWeight: "500",
  },
  otpValidateButton: {
    width: width * 0.8,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  otpValidateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  cancelOtpButton: {
    padding: 16,
  },
  cancelOtpButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addBeneficiaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addBeneficiaryBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  addBeneficiaryModal: {
    flex: 1,
  },
  addBeneficiaryContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addBeneficiaryInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  addBeneficiaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  addBeneficiaryButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  addBeneficiaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addBeneficiaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
