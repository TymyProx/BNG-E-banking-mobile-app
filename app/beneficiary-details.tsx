"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"

interface BeneficiaryDetails {
  id: string
  name: string
  accountNumber: string
  bankCode: string
  bankName: string
  status: number
  typeBeneficiary: string
  favoris: boolean
  customerId: string
  beneficiaryId: string
  createdAt: string
  updatedAt: string
}

export default function BeneficiaryDetails() {
  const [beneficiary, setBeneficiary] = useState<BeneficiaryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()
  const { beneficiaryId } = useLocalSearchParams()

  const fetchBeneficiaryDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        throw new Error("Token d'authentification non trouvé")
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.DETAILS(API_CONFIG.TENANT_ID, beneficiaryId as string)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails")
      }

      const data = await response.json()
      setBeneficiary(data)
    } catch (err) {
      console.error("Error fetching beneficiary details:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      Alert.alert("Erreur", "Impossible de charger les détails du bénéficiaire")
    } finally {
      setLoading(false)
    }
  }, [beneficiaryId])

  useFocusEffect(
    useCallback(() => {
      if (beneficiaryId) {
        fetchBeneficiaryDetails()
      }
    }, [beneficiaryId, fetchBeneficiaryDetails]),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Actif"
      case 1:
        return "Inactif"
      default:
        return "Inconnu"
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "#22c55e"
      case 1:
        return "#ef4444"
      default:
        return colors.textSecondary
    }
  }

  const handleDeactivate = async () => {
    if (!beneficiary) return

    Alert.alert("Désactiver le bénéficiaire", `Êtes-vous sûr de vouloir désactiver ${beneficiary.name} ?`, [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Désactiver",
        style: "destructive",
        onPress: async () => {
          try {
            setUpdating(true)

            const token = await SecureStore.getItemAsync("token")
            if (!token) {
              throw new Error("Token d'authentification non trouvé")
            }

            const response = await fetch(
              `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.UPDATE(API_CONFIG.TENANT_ID, beneficiary.id)}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  data: {
                    beneficiaryId: beneficiary.beneficiaryId,
                    customerId: beneficiary.customerId,
                    name: beneficiary.name,
                    accountNumber: beneficiary.accountNumber,
                    bankCode: beneficiary.bankCode,
                    bankName: beneficiary.bankName,
                    status: 1, // Set status to 1 for inactive
                    typeBeneficiary: beneficiary.typeBeneficiary,
                    favoris: beneficiary.favoris,
                  },
                }),
              },
            )

            if (!response.ok) {
              throw new Error("Erreur lors de la désactivation")
            }

            Alert.alert("Succès", "Le bénéficiaire a été désactivé avec succès", [
              {
                text: "OK",
                onPress: () => {
                  // Refresh the beneficiary details
                  fetchBeneficiaryDetails()
                },
              },
            ])
          } catch (err) {
            console.error("Error deactivating beneficiary:", err)
            Alert.alert("Erreur", "Impossible de désactiver le bénéficiaire")
          } finally {
            setUpdating(false)
          }
        },
      },
    ])
  }

  const handleReactivate = async () => {
    if (!beneficiary) return

    Alert.alert("Réactiver le bénéficiaire", `Êtes-vous sûr de vouloir réactiver ${beneficiary.name} ?`, [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Réactiver",
        onPress: async () => {
          try {
            setUpdating(true)

            const token = await SecureStore.getItemAsync("token")
            if (!token) {
              throw new Error("Token d'authentification non trouvé")
            }

            const response = await fetch(
              `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.UPDATE(API_CONFIG.TENANT_ID, beneficiary.id)}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  data: {
                    beneficiaryId: beneficiary.beneficiaryId,
                    customerId: beneficiary.customerId,
                    name: beneficiary.name,
                    accountNumber: beneficiary.accountNumber,
                    bankCode: beneficiary.bankCode,
                    bankName: beneficiary.bankName,
                    status: 0, // Set status to 0 for active
                    typeBeneficiary: beneficiary.typeBeneficiary,
                    favoris: beneficiary.favoris,
                  },
                }),
              },
            )

            if (!response.ok) {
              throw new Error("Erreur lors de la réactivation")
            }

            Alert.alert("Succès", "Le bénéficiaire a été réactivé avec succès", [
              {
                text: "OK",
                onPress: () => {
                  // Refresh the beneficiary details
                  fetchBeneficiaryDetails()
                },
              },
            ])
          } catch (err) {
            console.error("Error reactivating beneficiary:", err)
            Alert.alert("Erreur", "Impossible de réactiver le bénéficiaire")
          } finally {
            setUpdating(false)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !beneficiary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#ef4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>Erreur de chargement</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchBeneficiaryDetails}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Détails du bénéficiaire</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.avatarLargeText, { color: colors.primary }]}>
              {beneficiary.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.beneficiaryName, { color: colors.text }]}>{beneficiary.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(beneficiary.status) + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(beneficiary.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(beneficiary.status) }]}>
              {getStatusText(beneficiary.status)}
            </Text>
          </View>
          {beneficiary.favoris && (
            <View style={[styles.favorisBadge, { backgroundColor: "#fbbf24" + "20" }]}>
              <IconSymbol name="star.fill" size={14} color="#fbbf24" />
              <Text style={[styles.favorisText, { color: "#fbbf24" }]}>Favori</Text>
            </View>
          )}
        </View>

        {/* Information Cards */}
        <View style={styles.cardsContainer}>
          {/* Bank Information */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="building.columns" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Informations bancaires</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Banque</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{beneficiary.bankName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Code banque</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{beneficiary.bankCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{beneficiary.accountNumber}</Text>
              </View>
            </View>
          </View>

          {/* Beneficiary Information */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="person.circle" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Informations du bénéficiaire</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ID Bénéficiaire</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {beneficiary.beneficiaryId}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ID Client</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {beneficiary.customerId}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{beneficiary.typeBeneficiary}</Text>
              </View>
            </View>
          </View>

          {/* Dates Information */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Dates</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Créé le</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(beneficiary.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Modifié le</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(beneficiary.updatedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/transfer",
                params: { beneficiaryId: beneficiary.id },
              })
            }}
          >
            <IconSymbol name="arrow.right.circle.fill" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Effectuer un virement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => {
              router.push({
                pathname: "/edit-beneficiary",
                params: { beneficiaryId: beneficiary.id },
              })
            }}
          >
            <IconSymbol name="pencil" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Modifier</Text>
          </TouchableOpacity>

          {beneficiary.status === 0 ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.dangerButton,
                { borderColor: "#ef4444" },
                updating && styles.disabledButton,
              ]}
              onPress={handleDeactivate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <IconSymbol name="xmark.circle" size={20} color="#ef4444" />
                  <Text style={[styles.dangerButtonText, { color: "#ef4444" }]}>Désactiver</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.successButton,
                { borderColor: "#22c55e" },
                updating && styles.disabledButton,
              ]}
              onPress={handleReactivate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : (
                <>
                  <IconSymbol name="checkmark.circle" size={20} color="#22c55e" />
                  <Text style={[styles.successButtonText, { color: "#22c55e" }]}>Réactiver</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: "600",
  },
  beneficiaryName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  favorisBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  favorisText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    borderWidth: 2,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  successButton: {
    borderWidth: 2,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
})
