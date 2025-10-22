/**
 * Form Handlers Service
 * Handles form-related operations like selections and validations
 */

interface Bank {
  name: string
  code: string
  agencies: { code: string; name: string }[]
}

export class FormHandlersService {
  /**
   * Handle beneficiary type selection
   */
  static handleBeneficiaryTypeSelect(
    type: string,
    updateFormData: (updates: any) => void,
    closeModal: () => void,
  ): void {
    updateFormData({
      beneficiaryType: type,
      agencyCode: "",
      accountNumber: "",
      ribKey: "",
      bank: "",
      bankCode: "",
      selectedAgencyCode: "",
      iban: "",
      swiftCode: "",
    })
    closeModal()
  }

  /**
   * Handle bank selection
   */
  static handleBankSelect(bank: Bank, updateFormData: (updates: any) => void, closeModal: () => void): void {
    updateFormData({
      bank: bank.name,
      bankCode: bank.code,
      selectedAgencyCode: "",
    })
    closeModal()
  }

  /**
   * Handle agency selection
   */
  static handleAgencySelect(
    agencyCode: string,
    updateFormData: (field: string, value: string) => void,
    closeModal: () => void,
  ): void {
    updateFormData("selectedAgencyCode", agencyCode)
    closeModal()
  }

  /**
   * Handle BNG agency selection
   */
  static handleBNGAgencySelect(
    agencyCode: string,
    updateFormData: (field: string, value: string) => void,
    closeModal: () => void,
  ): void {
    updateFormData("agencyCode", agencyCode)
    closeModal()
  }
}
