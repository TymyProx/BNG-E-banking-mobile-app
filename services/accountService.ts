/**
 * Account Service
 * Handles all account-related API operations
 */

import { apiClient } from "./api"
import { API_ENDPOINTS, API_CONFIG } from "@/constants/Api"
import { logger } from "@/utils/logger"
import * as SecureStore from "expo-secure-store"

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
   * Fetch all active accounts for a tenant
   */
  static async fetchAccounts(tenantId: string): Promise<Account[]> {
    try {
      logger.info("Fetching accounts", { tenantId })

      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        throw new Error("Token d'authentification non trouvé")
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const activeAccounts = data.rows?.filter((acc: any) => acc.status?.toLowerCase() === "actif") || []

      logger.info("Accounts fetched successfully", { count: activeAccounts.length })
      return activeAccounts
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
  static async updateAccountBalance(
    tenantId: string,
    accountId: string,
    newBalance: number,
    accountData: any,
  ): Promise<void> {
    try {
      logger.info("Updating account balance", {
        tenantId,
        accountId,
        newBalance,
      })

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
