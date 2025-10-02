"use client"

import { useState } from "react"
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
} from "react-native"
import { router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/contexts/AuthContext"
import React from "react"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { resetPassword, isLoading } = useAuth()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!email.trim()) {
      newErrors.email = "Email requis"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    if (!validateForm()) return

    const success = await resetPassword(email)
    if (success) {
      Alert.alert("Email envoyé", "Un lien de réinitialisation a été envoyé à votre adresse email.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])
    } else {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.")
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E53E3E" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={60} color="#E53E3E" />
          </View>

          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>Entrez votre adresse email pour recevoir un lien de réinitialisation</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Votre adresse email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Envoyer le lien</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLoginButton} onPress={() => router.back()}>
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#E53E3E",
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#E53E3E",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backToLoginButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLoginText: {
    color: "#E53E3E",
    fontSize: 14,
    textDecorationLine: "underline",
  },
})
