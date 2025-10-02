"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React from "react"

interface RequestType {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
}

export default function NewRequestScreen() {
  const [selectedRequestType, setSelectedRequestType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestTypes: RequestType[] = [
    {
      id: "checkbook",
      title: "Demande de chéquier",
      description: "Commander un nouveau chéquier pour votre compte",
      icon: "book-outline",
    },
    {
      id: "attestation",
      title: "E-attestation",
      description: "Demander une attestation bancaire",
      icon: "document-text-outline",
    },
    {
      id: "credit",
      title: "Demande de crédit",
      description: "Faire une demande de prêt ou crédit",
      icon: "cash-outline",
    },
    {
      id: "card",
      title: "Demande de carte",
      description: "Commander une nouvelle carte bancaire",
      icon: "card-outline",
    },
    {
      id: "other",
      title: "Autre demande",
      description: "Faire une autre demande spécifique",
      icon: "ellipsis-horizontal-circle-outline",
    },
  ]

  const handleSelectRequestType = (id: string) => {
    setSelectedRequestType(id)
    router.push(`/request-form?type=${id}`)
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
            <Ionicons name="arrow-back" size={24} color="#4a5d4a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle demande</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.instructionTitle}>Choisissez le type de demande</Text>
          <Text style={styles.instructionText}>
            Sélectionnez le service que vous souhaitez demander. Vous pourrez ensuite compléter les informations
            nécessaires.
          </Text>
        </View>

        {/* Request Types */}
        <View style={styles.section}>
          {requestTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.requestTypeCard}
              onPress={() => handleSelectRequestType(type.id)}
            >
              <View
                style={[
                  styles.requestTypeIcon,
                  {
                    backgroundColor: type.id === "credit" ? "#efe44415" : "#4a5d4a15",
                  },
                ]}
              >
                <Ionicons name={type.icon} size={24} color={type.id === "credit" ? "#efe444" : "#4a5d4a"} />
              </View>
              <View style={styles.requestTypeContent}>
                <Text style={styles.requestTypeTitle}>{type.title}</Text>
                <Text style={styles.requestTypeDescription}>{type.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={styles.section}>
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={20} color="#4a5d4a" />
            <Text style={styles.noteText}>
              Les demandes sont traitées dans un délai de 48 heures ouvrables. Vous recevrez une notification dès que
              votre demande sera traitée.
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
  requestTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  requestTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  requestTypeContent: {
    flex: 1,
  },
  requestTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  requestTypeDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  noteCard: {
    flexDirection: "row",
    backgroundColor: "#4a5d4a10",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: "#4a5d4a",
    marginLeft: 12,
    lineHeight: 20,
  },
})
