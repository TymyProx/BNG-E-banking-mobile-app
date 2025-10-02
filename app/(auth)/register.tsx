"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Vibration,
} from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/contexts/AuthContext"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import React from "react"

const { width } = Dimensions.get("window")

export default function RegisterScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    accountNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [fieldValidation, setFieldValidation] = useState<{ [key: string]: boolean }>({})
  const [currentStep, setCurrentStep] = useState(1)
  const [isFormValid, setIsFormValid] = useState(false)

  const { register, isLoading, pendingOTPVerification, isAuthenticated } = useAuth()

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const progressAnim = useRef(new Animated.Value(0)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  // Input refs
  const inputRefs = {
    name: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    phone: useRef<TextInput>(null),
    accountNumber: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
    confirmPassword: useRef<TextInput>(null),
  }

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)")
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    // Real-time validation
    const newErrors: { [key: string]: string } = {}
    const newValidation: { [key: string]: boolean } = {}
    const valid = true

    // Name validation
    if (formData.name) {
      if (formData.name.length < 2) {
        newErrors.name = "Nom trop court"
        newValidation.name = false
      } else {
        newValidation.name = true
      }
    }

    // Email validation
    if (formData.email) {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Format email invalide"
        newValidation.email = false
      } else {
        newValidation.email = true
      }
    }

    // Phone validation
    if (formData.phone) {
      if (!/^\+224\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/.test(formData.phone)) {
        newErrors.phone = "Format: +224 XX XXX XXX XXX"
        newValidation.phone = false
      } else {
        newValidation.phone = true
      }
    }

    // Account number validation
    if (formData.accountNumber) {
      if (!/^BNG\d{12}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = "Format: BNG + 12 chiffres"
        newValidation.accountNumber = false
      } else {
        newValidation.accountNumber = true
      }
    }

    // Password validation
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Minimum 8 caractères"
        newValidation.password = false
      } else {
        newValidation.password = true
      }
    }

    // Confirm password validation
    if (formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mots de passe différents"
        newValidation.confirmPassword = false
      } else {
        newValidation.confirmPassword = true
      }
    }

    setErrors(newErrors)
    setFieldValidation(newValidation)

    // Check if all required fields are filled and valid
    const requiredFields = ["name", "email", "phone", "accountNumber", "password", "confirmPassword"]
    const allFieldsFilled = requiredFields.every((field) => formData[field as keyof typeof formData].trim() !== "")
    const allFieldsValid = requiredFields.every((field) => newValidation[field] === true)

    setIsFormValid(allFieldsFilled && allFieldsValid)

    // Update progress
    const filledFields = requiredFields.filter((field) => formData[field as keyof typeof formData].trim() !== "").length
    const progress = filledFields / requiredFields.length

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [formData])

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nom complet requis"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Numéro de téléphone requis"
    } else if (!/^\+224\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/.test(formData.phone)) {
      newErrors.phone = "Format: +224 XX XXX XXX XXX"
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Numéro de compte requis"
    } else if (!/^BNG\d{12}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = "Format: BNG + 12 chiffres"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Mot de passe requis"
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mots de passe différents"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      shakeAnimation()
      return
    }

    buttonPressAnimation()
    const success = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      accountNumber: formData.accountNumber,
      password: formData.password,
    })

    if (success) {
      Alert.alert("Inscription réussie", "Votre compte a été créé. Veuillez vérifier votre téléphone pour le code OTP.")
    } else {
      shakeAnimation()
      Alert.alert("Erreur", "Inscription échouée. Vérifiez vos informations ou contactez l'agence.")
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const focusNextField = (currentField: string) => {
    const fieldOrder = ["name", "email", "phone", "accountNumber", "password", "confirmPassword"]
    const currentIndex = fieldOrder.indexOf(currentField)
    if (currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1]
      inputRefs[nextField as keyof typeof inputRefs].current?.focus()
    }
  }

  const getInputBorderColor = (field: string) => {
    if (errors[field]) return colors.error
    if (fieldValidation[field]) return colors.success
    if (formData[field as keyof typeof formData]) return colors.primary
    return colors.border
  }

  const getInputIcon = (field: string) => {
    if (errors[field]) return colors.error
    if (fieldValidation[field]) return colors.success
    if (formData[field as keyof typeof formData]) return colors.primary
    return colors.icon
  }

  if (pendingOTPVerification) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.successCard, { backgroundColor: colors.cardBackground, opacity: fadeAnim }]}>
          <View style={[styles.successIconContainer, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Inscription réussie !</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            Un code de vérification a été envoyé à votre téléphone. Vous allez être redirigé vers la page de connexion.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(auth)/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Rejoignez BNG eBanking</Text>
          </View>
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
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Progression de l'inscription</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.form,
            {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: getInputBorderColor("name"),
                  borderWidth: formData.name ? 2 : 1,
                },
              ]}
            >
              <Ionicons name="person-outline" size={20} color={getInputIcon("name")} style={styles.inputIcon} />
              <TextInput
                ref={inputRefs.name}
                style={[styles.input, { color: colors.text }]}
                placeholder="Nom complet"
                placeholderTextColor={colors.icon}
                value={formData.name}
                onChangeText={(value) => updateFormData("name", value)}
                returnKeyType="next"
                onSubmitEditing={() => focusNextField("name")}
                blurOnSubmit={false}
              />
              {fieldValidation.name && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
            </View>
            {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: getInputBorderColor("email"),
                  borderWidth: formData.email ? 2 : 1,
                },
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={getInputIcon("email")} style={styles.inputIcon} />
              <TextInput
                ref={inputRefs.email}
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.icon}
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => focusNextField("email")}
                blurOnSubmit={false}
              />
              {fieldValidation.email && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
            </View>
            {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>}
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: getInputBorderColor("phone"),
                  borderWidth: formData.phone ? 2 : 1,
                },
              ]}
            >
              <Ionicons name="call-outline" size={20} color={getInputIcon("phone")} style={styles.inputIcon} />
              <TextInput
                ref={inputRefs.phone}
                style={[styles.input, { color: colors.text }]}
                placeholder="+224 XX XXX XXX XXX"
                placeholderTextColor={colors.icon}
                value={formData.phone}
                onChangeText={(value) => updateFormData("phone", value)}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => focusNextField("phone")}
                blurOnSubmit={false}
              />
              {fieldValidation.phone && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
            </View>
            {errors.phone && <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>}
          </View>

          {/* Account Number Input */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: getInputBorderColor("accountNumber"),
                  borderWidth: formData.accountNumber ? 2 : 1,
                },
              ]}
            >
              <Ionicons name="card-outline" size={20} color={getInputIcon("accountNumber")} style={styles.inputIcon} />
              <TextInput
                ref={inputRefs.accountNumber}
                style={[styles.input, { color: colors.text }]}
                placeholder="Numéro de compte (BNG...)"
                placeholderTextColor={colors.icon}
                value={formData.accountNumber}
                onChangeText={(value) => updateFormData("accountNumber", value)}
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => focusNextField("accountNumber")}
                blurOnSubmit={false}
              />
              {fieldValidation.accountNumber && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
            </View>
            {errors.accountNumber && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.accountNumber}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: getInputBorderColor("password"),
                  borderWidth: formData.password ? 2 : 1,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={getInputIcon("password")}
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRefs.password}
                style={[styles.input, { color: colors.text }]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.icon}
                value={formData.password}
                onChangeText={(value) => updateFormData("password", value)}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => focusNextField("password")}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: getInputBorderColor("confirmPassword"),
                  borderWidth: formData.confirmPassword ? 2 : 1,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={getInputIcon("confirmPassword")}
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRefs.confirmPassword}
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={colors.icon}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData("confirmPassword", value)}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Register Button */}
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isFormValid ? colors.primary : colors.border,
                  shadowColor: colors.shadow,
                },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.buttonText, { color: isFormValid ? "#FFFFFF" : colors.icon }]}>
                  Créer mon compte
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  progressContainer: {
    marginBottom: 24,
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
  form: {
    borderRadius: 20,
    padding: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  button: {
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successCard: {
    width: width * 0.9,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
})
