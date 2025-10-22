/**
 * Beneficiary Service
 * Handles all beneficiary-related API operations
 */

import { apiClient } from "./api"
import { API_ENDPOINTS, API_CONFIG } from "@/constants/Api"
import { logger } from "@/utils/logger"

export interface Beneficiary {
  id: string
  name: string
  bank: string
  rib: string
  accountNumber: string
}

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

export interface BeneficiaryListResponse {
  rows: any[]
  count: number
}

export class BeneficiaryService {
  /**
   * Fetch all beneficiaries for a tenant
   */
  static async getBeneficiaries(tenantId: string): Promise<BeneficiaryListResponse> {
    try {
      logger.info("Fetching beneficiaries", { tenantId })

      const response = await apiClient.get<BeneficiaryListResponse>(API_ENDPOINTS.BENEFICIARY.LIST(tenantId))

      logger.info("Beneficiaries fetched successfully", { count: response.data.rows?.length || 0 })
      return response.data
    } catch (error) {
      logger.error("Failed to fetch beneficiaries", error)
      throw error
    }
  }

  /**
   * Fetch beneficiary details by ID
   */
  static async getBeneficiaryDetails(beneficiaryId: string): Promise<BeneficiaryDetails> {
    try {
      logger.info("Fetching beneficiary details", { beneficiaryId })

      const response = await apiClient.get(API_ENDPOINTS.BENEFICIARY.DETAILS(API_CONFIG.TENANT_ID, beneficiaryId))

      logger.info("Beneficiary details fetched successfully")
      return response.data
    } catch (error) {
      logger.error("Failed to fetch beneficiary details", error)
      throw error
    }
  }

  /**
   * Update beneficiary status (activate/deactivate)
   */
  static async updateBeneficiaryStatus(beneficiary: BeneficiaryDetails, status: number): Promise<any> {
    try {
      logger.info("Updating beneficiary status", { beneficiaryId: beneficiary.id, status })

      const response = await apiClient.put(API_ENDPOINTS.BENEFICIARY.UPDATE(API_CONFIG.TENANT_ID, beneficiary.id), {
        data: {
          beneficiaryId: beneficiary.beneficiaryId,
          customerId: beneficiary.customerId,
          name: beneficiary.name,
          accountNumber: beneficiary.accountNumber,
          bankCode: beneficiary.bankCode,
          bankName: beneficiary.bankName,
          status,
          typeBeneficiary: beneficiary.typeBeneficiary,
          favoris: beneficiary.favoris,
        },
      })

      logger.info("Beneficiary status updated successfully")
      return response.data
    } catch (error) {
      logger.error("Failed to update beneficiary status", error)
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

export const beneficiaryService = BeneficiaryService
