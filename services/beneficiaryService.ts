/**
 * Beneficiary Service
 * Handles all beneficiary-related API operations
 */

import { apiClient } from "./api"
import { API_ENDPOINTS } from "@/constants/Api"
import { logger } from "@/utils/logger"

export interface Beneficiary {
  id: string
  name: string
  bank: string
  rib: string
  accountNumber: string
}

export class BeneficiaryService {
  /**
   * Fetch all beneficiaries for a tenant
   */
  static async getBeneficiaries(tenantId: string): Promise<Beneficiary[]> {
    try {
      logger.info("Fetching beneficiaries", { tenantId })

      const response = await apiClient.get(API_ENDPOINTS.BENEFICIARY.LIST(tenantId))

      const beneficiaries: Beneficiary[] = (response.data.rows || []).map((ben: any) => ({
        id: ben.id,
        name: ben.name || "Bénéficiaire sans nom",
        bank: ben.bankName || "Banque inconnue",
        rib: ben.accountNumber || "",
        accountNumber: ben.accountNumber || "",
      }))

      logger.info("Beneficiaries fetched successfully", { count: beneficiaries.length })
      return beneficiaries
    } catch (error) {
      logger.error("Failed to fetch beneficiaries", error)
      throw error
    }
  }

  /**
   * Create a new beneficiary
   */
  static async createBeneficiary(tenantId: string, beneficiaryData: any): Promise<any> {
    try {
      logger.info("Creating beneficiary", { tenantId })

      const response = await apiClient.post(API_ENDPOINTS.BENEFICIARY.CREATE(tenantId), { data: beneficiaryData })

      logger.info("Beneficiary created successfully")
      return response.data
    } catch (error) {
      logger.error("Failed to create beneficiary", error)
      throw error
    }
  }

  /**
   * Update beneficiary
   */
  static async updateBeneficiary(tenantId: string, beneficiaryId: string, beneficiaryData: any): Promise<any> {
    try {
      logger.info("Updating beneficiary", { tenantId, beneficiaryId })

      const response = await apiClient.put(API_ENDPOINTS.BENEFICIARY.UPDATE(tenantId, beneficiaryId), {
        data: beneficiaryData,
      })

      logger.info("Beneficiary updated successfully")
      return response.data
    } catch (error) {
      logger.error("Failed to update beneficiary", error)
      throw error
    }
  }

  /**
   * Delete beneficiary
   */
  static async deleteBeneficiary(tenantId: string, beneficiaryId: string): Promise<void> {
    try {
      logger.info("Deleting beneficiary", { tenantId, beneficiaryId })

      await apiClient.delete(API_ENDPOINTS.BENEFICIARY.DELETE(tenantId, beneficiaryId))

      logger.info("Beneficiary deleted successfully")
    } catch (error) {
      logger.error("Failed to delete beneficiary", error)
      throw error
    }
  }
}
