"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import SelectField from "../../components/ui/select-field"
import React from "react"

interface Account {
  id: string
  name: string
  number: string
  type: string
  balance: number
  currency?: string
}

interface StatementRequest {
  id: string
  accountId: string
  accountName: string
  period: string
  format: string
  status: "pending" | "processing" | "completed" | "failed"
  requestDate: string
  completionDate?: string
}

export default function StatementsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const params = useLocalSearchParams()

  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requests, setRequests] = useState<StatementRequest[]>([])
  const [isAccountLocked, setIsAccountLocked] = useState(false)
  const [fromAccountDetails, setFromAccountDetails] = useState(false)

  // Comptes disponibles
  const accounts: Account[] = [
    {
      id: "1",
      name: "Compte Courant Principal",
      number: "123456789",
      type: "Courant",
      balance: 2400000,
      currency: "GNF",
    },
    {
      id: "2",
      name: "Compte Épargne",
      number: "987654321",
      type: "Épargne",
      balance: 5600000,
      currency: "GNF",
    },
    {
      id: "3",
      name: "Compte Professionnel",
      number: "456789123",
      type: "Professionnel",
      balance: 1200000,
      currency: "GNF",
    },
  ]

  // Périodes disponibles
  const periods = [
    { label: "Dernier mois", value: "last_month" },
    { label: "3 derniers mois", value: "last_3_months" },
    { label: "6 derniers mois", value: "last_6_months" },
    { label: "Dernière année", value: "last_year" },
    { label: "Période personnalisée", value: "custom" },
  ]

  // Formats disponibles
  const formats = [
    { label: "PDF", value: "pdf" },
    { label: "Excel", value: "excel" },
    { label: "CSV", value: "csv" },
  ]

  // Historique des demandes (simulation)
  const mockRequests: StatementRequest[] = [
    {
      id: "1",
      accountId: "1",
      accountName: "Compte Courant Principal",
      period: "Dernier mois",
      format: "PDF",
      status: "completed",
      requestDate: "2024-01-15",
      completionDate: "2024-01-15",
    },
    {
      id: "2",
      accountId: "2",
      accountName: "Compte Épargne",
      period: "3 derniers mois",
      format: "Excel",
      status: "processing",
      requestDate: "2024-01-14",
    },
    {
      id: "3",
      accountId: "1",
      accountName: "Compte Courant Principal",
      period: "6 derniers mois",
      format: "PDF",
      status: "pending",
      requestDate: "2024-01-13",
    },
  ]

  useEffect(() => {
    setRequests(mockRequests)

    // Vérifier si on vient des détails d'un compte
    if (params.preselectedAccount && params.fromAccountDetails) {
      try {
        const preselectedAccount = JSON.parse(params.preselectedAccount as string)
        setSelectedAccount(preselectedAccount.id)
        setIsAccountLocked(true)
        setFromAccountDetails(true)
      } catch (error) {
        console.error("Erreur lors du parsing du compte présélectionné:", error)
      }
    }
  }, [params])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#059669"
      case "processing":
        return "#F59E0B"
      case "pending":
        return "#6B7280"
      case "failed":
        return "#DC2626"
      default:
        return "#6B7280"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminé"
      case "processing":
        return "En cours"
      case "pending":
        return "En attente"
      case "failed":
        return "Échec"
      default:
        return "Inconnu"
    }
  }

  const handleSubmit = async () => {
    if (!selectedAccount || !selectedPeriod) {
      Alert.alert("Champs manquants", "Veuillez sélectionner un compte et une période.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)
      const selectedPeriodData = periods.find((period) => period.value === selectedPeriod)

      const newRequest: StatementRequest = {
        id: Date.now().toString(),
        accountId: selectedAccount,
        accountName: selectedAccountData?.name || "",
        period: selectedPeriodData?.label || "",
        format: selectedFormat.toUpperCase(),
        status: "pending",
        requestDate: new Date().toISOString().split("T")[0],
      }

      setRequests((prev) => [newRequest, ...prev])

      Alert.alert(
        "Demande envoyée",
        "Votre demande de relevé a été envoyée avec succès. Vous recevrez une notification dès qu'il sera prêt.",
        [
          {
            text: "OK",
            onPress: () => {
              // Réinitialiser le formulaire seulement si on ne vient pas des détails d'un compte
              if (!fromAccountDetails) {
                setSelectedAccount("")
                setSelectedPeriod("")
                setSelectedFormat("pdf")
              } else {
                setSelectedPeriod("")
              }
            },
          },
        ],
      )
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (fromAccountDetails) {
      // Retourner à la page de détails du compte
      router.back()
    } else {
      // Navigation normale
      router.back()
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Relevés bancaires</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Formulaire de demande */}
        <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Nouvelle demande de relevé</Text>

          {fromAccountDetails && (
            <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Compte sélectionné depuis les détails du compte
              </Text>
            </View>
          )}

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Compte <Text style={styles.required}>*</Text>
            </Text>
            {isAccountLocked ? (
              <View style={[styles.lockedField, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.lockedFieldText, { color: colors.text }]}>
                  {accounts.find((acc) => acc.id === selectedAccount)?.name} -
                  {accounts.find((acc) => acc.id === selectedAccount)?.number}
                </Text>
                <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
              </View>
            ) : (
              <SelectField
                options={accounts.map((account) => ({
                  label: `${account.name} - ${account.number}`,
                  value: account.id,
                }))}
                value={selectedAccount}
                onValueChange={setSelectedAccount}
                placeholder="Sélectionnez un compte"
              />
            )}
          </View>

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Période <Text style={styles.required}>*</Text>
            </Text>
            <SelectField
              options={periods}
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              placeholder="Sélectionnez une période"
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Format</Text>
            <SelectField
              options={formats}
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              placeholder="Sélectionnez un format"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Demander le relevé</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Historique des demandes */}
        <View style={[styles.historyCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Historique des demandes</Text>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Aucune demande de relevé pour le moment
              </Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {requests.map((request) => (
                <View key={request.id} style={[styles.requestItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.requestHeader}>
                    <Text style={[styles.requestAccount, { color: colors.text }]}>{request.accountName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + "15" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                        {getStatusText(request.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.requestDetails, { color: colors.textSecondary }]}>
                    {request.period} • {request.format}
                  </Text>
                  <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
                    Demandé le {new Date(request.requestDate).toLocaleDateString("fr-FR")}
                  </Text>
                  {request.status === "completed" && (
                    <TouchableOpacity style={styles.downloadButton}>
                      <Ionicons name="download" size={16} color={colors.primary} />
                      <Text style={[styles.downloadButtonText, { color: colors.primary }]}>Télécharger</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  lockedField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  lockedFieldText: {
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  requestsList: {
    gap: 16,
  },
  requestItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestAccount: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  requestDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
})
