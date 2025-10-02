"use client"

import { useState } from "react"

import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import React from "react"

interface Card {
  id: string
  name: string
  number: string
  type: "Visa" | "Mastercard"
  expiry: string
  status: "active" | "blocked" | "expired"
  balance: number
  isBlocked: boolean
  gradient: string[]
  dailyLimit: number
  monthlyLimit: number
  lastUsed: string
  cvv: string
}

export default function CardsScreen() {
  const [showCardNumbers, setShowCardNumbers] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [showLimitsModal, setShowLimitsModal] = useState<boolean>(false)
  const [showPinModal, setShowPinModal] = useState<boolean>(false)
  const [showNewCardModal, setShowNewCardModal] = useState<boolean>(false)
  const [currentPin, setCurrentPin] = useState<string>("")
  const [newPin, setNewPin] = useState<string>("")
  const [confirmPin, setConfirmPin] = useState<string>("")
  const [newCardType, setNewCardType] = useState<"debit" | "credit">("debit")
  const [dailyLimit, setDailyLimit] = useState<string>("")
  const [monthlyLimit, setMonthlyLimit] = useState<string>("")

  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()

  const [cards, setCards] = useState<Card[]>([
    {
      id: "1",
      name: "Carte Principale",
      number: "4532 1234 5678 9876",
      type: "Visa",
      expiry: "12/26",
      status: "active",
      balance: 48200,
      isBlocked: false,
      gradient: [colors.primary, colors.primaryDark],
      dailyLimit: 500000,
      monthlyLimit: 2000000,
      lastUsed: "Aujourd'hui à 14:30",
      cvv: "123",
    },
    {
      id: "2",
      name: "Carte Épargne",
      number: "5555 9876 5432 1098",
      type: "Mastercard",
      expiry: "08/27",
      status: "active",
      balance: 25000,
      isBlocked: false,
      gradient: [colors.success, colors.successDark],
      dailyLimit: 300000,
      monthlyLimit: 1000000,
      lastUsed: "Hier à 09:15",
      cvv: "456",
    },
    {
      id: "3",
      name: "Carte Voyage",
      number: "4111 1111 1111 1111",
      type: "Visa",
      expiry: "03/25",
      status: "blocked",
      balance: 5000,
      isBlocked: true,
      gradient: [colors.textSecondary, colors.textTertiary],
      dailyLimit: 200000,
      monthlyLimit: 800000,
      lastUsed: "Il y a 3 jours",
      cvv: "789",
    },
  ])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const formatCardNumber = (number: string) => {
    return showCardNumbers ? number : number.replace(/\d(?=\d{4})/g, "•")
  }

  const toggleCardBlock = (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, isBlocked: !card.isBlocked, status: card.isBlocked ? "active" : "blocked" }
          : card,
      ),
    )
    Alert.alert("Succès", "État de la carte modifié avec succès!")
  }

  const openCardDetails = (card: Card) => {
    setSelectedCard(card)
    setShowDetailsModal(true)
  }

  const openLimitsModal = (card: Card) => {
    setSelectedCard(card)
    setDailyLimit(card.dailyLimit.toString())
    setMonthlyLimit(card.monthlyLimit.toString())
    setShowLimitsModal(true)
  }

  const openPinModal = (card: Card) => {
    setSelectedCard(card)
    setShowPinModal(true)
  }

  const updateLimits = () => {
    if (selectedCard) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === selectedCard.id
            ? { ...card, dailyLimit: Number.parseInt(dailyLimit), monthlyLimit: Number.parseInt(monthlyLimit) }
            : card,
        ),
      )
      setShowLimitsModal(false)
      Alert.alert("Succès", "Limites mises à jour avec succès!")
    }
  }

  const changePin = () => {
    if (newPin !== confirmPin) {
      Alert.alert("Erreur", "Les codes PIN ne correspondent pas")
      return
    }
    if (newPin.length !== 4) {
      Alert.alert("Erreur", "Le code PIN doit contenir 4 chiffres")
      return
    }
    setShowPinModal(false)
    setCurrentPin("")
    setNewPin("")
    setConfirmPin("")
    Alert.alert("Succès", "Code PIN modifié avec succès!")
  }

  const requestNewCard = () => {
    const newCard: Card = {
      id: Date.now().toString(),
      name: `Nouvelle Carte ${newCardType === "debit" ? "Débit" : "Crédit"}`,
      number: "0000 0000 0000 0000",
      type: "Visa",
      expiry: "12/29",
      status: "active",
      balance: 0,
      isBlocked: false,
      gradient:
        newCardType === "debit" ? [colors.primary, colors.primaryDark] : [colors.secondary, colors.secondaryDark],
      dailyLimit: 500000,
      monthlyLimit: 2000000,
      lastUsed: "Jamais utilisée",
      cvv: "000",
    }

    setCards((prev) => [...prev, newCard])
    setShowNewCardModal(false)
    Alert.alert("Succès", "Demande de carte envoyée! Vous recevrez votre nouvelle carte sous 5-7 jours ouvrables.")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mes cartes</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérer vos cartes bancaires</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCardNumbers(!showCardNumbers)} style={styles.eyeButton}>
          <IconSymbol name={showCardNumbers ? "eye.slash" : "eye"} size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cards List */}
        <View style={styles.cardsContainer}>
          {cards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              {/* Physical Card Design */}
              <TouchableOpacity onPress={() => openCardDetails(card)}>
                <View style={[styles.physicalCard, { backgroundColor: card.gradient[0] }]}>
                  {/* Card Background Pattern */}
                  <View style={styles.cardPattern}>
                    <View style={[styles.patternCircle, styles.patternCircle1]} />
                    <View style={[styles.patternCircle, styles.patternCircle2]} />
                    <View style={[styles.patternCircle, styles.patternCircle3]} />
                  </View>

                  <View style={styles.cardContent}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.bankName}>BNG BANK</Text>
                        <Text style={styles.cardName}>{card.name}</Text>
                      </View>
                      <View style={styles.cardTypeContainer}>
                        <Text style={styles.cardType}>{card.type}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                card.status === "active" ? colors.successBackground : colors.errorBackground,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: card.status === "active" ? colors.success : colors.error },
                            ]}
                          >
                            {card.status === "active" ? "Active" : "Bloquée"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Card Number */}
                    <View style={styles.cardNumberContainer}>
                      <Text style={styles.cardNumber}>{formatCardNumber(card.number)}</Text>
                    </View>

                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.balanceLabel}>SOLDE DISPONIBLE</Text>
                        <Text style={styles.balanceAmount}>{formatAmount(card.balance)} GNF</Text>
                      </View>
                      <View style={styles.expiryContainer}>
                        <Text style={styles.expiryLabel}>EXPIRE</Text>
                        <Text style={styles.expiryDate}>{card.expiry}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card Actions */}
              <View
                style={[styles.actionsCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}
              >
                <View style={styles.actionsContent}>
                  <View style={styles.blockToggle}>
                    <View style={styles.blockInfo}>
                      <IconSymbol
                        name={card.isBlocked ? "lock" : "lock.open"}
                        size={18}
                        color={card.isBlocked ? colors.error : colors.success}
                      />
                      <Text style={[styles.blockText, { color: colors.text }]}>
                        {card.isBlocked ? "Carte bloquée" : "Carte active"}
                      </Text>
                    </View>
                    <Switch
                      value={!card.isBlocked}
                      onValueChange={() => toggleCardBlock(card.id)}
                      trackColor={{ false: colors.error, true: colors.success }}
                      thumbColor="white"
                    />
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => openCardDetails(card)}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.text }]}>Détails</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => openLimitsModal(card)}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.text }]}>Limites</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => openPinModal(card)}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.text }]}>PIN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add New Card */}
        <TouchableOpacity
          style={[styles.addCardContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => setShowNewCardModal(true)}
        >
          <View style={styles.addCardContent}>
            <View style={[styles.addCardIcon, { backgroundColor: colors.primaryBackground }]}>
              <IconSymbol name="plus" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.addCardTitle, { color: colors.text }]}>Demander une nouvelle carte</Text>
            <Text style={[styles.addCardSubtitle, { color: colors.textSecondary }]}>
              Ajoutez une nouvelle carte à votre compte
            </Text>
            <TouchableOpacity style={[styles.requestButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.requestButtonText}>Faire une demande</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Card Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Détails de la carte</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <IconSymbol name="xmark" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedCard && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Nom de la carte</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCard.name}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Numéro de carte</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCard.number}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>CVV</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCard.cvv}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date d'expiration</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCard.expiry}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatAmount(selectedCard.balance)} GNF
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Limite journalière</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatAmount(selectedCard.dailyLimit)} GNF
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Limite mensuelle</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatAmount(selectedCard.monthlyLimit)} GNF
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dernière utilisation</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedCard.lastUsed}</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Limits Modal */}
      <Modal visible={showLimitsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Limites</Text>
            <TouchableOpacity onPress={() => setShowLimitsModal(false)}>
              <IconSymbol name="xmark" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Limite journalière (GNF)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border },
                ]}
                value={dailyLimit}
                onChangeText={setDailyLimit}
                keyboardType="numeric"
                placeholder="Entrez la limite journalière"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Limite mensuelle (GNF)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border },
                ]}
                value={monthlyLimit}
                onChangeText={setMonthlyLimit}
                keyboardType="numeric"
                placeholder="Entrez la limite mensuelle"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* PIN Modal */}
      <Modal visible={showPinModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Changer le code PIN</Text>
            <TouchableOpacity onPress={() => setShowPinModal(false)}>
              <IconSymbol name="xmark" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Code PIN actuel</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border },
                ]}
                value={currentPin}
                onChangeText={setCurrentPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholder="••••"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nouveau code PIN</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border },
                ]}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholder="••••"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmer le nouveau PIN</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border },
                ]}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholder="••••"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={changePin}>
              <Text style={styles.submitButtonText}>Changer le PIN</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* New Card Modal */}
      <Modal visible={showNewCardModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Demander une nouvelle carte</Text>
            <TouchableOpacity onPress={() => setShowNewCardModal(false)}>
              <IconSymbol name="xmark" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de carte</Text>

            <View style={styles.cardTypeOptions}>
              <TouchableOpacity
                style={[
                  styles.cardTypeOption,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  newCardType === "debit" && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setNewCardType("debit")}
              >
                <IconSymbol name="creditcard" size={28} color={colors.primary} />
                <Text style={[styles.cardTypeText, { color: colors.text }]}>Carte de débit</Text>
                <Text style={[styles.cardTypeDescription, { color: colors.textSecondary }]}>
                  Utilisez votre propre argent
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cardTypeOption,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  newCardType === "credit" && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setNewCardType("credit")}
              >
                <IconSymbol name="creditcard" size={28} color={colors.primary} />
                <Text style={[styles.cardTypeText, { color: colors.text }]}>Carte de crédit</Text>
                <Text style={[styles.cardTypeDescription, { color: colors.textSecondary }]}>Crédit renouvelable</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={requestNewCard}
            >
              <Text style={styles.submitButtonText}>Demander la carte</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
  },
  backButton: {
    marginRight: 18,
    padding: 10,
  },
  headerContent: {
    flex: 1,
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
  eyeButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  cardsContainer: {
    gap: 28,
    marginBottom: 28,
  },
  cardWrapper: {
    gap: 18,
  },
  physicalCard: {
    borderRadius: 24,
    padding: 28,
    minHeight: 220,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardPattern: {
    position: "absolute",
    inset: 0,
  },
  patternCircle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
  },
  patternCircle1: {
    width: 140,
    height: 140,
    top: -70,
    right: -70,
  },
  patternCircle2: {
    width: 100,
    height: 100,
    bottom: -50,
    left: -50,
  },
  patternCircle3: {
    width: 60,
    height: 60,
    top: 40,
    right: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  bankName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 2,
  },
  cardName: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardTypeContainer: {
    alignItems: "flex-end",
    gap: 10,
  },
  cardType: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardNumberContainer: {
    marginBottom: 28,
  },
  cardNumber: {
    color: "white",
    fontSize: 22,
    fontFamily: "monospace",
    letterSpacing: 3,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 1,
  },
  balanceAmount: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  expiryContainer: {
    alignItems: "flex-end",
  },
  expiryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  expiryDate: {
    color: "white",
    fontSize: 15,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  actionsCard: {
    borderRadius: 18,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  actionsContent: {
    gap: 20,
  },
  blockToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  blockText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addCardContainer: {
    borderRadius: 20,
    padding: 36,
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addCardContent: {
    alignItems: "center",
    gap: 20,
  },
  addCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  addCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  addCardSubtitle: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  requestButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  requestButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  detailItem: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 14,
    padding: 18,
    fontSize: 17,
    borderWidth: 1.5,
    fontWeight: "500",
  },
  submitButton: {
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  cardTypeOptions: {
    gap: 18,
    marginBottom: 36,
  },
  cardTypeOption: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
  },
  cardTypeText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    letterSpacing: -0.2,
  },
  cardTypeDescription: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "500",
  },
})
