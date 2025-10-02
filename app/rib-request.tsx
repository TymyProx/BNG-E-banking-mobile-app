"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import React from "react"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface DeliveryOption {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  estimatedTime: string
}

export default function RIBRequestScreen() {
  const params = useLocalSearchParams()
  const [selectedDelivery, setSelectedDelivery] = useState<string>("email")
  const [isSubmitting, setIsSubmitting] = useState(false)
   const colorScheme = useColorScheme() ?? "light"
   const colors = Colors[colorScheme]

  const deliveryOptions: DeliveryOption[] = [
    {
      id: "email",
      title: "Par email",
      description: "Recevoir le RIB par email instantanément",
      icon: "mail-outline",
      estimatedTime: "Immédiat",
    },
    {
      id: "sms",
      title: "Par SMS",
      description: "Recevoir un lien de téléchargement par SMS",
      icon: "chatbubble-outline",
      estimatedTime: "Immédiat",
    },
    {
      id: "app",
      title: "Dans l'application",
      description: "Télécharger directement depuis l'app",
      icon: "download-outline",
      estimatedTime: "Immédiat",
    },
    {
      id: "branch",
      title: "En agence",
      description: "Retirer le RIB dans une agence BNG",
      icon: "business-outline",
      estimatedTime: "24h ouvrables",
    },
  ]

  const handleSubmitRequest = async () => {
    if (!selectedDelivery) {
      Alert.alert("Erreur", "Veuillez sélectionner un mode de livraison")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const selectedOption = deliveryOptions.find((option) => option.id === selectedDelivery)

      Alert.alert(
        "Demande envoyée",
        `Votre demande de RIB a été envoyée avec succès. Vous recevrez votre RIB ${selectedOption?.title.toLowerCase()} dans ${selectedOption?.estimatedTime.toLowerCase()}.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      )
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de votre demande")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demander un RIB</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <View style={styles.accountInfoCard}>
            <Ionicons name="card-outline" size={24} color="#1f2937" />
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>{params.accountName}</Text>
              <Text style={styles.accountNumber}>
                Compte:{" "}
                {(params.accountNumber as string)
                  ?.slice(-4)
                  .padStart((params.accountNumber as string)?.length || 0, "•")}
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.instructionTitle}>Choisissez le mode de livraison</Text>
          <Text style={styles.instructionText}>
            Sélectionnez comment vous souhaitez recevoir votre Relevé d'Identité Bancaire (RIB).
          </Text>
        </View>

        {/* Delivery Options */}
        <View style={styles.section}>
          {deliveryOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.deliveryCard, selectedDelivery === option.id && styles.selectedCard]}
              onPress={() => setSelectedDelivery(option.id)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.deliveryIcon,
                      {
                        backgroundColor: selectedDelivery === option.id ? "#1f293715" : "#F3F4F6",
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={selectedDelivery === option.id ? "#1f2937" : "#6B7280"}
                    />
                  </View>
                  <View style={styles.deliveryContent}>
                    <Text style={[styles.deliveryTitle, selectedDelivery === option.id && styles.selectedText]}>
                      {option.title}
                    </Text>
                    <Text style={styles.deliveryDescription}>{option.description}</Text>
                    <Text style={styles.estimatedTime}>Délai: {option.estimatedTime}</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, selectedDelivery === option.id && styles.radioButtonSelected]}>
                  {selectedDelivery === option.id && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.submitButton, (!selectedDelivery || isSubmitting) && styles.submitButtonDisabled,{ backgroundColor: colors.primary },]}
            onPress={handleSubmitRequest}
            disabled={!selectedDelivery || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Envoi en cours...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Envoyer la demande</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.section}>
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={20} color="#1f2937" />
            <Text style={styles.noteText}>
              Le RIB contient toutes les informations nécessaires pour recevoir des virements : IBAN, BIC, nom du
              titulaire et adresse de la banque.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  section: {
    padding: 20,
  },
  accountInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f293710",
    borderRadius: 12,
    padding: 16,
  },
  accountDetails: {
    marginLeft: 12,
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: "#6B7280",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: "#dfdfdfff",
    backgroundColor: "#22e68a05",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deliveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  deliveryContent: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  selectedText: {
    color: "#1f2937",
  },
  deliveryDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "500",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#1f2937",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1f2937",
  },
  submitButton: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteCard: {
    flexDirection: "row",
    backgroundColor: "#1f293710",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
    marginLeft: 12,
    lineHeight: 20,
  },
})
