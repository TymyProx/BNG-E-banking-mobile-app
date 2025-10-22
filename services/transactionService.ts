/**
 * Transaction Service
 * Handles all transaction-related API operations
 */

import { apiClient } from "./api"
import { API_ENDPOINTS } from "@/constants/Api"
import { logger } from "@/utils/logger"
import { accountService } from "./accountService"

export interface TransactionData {
  txnId: string
  accountId: string
  txnType: "TRANSFERT" | "VIREMENT"
  amount: string
  valueDate: string
  status: string
  description: string
  creditAccount: string
  commentNotes: string
}

export class TransactionService {
  /**
   * Create a new transaction
   */
  static async createTransaction(tenantId: string, transactionData: TransactionData): Promise<any> {
    try {
      logger.info("Creating transaction", { tenantId, txnId: transactionData.txnId })

      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.CREATE(tenantId), { data: transactionData })

      logger.info("Transaction created successfully", { txnId: transactionData.txnId })
      return response.data
    } catch (error) {
      logger.error("Failed to create transaction", error)
      throw error
    }
  }

  /**
   * Process account-to-account transfer with balance updates
   */
  static async processTransfer(
    tenantId: string,
    sourceAccountId: string,
    destinationAccountId: string | null,
    amount: number,
  ): Promise<void> {
    try {
      logger.info("Processing transfer", {
        tenantId,
        sourceAccountId,
        destinationAccountId,
        amount,
      })

      // Update source account (debit)
      await accountService.updateAccountBalance(tenantId, sourceAccountId, -amount)

      // If destination account exists, update it (credit)
      if (destinationAccountId) {
        await accountService.updateAccountBalance(tenantId, destinationAccountId, amount)
      }

      logger.info("Transfer processed successfully")
    } catch (error) {
      logger.error("Failed to process transfer", error)
      throw error
    }
  }

  /**
   * Get transaction list
   */
  static async getTransactions(tenantId: string): Promise<any> {
    try {
      logger.info("Fetching transactions", { tenantId })

      const response = await apiClient.get(API_ENDPOINTS.TRANSACTION.LIST(tenantId))

      logger.info("Transactions fetched successfully", { count: response.data.rows?.length || 0 })

      return response.data
    } catch (error) {
      logger.error("Failed to fetch transactions", error)
      throw error
    }
  }
}

export const transactionService = TransactionService
