"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  TextInput,
  Modal,
} from "react-native"
import { router } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuth } from "@/contexts/AuthContext"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"

interface CreditType {
  id: string
  name: string
  description: string
  icon: string
  color: string
  minAmount: number
  maxAmount: number
  minDuration: number
  maxDuration: number
}

interface FormData {
  applicantName: string
  creditAmount: string
  durationMonths: string
  purpose: string
  typedemande: string
  accountNumber: string
}

interface Account {
  id: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  status: string
}

interface SelectOption {
  label: string
  value: string
}

export default function CreditRequestScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { user, tenantId, isLoading: authLoading } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [showAccountSelect, setShowAccountSelect] = useState(false)
  const [showCreditTypeSelect, setShowCreditTypeSelect] = useState(false)
  const [showPurposeSelect, setShowPurposeSelect] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    applicantName: "",
    creditAmount: "",
    durationMonths: "",
    purpose: "",
    typedemande: "",
    accountNumber: "",
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  const creditTypes: CreditType[] = [
    {
      id: "personnel",
      name: "Crédit Personnel",
      description: "Pour vos projets personnels",
      icon: "person.fill",
      color: colors.primary,
      minAmount: 500000,
      maxAmount: 50000000,
      minDuration: 6,
      maxDuration: 60,
    },
    {
      id: "immobilier",
      name: "Crédit Immobilier",
      description: "Pour l'achat ou la construction",
      icon: "house.fill",
      color: colors.success,
      minAmount: 10000000,
      maxAmount: 500000000,
      minDuration: 12,
      maxDuration: 300,
    },
    {
      id: "automobile",
      name: "Crédit Automobile",
      description: "Pour l'achat d'un véhicule",
      icon: "car.fill",
      color: colors.accent,
      minAmount: 2000000,
      maxAmount: 100000000,
      minDuration: 12,
      maxDuration: 84,
    },
    {
      id: "entreprise",
      name: "Crédit Entreprise",
      description: "Pour développer votre activité",
      icon: "briefcase.fill",
      color: colors.secondary,
      minAmount: 5000000,
      maxAmount: 1000000000,
      minDuration: 12,
      maxDuration: 120,
    },
  ]

  const purposes = [
    "Achat immobilier",
    "Achat véhicule",
    "Travaux et rénovation",
    "Équipement professionnel",
    "Développement entreprise",
    "Études et formation",
    "Événement familial",
    "Consolidation de dettes",
    "Autre",
  ]

  const fetchAccounts = async () => {
    if (!tenantId) return

    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) return

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.LIST(tenantId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Filter only active accounts
        const activeAccounts = (Array.isArray(data) ? data : data.rows || []).filter(
          (account: Account) => account.status === "ACTIF",
        )
        setAccounts(activeAccounts)
      }
    } catch (error) {
      console.error("[v0] Error fetching accounts:", error)
    } finally {
      setLoadingAccounts(false)
    }
  }

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

    if (user) {
      setFormData((prev) => ({
        ...prev,
        applicantName: user.fullName || user.name,
      }))
    }

    fetchAccounts()
  }, [user, tenantId])

  const handleCreditTypeSelect = (typeId: string) => {
    setFormData({ ...formData, typedemande: typeId })
  }

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "")
    if (numericValue === "") return ""
    return new Intl.NumberFormat("fr-GN").format(Number.parseInt(numericValue))
  }

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "")
    setFormData({ ...formData, creditAmount: numericValue })
  }

  const validateForm = (): boolean => {
    if (!formData.applicantName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre nom complet")
      return false
    }
    if (!formData.typedemande) {
      Alert.alert("Erreur", "Veuillez sélectionner un type de crédit")
      return false
    }
    if (!formData.creditAmount || Number.parseInt(formData.creditAmount) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un montant valide")
      return false
    }
    if (!formData.durationMonths || Number.parseInt(formData.durationMonths) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une durée valide")
      return false
    }
    if (!formData.purpose.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner l'objet du crédit")
      return false
    }
    if (!formData.accountNumber.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner un compte à débiter")
      return false
    }

    const selectedType = creditTypes.find((type) => type.id === formData.typedemande)
    if (selectedType) {
      const amount = Number.parseInt(formData.creditAmount)
      const duration = Number.parseInt(formData.durationMonths)

      if (amount < selectedType.minAmount || amount > selectedType.maxAmount) {
        Alert.alert(
          "Erreur",
          `Le montant doit être entre ${formatAmount(selectedType.minAmount.toString())} et ${formatAmount(selectedType.maxAmount.toString())} GNF`,
        )
        return false
      }

      if (duration < selectedType.minDuration || duration > selectedType.maxDuration) {
        Alert.alert(
          "Erreur",
          `La durée doit être entre ${selectedType.minDuration} et ${selectedType.maxDuration} mois`,
        )
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    if (authLoading) {
      Alert.alert("Chargement", "Veuillez patienter pendant le chargement de vos informations...")
      return
    }

    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour faire une demande de crédit")
      return
    }

    if (!tenantId) {
      Alert.alert("Erreur", "Impossible de récupérer les informations du tenant. Veuillez vous reconnecter.")
      return
    }

    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.")
        router.replace("/(auth)/login")
        return
      }

      const requestBody = {
        data: {
          applicantName: formData.applicantName,
          creditAmount: formData.creditAmount,
          durationMonths: formData.durationMonths,
          purpose: formData.purpose,
          typedemande: formData.typedemande,
          accountNumber: formData.accountNumber,
        },
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREDIT.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Erreur lors de la soumission de la demande")
      }

      const result = await response.json()

      Alert.alert(
        "Demande envoyée avec succès !",
        `Votre demande de crédit de ${formatAmount(formData.creditAmount)} GNF a été soumise.\n\nVotre demande sera étudiée par nos services. Vous recevrez une réponse dans les plus brefs délais.`,
        [
          {
            text: "Retour",
            onPress: () => {
              router.back()
            },
          },
        ],
      )
    } catch (error) {
      console.error("[v0] Error submitting credit request:", error)
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Une erreur est survenue lors de la soumission de la demande",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getSelectedAccountText = () => {
    if (!formData.accountNumber) return "Sélectionnez un compte"
    const account = accounts.find((acc) => acc.accountNumber === formData.accountNumber)
    return account ? `${account.accountNumber} - ${account.accountType}` : formData.accountNumber
  }

  const getSelectedCreditTypeText = () => {
    if (!formData.typedemande) return "Sélectionnez un type"
    const type = creditTypes.find((t) => t.id === formData.typedemande)
    return type ? type.name : formData.typedemande
  }

  const getSelectedPurposeText = () => {
    return formData.purpose || "Sélectionnez un objet"
  }

  const SelectModal = ({
    visible,
    onClose,
    options,
    selectedValue,
    onSelect,
    title,
  }: {
    visible: boolean
    onClose: () => void
    options: SelectOption[]
    selectedValue: string
    onSelect: (value: string) => void
    title: string
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: selectedValue === option.value ? `${colors.primary}20` : "transparent",
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => {
                  onSelect(option.value)
                  onClose()
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color: selectedValue === option.value ? colors.primary : colors.text,
                      fontWeight: selectedValue === option.value ? "600" : "400",
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && <IconSymbol name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )

  if (authLoading || loadingAccounts) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Demande de Crédit</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations personnelles</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nom complet *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={formData.applicantName}
                onChangeText={(value) => setFormData({ ...formData, applicantName: value })}
                placeholder="Entrez votre nom complet"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Compte à débiter *</Text>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setShowAccountSelect(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    { color: formData.accountNumber ? colors.text : colors.textSecondary },
                  ]}
                >
                  {getSelectedAccountText()}
                </Text>
                <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de crédit *</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => setShowCreditTypeSelect(true)}
            >
              <Text
                style={[styles.selectButtonText, { color: formData.typedemande ? colors.text : colors.textSecondary }]}
              >
                {getSelectedCreditTypeText()}
              </Text>
              <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails du crédit</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Montant demandé (GNF) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={formatAmount(formData.creditAmount)}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Durée (mois) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={formData.durationMonths}
                onChangeText={(value) => setFormData({ ...formData, durationMonths: value.replace(/[^0-9]/g, "") })}
                placeholder="12"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Objet du crédit *</Text>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setShowPurposeSelect(true)}
              >
                <Text
                  style={[styles.selectButtonText, { color: formData.purpose ? colors.text : colors.textSecondary }]}
                >
                  {getSelectedPurposeText()}
                </Text>
                <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <SelectModal
        visible={showAccountSelect}
        onClose={() => setShowAccountSelect(false)}
        options={accounts.map((acc) => ({
          label: `${acc.accountNumber} - ${acc.accountType} (${(acc.balance ?? 0).toLocaleString()} ${acc.currency})`,
          value: acc.accountNumber,
        }))}
        selectedValue={formData.accountNumber}
        onSelect={(value) => setFormData({ ...formData, accountNumber: value })}
        title="Sélectionnez un compte"
      />

      <SelectModal
        visible={showCreditTypeSelect}
        onClose={() => setShowCreditTypeSelect(false)}
        options={creditTypes.map((type) => ({
          label: type.name,
          value: type.id,
        }))}
        selectedValue={formData.typedemande}
        onSelect={(value) => setFormData({ ...formData, typedemande: value })}
        title="Type de crédit"
      />

      <SelectModal
        visible={showPurposeSelect}
        onClose={() => setShowPurposeSelect(false)}
        options={purposes.map((purpose) => ({
          label: purpose,
          value: purpose,
        }))}
        selectedValue={formData.purpose}
        onSelect={(value) => setFormData({ ...formData, purpose: value })}
        title="Objet du crédit"
      />

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
            },
            isLoading && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Soumettre la demande</Text>
              <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalList: {
    flex: 1,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
    letterSpacing: -0.2,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
