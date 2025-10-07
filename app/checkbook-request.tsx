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

interface FormData {
  dateorder: string
  nbrefeuille: string
  nbrechequier: string
  stepflow: number
  intitulecompte: string
  numcompteId: string
  commentaire: string
}

interface Account {
  id: string
  accountNumber: string
  accountName: string
  type: string
  balance: number
  currency: string
  status: string
}

interface SelectOption {
  label: string
  value: string
}

export default function CheckbookRequestScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { user, tenantId, isLoading: authLoading } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [showAccountSelect, setShowAccountSelect] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    dateorder: new Date().toISOString().split("T")[0],
    nbrefeuille: "",
    nbrechequier: "",
    stepflow: 0,
    intitulecompte: "",
    numcompteId: "",
    commentaire: "",
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

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
        const activeCurrentAccounts = (Array.isArray(data) ? data : data.rows || []).filter(
          (account: Account) => account.status === "ACTIF" && account.type === "Courant",
        )
        setAccounts(activeCurrentAccounts)
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

    fetchAccounts()
  }, [tenantId])

  const validateForm = (): boolean => {
    if (!formData.numcompteId) {
      Alert.alert("Erreur", "Veuillez sélectionner un compte")
      return false
    }
    if (!formData.nbrechequier || Number.parseInt(formData.nbrechequier) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un nombre de chéquiers valide")
      return false
    }
    if (!formData.nbrefeuille || Number.parseInt(formData.nbrefeuille) <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un nombre de feuilles valide")
      return false
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
      Alert.alert("Erreur", "Vous devez être connecté pour faire une demande de chéquier")
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
          dateorder: formData.dateorder,
          nbrefeuille: Number.parseInt(formData.nbrefeuille),
          nbrechequier: Number.parseInt(formData.nbrechequier),
          stepflow: 0,
          intitulecompte: formData.intitulecompte,
          numcompteId: formData.numcompteId,
          commentaire: formData.commentaire,
        },
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHECKBOOK.CREATE(tenantId)}`, {
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

      Alert.alert(
        "Demande envoyée avec succès !",
        `Votre demande de ${formData.nbrechequier} chéquier(s) de ${formData.nbrefeuille} feuilles a été soumise.\n\nVotre demande sera traitée dans les plus brefs délais.`,
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
      console.error("[v0] Error submitting checkbook request:", error)
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Une erreur est survenue lors de la soumission de la demande",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountSelect = (accountId: string) => {
    const selectedAccount = accounts.find((acc) => acc.id === accountId)
    if (selectedAccount) {
      setFormData({
        ...formData,
        numcompteId: accountId,
        intitulecompte: selectedAccount.accountName,
      })
    }
  }

  const getSelectedAccountText = () => {
    if (!formData.numcompteId) return "Sélectionnez un compte"
    const account = accounts.find((acc) => acc.id === formData.numcompteId)
    return account ? `${account.accountNumber} - ${account.accountName}` : "Sélectionnez un compte"
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
          <ScrollView
            style={styles.modalList}
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
          >
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Demande de Chéquier</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations du compte</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Compte *</Text>
              <TouchableOpacity
                style={[styles.selectButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setShowAccountSelect(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    { color: formData.numcompteId ? colors.text : colors.textSecondary },
                  ]}
                >
                  {getSelectedAccountText()}
                </Text>
                <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails de la commande</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre de chéquiers *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={formData.nbrechequier}
                onChangeText={(value) => setFormData({ ...formData, nbrechequier: value.replace(/[^0-9]/g, "") })}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre de feuilles par chéquier *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={formData.nbrefeuille}
                onChangeText={(value) => setFormData({ ...formData, nbrefeuille: value.replace(/[^0-9]/g, "") })}
                placeholder="25"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                Généralement 25 ou 50 feuilles par chéquier
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Commentaire (optionnel)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={formData.commentaire}
                onChangeText={(value) => setFormData({ ...formData, commentaire: value })}
                placeholder="Ajoutez un commentaire si nécessaire..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <SelectModal
        visible={showAccountSelect}
        onClose={() => setShowAccountSelect(false)}
        options={accounts.map((acc) => ({
          label: `${acc.accountNumber} - ${acc.accountName}`,
          value: acc.id,
        }))}
        selectedValue={formData.numcompteId}
        onSelect={handleAccountSelect}
        title="Sélectionnez un compte"
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
  textArea: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 100,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
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
    minHeight: "50%",
    maxHeight: "80%",
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
  modalListContent: {
    paddingBottom: 20,
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
