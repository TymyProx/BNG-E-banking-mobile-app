/**
 * Account Service
 * Handles all account-related API operations
 */

import { apiClient } from "./api"
import { API_ENDPOINTS } from "@/constants/Api"
import { logger } from "@/utils/logger"

export interface Account {
  id: string
  name: string
  number: string
  availableBalance: number
  type: "courant" | "epargne" | "terme"
  currency: string
  status?: string
}

export interface AccountListResponse {
  rows: any[]
  count: number
}

export class AccountService {
  /**
   * Fetch all accounts for a tenant
   */
  static async getAccounts(tenantId: string): Promise<AccountListResponse> {
    try {
      logger.info("Fetching accounts", { tenantId })

      const response = await apiClient.get<AccountListResponse>(API_ENDPOINTS.ACCOUNT.LIST(tenantId))

      logger.info("Accounts fetched successfully", { count: response.data.rows?.length || 0 })
      return response.data
    } catch (error) {
      logger.error("Failed to fetch accounts", error)
      throw error
    }
  }

  /**
   * Get account details
   */
  static async getAccountDetails(tenantId: string, accountId: string): Promise<any> {
    try {
      logger.info("Fetching account details", { tenantId, accountId })

      const response = await apiClient.get(API_ENDPOINTS.ACCOUNT.DETAILS(tenantId, accountId))

      const account = response.data.data || response.data
      logger.info("Account details fetched successfully", { accountId })

      return account
    } catch (error) {
      logger.error("Failed to fetch account details", error)
      throw error
    }
  }

  /**
   * Update account balance
   */
  static async updateAccountBalance(tenantId: string, accountId: string, amountChange: number): Promise<void> {
    try {
      logger.info("Updating account balance", {
        tenantId,
        accountId,
        amountChange,
      })

      // Fetch current account data
      const accountData = await this.getAccountDetails(tenantId, accountId)
      const currentBalance = Number.parseFloat(accountData.availableBalance || "0")
      const newBalance = currentBalance + amountChange

      // Verify sufficient balance for debits
      if (newBalance < 0) {
        throw new Error(`Solde insuffisant. Solde disponible: ${currentBalance}, Montant: ${Math.abs(amountChange)}`)
      }

      const updateData = {
        data: {
          ...accountData,
          availableBalance: newBalance.toString(),
        },
      }

      await apiClient.put(API_ENDPOINTS.ACCOUNT.UPDATE(tenantId, accountId), updateData)

      logger.info("Account balance updated successfully", { accountId, newBalance })
    } catch (error) {
      logger.error("Failed to update account balance", error)
      throw error
    }
  }

  /**
   * Create new account
   */
  static async createAccount(tenantId: string, accountData: any): Promise<any> {
    try {
      logger.info("Creating new account", { tenantId })

      const response = await apiClient.post(API_ENDPOINTS.ACCOUNT.CREATE(tenantId), { data: accountData })

      logger.info("Account created successfully")
      return response.data
    } catch (error) {
      logger.error("Failed to create account", error)
      throw error
    }
  }
}

export const accountService = AccountService
