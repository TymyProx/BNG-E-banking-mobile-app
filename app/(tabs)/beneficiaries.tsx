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
import { useAuth } from "@/contexts/AuthContext"

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

const Beneficiaries = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("actif")
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()
  const { tenantId } = useAuth()

  const [beneficiaries, setBeneficiaries] = useState([])

  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await SecureStore.getItemAsync("token")
      if (!token || !tenantId) {
        console.log("[v0] No token or tenantId available for beneficiaries")
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.LIST(tenantId)}`, {
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

      const mappedBeneficiaries = data.rows.map((item) => ({
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
  }, [tenantId])

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

  const handleToggleFavorite = async (beneficiary) => {
    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token || !tenantId) {
        throw new Error("Token d'authentification non trouvé")
      }

      const newFavorisValue = !beneficiary.favoris

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.UPDATE(tenantId, beneficiary.id)}`,
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

      setBeneficiaries((prev) =>
        prev.map((ben) => (ben.id === beneficiary.id ? { ...ben, favoris: newFavorisValue } : ben)),
      )
    } catch (err) {
      console.error("Error toggling favorite:", err)
      Alert.alert("Erreur", "Impossible de mettre à jour le favori")
    }
  }

  const handleTransferTo = (beneficiary) => {
    // Handle transfer logic here
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.content}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un bénéficiaire"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <ScrollView contentContainerStyle={styles.scrollView}>
            {filteredBeneficiaries.map((beneficiary) => (
              <TouchableOpacity
                key={beneficiary.id}
                style={styles.beneficiaryItem}
                onPress={() => setSelectedBeneficiary(beneficiary)}
              >
                <IconSymbol symbol={beneficiary.avatar} size={40} color={colors.primary} />
                <View style={styles.beneficiaryInfo}>
                  <Text style={styles.beneficiaryName}>{beneficiary.name}</Text>
                  <Text style={styles.beneficiaryNumber}>{beneficiary.number}</Text>
                  <Text style={styles.beneficiaryBank}>{beneficiary.bank}</Text>
                </View>
                <TouchableOpacity onPress={() => handleToggleFavorite(beneficiary)}>
                  <IconSymbol symbol={beneficiary.favoris ? "star" : "star-outline"} size={24} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedBeneficiary && (
            <Modal visible={true} animationType="slide">
              <View style={styles.modalContainer}>
                <TouchableOpacity onPress={() => setSelectedBeneficiary(null)} style={styles.closeButton}>
                  <IconSymbol symbol="close" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Détails du bénéficiaire</Text>
                <Text style={styles.modalText}>Nom: {selectedBeneficiary.fullName}</Text>
                <Text style={styles.modalText}>Numéro de compte: {selectedBeneficiary.accountNumber}</Text>
                <Text style={styles.modalText}>Banque: {selectedBeneficiary.bankName}</Text>
                <Text style={styles.modalText}>Téléphone: {selectedBeneficiary.phoneNumber}</Text>
                {selectedBeneficiary.email && <Text style={styles.modalText}>Email: {selectedBeneficiary.email}</Text>}
                <TouchableOpacity style={styles.transferButton} onPress={() => handleTransferTo(selectedBeneficiary)}>
                  <Text style={styles.transferButtonText}>Transférer</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  scrollView: {
    flexGrow: 1,
  },
  beneficiaryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  beneficiaryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  beneficiaryName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  beneficiaryNumber: {
    fontSize: 16,
    color: "#666",
  },
  beneficiaryBank: {
    fontSize: 16,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 8,
  },
  transferButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  transferButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
})

export default Beneficiaries
