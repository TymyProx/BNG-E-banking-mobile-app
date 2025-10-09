"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect } from "expo-router"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import { useAuth } from "@/contexts/AuthContext"

interface CreditRequest {
  id: string
  createdAt: string
  applicantName: string
  creditAmount: string
  durationMonths: string
  purpose: string
  typedemande: string
  accountNumber: string
  status: string
  updatedAt?: string
}

interface CheckbookRequest {
  id: string
  createdAt: string
  dateorder: string
  nbrefeuille: number
  nbrechequier: number
  intitulecompte: string
  numcompteId: string
  commentaire: string
  status: string
  updatedAt?: string
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
  const { token } = useAuth()

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

  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([])
  const [checkbookRequests, setCheckbookRequests] = useState<CheckbookRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const fetchCreditRequests = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREDIT.LIST(API_CONFIG.TENANT_ID)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCreditRequests(data.rows || [])
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes de crédit:", error)
    }
  }

  const fetchCheckbookRequests = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHECKBOOK.LIST(API_CONFIG.TENANT_ID)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCheckbookRequests(data.rows || [])
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes de chéquier:", error)
    }
  }

  const fetchCreditDetails = async (creditId: string) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREDIT.DETAILS(API_CONFIG.TENANT_ID, creditId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setSelectedRequest({ ...data, type: "credit" })
        setDetailsModalVisible(true)
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const fetchCheckbookDetails = async (checkbookId: string) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHECKBOOK.DETAILS(API_CONFIG.TENANT_ID, checkbookId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setSelectedRequest({ ...data, type: "checkbook" })
        setDetailsModalVisible(true)
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchCreditRequests(), fetchCheckbookRequests()])
        setLoading(false)
      }
      fetchData()
    }, [token]),
  )

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

  const formatAmount = (amount: string) => {
    const numAmount = Number.parseFloat(amount)
    return numAmount.toLocaleString("fr-FR")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "rgba(255, 193, 7, 0.15)" }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFC107" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>E-Services</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérez vos demandes en ligne</Text>
          </View>
          <View style={styles.headerPlaceholder} />
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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
            </View>
          ) : creditRequests.length > 0 || checkbookRequests.length > 0 ? (
            <>
              {/* Credit Requests */}
              {creditRequests.map((request) => (
                <TouchableOpacity
                  key={`credit-${request.id}`}
                  style={[
                    styles.requestCard,
                    { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow },
                  ]}
                  onPress={() => fetchCreditDetails(request.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTitleContainer}>
                      <Ionicons name="cash-outline" size={24} color="#3B82F6" />
                      <Text style={[styles.requestTitle, { color: colors.text }]}>Demande de crédit</Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: "#EFF6FF" }]}>
                      <Text style={[styles.typeText, { color: "#3B82F6" }]}>{request.typedemande}</Text>
                    </View>
                  </View>
                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Montant:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatAmount(request.creditAmount)} GNF
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Durée:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{request.durationMonths} mois</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Objet:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{request.purpose}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Compte:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{request.accountNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons name={getStatusIcon(request.status)} size={16} color={getStatusColor(request.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                  <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
                    Demandé le {formatDate(request.createdAt)}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Checkbook Requests */}
              {checkbookRequests.map((request) => (
                <TouchableOpacity
                  key={`checkbook-${request.id}`}
                  style={[
                    styles.requestCard,
                    { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow },
                  ]}
                  onPress={() => fetchCheckbookDetails(request.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTitleContainer}>
                      <Ionicons name="card-outline" size={24} color="#10B981" />
                      <Text style={[styles.requestTitle, { color: colors.text }]}>Demande de chéquier</Text>
                    </View>
                  </View>
                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Nombre de chéquiers:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{request.nbrechequier}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Feuilles par chéquier:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{request.nbrefeuille}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Compte:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{request.numcompteId}</Text>
                    </View>
                    {request.commentaire && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Commentaire:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{request.commentaire}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons name={getStatusIcon(request.status)} size={16} color={getStatusColor(request.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                  <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
                    Commandé le {formatDate(request.dateorder)}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
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

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedRequest?.type === "credit"
                  ? "Détails de la demande de crédit"
                  : "Détails de la commande de chéquier"}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedRequest?.type === "credit" ? (
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Nom du demandeur</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.applicantName || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Type de crédit</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.typedemande || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Montant demandé</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.creditAmount ? formatAmount(selectedRequest.creditAmount) : "N/A"} GNF
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Durée</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.durationMonths || "N/A"} mois
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Objet du crédit</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.purpose || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.accountNumber || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Date de création</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.createdAt ? formatDate(selectedRequest.createdAt) : "N/A"}
                      </Text>
                    </View>
                    {selectedRequest?.updatedAt && (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                          Dernière mise à jour
                        </Text>
                        <Text style={[styles.detailItemValue, { color: colors.text }]}>
                          {formatDate(selectedRequest.updatedAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Intitulé du compte</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.intitulecompte || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.numcompteId || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Nombre de chéquiers</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.nbrechequier ?? "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                        Feuilles par chéquier
                      </Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.nbrefeuille ?? "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Date de commande</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.dateorder ? formatDate(selectedRequest.dateorder) : "N/A"}
                      </Text>
                    </View>
                    {selectedRequest?.commentaire && (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Commentaire</Text>
                        <Text style={[styles.detailItemValue, { color: colors.text }]}>
                          {selectedRequest.commentaire}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>Date de création</Text>
                      <Text style={[styles.detailItemValue, { color: colors.text }]}>
                        {selectedRequest?.createdAt ? formatDate(selectedRequest.createdAt) : "N/A"}
                      </Text>
                    </View>
                    {selectedRequest?.updatedAt && (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                          Dernière mise à jour
                        </Text>
                        <Text style={[styles.detailItemValue, { color: colors.text }]}>
                          {formatDate(selectedRequest.updatedAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerPlaceholder: {
    width: 48,
    height: 48,
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
  requestTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
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
  requestDetails: {
    marginTop: 16,
    marginBottom: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.3,
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalLoading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  detailItemLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailItemValue: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  closeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
})
