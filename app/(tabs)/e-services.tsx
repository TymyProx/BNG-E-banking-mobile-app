"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface Request {
  id: string
  type: string
  title: string
  status: "pending" | "approved" | "rejected"
  date: string
  description: string
}

interface ServiceCard {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  route: string
}

export default function EServicesScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const services: ServiceCard[] = [
    {
      id: "credit",
      title: "Demande de crédit",
      description: "Faites une demande de crédit en ligne",
      icon: "cash-outline",
      color: "#3B82F6",
      route: "/credit-request",
    },
    {
      id: "checkbook",
      title: "Demande de chéquier",
      description: "Commandez un nouveau chéquier",
      icon: "card-outline",
      color: "#10B981",
      route: "/checkbook-request",
    },
  ]

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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Services disponibles</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}
                onPress={() => router.push(service.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
                  <Ionicons name={service.icon} size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.serviceTitle, { color: colors.text }]}>{service.title}</Text>
                <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>{service.description}</Text>
                <View style={styles.serviceArrow}>
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  serviceCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 20,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceArrow: {
    position: "absolute",
    bottom: 20,
    right: 20,
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
