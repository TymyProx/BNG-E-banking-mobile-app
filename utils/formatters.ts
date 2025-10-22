/**
 * Formatting utility functions
 * Centralized formatting logic for display
 */

export class Formatters {
  /**
   * Format amount with thousand separators
   */
  static formatAmount(amount: string | number): string {
    const numValue = typeof amount === "string" ? amount.replace(/\D/g, "") : amount.toString()

    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number, currency = "GNF"): string {
    return `${amount.toLocaleString("fr-FR")} ${currency}`
  }

  /**
   * Format date
   */
  static formatDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  /**
   * Format date and time
   */
  static formatDateTime(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  /**
   * Format phone number
   */
  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }
    return phone
  }

  /**
   * Format account number
   */
  static formatAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/(.{4})/g, "$1 ").trim()
  }

  /**
   * Mask account number (show only last 4 digits)
   */
  static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber
    return `**** **** ${accountNumber.slice(-4)}`
  }

  /**
   * Get beneficiary status text
   */
  static getBeneficiaryStatusText(status: number): string {
    switch (status) {
      case 0:
        return "Actif"
      case 1:
        return "Inactif"
      default:
        return "Inconnu"
    }
  }

  /**
   * Get beneficiary status color
   */
  static getBeneficiaryStatusColor(status: number): string {
    switch (status) {
      case 0:
        return "#22c55e"
      case 1:
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }
}

export const formatAmount = (amount: string | number): string => {
  return Formatters.formatAmount(amount)
}

export const formatCurrency = (amount: number, currency = "GNF"): string => {
  return Formatters.formatCurrency(amount, currency)
}

export const formatDate = (date: string | Date): string => {
  return Formatters.formatDate(date)
}

export const formatDateTime = (date: string | Date): string => {
  return Formatters.formatDateTime(date)
}

export const formatPhone = (phone: string): string => {
  return Formatters.formatPhone(phone)
}

export const formatAccountNumber = (accountNumber: string): string => {
  return Formatters.formatAccountNumber(accountNumber)
}

export const maskAccountNumber = (accountNumber: string): string => {
  return Formatters.maskAccountNumber(accountNumber)
}
