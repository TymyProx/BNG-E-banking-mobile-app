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
  Dimensions,
  Vibration,
} from "react-native"
import { router } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuth } from "@/contexts/AuthContext"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"

const { width } = Dimensions.get("window")

interface AccountType {
  id: string
  name: string
  description: string
  icon: string
  features: string[]
  color: string
}

interface FormData {
  accountType: string
  currency: string
  purpose: string
  agreeToTerms: boolean
}

export default function NewAccountScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { user, tenantId, isLoading: authLoading } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    accountType: "",
    currency: "GNF",
    purpose: "",
    agreeToTerms: false,
  })

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  const accountTypes: AccountType[] = [
    {
      id: "savings",
      name: "Compte Épargne",
      description: "Idéal pour économiser avec des intérêts attractifs",
      icon: "banknote",
      features: ["Taux d'intérêt: 3.5%", "Pas de frais de tenue", "Retraits illimités"],
      color: colors.success,
    },
    {
      id: "checking",
      name: "Compte Courant",
      description: "Pour vos transactions quotidiennes",
      icon: "creditcard",
      features: ["Carte bancaire gratuite", "Virements illimités", "Découvert autorisé"],
      color: colors.primary,
    },
    {
      id: "business",
      name: "Compte Professionnel",
      description: "Conçu pour les entreprises et professionnels",
      icon: "briefcase",
      features: ["Gestion multi-utilisateurs", "Outils comptables", "Support dédié"],
      color: colors.accent,
    },
    {
      id: "youth",
      name: "Compte Jeune",
      description: "Pour les moins de 25 ans",
      icon: "graduationcap",
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

  const currencies = [
    { code: "GNF", name: "Franc Guinéen", symbol: "GNF" },
    { code: "USD", name: "Dollar Américain", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
  ]

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

    Animated.timing(progressAnim, {
      toValue: currentStep / 3,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [currentStep, user, tenantId, authLoading])

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

  const handleAccountTypeSelect = (typeId: string) => {
    setFormData({ ...formData, accountType: typeId })
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.accountType) {
      shakeAnimation()
      Alert.alert("Erreur", "Veuillez sélectionner un type de compte")
      return
    }
    if (currentStep === 2 && !formData.purpose) {
      shakeAnimation()
      Alert.alert("Erreur", "Veuillez sélectionner l'objectif du compte")
      return
    }
    if (currentStep === 3 && !formData.agreeToTerms) {
      shakeAnimation()
      Alert.alert("Erreur", "Veuillez accepter les conditions générales")
      return
    }

    buttonPressAnimation()

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.back() // Use router.back() instead of router.push("/accounts")
    }
  }

  const handleSubmit = async () => {
    if (authLoading) {
      Alert.alert("Chargement", "Veuillez patienter pendant le chargement de vos informations...")
      return
    }

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
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.")
        router.replace("/(auth)/login")
        return
      }

      const selectedType = accountTypes.find((type) => type.id === formData.accountType)
      const accountId = `ACC${Date.now()}`

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
          accountName: selectedType?.name || "",
          currency: formData.currency,
          status: "EN ATTENTE",
          type: typeMapping[formData.accountType] || formData.accountType,
          agency: "Agence Principale",
        },
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.CREATE(tenantId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Erreur lors de la création du compte")
      }

      const result = await response.json()

      Alert.alert(
        "Demande envoyée avec succès !",
        `Votre demande d'ouverture de ${selectedType?.name} a été soumise.\n\nVotre demande est en attente d'approbation par le back-office. Vous recevrez une notification une fois le compte validé et le numéro de compte attribué.`,
        [
          {
            text: "Continuer",
            onPress: () => {
              router.back() // Use router.back() instead of router.replace("/(tabs)/accounts")
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

    return (
      <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>Devise et objectif</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Choisissez la devise et précisez l'usage du compte
        </Text>

        <View style={[styles.selectedTypeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={[styles.selectedTypeIcon, { backgroundColor: `${selectedType?.color}20` }]}>
            <IconSymbol name={selectedType?.icon as any} size={24} color={selectedType?.color ?? "#000"} />
          </View>
          <Text style={[styles.selectedTypeName, { color: colors.text }]}>{selectedType?.name}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Devise *</Text>
          <View style={styles.currencyGrid}>
            {currencies.map((curr) => (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.currencyButton,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: formData.currency === curr.code ? colors.primary : colors.border,
                    borderWidth: formData.currency === curr.code ? 2 : 1,
                  },
                ]}
                onPress={() => setFormData({ ...formData, currency: curr.code })}
                activeOpacity={0.8}
              >
                <Text style={[styles.currencySymbol, { color: colors.text }]}>{curr.symbol}</Text>
                <Text style={[styles.currencyCode, { color: colors.text }]}>{curr.code}</Text>
                {formData.currency === curr.code && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 32 }]}>Objectif du compte *</Text>
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
        </View>
      </Animated.View>
    )
  }

  const renderStep3 = () => {
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
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Devise</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formData.currency}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Objectif</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formData.purpose}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Statut</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>En attente d'approbation</Text>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
          <IconSymbol name="info.circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Le numéro de compte et les soldes seront attribués par le back-office lors de la validation de votre
            demande.
          </Text>
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

  if (authLoading) {
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
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={24} color="#FBBF24" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Nouveau compte</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </Animated.View>

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
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>Étape {currentStep} sur 3</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

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
                <Text style={styles.nextButtonText}>{currentStep === 3 ? "Soumettre la demande" : "Continuer"}</Text>
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
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
  formSection: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  purposesList: {
    gap: 12,
    marginTop: 12,
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
    marginBottom: 24,
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
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
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
  currencyGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  currencyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: "600",
  },
})
