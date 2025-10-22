/**
 * Base API client
 * Centralized API communication with error handling
 */

import * as SecureStore from "expo-secure-store"
import { API_CONFIG } from "@/constants/Api"
import { logger } from "@/utils/logger"
import { ErrorHandler } from "@/utils/errorHandler"

export interface ApiResponse<T = any> {
  data: T
  status: number
  message?: string
}

export interface ApiError {
  message: string
  status: number
  details?: any
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL
  }

  /**
   * Get authentication token from secure storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync("token")
    } catch (error) {
      logger.error("Failed to get auth token", error)
      return null
    }
  }

  /**
   * Build headers for API requests
   */
  private async buildHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const token = await this.getAuthToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response, endpoint: string): Promise<ApiResponse<T>> {
    const status = response.status

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      logger.apiError(endpoint, { status, error: errorText })

      throw {
        message: errorText || `HTTP Error ${status}`,
        status,
        details: errorText,
      } as ApiError
    }

    const contentType = response.headers.get("content-type")
    let data: T

    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = (await response.text()) as any
    }

    logger.apiResponse(endpoint, status, data)

    return {
      data,
      status,
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const headers = await this.buildHeaders(customHeaders)

      logger.apiRequest(endpoint, "GET")

      const response = await fetch(url, {
        method: "GET",
        headers,
      })

      return await this.handleResponse<T>(response, endpoint)
    } catch (error) {
      throw ErrorHandler.handleApiError(error, `GET ${endpoint}`)
    }
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const headers = await this.buildHeaders(customHeaders)

      logger.apiRequest(endpoint, "POST", body)

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      return await this.handleResponse<T>(response, endpoint)
    } catch (error) {
      throw ErrorHandler.handleApiError(error, `POST ${endpoint}`)
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const headers = await this.buildHeaders(customHeaders)

      logger.apiRequest(endpoint, "PUT", body)

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      return await this.handleResponse<T>(response, endpoint)
    } catch (error) {
      throw ErrorHandler.handleApiError(error, `PUT ${endpoint}`)
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const headers = await this.buildHeaders(customHeaders)

      logger.apiRequest(endpoint, "DELETE")

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      })

      return await this.handleResponse<T>(response, endpoint)
    } catch (error) {
      throw ErrorHandler.handleApiError(error, `DELETE ${endpoint}`)
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
