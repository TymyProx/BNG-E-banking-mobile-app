"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { router } from "expo-router"
import React from "react"

interface BillService {
  id: string
  name: string
  icon: string
  color: string
  category: "utilities" | "telecom" | "transport" | "other"
  available: boolean
}

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
}

export default function BillsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  // États principaux
  const [selectedService, setSelectedService] = useState<BillService | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [customerNumber, setCustomerNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState({ message: "", type: "" })

  // Services de paiement disponibles
  const billServices: BillService[] = [
    {
      id: "edg",
      name: "EDG (Électricité)",
      icon: "bolt.fill",
      color: "#FF6B35",
      category: "utilities",
      available: true,
    },
    {
      id: "seg",
      name: "SEG (Eau)",
      icon: "drop.fill",
      color: "#4A90E2",
      category: "utilities",
      available: true,
    },
    {
      id: "orange",
      name: "Orange Guinée",
      icon: "phone.fill",
      color: "#FF8C00",
      category: "telecom",
      available: true,
    },
    {
      id: "mtn",
      name: "MTN Guinée",
      icon: "phone.badge.plus",
      color: "#FFCC00",
      category: "telecom",
      available: true,
    },
    {
      id: "cellcom",
      name: "Cellcom",
      icon: "wifi",
      color: "#00A651",
      category: "telecom",
      available: true,
    },
    {
      id: "canal",
      name: "Canal+ Guinée",
      icon: "tv.fill",
      color: "#000000",
      category: "other",
      available: true,
    },
    {
      id: "internet",
      name: "Fournisseur Internet",
      icon: "wifi",
      color: "#6C5CE7",
      category: "telecom",
      available: false,
    },
    {
      id: "transport",
      name: "Transport Public",
      icon: "bus",
      color: "#A0A0A0",
      category: "transport",
      available: false,
    },
  ]

  // Comptes disponibles
  const accounts: Account[] = [
    {
      id: "1",
      name: "Compte Courant Principal",
      number: "BNG001234567890",
      balance: 2400000,
      currency: "GNF",
    },
    {
      id: "2",
      name: "Compte Épargne",
      number: "BNG009876543210",
      balance: 1800000,
      currency: "GNF",
    },
  ]

  // Fonctions utilitaires
  const formatAmount = (value: string): string => {
    const numValue = value.replace(/\D/g, "")
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  const dismissKeyboard = () => {
    Keyboard.dismiss()
  }

  const generateReference = (): string => {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `F${dateStr}${randomNum}`
  }

  // Sélection du service
  const selectService = (service: BillService) => {
    if (!service.available) {
      setFeedback({
        message: "Le service est temporairement indisponible.",
        type: "error",
      })
      setTimeout(() => setFeedback({ message: "", type: "" }), 3000)
      return
    }

    setSelectedService(service)
    setShowPaymentModal(true)
    setFeedback({ message: "", type: "" })
  }

  // Validation du paiement
  const validatePayment = () => {
    if (!selectedAccount) {
      setFeedback({ message: "Veuillez sélectionner un compte", type: "error" })
      return
    }

    if (!customerNumber.trim()) {
      setFeedback({ message: "Veuillez saisir votre numéro client", type: "error" })
      return
    }

    if (!amount.trim()) {
      setFeedback({ message: "Veuillez saisir le montant", type: "error" })
      return
    }

    const numAmount = Number.parseFloat(amount.replace(/\s/g, ""))
    if (numAmount <= 0) {
      setFeedback({ message: "Veuillez saisir un montant valide", type: "error" })
      return
    }

    if (numAmount > selectedAccount.balance) {
      setFeedback({ message: "Solde insuffisant", type: "error" })
      return
    }

    // Procéder au paiement
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowPaymentModal(false)
      setShowOtpModal(true)
      setFeedback({
        message: "Code OTP envoyé par SMS au +224 XXX XXX 789",
        type: "success",
      })
    }, 1500)
  }

  // Validation OTP
  const validateOTP = () => {
    if (otpCode !== "123456") {
      setFeedback({ message: "Code OTP incorrect", type: "error" })
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowOtpModal(false)
      const reference = generateReference()
      setFeedback({
        message: `Paiement réussi. Référence : ${reference}`,
        type: "success",
      })

      // Réinitialiser après succès
      setTimeout(() => {
        resetForm()
      }, 5000)
    }, 2000)
  }

  // Réinitialisation
  const resetForm = () => {
    setSelectedService(null)
    setSelectedAccount(null)
    setCustomerNumber("")
    setAmount("")
    setOtpCode("")
    setFeedback({ message: "", type: "" })
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedAccount(null)
    setCustomerNumber("")
    setAmount("")
    setFeedback({ message: "", type: "" })
    Keyboard.dismiss()
  }

  const closeOtpModal = () => {
    setShowOtpModal(false)
    setOtpCode("")
    setFeedback({ message: "", type: "" })
    Keyboard.dismiss()
  }

  // Grouper les services par catégorie
  const servicesByCategory = {
    utilities: billServices.filter((s) => s.category === "utilities"),
    telecom: billServices.filter((s) => s.category === "telecom"),
    transport: billServices.filter((s) => s.category === "transport"),
    other: billServices.filter((s) => s.category === "other"),
  }

  const categoryNames = {
    utilities: "Services Publics",
    telecom: "Télécommunications",
    transport: "Transport",
    other: "Autres Services",
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                router.back()
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Paiement de Factures</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Feedback Message */}
        {feedback.message ? (
          <View
            style={[styles.feedbackContainer, { backgroundColor: feedback.type === "success" ? "#d4edda" : "#f8d7da" }]}
          >
            <IconSymbol
              name={feedback.type === "success" ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"}
              size={20}
              color={feedback.type === "success" ? "#155724" : "#721c24"}
            />
            <Text style={[styles.feedbackText, { color: feedback.type === "success" ? "#155724" : "#721c24" }]}>
              {feedback.message}
            </Text>
          </View>
        ) : null}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Services par catégorie */}
          {Object.entries(servicesByCategory).map(([category, services]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {categoryNames[category as keyof typeof categoryNames]}
              </Text>
              <View style={styles.servicesGrid}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      {
                        backgroundColor: colors.cardBackground,
                        opacity: service.available ? 1 : 0.6,
                      },
                    ]}
                    onPress={() => selectService(service)}
                  >
                    <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                      <IconSymbol name={service.icon as any} size={28} color={service.color} />
                    </View>
                    <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                    {!service.available && (
                      <Text style={[styles.unavailableText, { color: colors.icon }]}>Indisponible</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Information */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Service eFacture</Text>
              <Text style={[styles.infoText, { color: colors.icon }]}>
                Payez vos factures en toute sécurité avec votre compte BNG. Frais de transaction : 0 GNF
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Modal de paiement */}
        <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Paiement {selectedService?.name}</Text>
                <TouchableOpacity onPress={closePaymentModal} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                {/* Sélection du compte */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Compte à débiter *</Text>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        {
                          backgroundColor: colors.cardBackground,
                          borderColor: selectedAccount?.id === account.id ? colors.primary : colors.border,
                          borderWidth: selectedAccount?.id === account.id ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedAccount(account)}
                    >
                      <View style={styles.accountInfo}>
                        <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                        <Text style={[styles.accountBalance, { color: colors.icon }]}>
                          Solde: {account.balance.toLocaleString()} {account.currency}
                        </Text>
                      </View>
                      {selectedAccount?.id === account.id && (
                        <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Numéro client */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Numéro client / Compteur *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={customerNumber}
                    onChangeText={setCustomerNumber}
                    placeholder="Ex: 123456789"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                  />
                </View>

                {/* Montant */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Montant *</Text>
                  <View style={[styles.amountInputContainer, { backgroundColor: colors.cardBackground }]}>
                    <TextInput
                      style={[styles.amountInput, { color: colors.text }]}
                      value={amount}
                      onChangeText={(text) => setAmount(formatAmount(text))}
                      placeholder="0"
                      placeholderTextColor={colors.icon}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.currency, { color: colors.text }]}>GNF</Text>
                  </View>
                </View>

                {/* Montants suggérés */}
                <View style={styles.suggestedAmounts}>
                  <Text style={[styles.label, { color: colors.text }]}>Montants suggérés</Text>
                  <View style={styles.amountButtons}>
                    {["25000", "50000", "100000", "200000"].map((suggestedAmount) => (
                      <TouchableOpacity
                        key={suggestedAmount}
                        style={[styles.amountButton, { backgroundColor: colors.cardBackground }]}
                        onPress={() => setAmount(formatAmount(suggestedAmount))}
                      >
                        <Text style={[styles.amountButtonText, { color: colors.text }]}>
                          {Number.parseInt(suggestedAmount).toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Bouton de validation */}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.payButton,
                    {
                      backgroundColor: selectedAccount && customerNumber && amount ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={validatePayment}
                  disabled={!selectedAccount || !customerNumber || !amount || isLoading}
                >
                  <Text
                    style={[
                      styles.payButtonText,
                      {
                        color: selectedAccount && customerNumber && amount ? "#FFFFFF" : colors.icon,
                      },
                    ]}
                  >
                    {isLoading ? "Traitement..." : "Payer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Modal OTP */}
        <Modal visible={showOtpModal} animationType="slide" presentationStyle="pageSheet">
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Validation OTP</Text>
                <TouchableOpacity onPress={closeOtpModal} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.otpContainer}>
                <IconSymbol name="lock.shield.fill" size={64} color={colors.primary} />
                <Text style={[styles.otpDescription, { color: colors.text }]}>
                  Saisissez le code de validation reçu par SMS
                </Text>

                <TextInput
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: colors.cardBackground,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="123456"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  maxLength={6}
                  textAlign="center"
                  autoFocus={true}
                />

                <Text style={[styles.otpHint, { color: colors.icon }]}>Code de test: 123456</Text>

                <TouchableOpacity
                  style={[
                    styles.otpValidateButton,
                    { backgroundColor: otpCode.length === 6 ? colors.primary : colors.border },
                  ]}
                  onPress={validateOTP}
                  disabled={otpCode.length !== 6 || isLoading}
                >
                  <Text
                    style={[styles.otpValidateButtonText, { color: otpCode.length === 6 ? "#FFFFFF" : colors.icon }]}
                  >
                    {isLoading ? "Validation..." : "Valider"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeOtpModal} style={styles.cancelButton}>
                  <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  // headerContent: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  // },
  // backButton: {
  //   width: 44,
  //   height: 44,
  //   borderRadius: 22,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  //    backButton: {
  //   marginRight: 18,
  //   padding: 10,
  // },
  feedbackText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceCard: {
    width: "47%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  unavailableText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "right",
  },
  currency: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  suggestedAmounts: {
    marginBottom: 24,
  },
  amountButtons: {
    flexDirection: "row",
    gap: 8,
  },
  amountButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  amountButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  payButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  otpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  otpDescription: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  otpInput: {
    width: 200,
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 8,
    marginVertical: 20,
  },
  otpHint: {
    fontSize: 12,
    marginBottom: 30,
  },
  otpValidateButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  otpValidateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  // headerTitleContainer: {
  //   flex: 1,
  //   alignItems: "center",
  // },
  // headerSpacer: {
  //   width: 44,
  // },
})
