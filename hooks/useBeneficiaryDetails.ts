"use client"

import { useState, useCallback } from "react"
import { Alert } from "react-native"
import { useFocusEffect } from "expo-router"
import { beneficiaryService } from "@/services/beneficiaryService"
import { logger } from "@/utils/logger"
import { handleError } from "@/utils/errorHandler"

export interface BeneficiaryDetails {
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

interface UseBeneficiaryDetailsReturn {
  beneficiary: BeneficiaryDetails | null
  loading: boolean
  error: string | null
  updating: boolean
  fetchBeneficiaryDetails: () => Promise<void>
  handleDeactivate: () => void
  handleReactivate: () => void
}

export function useBeneficiaryDetails(beneficiaryId: string | string[]): UseBeneficiaryDetailsReturn {
  const [beneficiary, setBeneficiary] = useState<BeneficiaryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchBeneficiaryDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      logger.info("Fetching beneficiary details", { beneficiaryId })

      const data = await beneficiaryService.getBeneficiaryDetails(beneficiaryId as string)
      setBeneficiary(data)
      logger.success("Beneficiary details fetched successfully")
    } catch (err) {
      const errorMessage = handleError(err, "Erreur lors de la récupération des détails")
      setError(errorMessage)
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

  const handleDeactivate = useCallback(() => {
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
            logger.info("Deactivating beneficiary", { beneficiaryId: beneficiary.id })

            await beneficiaryService.updateBeneficiaryStatus(beneficiary, 1)

            Alert.alert("Succès", "Le bénéficiaire a été désactivé avec succès", [
              {
                text: "OK",
                onPress: () => {
                  fetchBeneficiaryDetails()
                },
              },
            ])
            logger.success("Beneficiary deactivated successfully")
          } catch (err) {
            handleError(err, "Erreur lors de la désactivation")
            Alert.alert("Erreur", "Impossible de désactiver le bénéficiaire")
          } finally {
            setUpdating(false)
          }
        },
      },
    ])
  }, [beneficiary, fetchBeneficiaryDetails])

  const handleReactivate = useCallback(() => {
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
            logger.info("Reactivating beneficiary", { beneficiaryId: beneficiary.id })

            await beneficiaryService.updateBeneficiaryStatus(beneficiary, 0)

            Alert.alert("Succès", "Le bénéficiaire a été réactivé avec succès", [
              {
                text: "OK",
                onPress: () => {
                  fetchBeneficiaryDetails()
                },
              },
            ])
            logger.success("Beneficiary reactivated successfully")
          } catch (err) {
            handleError(err, "Erreur lors de la réactivation")
            Alert.alert("Erreur", "Impossible de réactiver le bénéficiaire")
          } finally {
            setUpdating(false)
          }
        },
      },
    ])
  }, [beneficiary, fetchBeneficiaryDetails])

  return {
    beneficiary,
    loading,
    error,
    updating,
    fetchBeneficiaryDetails,
    handleDeactivate,
    handleReactivate,
  }
}
