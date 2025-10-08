"use client"

import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native"

import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "@/contexts/AuthContext"

const { width, height } = Dimensions.get("window")

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const { login: authLogin, isLoading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current
  const cardSlideAnim = useRef(new Animated.Value(100)).current

  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("token")
        if (token) {
          router.replace("/(tabs)")
        }
      } catch (error) {
        console.log("Error checking token:", error)
      }
    }
    checkToken()
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 900,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    const newErrors: { [key: string]: string } = {}
    let valid = true

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email invalide"
      valid = false
    }

    setErrors(newErrors)
    setIsFormValid(email.trim() !== "" && password.trim() !== "" && valid)
  }, [email, password])

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

    if (!email.trim()) {
      newErrors.email = "Email requis"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email invalide"
    }

    if (!password.trim()) {
      newErrors.password = "Mot de passe requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) {
      shakeAnimation()
      return
    }

    buttonPressAnimation()
    setIsLoading(true)

    try {
      const success = await authLogin(email, password)

      if (success) {
        router.replace("/(tabs)")
      } else {
        shakeAnimation()
      }
    } catch (err: any) {
      shakeAnimation()
      Alert.alert("Erreur", err.message || "Une erreur s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary + "15", colors.background]} style={styles.gradientBackground} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.modernHeader,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: logoScaleAnim }],
              },
            ]}
          >
            <View style={[styles.logoContainer]}>
              <Image
                source={require("../../assets/images/logo-bng.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.modernForm,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
                opacity: fadeAnim,
                transform: [{ translateY: cardSlideAnim }, { translateX: shakeAnim }],
              },
            ]}
          >
            <View style={styles.modernInputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <View
                style={[
                  styles.modernInputContainer,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.email ? colors.error : email ? colors.success : colors.border,
                    borderWidth: email ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={errors.email ? colors.error : email ? colors.success : colors.primary}
                  />
                </View>
                <TextInput
                  ref={emailRef}
                  style={[styles.modernInput, { color: colors.text }]}
                  placeholder="Saisissez votre email"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {email && !errors.email && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
              </View>
              {errors.email && (
                <Animated.Text style={[styles.modernErrorText, { color: colors.error }]}>{errors.email}</Animated.Text>
              )}
            </View>

            <View style={styles.modernInputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mot de Passe</Text>
              <View
                style={[
                  styles.modernInputContainer,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: errors.password ? colors.error : password ? colors.success : colors.border,
                    borderWidth: password ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={errors.password ? colors.error : password ? colors.success : colors.primary}
                  />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={[styles.modernInput, { color: colors.text }]}
                  placeholder="Saisissez votre mot de passe"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.modernEyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color={colors.icon} />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Animated.Text style={[styles.modernErrorText, { color: colors.error }]}>
                  {errors.password}
                </Animated.Text>
              )}
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.modernButton,
                  {
                    backgroundColor: isFormValid ? colors.primary : colors.border,
                    shadowColor: colors.shadow,
                  },
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || !isFormValid}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={isFormValid ? "#FFFFFF" : colors.icon} />
                    <Text style={[styles.modernButtonText, { color: isFormValid ? "#FFFFFF" : colors.icon }]}>
                      Se Connecter
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.modernLinks}>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                activeOpacity={0.7}
                style={[styles.linkButton, { backgroundColor: colors.primary + "08" }]}
              >
                <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.modernLinkText, { color: colors.primary }]}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                activeOpacity={0.7}
                style={[styles.linkButton, { backgroundColor: colors.primary + "08" }]}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                <Text style={[styles.modernLinkText, { color: colors.primary }]}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[styles.securityNotice, { opacity: fadeAnim }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.securityText, { color: colors.textSecondary }]}>
              Vos données sont protégées par un chiffrement de niveau bancaire
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },
  modernHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 160,
    height: 120,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: 10,
  },
  logoImage: {
    width: 160,
    height: 120,
  },
  modernWelcome: {
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  modernForm: {
    borderRadius: 24,
    padding: 32,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
    marginBottom: 24,
  },
  modernInputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  modernInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  modernLinkText: {
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  modernEyeIcon: {
    padding: 8,
  },
  modernErrorText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 8,
    fontWeight: "500",
  },
  modernButton: {
    borderRadius: 16,
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modernLinks: {
    marginTop: 20,
    gap: 10,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  securityText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
})
