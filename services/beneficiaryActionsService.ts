/**
 * Beneficiary Actions Service
 * Handles beneficiary-specific actions like activate/deactivate and fetching details
 */

import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import { logger } from "@/utils/logger"
import { Alert } from "react-native"

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

export class BeneficiaryActionsService {
  /**
   * Fetch beneficiary details
   */
  static async fetchBeneficiaryDetails(beneficiaryId: string): Promise<BeneficiaryDetails> {
    try {
      logger.info("Fetching beneficiary details", { beneficiaryId })

      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        throw new Error("Token d'authentification non trouvé")
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.BENEFICIARY.DETAILS(API_CONFIG.TENANT_ID, beneficiaryId)}`,
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
      logger.info("Beneficiary details fetched successfully")
      return data
    } catch (error) {
      logger.error("Failed to fetch beneficiary details", error)
      throw error
    }
  }

  /**
   * Deactivate a beneficiary
   */
  static async handleDeactivate(beneficiary: BeneficiaryDetails, onSuccess: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      Alert.alert("Désactiver le bénéficiaire", `Êtes-vous sûr de vouloir désactiver ${beneficiary.name} ?`, [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => reject(new Error("Cancelled")),
        },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: async () => {
            try {
              logger.info("Deactivating beneficiary", { beneficiaryId: beneficiary.id })

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

              logger.info("Beneficiary deactivated successfully")

              Alert.alert("Succès", "Le bénéficiaire a été désactivé avec succès", [
                {
                  text: "OK",
                  onPress: () => {
                    onSuccess()
                    resolve()
                  },
                },
              ])
            } catch (err) {
              logger.error("Error deactivating beneficiary", err)
              Alert.alert("Erreur", "Impossible de désactiver le bénéficiaire")
              reject(err)
            }
          },
        },
      ])
    })
  }

  /**
   * Reactivate a beneficiary
   */
  static async handleReactivate(beneficiary: BeneficiaryDetails, onSuccess: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      Alert.alert("Réactiver le bénéficiaire", `Êtes-vous sûr de vouloir réactiver ${beneficiary.name} ?`, [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => reject(new Error("Cancelled")),
        },
        {
          text: "Réactiver",
          onPress: async () => {
            try {
              logger.info("Reactivating beneficiary", { beneficiaryId: beneficiary.id })

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

              logger.info("Beneficiary reactivated successfully")

              Alert.alert("Succès", "Le bénéficiaire a été réactivé avec succès", [
                {
                  text: "OK",
                  onPress: () => {
                    onSuccess()
                    resolve()
                  },
                },
              ])
            } catch (err) {
              logger.error("Error reactivating beneficiary", err)
              Alert.alert("Erreur", "Impossible de réactiver le bénéficiaire")
              reject(err)
            }
          },
        },
      ])
    })
  }
}
