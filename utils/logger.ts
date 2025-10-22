/**
 * Centralized logging utility
 * Provides consistent logging across the application
 */

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

const __DEV__ = process.env.NODE_ENV === "development" // Declare the __DEV__ variable

class Logger {
  private prefix = "[BNG]"
  private isDevelopment = __DEV__

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : ""
    return `${this.prefix} [${level.toUpperCase()}] ${timestamp} - ${message}${dataStr}`
  }

  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage("info", message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage("warn", message, data))
    }
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error
    console.error(this.formatMessage("error", message, errorData))
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage("debug", message, data))
    }
  }

  // Specific logging methods for common operations
  apiRequest(endpoint: string, method: string, data?: any): void {
    this.info(`API Request: ${method} ${endpoint}`, data)
  }

  apiResponse(endpoint: string, status: number, data?: any): void {
    this.info(`API Response: ${endpoint} (${status})`, data)
  }

  apiError(endpoint: string, error: any): void {
    this.error(`API Error: ${endpoint}`, error)
  }
}

export const logger = new Logger()
