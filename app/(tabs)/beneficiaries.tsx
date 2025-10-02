"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import React from "react"

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
}

export default function Beneficiaries() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()

  useEffect(() => {
    console.log("Beneficiaries page mounted")
  }, [])

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    {
      id: "1",
      name: "Marie Diallo",
      fullName: "Marie Diallo",
      number: "•••• 1234",
      bank: "BNG",
      lastTransfer: "Il y a 2 jours",
      avatar: "M",
      phoneNumber: "+224 123 456 789",
      email: "marie.diallo@email.com",
    },
    {
      id: "2",
      name: "Ibrahima Sy",
      fullName: "Ibrahima Sy",
      number: "•••• 5678",
      bank: "SGBG",
      lastTransfer: "Il y a 1 semaine",
      avatar: "I",
      phoneNumber: "+224 987 654 321",
    },
    {
      id: "3",
      name: "Fatou Camara",
      fullName: "Fatou Camara",
      number: "•••• 9012",
      bank: "BNG",
      lastTransfer: "Il y a 3 jours",
      avatar: "F",
      phoneNumber: "+224 555 123 456",
      email: "fatou.camara@email.com",
    },
    {
      id: "4",
      name: "Amadou Barry",
      fullName: "Amadou Barry",
      number: "•••• 3456",
      bank: "UBA",
      lastTransfer: "Il y a 1 mois",
      avatar: "A",
      phoneNumber: "+224 777 888 999",
    },
    {
      id: "5",
      name: "Aissatou Bah",
      fullName: "Aissatou Bah",
      number: "•••• 7890",
      bank: "BNG",
      lastTransfer: "Il y a 5 jours",
      avatar: "A",
      phoneNumber: "+224 666 777 888",
      email: "aissatou.bah@email.com",
    },
  ])

  const filteredBeneficiaries = beneficiaries.filter(
    (ben) =>
      ben.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ben.bank.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const handleDeleteBeneficiary = () => {
    setShowActionModal(false)
    if (selectedBeneficiary) {
      Alert.alert(
        "Supprimer le bénéficiaire",
        `Êtes-vous sûr de vouloir supprimer ${selectedBeneficiary.name} de vos bénéficiaires ?`,
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => {
              setBeneficiaries((prev) => prev.filter((ben) => ben.id !== selectedBeneficiary.id))
              Alert.alert("Succès", `${selectedBeneficiary.name} a été supprimé(e) de vos bénéficiaires.`)
            },
          },
        ],
      )
    }
  }

  const handleViewDetails = () => {
    setShowActionModal(false)
    if (selectedBeneficiary) {
      Alert.alert(
        "Détails du bénéficiaire",
        `Nom: ${selectedBeneficiary.fullName}\nBanque: ${selectedBeneficiary.bank}\nCompte: ${selectedBeneficiary.number}\nTéléphone: ${selectedBeneficiary.phoneNumber}${selectedBeneficiary.email ? `\nEmail: ${selectedBeneficiary.email}` : ""}\nDernier virement: ${selectedBeneficiary.lastTransfer}`,
      )
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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

      {/* Search Bar */}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Beneficiaries List */}
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
                  <TouchableOpacity
                    style={[styles.transferButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleTransferTo(beneficiary.id)}
                  >
                    <Text style={styles.transferButtonText}>Virer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moreButton, { backgroundColor: colors.textSecondary + "20" }]}
                    onPress={() => handleBeneficiaryActions(beneficiary)}
                  >
                    <IconSymbol name="ellipsis" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {filteredBeneficiaries.length === 0 && (
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

      {/* Action Modal */}
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

              <TouchableOpacity
                style={[styles.modalAction, { borderBottomWidth: 0 }]}
                onPress={handleDeleteBeneficiary}
              >
                <IconSymbol name="trash" size={20} color="#ef4444" />
                <Text style={[styles.modalActionText, { color: "#ef4444" }]}>Supprimer</Text>
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
