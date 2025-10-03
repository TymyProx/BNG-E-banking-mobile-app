"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import { useAuth } from "@/contexts/AuthContext"

interface FormData {
  fullName: string
  beneficiaryType: string
  // Même banque
  agencyCode: string
  accountNumber: string
  ribKey: string
  // Même zone monétaire
  bank: string
  bankCode: string
  selectedAgencyCode: string
  // International
  iban: string
  swiftCode: string
  // Contact
  phoneNumber: string
  email: string
}

interface FormErrors {
  fullName?: string
  beneficiaryType?: string
  agencyCode?: string
  accountNumber?: string
  ribKey?: string
  bank?: string
  bankCode?: string
  selectedAgencyCode?: string
  iban?: string
  swiftCode?: string
  phoneNumber?: string
  email?: string
}

interface Bank {
  name: string
  code: string
  agencies: { code: string; name: string }[]
}

export default function EditBeneficiary() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()
  const { beneficiaryId } = useLocalSearchParams()
  const { user } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    beneficiaryType: "",
    agencyCode: "",
    accountNumber: "",
    ribKey: "",
    bank: "",
    bankCode: "",
    selectedAgencyCode: "",
    iban: "",
    swiftCode: "",
    phoneNumber: "",
    email: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showBeneficiaryTypeModal, setShowBeneficiaryTypeModal] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [showAgencyModal, setShowAgencyModal] = useState(false)
  const [showBNGAgencyModal, setShowBNGAgencyModal] = useState(false)

  const beneficiaryTypes = [
    { value: "BNG-BNG", label: "Même banque" },
    { value: "BNG-CONFRERE", label: "Même zone monétaire" },
    { value: "International", label: "International" },
  ]

  const banks: Bank[] = [
    {
      name: "Banque Nationale de Guinée",
      code: "BNG001",
      agencies: [
        { code: "001", name: "Agence Centrale Conakry" },
        { code: "002", name: "Agence Kaloum" },
        { code: "003", name: "Agence Matam" },
        { code: "004", name: "Agence Kindia" },
        { code: "005", name: "Agence Labé" },
        { code: "006", name: "Agence Kankan" },
        { code: "007", name: "Agence Boké" },
        { code: "008", name: "Agence Mamou" },
        { code: "009", name: "Agence Faranah" },
        { code: "010", name: "Agence Nzérékoré" },
        { code: "011", name: "Agence Siguiri" },
        { code: "012", name: "Agence Kissidougou" },
      ],
    },
    {
      name: "Société Générale de Banque en Guinée",
      code: "SGBG002",
      agencies: [
        { code: "001", name: "Agence Principale" },
        { code: "002", name: "Agence Almamya" },
        { code: "003", name: "Agence Ratoma" },
        { code: "004", name: "Agence Kankan" },
      ],
    },
    {
      name: "United Bank for Africa",
      code: "UBA003",
      agencies: [
        { code: "001", name: "Agence Centrale" },
        { code: "002", name: "Agence Tombo" },
        { code: "003", name: "Agence Mamou" },
      ],
    },
    {
      name: "Banque Internationale pour le Commerce et l'Industrie de Guinée",
      code: "BICI004",
      agencies: [
        { code: "001", name: "Agence Principale Conakry" },
        { code: "002", name: "Agence Dixinn" },
        { code: "003", name: "Agence Boké" },
      ],
    },
    {
      name: "Ecobank Guinée",
      code: "ECO005",
      agencies: [
        { code: "001", name: "Agence Centrale" },
        { code: "002", name: "Agence Madina" },
        { code: "003", name: "Agence Nzérékoré" },
      ],
    },
    {
      name: "Vista Bank Guinée",
      code: "VISTA006",
      agencies: [
        { code: "001", name: "Agence Principale" },
        { code: "002", name: "Agence Hamdallaye" },
      ],
    },
  ]

  const bngAgencies = banks.find((bank) => bank.name === "Banque Nationale de Guinée")?.agencies || []

  useEffect(() => {
    const loadBeneficiaryData = async () => {
      if (!beneficiaryId) {
        Alert.alert("Erreur", "ID du bénéficiaire manquant")
        router.back()
        return
      }

      try {
        setIsLoading(true)

        const token = await SecureStore.getItemAsync("token")
        if (!token) {
          throw new Error("Token d'authentification non trouvé")
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.DETAILS(API_CONFIG.TENANT_ID, beneficiaryId as string)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des détails")
        }

        const data = await response.json()

        let beneficiaryType = "BNG-CONFRERE"
        if (data.iban) {
          beneficiaryType = "International"
        } else if (data.bankCode === "BNG001") {
          beneficiaryType = "BNG-BNG"
        }

        setFormData({
          fullName: data.name || "",
          beneficiaryType,
          agencyCode: data.agencyCode || "",
          accountNumber: data.accountNumber || "",
          ribKey: data.ribKey || "",
          bank: data.bankName || "",
          bankCode: data.bankCode || "",
          selectedAgencyCode: data.agencyCode || "",
          iban: data.iban || "",
          swiftCode: data.swiftCode || "",
          phoneNumber: data.phoneNumber || "",
          email: data.email || "",
        })
      } catch (err) {
        console.error("Error loading beneficiary data:", err)
        Alert.alert("Erreur", "Impossible de charger les données du bénéficiaire", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadBeneficiaryData()
  }, [beneficiaryId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Le nom et prénom sont requis"
    }

    if (!formData.beneficiaryType) {
      newErrors.beneficiaryType = "Le type de bénéficiaire est requis"
    }

    if (formData.beneficiaryType === "BNG-BNG") {
      if (!formData.agencyCode.trim()) {
        newErrors.agencyCode = "Le code agence est requis"
      }
      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = "Le numéro de compte est requis"
      }
      if (!formData.ribKey.trim()) {
        newErrors.ribKey = "La clé RIB est requise"
      }
    } else if (formData.beneficiaryType === "BNG-CONFRERE") {
      if (!formData.bank.trim()) {
        newErrors.bank = "La banque est requise"
      }
      if (!formData.selectedAgencyCode.trim()) {
        newErrors.selectedAgencyCode = "Le code agence est requis"
      }
      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = "Le numéro de compte est requis"
      }
    } else if (formData.beneficiaryType === "International") {
      if (!formData.iban.trim()) {
        newErrors.iban = "L'IBAN est requis"
      }
      if (!formData.swiftCode.trim()) {
        newErrors.swiftCode = "Le code SWIFT est requis"
      }
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Le numéro de téléphone est requis"
    } else if (!/^(\+224|00224|224)?[0-9]{8,9}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Format de numéro invalide (ex: +224 123 456 789)"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        throw new Error("Token d'authentification non trouvé")
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.UPDATE(API_CONFIG.TENANT_ID, beneficiaryId as string)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.JSONstringify({
            data: {
              customerId: user?.id || "", // Automatically set from logged-in user
              name: formData.fullName,
              accountNumber: formData.accountNumber,
              bankCode: formData.bankCode,
              bankName: formData.bank,
              typeBeneficiary: formData.beneficiaryType,
              phoneNumber: formData.phoneNumber,
              email: formData.email,
              agencyCode: formData.agencyCode || formData.selectedAgencyCode,
              ribKey: formData.ribKey,
              iban: formData.iban,
              swiftCode: formData.swiftCode,
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Erreur lors de la modification")
      }

      Alert.alert("Succès", `Les informations de ${formData.fullName} ont été mises à jour avec succès.`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      console.error("Error updating beneficiary:", error)
      Alert.alert("Erreur", "Une erreur est survenue lors de la modification du bénéficiaire.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleBeneficiaryTypeSelect = (type: string) => {
    updateFormData("beneficiaryType", type)
    setFormData((prev) => ({
      ...prev,
      beneficiaryType: type,
      agencyCode: "",
      accountNumber: "",
      ribKey: "",
      bank: "",
      bankCode: "",
      selectedAgencyCode: "",
      iban: "",
      swiftCode: "",
    }))
    setShowBeneficiaryTypeModal(false)
  }

  const handleBankSelect = (bank: Bank) => {
    setFormData((prev) => ({
      ...prev,
      bank: bank.name,
      bankCode: bank.code,
      selectedAgencyCode: "",
    }))
    setShowBankModal(false)
  }

  const handleAgencySelect = (agencyCode: string) => {
    updateFormData("selectedAgencyCode", agencyCode)
    setShowAgencyModal(false)
  }

  const handleBNGAgencySelect = (agencyCode: string) => {
    updateFormData("agencyCode", agencyCode)
    setShowBNGAgencyModal(false)
  }

  const getBeneficiaryTypeLabel = (type: string) => {
    const beneficiaryType = beneficiaryTypes.find((t) => t.value === type)
    return beneficiaryType ? beneficiaryType.label : ""
  }

  const getSelectedBank = () => {
    return banks.find((bank) => bank.name === formData.bank)
  }

  const getSelectedAgency = () => {
    const selectedBank = getSelectedBank()
    if (!selectedBank) return null
    return selectedBank.agencies.find((agency) => agency.code === formData.selectedAgencyCode)
  }

  const getBNGSelectedAgency = () => {
    return bngAgencies.find((agency) => agency.code === formData.agencyCode)
  }

  const renderAccountFields = () => {
    switch (formData.beneficiaryType) {
      case "BNG-BNG":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Code agence <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectInput,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.agencyCode ? "#ef4444" : colors.border,
                  },
                ]}
                onPress={() => !isLoading && setShowBNGAgencyModal(true)}
                disabled={isLoading}
              >
                <View style={styles.selectContent}>
                  {formData.agencyCode ? (
                    <View>
                      <Text style={[styles.selectedBankName, { color: colors.text }]}>
                        {getBNGSelectedAgency()?.name}
                      </Text>
                      <Text style={[styles.selectedBankCode, { color: colors.textSecondary }]}>
                        Code: {formData.agencyCode}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
                      Sélectionnez une agence BNG
                    </Text>
                  )}
                </View>
                <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {errors.agencyCode && <Text style={styles.errorText}>{errors.agencyCode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Numéro de compte <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.accountNumber ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Entrez le numéro de compte"
                placeholderTextColor={colors.textSecondary}
                value={formData.accountNumber}
                onChangeText={(text) => updateFormData("accountNumber", text.replace(/\D/g, ""))}
                keyboardType="numeric"
                maxLength={20}
                editable={!isLoading}
              />
              {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Clé RIB <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.ribKey ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Ex: 97"
                placeholderTextColor={colors.textSecondary}
                value={formData.ribKey}
                onChangeText={(text) => updateFormData("ribKey", text.replace(/\D/g, ""))}
                keyboardType="numeric"
                maxLength={2}
                editable={!isLoading}
              />
              {errors.ribKey && <Text style={styles.errorText}>{errors.ribKey}</Text>}
            </View>
          </>
        )

      case "BNG-CONFRERE":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Banque <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectInput,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.bank ? "#ef4444" : colors.border,
                  },
                ]}
                onPress={() => !isLoading && setShowBankModal(true)}
                disabled={isLoading}
              >
                <View style={styles.selectContent}>
                  {formData.bank ? (
                    <View>
                      <Text style={[styles.selectedBankName, { color: colors.text }]}>{formData.bank}</Text>
                      <Text style={[styles.selectedBankCode, { color: colors.textSecondary }]}>
                        Code: {formData.bankCode}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Sélectionnez une banque</Text>
                  )}
                </View>
                <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}
            </View>

            {formData.bank && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Code agence <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: errors.selectedAgencyCode ? "#ef4444" : colors.border,
                    },
                  ]}
                  onPress={() => !isLoading && setShowAgencyModal(true)}
                  disabled={isLoading}
                >
                  <View style={styles.selectContent}>
                    {formData.selectedAgencyCode ? (
                      <View>
                        <Text style={[styles.selectedBankName, { color: colors.text }]}>
                          {getSelectedAgency()?.name}
                        </Text>
                        <Text style={[styles.selectedBankCode, { color: colors.textSecondary }]}>
                          Code: {formData.selectedAgencyCode}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Sélectionnez une agence</Text>
                    )}
                  </View>
                  <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {errors.selectedAgencyCode && <Text style={styles.errorText}>{errors.selectedAgencyCode}</Text>}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Numéro de compte <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.accountNumber ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Entrez le numéro de compte"
                placeholderTextColor={colors.textSecondary}
                value={formData.accountNumber}
                onChangeText={(text) => updateFormData("accountNumber", text.replace(/\D/g, ""))}
                keyboardType="numeric"
                maxLength={20}
                editable={!isLoading}
              />
              {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
            </View>
          </>
        )

      case "International":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                IBAN <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.iban ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Ex: FR1420041010050500013M02606"
                placeholderTextColor={colors.textSecondary}
                value={formData.iban}
                onChangeText={(text) => updateFormData("iban", text.toUpperCase())}
                autoCapitalize="characters"
                editable={!isLoading}
              />
              {errors.iban && <Text style={styles.errorText}>{errors.iban}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Code SWIFT <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.swiftCode ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Ex: BNPAFRPP"
                placeholderTextColor={colors.textSecondary}
                value={formData.swiftCode}
                onChangeText={(text) => updateFormData("swiftCode", text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={11}
                editable={!isLoading}
              />
              {errors.swiftCode && <Text style={styles.errorText}>{errors.swiftCode}</Text>}
            </View>
          </>
        )

      default:
        return null
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Modifier le bénéficiaire</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Mettre à jour les informations</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations personnelles</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Nom et Prénoms <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.fullName ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Entrez le nom et prénoms"
                placeholderTextColor={colors.textSecondary}
                value={formData.fullName}
                onChangeText={(text) => updateFormData("fullName", text)}
                autoCapitalize="words"
                editable={!isLoading}
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de bénéficiaire</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Type de bénéficiaire <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectInput,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.beneficiaryType ? "#ef4444" : colors.border,
                  },
                ]}
                onPress={() => !isLoading && setShowBeneficiaryTypeModal(true)}
                disabled={isLoading}
              >
                <View style={styles.selectContent}>
                  {formData.beneficiaryType ? (
                    <Text style={[styles.selectedBankName, { color: colors.text }]}>
                      {getBeneficiaryTypeLabel(formData.beneficiaryType)}
                    </Text>
                  ) : (
                    <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
                      Sélectionnez le type de bénéficiaire
                    </Text>
                  )}
                </View>
                <IconSymbol name="chevron.down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {errors.beneficiaryType && <Text style={styles.errorText}>{errors.beneficiaryType}</Text>}
            </View>
          </View>

          {formData.beneficiaryType && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations du compte</Text>
              {renderAccountFields()}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations de contact</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Numéro de téléphone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.phoneNumber ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="+224 123 456 789"
                placeholderTextColor={colors.textSecondary}
                value={formData.phoneNumber}
                onChangeText={(text) => updateFormData("phoneNumber", text)}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email (optionnel)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.email ? "#ef4444" : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="exemple@email.com"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(text) => updateFormData("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: isLoading ? colors.textSecondary : colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.submitButtonText}>Modification en cours...</Text>
          ) : (
            <>
              <IconSymbol name="checkmark" size={16} color="white" />
              <Text style={styles.submitButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showBeneficiaryTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBeneficiaryTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Type de bénéficiaire</Text>
              <TouchableOpacity onPress={() => setShowBeneficiaryTypeModal(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {beneficiaryTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bankOption,
                    {
                      backgroundColor: formData.beneficiaryType === type.value ? colors.primary + "20" : "transparent",
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleBeneficiaryTypeSelect(type.value)}
                >
                  <View style={styles.bankOptionContent}>
                    <Text
                      style={[
                        styles.bankName,
                        { color: formData.beneficiaryType === type.value ? colors.primary : colors.text },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </View>
                  {formData.beneficiaryType === type.value && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBNGAgencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBNGAgencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner une agence BNG</Text>
              <TouchableOpacity onPress={() => setShowBNGAgencyModal(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {bngAgencies.map((agency, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bankOption,
                    {
                      backgroundColor: formData.agencyCode === agency.code ? colors.primary + "20" : "transparent",
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleBNGAgencySelect(agency.code)}
                >
                  <View style={styles.bankOptionContent}>
                    <Text
                      style={[
                        styles.bankName,
                        { color: formData.agencyCode === agency.code ? colors.primary : colors.text },
                      ]}
                    >
                      {agency.name}
                    </Text>
                    <Text
                      style={[
                        styles.bankFullName,
                        { color: formData.agencyCode === agency.code ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      Code: {agency.code}
                    </Text>
                  </View>
                  {formData.agencyCode === agency.code && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBankModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner une banque</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {banks.map((bank, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bankOption,
                    {
                      backgroundColor: formData.bank === bank.name ? colors.primary + "20" : "transparent",
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleBankSelect(bank)}
                >
                  <View style={styles.bankOptionContent}>
                    <Text
                      style={[styles.bankName, { color: formData.bank === bank.name ? colors.primary : colors.text }]}
                    >
                      {bank.name}
                    </Text>
                    <Text
                      style={[
                        styles.bankFullName,
                        { color: formData.bank === bank.name ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      Code: {bank.code}
                    </Text>
                  </View>
                  {formData.bank === bank.name && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAgencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAgencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner une agence</Text>
              <TouchableOpacity onPress={() => setShowAgencyModal(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {getSelectedBank()?.agencies.map((agency, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bankOption,
                    {
                      backgroundColor:
                        formData.selectedAgencyCode === agency.code ? colors.primary + "20" : "transparent",
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleAgencySelect(agency.code)}
                >
                  <View style={styles.bankOptionContent}>
                    <Text
                      style={[
                        styles.bankName,
                        { color: formData.selectedAgencyCode === agency.code ? colors.primary : colors.text },
                      ]}
                    >
                      {agency.name}
                    </Text>
                    <Text
                      style={[
                        styles.bankFullName,
                        { color: formData.selectedAgencyCode === agency.code ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      Code: {agency.code}
                    </Text>
                  </View>
                  {formData.selectedAgencyCode === agency.code && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  selectInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  selectContent: {
    flex: 1,
  },
  selectedBankName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedBankCode: {
    fontSize: 14,
  },
  placeholder: {
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  bankOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  bankOptionContent: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  bankFullName: {
    fontSize: 14,
  },
})
