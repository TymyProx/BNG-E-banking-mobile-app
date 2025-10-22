/**
 * Document Service
 * Handles document generation and download operations (statements, RIB, etc.)
 */

import * as SecureStore from "expo-secure-store"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"
import * as XLSX from "xlsx"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import { logger } from "@/utils/logger"
import { Alert } from "react-native"

export type StatementFormat = "PDF" | "EXCEL" | "CSV"
export type StatementPeriod = "3months" | "lastMonth" | "currentMonth"

interface AccountDetails {
  id: string
  accountNumber: string
  accountName: string
  currency: string
  [key: string]: any
}

export class DocumentService {
  /**
   * Get date range based on selected period
   */
  static getDateRange(period: StatementPeriod): { startDate: Date; endDate: Date } {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "currentMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { startDate, endDate }
  }

  /**
   * Handle statement request - validates account before showing modal
   */
  static handleStatementRequest(account: AccountDetails | null): boolean {
    if (!account) return false

    if (!account.accountNumber) {
      Alert.alert(
        "Compte en attente",
        "Le numéro de compte n'est pas encore attribué. Veuillez attendre la validation de votre compte.",
      )
      return false
    }

    return true
  }

  /**
   * Download account statement in specified format
   */
  static async handleDownloadStatement(
    account: AccountDetails,
    tenantId: string,
    selectedPeriod: StatementPeriod,
    selectedFormat: StatementFormat,
  ): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour télécharger un relevé")
        return
      }

      logger.info("Fetching transactions for statement")
      const transactionsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTION.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!transactionsResponse.ok) {
        throw new Error(`Erreur ${transactionsResponse.status}: ${transactionsResponse.statusText}`)
      }

      const responseData = await transactionsResponse.json()
      let allTransactions: any[] = []

      if (Array.isArray(responseData)) {
        allTransactions = responseData
      } else if (responseData && Array.isArray(responseData.data)) {
        allTransactions = responseData.data
      } else if (responseData && Array.isArray(responseData.rows)) {
        allTransactions = responseData.rows
      } else if (responseData && Array.isArray(responseData.transactions)) {
        allTransactions = responseData.transactions
      }

      const { startDate, endDate } = this.getDateRange(selectedPeriod)
      const filteredTransactions = allTransactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date || transaction.createdAt)
        const matchesAccount =
          transaction.accountId === account.id || transaction.accountNumber === account.accountNumber
        const matchesDateRange = transactionDate >= startDate && transactionDate <= endDate
        return matchesAccount && matchesDateRange
      })

      if (filteredTransactions.length === 0) {
        Alert.alert("Aucune transaction", "Aucune transaction trouvée pour la période sélectionnée.")
        return
      }

      let fileUri = ""
      const filename = `releve_${account.accountNumber}_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}`

      if (selectedFormat === "CSV") {
        fileUri = await this.generateCSV(filteredTransactions, account, filename)
      } else if (selectedFormat === "PDF") {
        fileUri = await this.generatePDF(filteredTransactions, account, startDate, endDate, filename)
      } else if (selectedFormat === "EXCEL") {
        fileUri = await this.generateExcel(filteredTransactions, account, startDate, endDate, filename)
      }

      logger.info("File saved successfully", { fileUri })

      Alert.alert("Succès", `Le relevé ${selectedFormat} a été généré avec succès`, [
        {
          text: "Partager",
          onPress: async () => {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri)
            }
          },
        },
        { text: "OK" },
      ])
    } catch (error) {
      logger.error("Error generating statement", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      Alert.alert(
        "Erreur de génération",
        `Impossible de générer le relevé.\n\nDétails: ${errorMessage}\n\nVérifiez que vous avez des transactions pour cette période.`,
      )
      throw error
    }
  }

  /**
   * Generate CSV statement
   */
  private static async generateCSV(transactions: any[], account: AccountDetails, filename: string): Promise<string> {
    let csvContent = "Date,Type,Description,Montant,Devise,Solde,Référence\n"
    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.date || transaction.createdAt).toLocaleDateString("fr-FR")
      const type = transaction.type === "credit" ? "Crédit" : "Débit"
      const description = (transaction.description || transaction.label || "N/A").replace(/"/g, '""')
      const amount = transaction.amount || 0
      const currency = transaction.currency || account.currency
      const balance = transaction.balance || 0
      const reference = transaction.reference || transaction.id

      csvContent += `"${date}","${type}","${description}",${amount},"${currency}",${balance},"${reference}"\n`
    })

    const fileUri = FileSystem.documentDirectory + filename + ".csv"
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    })
    return fileUri
  }

  /**
   * Generate PDF statement
   */
  private static async generatePDF(
    transactions: any[],
    account: AccountDetails,
    startDate: Date,
    endDate: Date,
    filename: string,
  ): Promise<string> {
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1E40AF; text-align: center; }
          .header { margin-bottom: 30px; }
          .info { margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1E40AF; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .credit { color: #059669; font-weight: bold; }
          .debit { color: #DC2626; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <h1>RELEVÉ DE COMPTE</h1>
        <div class="header">
          <div class="info"><strong>Compte:</strong> ${account.accountName}</div>
          <div class="info"><strong>Numéro:</strong> ${account.accountNumber}</div>
          <div class="info"><strong>Période:</strong> ${startDate.toLocaleDateString("fr-FR")} - ${endDate.toLocaleDateString("fr-FR")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Solde</th>
            </tr>
          </thead>
          <tbody>
    `

    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.date || transaction.createdAt).toLocaleDateString("fr-FR")
      const type = transaction.type === "credit" ? "Crédit" : "Débit"
      const description = transaction.description || transaction.label || "N/A"
      const amount = transaction.amount || 0
      const currency = transaction.currency || account.currency
      const balance = transaction.balance || 0
      const amountClass = transaction.type === "credit" ? "credit" : "debit"
      const amountSign = transaction.type === "credit" ? "+" : "-"

      htmlContent += `
        <tr>
          <td>${date}</td>
          <td>${type}</td>
          <td>${description}</td>
          <td class="${amountClass}">${amountSign}${amount} ${currency}</td>
          <td>${balance} ${currency}</td>
        </tr>
      `
    })

    htmlContent += `
          </tbody>
        </table>
        <div class="footer">
          <p>Total des transactions: ${transactions.length}</p>
          <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
        </div>
      </body>
      </html>
    `

    const { uri } = await Print.printToFileAsync({ html: htmlContent })
    const fileUri = FileSystem.documentDirectory + filename + ".pdf"
    await FileSystem.moveAsync({
      from: uri,
      to: fileUri,
    })
    return fileUri
  }

  /**
   * Generate Excel statement
   */
  private static async generateExcel(
    transactions: any[],
    account: AccountDetails,
    startDate: Date,
    endDate: Date,
    filename: string,
  ): Promise<string> {
    const worksheetData = [
      ["RELEVÉ DE COMPTE"],
      [],
      ["Compte:", account.accountName],
      ["Numéro:", account.accountNumber],
      ["Période:", `${startDate.toLocaleDateString("fr-FR")} - ${endDate.toLocaleDateString("fr-FR")}`],
      [],
      ["Date", "Type", "Description", "Montant", "Devise", "Solde", "Référence"],
    ]

    transactions.forEach((transaction: any) => {
      const date = new Date(transaction.date || transaction.createdAt).toLocaleDateString("fr-FR")
      const type = transaction.type === "credit" ? "Crédit" : "Débit"
      const description = transaction.description || transaction.label || "N/A"
      const amount = transaction.amount || 0
      const currency = transaction.currency || account.currency
      const balance = transaction.balance || 0
      const reference = transaction.reference || transaction.id

      worksheetData.push([date, type, description, amount, currency, balance, reference])
    })

    worksheetData.push([])
    worksheetData.push(["Total des transactions:", transactions.length.toString()])

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relevé")

    const excelBuffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" })
    const fileUri = FileSystem.documentDirectory + filename + ".xlsx"
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return fileUri
  }

  /**
   * Download RIB (bank identity statement)
   */
  static async handleDownloadRIB(account: AccountDetails): Promise<void> {
    if (!account.accountNumber) {
      Alert.alert(
        "Compte en attente",
        "Le numéro de compte n'est pas encore attribué. Veuillez attendre la validation de votre compte.",
      )
      return
    }

    try {
      const iban = `GN${account.accountNumber.padStart(22, "0")}`
      const bic = "BNGEGGUI"
      const codeBank = account.accountNumber.substring(0, 5)
      const codeGuichet = account.accountNumber.substring(5, 10)
      const cleRIB = account.accountNumber.substring(account.accountNumber.length - 2)

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              background-color: #f5f5f5;
            }
            .rib-container {
              background-color: white;
              border: 2px solid #1E40AF;
              border-radius: 12px;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1E40AF;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .bank-name {
              font-size: 28px;
              font-weight: bold;
              color: #1E40AF;
              margin-bottom: 10px;
            }
            .document-title {
              font-size: 20px;
              color: #666;
              margin-top: 10px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 14px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e5e5;
            }
            .info-label {
              font-size: 14px;
              color: #666;
            }
            .info-value {
              font-size: 16px;
              font-weight: 600;
              color: #1E40AF;
            }
            .iban-section {
              background-color: #f0f4ff;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .iban-value {
              font-size: 20px;
              font-weight: bold;
              color: #1E40AF;
              letter-spacing: 2px;
              text-align: center;
              margin: 10px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e5e5;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .date {
              text-align: right;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="rib-container">
            <div class="header">
              <div class="bank-name">BNG E-BANKING</div>
              <div class="document-title">RELEVÉ D'IDENTITÉ BANCAIRE</div>
            </div>

            <div class="section">
              <div class="section-title">Informations du titulaire</div>
              <div class="info-row">
                <span class="info-label">Nom du compte</span>
                <span class="info-value">${account.accountName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type de compte</span>
                <span class="info-value">${account.type}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Coordonnées bancaires</div>
              <div class="info-row">
                <span class="info-label">Code Banque</span>
                <span class="info-value">${codeBank}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Code Guichet</span>
                <span class="info-value">${codeGuichet}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Numéro de compte</span>
                <span class="info-value">${account.accountNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Clé RIB</span>
                <span class="info-value">${cleRIB}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Agence</span>
                <span class="info-value">${account.agency || "Agence Principale"}</span>
              </div>
            </div>

            <div class="iban-section">
              <div class="section-title" style="text-align: center;">IBAN</div>
              <div class="iban-value">${iban}</div>
            </div>

            <div class="section">
              <div class="info-row">
                <span class="info-label">Code BIC/SWIFT</span>
                <span class="info-value">${bic}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Devise</span>
                <span class="info-value">${account.currency}</span>
              </div>
            </div>

            <div class="footer">
              <p>Ce document est un relevé d'identité bancaire officiel.</p>
              <p>Il peut être utilisé pour effectuer des virements bancaires.</p>
            </div>

            <div class="date">
              Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
            </div>
          </div>
        </body>
        </html>
      `

      logger.info("Generating RIB PDF")
      const { uri } = await Print.printToFileAsync({ html: htmlContent })

      const filename = `RIB_${account.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`
      const fileUri = FileSystem.documentDirectory + filename

      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      })

      logger.info("RIB generated successfully", { fileUri })

      Alert.alert(
        "RIB généré avec succès",
        "Votre relevé d'identité bancaire a été créé. Vous pouvez maintenant le partager ou le sauvegarder.",
        [
          {
            text: "OK",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: "application/pdf",
                  dialogTitle: "Partager votre RIB",
                  UTI: "com.adobe.pdf",
                })
              }
            },
          },
        ],
      )
    } catch (error) {
      logger.error("Error generating RIB", error)
      Alert.alert("Erreur", "Impossible de générer le RIB. Veuillez réessayer.")
      throw error
    }
  }
}
