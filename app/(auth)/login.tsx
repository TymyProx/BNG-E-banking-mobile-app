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
  ImageBackground,
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
import { useAuth } from "@/contexts/AuthContext"
import React from "react"

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
    <ImageBackground source={require("../../assets/images/welcom.png")} style={styles.container} resizeMode="cover">
      <View style={styles.overlay} />

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
            {/* <Image source={require("../../assets/images/logo-bng.png")} style={styles.logo} resizeMode="contain" /> */}
            <Text style={styles.welcomeTitle}>Bienvenue sur</Text>
            <Text style={styles.bankName}>BNG E-Banking</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.modernForm,
              {
                opacity: fadeAnim,
                transform: [{ translateY: cardSlideAnim }, { translateX: shakeAnim }],
              },
            ]}
          >
            <View style={styles.modernInputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.modernInputContainer,
                  {
                    borderColor: errors.email ? "#EF4444" : email ? "#2D7A4F" : "#2D7A4F",
                    borderWidth: email ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={22} color="#2D7A4F" />
                </View>
                <TextInput
                  ref={emailRef}
                  style={styles.modernInput}
                  placeholder="Saisissez votre email"
                  placeholderTextColor="#fff"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {email && !errors.email && <Ionicons name="checkmark-circle" size={22} color="#2D7A4F" />}
              </View>
              {errors.email && <Animated.Text style={styles.modernErrorText}>{errors.email}</Animated.Text>}
            </View>

            <View style={styles.modernInputGroup}>
              <Text style={styles.inputLabel}>Mot de Passe</Text>
              <View
                style={[
                  styles.modernInputContainer,
                  {
                    borderColor: errors.password ? "#EF4444" : password ? "#2D7A4F" : "#2D7A4F",
                    borderWidth: password ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2D7A4F" />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={styles.modernInput}
                  placeholder="Saisissez votre mot de passe"
                  placeholderTextColor="#fff"
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
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#2D7A4F" />
                </TouchableOpacity>
              </View>
              {errors.password && <Animated.Text style={styles.modernErrorText}>{errors.password}</Animated.Text>}
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.modernButton,
                  {
                    backgroundColor: isFormValid ? "#2D7A4F" : "rgba(255, 255, 255, 0.2)",
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
                    <Text style={styles.modernButtonText}>Se Connecter</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.modernLinks}>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                activeOpacity={0.7}
                style={styles.linkButton}
              >
                <Text style={styles.modernLinkText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                activeOpacity={0.7}
                style={styles.linkButton}
              >
                <Text style={styles.modernLinkText}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  flex: {
    flex: 1,
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
  logo: {
    width: 120,
    height: 120,
    marginTop: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "400",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bankName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modernForm: {
    borderRadius: 24,
    padding: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "#2D7A4F",
    marginBottom: 24,
  },
  modernInputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modernInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  modernEyeIcon: {
    padding: 8,
  },
  modernErrorText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 8,
    fontWeight: "600",
    color: "#FEE2E2",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modernButton: {
    borderRadius: 16,
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modernButtonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  modernLinks: {
    marginTop: 24,
    gap: 12,
    alignItems: "center",
  },
  linkButton: {
    padding: 8,
  },
  modernLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
