"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"
import * as XLSX from "xlsx"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  time: string
  balance: number
  category: string
  reference: string
}

interface AccountDetails {
  id: string
  accountId: string
  customerId: string
  accountNumber: string
  accountName: string
  currency: string
  bookBalance: string | null
  availableBalance: string | null
  status: string
  type: string
  agency: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  tenantId: string
}

export default function AccountDetailsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const params = useLocalSearchParams()
  const [account, setAccount] = useState<AccountDetails | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const { tenantId } = useAuth()

  const loadAccountDetails = async () => {
    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")
      const accountId = params.id as string

      if (!token || !tenantId || !accountId) {
        console.log("[v0] Missing token, tenantId, or accountId")
        Alert.alert("Erreur", "Informations d'authentification manquantes")
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ACCOUNT.DETAILS(tenantId, accountId)}`, {
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
      console.log("[v0] Account details loaded:", data)
      setAccount(data)

      const transactionsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTION.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        console.log("[v0] Transactions response:", transactionsData)

        let allTransactions: any[] = []
        if (Array.isArray(transactionsData)) {
          allTransactions = transactionsData
        } else if (transactionsData && Array.isArray(transactionsData.data)) {
          allTransactions = transactionsData.data
        } else if (transactionsData && Array.isArray(transactionsData.rows)) {
          allTransactions = transactionsData.rows
        } else if (transactionsData && Array.isArray(transactionsData.transactions)) {
          allTransactions = transactionsData.transactions
        }

        const accountTransactions = allTransactions
          .filter(
            (transaction: any) =>
              transaction.accountId === accountId ||
              transaction.accountNumber === data.accountNumber ||
              transaction.compteId === accountId,
          )
          .map((transaction: any) => ({
            id: transaction.id || transaction.transactionId || String(Math.random()),
            type: (transaction.type === "credit" || transaction.type === "CREDIT" ? "credit" : "debit") as
              | "credit"
              | "debit",
            amount: Number.parseFloat(transaction.amount || transaction.montant || "0"),
            description: transaction.description || transaction.label || transaction.libelle || "Transaction",
            date: transaction.date || transaction.createdAt || new Date().toISOString(),
            time: transaction.time || new Date(transaction.date || transaction.createdAt).toLocaleTimeString("fr-FR"),
            balance: Number.parseFloat(transaction.balance || transaction.solde || "0"),
            category: transaction.category || transaction.categorie || "Autre",
            reference: transaction.reference || transaction.id || "N/A",
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending

        console.log("[v0] Filtered account transactions:", accountTransactions.length)
        setTransactions(accountTransactions)
      } else {
        console.log("[v0] Failed to fetch transactions, using empty array")
        setTransactions([])
      }
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des détails:", error)
      Alert.alert("Erreur", "Impossible de charger les détails du compte. Veuillez réessayer.")
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccountDetails()
    setRefreshing(false)
  }

  useEffect(() => {
    loadAccountDetails()
  }, [])

  const formatAmount = (amount: number | string | null) => {
    if (amount === null || amount === undefined) {
      return "En attente"
    }
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("fr-FR").format(Math.abs(numAmount))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    })
  }

  const getTransactionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "salaire":
        return "banknote"
      case "retrait":
        return "minus.circle"
      case "mobile money":
        return "phone"
      case "virement":
        return "arrow.left.arrow.right"
      case "frais bancaires":
        return "building.columns"
      default:
        return "creditcard"
    }
  }

  const [showStatementModal, setShowStatementModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<"3months" | "lastMonth" | "currentMonth">("currentMonth")
  const [selectedFormat, setSelectedFormat] = useState<"PDF" | "EXCEL" | "CSV">("PDF")
  const [isDownloading, setIsDownloading] = useState(false)

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (selectedPeriod) {
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

  const handleStatementRequest = () => {
    if (!account) return

    if (!account.accountNumber) {
      Alert.alert(
        "Compte en attente",
        "Le numéro de compte n'est pas encore attribué. Veuillez attendre la validation de votre compte.",
      )
      return
    }

    setShowStatementModal(true)
  }

  const handleDownloadStatement = async () => {
    if (!account || !tenantId) return

    setIsDownloading(true)
    try {
      const token = await SecureStore.getItemAsync("token")
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour télécharger un relevé")
        return
      }

      console.log("[v0] Récupération des transactions...")
      const transactionsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTION.LIST(tenantId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!transactionsResponse.ok) {
        // FIX: Undeclared variable 'response' replaced with 'transactionsResponse'
        throw new Error(`Erreur ${transactionsResponse.status}: ${transactionsResponse.statusText}`)
      }

      const responseData = await transactionsResponse.json()
      console.log("[v0] Réponse API complète:", JSON.stringify(responseData, null, 2))
      console.log("[v0] Type de responseData:", typeof responseData)
      console.log("[v0] Est un tableau?", Array.isArray(responseData))

      let allTransactions: any[] = []

      if (Array.isArray(responseData)) {
        allTransactions = responseData
      } else if (responseData && Array.isArray(responseData.data)) {
        allTransactions = responseData.data
      } else if (responseData && Array.isArray(responseData.rows)) {
        allTransactions = responseData.rows
      } else if (responseData && Array.isArray(responseData.transactions)) {
        allTransactions = responseData.transactions
      } else {
        console.log("[v0] Structure de réponse non reconnue:", Object.keys(responseData || {}))
        throw new Error("Format de réponse API non reconnu")
      }

      console.log("[v0] Nombre total de transactions:", allTransactions.length)

      const { startDate, endDate } = getDateRange()
      const filteredTransactions = allTransactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date || transaction.createdAt)
        const matchesAccount =
          transaction.accountId === account.id || transaction.accountNumber === account.accountNumber
        const matchesDateRange = transactionDate >= startDate && transactionDate <= endDate

        console.log("[v0] Transaction:", {
          id: transaction.id,
          accountId: transaction.accountId,
          accountNumber: transaction.accountNumber,
          date: transactionDate,
          matchesAccount,
          matchesDateRange,
        })

        return matchesAccount && matchesDateRange
      })

      console.log("[v0] Transactions filtrées:", filteredTransactions.length)

      if (filteredTransactions.length === 0) {
        Alert.alert("Aucune transaction", "Aucune transaction trouvée pour la période sélectionnée.")
        setIsDownloading(false)
        return
      }

      let fileUri = ""
      const filename = `releve_${account.accountNumber}_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}`

      if (selectedFormat === "CSV") {
        // Generate CSV file
        let csvContent = "Date,Type,Description,Montant,Devise,Solde,Référence\n"
        filteredTransactions.forEach((transaction: any) => {
          const date = new Date(transaction.date || transaction.createdAt).toLocaleDateString("fr-FR")
          const type = transaction.type === "credit" ? "Crédit" : "Débit"
          const description = (transaction.description || transaction.label || "N/A").replace(/"/g, '""')
          const amount = transaction.amount || 0
          const currency = transaction.currency || account.currency
          const balance = transaction.balance || 0
          const reference = transaction.reference || transaction.id

          csvContent += `"${date}","${type}","${description}",${amount},"${currency}",${balance},"${reference}"\n`
        })

        fileUri = FileSystem.documentDirectory + filename + ".csv"
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        })
      } else if (selectedFormat === "PDF") {
        // Generate PDF using HTML
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

        filteredTransactions.forEach((transaction: any) => {
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
              <p>Total des transactions: ${filteredTransactions.length}</p>
              <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
            </div>
          </body>
          </html>
        `

        const { uri } = await Print.printToFileAsync({ html: htmlContent })
        fileUri = FileSystem.documentDirectory + filename + ".pdf"
        await FileSystem.moveAsync({
          from: uri,
          to: fileUri,
        })
      } else if (selectedFormat === "EXCEL") {
        // Generate Excel file
        const worksheetData = [
          ["RELEVÉ DE COMPTE"],
          [],
          ["Compte:", account.accountName],
          ["Numéro:", account.accountNumber],
          ["Période:", `${startDate.toLocaleDateString("fr-FR")} - ${endDate.toLocaleDateString("fr-FR")}`],
          [],
          ["Date", "Type", "Description", "Montant", "Devise", "Solde", "Référence"],
        ]

        filteredTransactions.forEach((transaction: any) => {
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
        worksheetData.push(["Total des transactions:", filteredTransactions.length.toString()])

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relevé")

        const excelBuffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" })
        fileUri = FileSystem.documentDirectory + filename + ".xlsx"
        await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystem.EncodingType.Base64,
        })
      }

      console.log("[v0] Fichier sauvegardé avec succès:", fileUri)

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
      setShowStatementModal(false)
    } catch (error) {
      console.error("[v0] Erreur lors de la génération du relevé:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      Alert.alert(
        "Erreur de génération",
        `Impossible de générer le relevé.\n\nDétails: ${errorMessage}\n\nVérifiez que vous avez des transactions pour cette période.`,
      )
    } finally {
      setIsDownloading(false)
    }
  }

  // FIX: Undeclared variable 'handleRIBRequest' removed, 'handleDownloadRIB' used instead.
  const handleDownloadRIB = async () => {
    if (!account) return

    if (!account.accountNumber) {
      Alert.alert(
        "Compte en attente",
        "Le numéro de compte n'est pas encore attribué. Veuillez attendre la validation de votre compte.",
      )
      return
    }

    try {
      // Générer un IBAN fictif basé sur le numéro de compte (à remplacer par les vraies données de l'API)
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

      console.log("[v0] Génération du RIB en PDF...")
      const { uri } = await Print.printToFileAsync({ html: htmlContent })

      const filename = `RIB_${account.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`
      const fileUri = FileSystem.documentDirectory + filename

      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      })

      console.log("[v0] RIB généré avec succès:", fileUri)

      Alert.alert(
        "RIB généré avec succès",
        "Votre relevé d'identité bancaire a été créé. Vous pouvez maintenant le partager ou le sauvegarder.",
        [
          {
            text: "OK",
            onPress: async () => {
              // Ouvrir le menu de partage après confirmation
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
      console.error("[v0] Erreur lors de la génération du RIB:", error)
      Alert.alert("Erreur", "Impossible de générer le RIB. Veuillez réessayer.")
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!account) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Compte introuvable</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#FBBF24" />
          </TouchableOpacity>
          {/* </CHANGE> */}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Détails du compte</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Account Card */}
        <View style={[styles.accountCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.accountHeader}>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.text }]}>{account.accountName}</Text>
              <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                {account.accountNumber
                  ? account.accountNumber.slice(-4).padStart(account.accountNumber.length, "•")
                  : "Numéro non attribué"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <IconSymbol name={showBalance ? "eye.fill" : "eye.slash.fill"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceSection}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
            <Text
              style={[
                styles.balanceAmount,
                {
                  color:
                    account.availableBalance === null
                      ? colors.textSecondary
                      : Number.parseFloat(account.availableBalance) >= 0
                        ? "#059669"
                        : "#DC2626",
                },
              ]}
            >
              {showBalance
                ? account.availableBalance === null
                  ? "En attente"
                  : `${Number.parseFloat(account.availableBalance) >= 0 ? "" : "-"}${formatAmount(account.availableBalance)} ${account.currency}`
                : "••••••"}
            </Text>
            <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
              Dernière mise à jour: {new Date(account.updatedAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>

          <View style={styles.accountActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: account.accountNumber ? colors.background : colors.border,
                  borderWidth: 1,
                  borderColor: account.accountNumber ? colors.border : colors.border,
                  opacity: account.accountNumber ? 1 : 0.5,
                },
              ]}
              onPress={handleStatementRequest}
              disabled={!account.accountNumber}
            >
              <IconSymbol
                name="doc.text"
                size={16}
                color={account.accountNumber ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: account.accountNumber ? colors.primary : colors.textSecondary },
                ]}
              >
                Demander Relevé
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: account.accountNumber ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderColor: account.accountNumber ? colors.primary : colors.border,
                  opacity: account.accountNumber ? 1 : 0.5,
                },
              ]}
              onPress={handleDownloadRIB}
              disabled={!account.accountNumber}
            >
              <IconSymbol name="arrow.down.doc" size={16} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>Télécharger RIB</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Informations du compte</Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.accountNumber || "Non attribué"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Agence</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.agency || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Devise</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{account.currency}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Solde comptable</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {account.bookBalance === null
                  ? "En attente"
                  : `${formatAmount(account.bookBalance)} ${account.currency}`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {account.availableBalance === null
                  ? "En attente"
                  : `${formatAmount(account.availableBalance)} ${account.currency}`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Créé le</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(account.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Statut</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      account.status.toLowerCase() === "active" || account.status.toLowerCase() === "actif"
                        ? "#059669"
                        : account.status.toLowerCase() === "en attente"
                          ? "#F59E0B"
                          : "#DC2626",
                  },
                ]}
              >
                <Text style={styles.statusText}>{account.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.transactionsCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.text }]}>Dernières transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <IconSymbol name="tray" size={48} color={colors.textSecondary} />
              <Text style={[{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }]}>
                Aucune transaction disponible
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: transaction.type === "credit" ? "#059669" + "15" : "#DC2626" + "15",
                        },
                      ]}
                    >
                      <IconSymbol
                        name={getTransactionIcon(transaction.category) as any}
                        size={16}
                        color={transaction.type === "credit" ? "#059669" : "#DC2626"}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDescription, { color: colors.text }]}>
                        {transaction.description}
                      </Text>
                      <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                        {formatDate(transaction.date)} • {transaction.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: transaction.type === "credit" ? "#059669" : "#DC2626" },
                      ]}
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      {formatAmount(transaction.amount)} {account?.currency || "GNF"}
                    </Text>
                    <Text style={[styles.transactionBalance, { color: colors.textSecondary }]}>
                      Solde: {formatAmount(transaction.balance)} {account?.currency || "GNF"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Statement Modal */}
      <Modal
        visible={showStatementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Demander un relevé</Text>
              <TouchableOpacity onPress={() => setShowStatementModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Account Info */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Compte sélectionné</Text>
                <View style={[styles.selectedAccountCard, { backgroundColor: colors.background }]}>
                  <View style={styles.selectedAccountInfo}>
                    <Text style={[styles.selectedAccountName, { color: colors.text }]}>{account?.accountName}</Text>
                    <Text style={[styles.selectedAccountNumber, { color: colors.textSecondary }]}>
                      {account?.accountNumber}
                    </Text>
                  </View>
                  <View style={[styles.selectedAccountBadge, { backgroundColor: colors.primary + "15" }]}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  </View>
                </View>
              </View>

              {/* Period Selection */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Période</Text>
                <View style={styles.periodOptions}>
                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      {
                        backgroundColor: selectedPeriod === "currentMonth" ? colors.primary : colors.background,
                        borderColor: selectedPeriod === "currentMonth" ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPeriod("currentMonth")}
                  >
                    <IconSymbol
                      name="calendar"
                      size={20}
                      color={selectedPeriod === "currentMonth" ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[
                        styles.periodText,
                        { color: selectedPeriod === "currentMonth" ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      Mois en cours
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      {
                        backgroundColor: selectedPeriod === "lastMonth" ? colors.primary : colors.background,
                        borderColor: selectedPeriod === "lastMonth" ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPeriod("lastMonth")}
                  >
                    <IconSymbol
                      name="calendar.badge.clock"
                      size={20}
                      color={selectedPeriod === "lastMonth" ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[styles.periodText, { color: selectedPeriod === "lastMonth" ? "#FFFFFF" : colors.text }]}
                    >
                      Mois dernier
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      {
                        backgroundColor: selectedPeriod === "3months" ? colors.primary : colors.background,
                        borderColor: selectedPeriod === "3months" ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPeriod("3months")}
                  >
                    <IconSymbol
                      name="calendar.badge.plus"
                      size={20}
                      color={selectedPeriod === "3months" ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[styles.periodText, { color: selectedPeriod === "3months" ? "#FFFFFF" : colors.text }]}
                    >
                      3 derniers mois
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Format Selection */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Format</Text>
                <View style={styles.formatOptions}>
                  {(["PDF", "EXCEL", "CSV"] as const).map((format) => (
                    <TouchableOpacity
                      key={format}
                      style={[
                        styles.formatOption,
                        {
                          backgroundColor: selectedFormat === format ? colors.primary : colors.background,
                          borderColor: selectedFormat === format ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedFormat(format)}
                    >
                      <IconSymbol
                        name={
                          format === "PDF"
                            ? "doc.text.fill"
                            : format === "EXCEL"
                              ? "tablecells.fill"
                              : "doc.plaintext.fill"
                        }
                        size={20}
                        color={selectedFormat === format ? "#FFFFFF" : colors.text}
                      />
                      <Text style={[styles.formatText, { color: selectedFormat === format ? "#FFFFFF" : colors.text }]}>
                        {format}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => setShowStatementModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={handleDownloadStatement}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="arrow.down.circle.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.downloadButtonText}>Télécharger</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 44,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
  },
  accountCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 12,
  },
  accountActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  transactionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionsList: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionBalance: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  selectedAccountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  selectedAccountInfo: {
    flex: 1,
  },
  selectedAccountName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedAccountNumber: {
    fontSize: 14,
  },
  selectedAccountBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  periodOptions: {
    gap: 12,
  },
  periodOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  formatOptions: {
    flexDirection: "row",
    gap: 12,
  },
  formatOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  formatText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  downloadButton: {},
  downloadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})
