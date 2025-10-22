/**
 * Centralized error handling utility
 * Provides consistent error handling and user-friendly messages
 */

import { Alert } from "react-native"
import { logger } from "./logger"

export interface AppError {
  code: string
  message: string
  details?: any
}

export class ErrorHandler {
  /**
   * Handle API errors and show appropriate user messages
   */
  static handleApiError(error: any, context: string): AppError {
    logger.apiError(context, error)

    if (error instanceof Error) {
      return {
        code: "API_ERROR",
        message: error.message,
        details: error,
      }
    }

    if (typeof error === "object" && error.message) {
      return {
        code: "API_ERROR",
        message: error.message,
        details: error,
      }
    }

    return {
      code: "UNKNOWN_ERROR",
      message: "Une erreur inattendue est survenue",
      details: error,
    }
  }

  /**
   * Show error alert to user
   */
  static showErrorAlert(title: string, message: string): void {
    Alert.alert(title, message, [{ text: "OK" }])
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(): AppError {
    logger.error("Network error occurred")
    return {
      code: "NETWORK_ERROR",
      message: "Erreur de connexion. Vérifiez votre connexion internet.",
    }
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(): AppError {
    logger.error("Authentication error occurred")
    return {
      code: "AUTH_ERROR",
      message: "Session expirée. Veuillez vous reconnecter.",
    }
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, message: string): AppError {
    logger.warn(`Validation error: ${field}`, { message })
    return {
      code: "VALIDATION_ERROR",
      message,
      details: { field },
    }
  }
}
