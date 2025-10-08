"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter, useFocusEffect } from "expo-router"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as SecureStore from "expo-secure-store"

interface Beneficiary {
  id: string
  name: string
  number: string
  bank: string
  lastTransfer: string
  avatar: string
  fullName: string
  phoneNumber: string
  email?: string
  accountNumber: string
  bankCode: string
  bankName: string
  favoris?: boolean
  status: number // 0 = Actif, 1 = Désactivé
  beneficiaryId?: string
  customerId?: string
  typeBeneficiary?: string
}

type FilterType = "tous" | "actif" | "desactive" | "favoris"

export default function Beneficiaries() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("actif")
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])

  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        throw new Error("Token d'authentification non trouvé")
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.LIST(API_CONFIG.TENANT_ID)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des bénéficiaires")
      }

      const data = await response.json()

      const mappedBeneficiaries: Beneficiary[] = data.rows.map((item: any) => ({
        id: item.id,
        name: item.name,
        fullName: item.name,
        number: `•••• ${item.accountNumber.slice(-4)}`,
        accountNumber: item.accountNumber,
        bank: item.bankName,
        bankCode: item.bankCode,
        bankName: item.bankName,
        lastTransfer: "Récent",
        avatar: item.name.charAt(0).toUpperCase(),
        phoneNumber: item.customerId || "N/A",
        favoris: item.favoris,
        status: item.status,
        beneficiaryId: item.beneficiaryId,
        customerId: item.customerId,
        typeBeneficiary: item.typeBeneficiary,
      }))

      setBeneficiaries(mappedBeneficiaries)
    } catch (err) {
      console.error("Error fetching beneficiaries:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      Alert.alert("Erreur", "Impossible de charger les bénéficiaires")
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      console.log("Beneficiaries screen focused, fetching data...")
      fetchBeneficiaries()
    }, [fetchBeneficiaries]),
  )

  const filteredBeneficiaries = beneficiaries.filter((ben) => {
    const matchesSearch =
      ben.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ben.bank.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (filter === "actif") {
      matchesStatus = ben.status === 0
    } else if (filter === "desactive") {
      matchesStatus = ben.status === 1
    } else if (filter === "favoris") {
      matchesStatus = ben.favoris === true
    }

    return matchesSearch && matchesStatus
  })

  const handleToggleFavorite = async (beneficiary: Beneficiary) => {
    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        throw new Error("Token d'authentification non trouvé")
      }

      const newFavorisValue = !beneficiary.favoris

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
              status: beneficiary.status,
              typeBeneficiary: beneficiary.typeBeneficiary,
              favoris: newFavorisValue,
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du favori")
      }

      // Update local state
      setBeneficiaries((prev) =>
        prev.map((ben) => (ben.id === beneficiary.id ? { ...ben, favoris: newFavorisValue } : ben)),
      )
    } catch (err) {
      console.error("Error toggling favorite:", err)
      Alert.alert("Erreur", "Impossible de mettre à jour le favori")
    }
  }

  const handleTransferTo = (beneficiaryId: string) => {
    console.log(`Initiating transfer to beneficiary: ${beneficiaryId}`)
    router.push({
      pathname: "/(tabs)/transfer",
      params: { beneficiaryId },
    })
  }

  const handleAddBeneficiary = () => {
    console.log("Add beneficiary button pressed")
    router.push("/add-beneficiary")
  }

  const handleBeneficiaryActions = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary)
    setShowActionModal(true)
  }

  const handleEditBeneficiary = () => {
    setShowActionModal(false)
    if (selectedBeneficiary) {
      router.push({
        pathname: "/edit-beneficiary",
        params: { beneficiaryId: selectedBeneficiary.id },
      })
    }
  }

  const handleToggleStatus = async () => {
    setShowActionModal(false)
    if (!selectedBeneficiary) return

    const newStatus = selectedBeneficiary.status === 0 ? 1 : 0
    const actionText = newStatus === 1 ? "désactiver" : "réactiver"
    const statusText = newStatus === 0 ? "activé" : "désactivé"

    Alert.alert("Confirmation", `Êtes-vous sûr de vouloir ${actionText} ce bénéficiaire ?`, [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Confirmer",
        style: newStatus === 1 ? "destructive" : "default",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("token")
            if (!token) {
              throw new Error("Token d'authentification non trouvé")
            }

            const response = await fetch(
              `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.UPDATE(API_CONFIG.TENANT_ID, selectedBeneficiary.id)}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  data: {
                    beneficiaryId: selectedBeneficiary.beneficiaryId,
                    customerId: selectedBeneficiary.customerId,
                    name: selectedBeneficiary.name,
                    accountNumber: selectedBeneficiary.accountNumber,
                    bankCode: selectedBeneficiary.bankCode,
                    bankName: selectedBeneficiary.bankName,
                    status: newStatus,
                    typeBeneficiary: selectedBeneficiary.typeBeneficiary,
                    favoris: selectedBeneficiary.favoris,
                  },
                }),
              },
            )

            if (!response.ok) {
              throw new Error("Erreur lors de la mise à jour du statut")
            }

            // Update local state
            setBeneficiaries((prev) =>
              prev.map((ben) => (ben.id === selectedBeneficiary.id ? { ...ben, status: newStatus } : ben)),
            )

            Alert.alert("Succès", `Le bénéficiaire a été ${statusText}`)
          } catch (err) {
            console.error("Error toggling status:", err)
            Alert.alert("Erreur", "Impossible de mettre à jour le statut du bénéficiaire")
          }
        },
      },
    ])
  }

  const handleViewDetails = () => {
    setShowActionModal(false)
    if (selectedBeneficiary) {
      router.push({
        pathname: "/beneficiary-details",
        params: { beneficiaryId: selectedBeneficiary.id },
      })
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => {
            console.log("Navigating back from Beneficiaries page")
            router.navigate("/profile")
          }}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Bénéficiaires</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérer vos contacts de virement</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddBeneficiary}
        >
          <IconSymbol name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un bénéficiaire..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={(text) => {
              console.log(`Searching for: ${text}`)
              setSearchTerm(text)
            }}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "tous" && styles.filterPillActive,
              {
                backgroundColor: filter === "tous" ? colors.primary : colors.cardBackground,
                borderColor: filter === "tous" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter("tous")}
          >
            <IconSymbol name="list.bullet" size={18} color={filter === "tous" ? "white" : colors.textSecondary} />
            <Text style={[styles.filterPillText, { color: filter === "tous" ? "white" : colors.textSecondary }]}>
              Tous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "actif" && styles.filterPillActive,
              {
                backgroundColor: filter === "actif" ? "#10b981" : colors.cardBackground,
                borderColor: filter === "actif" ? "#10b981" : colors.border,
              },
            ]}
            onPress={() => setFilter("actif")}
          >
            <IconSymbol name="checkmark.circle.fill" size={18} color={filter === "actif" ? "white" : "#10b981"} />
            <Text style={[styles.filterPillText, { color: filter === "actif" ? "white" : colors.textSecondary }]}>
              Actifs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "desactive" && styles.filterPillActive,
              {
                backgroundColor: filter === "desactive" ? "#ef4444" : colors.cardBackground,
                borderColor: filter === "desactive" ? "#ef4444" : colors.border,
              },
            ]}
            onPress={() => setFilter("desactive")}
          >
            <IconSymbol name="xmark.circle.fill" size={18} color={filter === "desactive" ? "white" : "#ef4444"} />
            <Text style={[styles.filterPillText, { color: filter === "desactive" ? "white" : colors.textSecondary }]}>
              Désactivés
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "favoris" && styles.filterPillActive,
              {
                backgroundColor: filter === "favoris" ? "#FFD700" : colors.cardBackground,
                borderColor: filter === "favoris" ? "#FFD700" : colors.border,
              },
            ]}
            onPress={() => setFilter("favoris")}
          >
            <IconSymbol name="star.fill" size={18} color={filter === "favoris" ? "white" : "#FFD700"} />
            <Text style={[styles.filterPillText, { color: filter === "favoris" ? "white" : colors.textSecondary }]}>
              Favoris
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement des bénéficiaires...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.beneficiariesContainer}>
            {filteredBeneficiaries.map((beneficiary) => (
              <View key={beneficiary.id} style={[styles.beneficiaryCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.beneficiaryContent}>
                  <View style={styles.beneficiaryLeft}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>{beneficiary.avatar}</Text>
                    </View>
                    <View style={styles.beneficiaryInfo}>
                      <Text style={[styles.beneficiaryName, { color: colors.text }]}>{beneficiary.name}</Text>
                      <Text style={[styles.beneficiaryDetails, { color: colors.textSecondary }]}>
                        {beneficiary.number} • {beneficiary.bank}
                      </Text>
                      <Text style={[styles.lastTransfer, { color: colors.textSecondary }]}>
                        Dernier virement: {beneficiary.lastTransfer}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.beneficiaryActions}>
                    {beneficiary.status === 0 && (
                      <TouchableOpacity
                        style={[styles.transferButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleTransferTo(beneficiary.id)}
                      >
                        <Text style={styles.transferButtonText}>Virer</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.moreButton, { backgroundColor: colors.textSecondary + "20" }]}
                      onPress={() => handleBeneficiaryActions(beneficiary)}
                    >
                      <IconSymbol name="ellipsis" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {beneficiary.status === 0 && (
                      <TouchableOpacity onPress={() => handleToggleFavorite(beneficiary)} style={styles.starIconButton}>
                        <IconSymbol name={beneficiary.favoris ? "star.fill" : "star"} size={24} color="#FFD700" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {filteredBeneficiaries.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.textSecondary + "20" }]}>
                <IconSymbol name="person.2" size={48} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun bénéficiaire trouvé</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchTerm ? "Aucun résultat pour votre recherche" : "Vous n'avez pas encore ajouté de bénéficiaires"}
              </Text>
              <TouchableOpacity
                style={[styles.addBeneficiaryButton, { backgroundColor: colors.primary }]}
                onPress={handleAddBeneficiary}
              >
                <IconSymbol name="plus" size={16} color="white" />
                <Text style={styles.addBeneficiaryText}>Ajouter un bénéficiaire</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedBeneficiary?.name}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {selectedBeneficiary?.bank} • {selectedBeneficiary?.number}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalAction, { borderBottomColor: colors.border }]}
                onPress={handleViewDetails}
              >
                <IconSymbol name="info.circle" size={20} color={colors.primary} />
                <Text style={[styles.modalActionText, { color: colors.text }]}>Voir les détails</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalAction, { borderBottomColor: colors.border }]}
                onPress={handleEditBeneficiary}
              >
                <IconSymbol name="pencil" size={20} color={colors.primary} />
                <Text style={[styles.modalActionText, { color: colors.text }]}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalAction, { borderBottomWidth: 0 }]} onPress={handleToggleStatus}>
                <IconSymbol
                  name={selectedBeneficiary?.status === 0 ? "xmark.circle" : "checkmark.circle"}
                  size={20}
                  color={selectedBeneficiary?.status === 0 ? "#ef4444" : "#10b981"}
                />
                <Text
                  style={[styles.modalActionText, { color: selectedBeneficiary?.status === 0 ? "#ef4444" : "#10b981" }]}
                >
                  {selectedBeneficiary?.status === 0 ? "Désactiver" : "Réactiver"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.textSecondary + "20" }]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  loadingText: {
    fontSize: 16,
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterSection: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillActive: {
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  beneficiariesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  beneficiaryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  starIconButton: {
    padding: 4,
  },
  beneficiaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  beneficiaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  beneficiaryDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  lastTransfer: {
    fontSize: 12,
  },
  beneficiaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transferButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  transferButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  addBeneficiaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addBeneficiaryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalActions: {
    marginBottom: 16,
  },
  modalAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalCancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
