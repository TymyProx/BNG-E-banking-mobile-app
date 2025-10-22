/**
 * Validation utility functions
 * Centralized validation logic for forms and data
 */

export class Validators {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number (Guinea format)
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+224)?[0-9]{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  /**
   * Validate amount
   */
  static isValidAmount(amount: string | number, maxAmount?: number): boolean {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount.replace(/\s/g, "")) : amount

    if (isNaN(numAmount) || numAmount <= 0) {
      return false
    }

    if (maxAmount !== undefined && numAmount > maxAmount) {
      return false
    }

    return true
  }

  /**
   * Validate account number
   */
  static isValidAccountNumber(accountNumber: string): boolean {
    return accountNumber.length >= 10 && /^[0-9]+$/.test(accountNumber)
  }

  /**
   * Validate RIB (Relevé d'Identité Bancaire)
   */
  static isValidRIB(rib: string): boolean {
    return rib.length >= 20 && /^[0-9]+$/.test(rib)
  }

  /**
   * Validate required field
   */
  static isRequired(value: string): boolean {
    return value.trim().length > 0
  }

  /**
   * Validate minimum length
   */
  static minLength(value: string, min: number): boolean {
    return value.trim().length >= min
  }

  /**
   * Validate maximum length
   */
  static maxLength(value: string, max: number): boolean {
    return value.trim().length <= max
  }
}

/**
 * Validate amount for transfers
 */
export const validateAmount = (amount: string, maxAmount?: number): boolean => {
  return Validators.isValidAmount(amount, maxAmount)
}

/**
 * Validate transfer form
 */
export const validateTransferForm = (data: {
  transferType: "account" | "beneficiary" | null
  selectedAccount: any
  selectedDestinationAccount: any
  selectedBeneficiary: any
  amount: string
  motif: string
}): { isValid: boolean; error?: string } => {
  if (!data.transferType) {
    return { isValid: false, error: "Veuillez choisir le type de transfert" }
  }
  if (!data.selectedAccount) {
    return { isValid: false, error: "Veuillez sélectionner un compte débiteur" }
  }
  if (data.transferType === "account" && !data.selectedDestinationAccount) {
    return { isValid: false, error: "Veuillez sélectionner un compte créditeur" }
  }
  if (data.transferType === "beneficiary" && !data.selectedBeneficiary) {
    return { isValid: false, error: "Veuillez sélectionner un bénéficiaire" }
  }
  if (!data.amount.trim()) {
    return { isValid: false, error: "Veuillez saisir un montant" }
  }
  if (!data.motif.trim()) {
    return { isValid: false, error: "Veuillez saisir un motif" }
  }
  return { isValid: true }
}
