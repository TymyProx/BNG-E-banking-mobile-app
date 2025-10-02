"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import React from "react"

interface Request {
  id: string
  type: string
  title: string
  status: "pending" | "approved" | "rejected"
  date: string
  description: string
}

export default function EServicesScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const [requests] = useState<Request[]>([
    {
      id: "1",
      type: "checkbook",
      title: "Demande de chéquier",
      status: "approved",
      date: "2024-01-15",
      description: "Chéquier standard - Compte 123456789",
    },
    {
      id: "2",
      type: "attestation",
      title: "E-attestation de solde",
      status: "pending",
      date: "2024-01-20",
      description: "Attestation pour visa - Compte 123456789",
    },
    {
      id: "3",
      type: "credit",
      title: "Demande de crédit",
      status: "rejected",
      date: "2024-01-10",
      description: "Crédit automobile - 15,000,000 GNF",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.success
      case "rejected":
        return colors.error
      case "pending":
      default:
        return colors.warning
    }
  }

  const getStatusBackground = (status: string) => {
    switch (status) {
      case "approved":
        return colors.successBackground
      case "rejected":
        return colors.errorBackground
      case "pending":
      default:
        return colors.warningBackground
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvée"
      case "rejected":
        return "Rejetée"
      case "pending":
      default:
        return "En attente"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "checkmark-circle"
      case "rejected":
        return "close-circle"
      case "pending":
      default:
        return "time"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>E-Services</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérez vos demandes en ligne</Text>
        </View>

        {/* New Request Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.newRequestButton, { backgroundColor: colors.primary, shadowColor: colors.cardShadow }]}
            onPress={() => router.push("/new-request")}
          >
            <View style={styles.newRequestIcon}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.newRequestContent}>
              <Text style={styles.newRequestTitle}>Nouvelle demande</Text>
              <Text style={styles.newRequestSubtitle}>Chéquier, attestation, crédit...</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Requests History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique des demandes</Text>
          {requests.length > 0 ? (
            requests.map((request) => (
              <View
                key={request.id}
                style={[styles.requestCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}
              >
                <View style={styles.requestHeader}>
                  <Text style={[styles.requestTitle, { color: colors.text }]}>{request.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(request.status) }]}>
                    <Ionicons
                      name={getStatusIcon(request.status) as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={getStatusColor(request.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.requestDescription, { color: colors.textSecondary }]}>{request.description}</Text>
                <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
                  Demandé le {formatDate(request.date)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={56} color={colors.iconSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Aucune demande</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Vous n'avez encore fait aucune demande
              </Text>
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Besoin d'aide ?</Text>
          <View style={[styles.helpCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
            <View style={[styles.helpItem, { borderBottomColor: colors.borderLight }]}>
              <Ionicons name="call" size={22} color={colors.primary} />
              <View style={styles.helpContent}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>Service client</Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>+224 123 456 789</Text>
              </View>
            </View>
            <View style={[styles.helpItem, { borderBottomColor: colors.borderLight }]}>
              <Ionicons name="mail" size={22} color={colors.primary} />
              <View style={styles.helpContent}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>Email</Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>support@bng.gn</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.helpItem} onPress={() => router.push("/support")}>
              <Ionicons name="chatbubbles" size={22} color={colors.primary} />
              <View style={styles.helpContent}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>Chat en ligne</Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>Discuter avec un conseiller</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.iconSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  section: {
    padding: 24,
  },
  newRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  newRequestIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  newRequestContent: {
    flex: 1,
  },
  newRequestTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  newRequestSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  requestCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  requestDescription: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "500",
  },
  requestDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },
  helpCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  helpContent: {
    flex: 1,
    marginLeft: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  helpText: {
    fontSize: 14,
    fontWeight: "500",
  },
})
