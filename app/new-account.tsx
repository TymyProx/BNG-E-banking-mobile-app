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
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  Vibration,
} from "react-native"
import { router } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuth } from "@/contexts/AuthContext"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

const { width } = Dimensions.get("window")

interface AccountType {
  id: string
  name: string
  description: string
  icon: string
  minDeposit: number
  features: string[]
  color: string
}

interface FormData {
  accountType: string
  initialDeposit: string
  purpose: string
  agreeToTerms: boolean
}

export default function NewAccountScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { user, tenantId } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    accountType: "",
    initialDeposit: "",
    purpose: "",
    agreeToTerms: false,
  })

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  // Input ref
  const depositRef = useRef<TextInput>(null)

  const accountTypes: AccountType[] = [
    {
      id: "savings",
      name: "Compte Épargne",
      description: "Idéal pour économiser avec des intérêts attractifs",
      icon: "banknote",
      minDeposit: 100000,
      features: ["Taux d'intérêt: 3.5%", "Pas de frais de tenue", "Retraits illimités"],
      color: colors.success,
    },
    {
      id: "checking",
      name: "Compte Courant",
      description: "Pour vos transactions quotidiennes",
      icon: "creditcard",
      minDeposit: 50000,
      features: ["Carte bancaire gratuite", "Virements illimités", "Découvert autorisé"],
      color: colors.primary,
    },
    {
      id: "business",
      name: "Compte Professionnel",
      description: "Conçu pour les entreprises et professionnels",
      icon: "briefcase",
      minDeposit: 500000,
      features: ["Gestion multi-utilisateurs", "Outils comptables", "Support dédié"],
      color: colors.accent,
    },
    {
      id: "youth",
      name: "Compte Jeune",
      description: "Pour les moins de 25 ans",
      icon: "graduationcap",
      minDeposit: 25000,
      features: ["Frais réduits", "Carte gratuite", "Application mobile"],
      color: colors.secondary,
    },
  ]

  const purposes = [
    "Épargne personnelle",
    "Gestion des revenus",
    "Projets futurs",
    "Activité professionnelle",
    "Investissements",
    "Autre",
  ]

  useEffect(() => {
    // Entrance animation
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

    // Update progress
    Animated.timing(progressAnim, {
      toValue: currentStep / 4,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [currentStep])

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

  const formatAmount = (amount: string) => {
    const num = Number.parseInt(amount.replace(/\D/g, ""))
    return isNaN(num) ? "" : new Intl.NumberFormat("fr-FR").format(num)
  }

  const handleAccountTypeSelect = (typeId: string) => {
    setFormData({ ...formData, accountType: typeId })
  }

  const handleDepositChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    setFormData({ ...formData, initialDeposit: numericValue })
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.accountType) {
      shakeAnimation()
      Alert.alert("Erreur", "Veuillez sélectionner un type de compte")
      return
    }
    if (currentStep === 2) {
      const selectedType = accountTypes.find((type) => type.id === formData.accountType)
      const deposit = Number.parseInt(formData.initialDeposit)
      if (!formData.initialDeposit || deposit < (selectedType?.minDeposit || 0)) {
        shakeAnimation()
        Alert.alert(
          "Erreur",
          `Le dépôt minimum pour ce type de compte est de ${new Intl.NumberFormat("fr-FR").format(
            selectedType?.minDeposit || 0,
          )} GNF`,
        )
        return
      }
    }
    if (currentStep === 3 && !formData.purpose) {
      shakeAnimation()
      Alert.alert("Erreur", "Veuillez sélectionner l'objectif du compte")
      return
    }
    if (currentStep === 4 && !formData.agreeToTerms) {
      shakeAnimation()
      Alert.alert("Erreur", "Veuillez accepter les conditions générales")
      return
    }

    buttonPressAnimation()

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      //router.back()
      router.push("/accounts")
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer un compte")
      return
    }

    if (!tenantId) {
      Alert.alert("Erreur", "Impossible de récupérer les informations du tenant. Veuillez vous reconnecter.")
      return
    }

    setIsLoading(true)
    try {
      const selectedType = accountTypes.find((type) => type.id === formData.accountType)
      const accountNumber = `BNG${Date.now().toString().slice(-10)}`
      const accountId = `ACC${Date.now()}`

      // Map account type to API type
      const typeMapping: { [key: string]: string } = {
        savings: "EPARGNE",
        checking: "COURANT",
        business: "PROFESSIONNEL",
        youth: "JEUNE",
      }

      const requestBody = {
        data: {
          accountId: accountId,
          customerId: user.id,
          accountNumber: accountNumber,
          accountName: selectedType?.name || "",
          currency: "GNF",
          bookBalance: formData.initialDeposit,
          availableBalance: formData.initialDeposit,
          status: "EN ATTENTE",
          type: typeMapping[formData.accountType] || formData.accountType,
          agency: "Agence Principale",
        },
      }

      console.log("[v0] Creating account with data:", requestBody)
      console.log("[v0] Using tenantId:", tenantId)

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] API Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.log("[v0] API Error:", errorData)
        throw new Error(errorData?.message || "Erreur lors de la création du compte")
      }

      const result = await response.json()
      console.log("[v0] Account created successfully:", result)

      Alert.alert(
        "Demande envoyée avec succès !",
        `Votre demande d'ouverture de ${selectedType?.name} a été soumise.\n\nNuméro de compte: ${accountNumber}\nDépôt initial: ${formatAmount(
          formData.initialDeposit,
        )} GNF\n\nVotre demande est en attente d'approbation. Vous recevrez une notification une fois le compte activé.`,
        [
          {
            text: "Continuer",
            onPress: () => {
              router.replace("/(tabs)/accounts")
            },
          },
        ],
      )
    } catch (error) {
      console.error("[v0] Error creating account:", error)
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Une erreur est survenue lors de la création du compte",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Choisissez votre type de compte</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Sélectionnez le compte qui correspond le mieux à vos besoins
      </Text>

      <View style={styles.accountTypesList}>
        {accountTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.accountTypeCard,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
                borderColor: formData.accountType === type.id ? type.color : colors.border,
                borderWidth: formData.accountType === type.id ? 2 : 1,
              },
            ]}
            onPress={() => handleAccountTypeSelect(type.id)}
            activeOpacity={0.8}
          >
            <View style={styles.accountTypeHeader}>
              <View style={[styles.accountTypeIcon, { backgroundColor: `${type.color}20` }]}>
                <IconSymbol name={type.icon as any} size={28} color={type.color} />
              </View>
              <View style={styles.accountTypeInfo}>
                <Text style={[styles.accountTypeName, { color: colors.text }]}>{type.name}</Text>
                <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>{type.description}</Text>
              </View>
              {formData.accountType === type.id && (
                <IconSymbol name="checkmark.circle.fill" size={28} color={type.color} />
              )}
            </View>
            <View style={styles.accountTypeFeatures}>
              <Text style={[styles.minDepositText, { color: colors.textSecondary }]}>
                Dépôt minimum: {new Intl.NumberFormat("fr-FR").format(type.minDeposit)} GNF
              </Text>
              {type.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <IconSymbol name="checkmark" size={14} color={type.color} />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  )

  const renderStep2 = () => {
    const selectedType = accountTypes.find((type) => type.id === formData.accountType)
    const isValidAmount =
      formData.initialDeposit && Number.parseInt(formData.initialDeposit) >= (selectedType?.minDeposit || 0)

    return (
      <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Dépôt initial</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Montant que vous souhaitez déposer à l'ouverture
        </Text>

        <View style={[styles.selectedTypeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={[styles.selectedTypeIcon, { backgroundColor: `${selectedType?.color}20` }]}>
            <IconSymbol
              name={selectedType?.icon as any}
              size={24}
              color={selectedType?.color ?? "#000"} // valeur par défaut
            />
          </View>
          <Text style={[styles.selectedTypeName, { color: colors.text }]}>{selectedType?.name}</Text>
        </View>

        <View style={styles.depositSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Montant du dépôt *</Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: isValidAmount ? colors.success : formData.initialDeposit ? colors.error : colors.border,
                borderWidth: formData.initialDeposit ? 2 : 1,
              },
            ]}
          >
            <TextInput
              ref={depositRef}
              style={[styles.amountInput, { color: colors.text }]}
              value={formatAmount(formData.initialDeposit)}
              onChangeText={handleDepositChange}
              placeholder="0"
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
              returnKeyType="done"
              selectTextOnFocus
            />
            <Text style={[styles.currencyText, { color: colors.textSecondary }]}>GNF</Text>
            {isValidAmount && <IconSymbol name="checkmark.circle" size={20} color={colors.success} />}
          </View>
          <Text style={[styles.minDepositInfo, { color: colors.textSecondary }]}>
            Minimum requis: {new Intl.NumberFormat("fr-FR").format(selectedType?.minDeposit || 0)} GNF
          </Text>

          {/* Suggested amounts */}
          <View style={styles.suggestedAmounts}>
            <Text style={[styles.suggestedLabel, { color: colors.textSecondary }]}>Montants suggérés</Text>
            <View style={styles.suggestedGrid}>
              {[
                selectedType?.minDeposit,
                selectedType?.minDeposit! * 2,
                selectedType?.minDeposit! * 5,
                selectedType?.minDeposit! * 10,
              ].map((amount, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestedButton,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  ]}
                  onPress={() => setFormData({ ...formData, initialDeposit: amount!.toString() })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.suggestedText, { color: colors.text }]}>
                    {new Intl.NumberFormat("fr-FR").format(amount!)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Objectif du compte</Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Aidez-nous à mieux vous servir en précisant l'usage principal
      </Text>

      <View style={styles.purposesList}>
        {purposes.map((purpose, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.purposeItem,
              {
                backgroundColor: colors.cardBackground,
                borderColor: formData.purpose === purpose ? colors.primary : colors.border,
                borderWidth: formData.purpose === purpose ? 2 : 1,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={() => setFormData({ ...formData, purpose })}
            activeOpacity={0.8}
          >
            <Text style={[styles.purposeText, { color: colors.text }]}>{purpose}</Text>
            {formData.purpose === purpose && (
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  )

  const renderStep4 = () => {
    const selectedType = accountTypes.find((type) => type.id === formData.accountType)
    return (
      <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Récapitulatif</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Vérifiez les informations avant de finaliser
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Type de compte</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedType?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Dépôt initial</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatAmount(formData.initialDeposit)} GNF
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Objectif</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formData.purpose}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              formData.agreeToTerms && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {formData.agreeToTerms && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text style={[styles.termsText, { color: colors.text }]}>
            J'accepte les{" "}
            <Text style={{ color: colors.primary, textDecorationLine: "underline" }}>conditions générales</Text> et la{" "}
            <Text style={{ color: colors.primary, textDecorationLine: "underline" }}>politique de confidentialité</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nouveau compte</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
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
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>Étape {currentStep} sur 4</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.shadow,
              },
              isLoading && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{currentStep === 4 ? "Créer le compte" : "Continuer"}</Text>
                <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
  },
  accountTypesList: {
    gap: 20,
  },
  accountTypeCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accountTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  accountTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  accountTypeInfo: {
    flex: 1,
  },
  accountTypeName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  accountTypeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  accountTypeFeatures: {
    gap: 8,
  },
  minDepositText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
  },
  selectedTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  selectedTypeName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  depositSection: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  minDepositInfo: {
    fontSize: 12,
    fontWeight: "500",
  },
  suggestedAmounts: {
    marginTop: 16,
  },
  suggestedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  suggestedGrid: {
    flexDirection: "row",
    gap: 12,
  },
  suggestedButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  suggestedText: {
    fontSize: 11,
    fontWeight: "600",
  },
  purposesList: {
    gap: 16,
  },
  purposeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  purposeText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    gap: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
})
