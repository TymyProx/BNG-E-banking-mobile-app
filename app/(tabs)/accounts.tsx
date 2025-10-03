"use client"

import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  Animated,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native"
import { useAuth } from "@/contexts/AuthContext"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  type: "primary" | "savings" | "checking" | "credit"
  change: number
  status: "active" | "inactive" | "blocked" | "pending" | "actif" | "en attente" | "attente" | "inactif" | "bloqué"
  currency: string
  lastUpdate: string
}

const { width } = Dimensions.get("window")

export default function AccountsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  const { tenantId } = useAuth()

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      // Get token from SecureStore
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] No token or tenantId available")
        setAccounts([])
        setIsLoading(false)
        return
      }

      // Fetch accounts from API
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
      console.log("[v0] Accounts fetched:", data)

      // Map API response to Account interface
      const mappedAccounts: Account[] = data.rows.map((account: any) => ({
        id: account.id,
        name: account.accountName || "Compte sans nom",
        number: account.accountNumber || "N/A",
        balance: Number.parseFloat(account.availableBalance || "0"),
        type: account.type?.toLowerCase() || "checking",
        change: 0, // Change percentage not provided by API
        status: account.status?.toLowerCase() || "active",
        currency: account.currency || "GNF",
        lastUpdate: account.updatedAt ? new Date(account.updatedAt).toLocaleDateString("fr-FR") : "N/A",
      }))

      setAccounts(mappedAccounts)

      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start()
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des comptes:", error)
      Alert.alert("Erreur", "Impossible de charger les comptes. Veuillez réessayer.")
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccounts()
    setRefreshing(false)
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "primary":
        return "wallet.pass.fill"
      case "savings":
        return "banknote.fill"
      case "checking":
        return "creditcard.fill"
      case "credit":
        return "minus.circle.fill"
      default:
        return "creditcard.fill"
    }
  }

  const getAccountColor = (type: string) => {
    switch (type) {
      case "primary":
        return colors.primary
      case "savings":
        return colors.success
      case "checking":
        return colors.secondary
      case "credit":
        return colors.error
      default:
        return colors.primary
    }
  }

  const getAccountBackground = (type: string) => {
    switch (type) {
      case "primary":
        return colors.primaryBackground
      case "savings":
        return colors.successBackground
      case "checking":
        return colors.secondaryBackground
      case "credit":
        return colors.errorBackground
      default:
        return colors.primaryBackground
    }
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case "active":
      case "actif":
        return {
          background: colors.successBackground,
          color: colors.success,
        }
      case "pending":
      case "en attente":
      case "attente":
        return {
          background: "#FEF3C7", // Yellow background
          color: "#F59E0B", // Orange color
        }
      case "inactive":
      case "inactif":
        return {
          background: colors.borderLight,
          color: colors.textSecondary,
        }
      case "blocked":
      case "bloqué":
        return {
          background: colors.errorBackground,
          color: colors.error,
        }
      default:
        return {
          background: colors.borderLight,
          color: colors.textSecondary,
        }
    }
  }

  const handleAccountPress = (account: Account) => {
    router.push({
      pathname: "/account-details",
      params: {
        id: account.id,
        name: account.name,
        number: account.number,
        balance: account.balance.toString(),
        type: account.type,
        currency: account.currency,
        status: account.status,
        lastUpdate: account.lastUpdate,
      },
    })
  }

  const handleNewAccount = () => {
    router.push("/new-account")
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const activeAccounts = accounts.filter((account) => account.status === "active").length

  const AccountCard = ({ account, index }: { account: Account; index: number }) => {
    const [scaleAnim] = useState(new Animated.Value(1))

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start()
    }

    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.accountCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}
          onPress={() => handleAccountPress(account)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Header avec icône et badge de statut */}
          <View style={styles.cardHeader}>
            <View style={styles.accountLeft}>
              <View style={[styles.accountIcon, { backgroundColor: getAccountBackground(account.type) }]}>
                <IconSymbol
                  name={getAccountIcon(account.type) as any}
                  size={28}
                  color={getAccountColor(account.type)}
                />
              </View>
              <View style={styles.accountInfo}>
                <View style={styles.accountNameRow}>
                  <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(account.status).background }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(account.status).color }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(account.status).color }]}>
                      {account.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                  •••• •••• •••• {account.number.slice(-4)}
                </Text>
              </View>
            </View>
          </View>

          {/* Solde principal */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceLeft}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
                <View style={styles.balanceAmountRow}>
                  <Text style={[styles.accountBalance, { color: account.balance >= 0 ? colors.text : colors.error }]}>
                    {account.balance >= 0 ? "" : "-"}
                    {formatAmount(account.balance)}
                  </Text>
                  <Text style={[styles.currency, { color: colors.textSecondary }]}>GNF</Text>
                </View>
              </View>
              <View style={styles.changeContainer}>
                <View
                  style={[
                    styles.changeBadge,
                    { backgroundColor: account.change > 0 ? colors.successBackground : colors.errorBackground },
                  ]}
                >
                  <IconSymbol
                    name={account.change > 0 ? "arrow.up" : "arrow.down"}
                    size={12}
                    color={account.change > 0 ? colors.success : colors.error}
                  />
                  <Text
                    style={[styles.accountChangeText, { color: account.change > 0 ? colors.success : colors.error }]}
                  >
                    {account.change > 0 ? "+" : ""}
                    {account.change}%
                  </Text>
                </View>
                <Text style={[styles.changeLabel, { color: colors.textTertiary }]}>Ce mois</Text>
              </View>
            </View>
          </View>

          {/* Séparateur */}
          <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec titre et bouton retour */}
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Comptes</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleNewAccount}>
          <IconSymbol name="plus.circle.fill" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Liste des comptes */}
        <View style={styles.accountsList}>
          {isLoading
            ? // Loading skeleton amélioré
              Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}>
                  <View style={styles.skeletonHeader}>
                    <View style={[styles.skeletonIcon, { backgroundColor: colors.borderLight }]} />
                    <View style={styles.skeletonContent}>
                      <View style={[styles.skeletonLine, { backgroundColor: colors.borderLight, width: "70%" }]} />
                      <View style={[styles.skeletonLineSmall, { backgroundColor: colors.borderLight, width: "50%" }]} />
                    </View>
                  </View>
                  <View style={styles.skeletonBalance}>
                    <View style={[styles.skeletonLine, { backgroundColor: colors.borderLight, width: "40%" }]} />
                    <View style={[styles.skeletonLineSmall, { backgroundColor: colors.borderLight, width: "30%" }]} />
                  </View>
                  <View style={[styles.skeletonSeparator, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.skeletonActions}>
                    <View style={[styles.skeletonButton, { backgroundColor: colors.borderLight }]} />
                    <View style={[styles.skeletonButton, { backgroundColor: colors.borderLight }]} />
                    <View style={[styles.skeletonButtonSmall, { backgroundColor: colors.borderLight }]} />
                  </View>
                </View>
              ))
            : accounts.map((account, index) => <AccountCard key={account.id} account={account} index={index} />)}
        </View>

        {/* Empty State modernisé */}
        {!isLoading && accounts.length === 0 && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryBackground }]}>
              <IconSymbol name="creditcard.fill" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun compte trouvé</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Ouvrez votre premier compte pour commencer à gérer vos finances
            </Text>
            <TouchableOpacity
              style={[styles.createAccountButton, { backgroundColor: colors.primary }]}
              onPress={handleNewAccount}
            >
              <IconSymbol name="plus.circle.fill" size={22} color="#FFFFFF" />
              <Text style={styles.createAccountText}>Ouvrir un compte</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Espacement en bas */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const colors = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F3F6",
  primary: "#6C4AB6", // Violet profond
  primaryLight: "#A88BEB", // Violet clair
  onPrimary: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  shadow: "rgba(0,0,0,0.06)",
  error: "#EF4444",
  success: "#10B981",
  primaryBackground: "#E9D5FF",
  successBackground: "#E1FAEE",
  secondaryBackground: "#D1E7DD",
  errorBackground: "#FEE2E2",
  borderLight: "#E5E7EB",
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryCard: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 32,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  summaryAmount: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  summaryCurrency: {
    fontSize: 16,
    fontWeight: "600",
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryFooter: {
    marginTop: 4,
  },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summarySubtext: {
    fontSize: 13,
    fontWeight: "500",
  },
  accountsList: {
    paddingHorizontal: 24,
    gap: 20,
  },
  accountCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardHeader: {
    marginBottom: 20,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  accountIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  accountName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountNumber: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 1,
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  currency: {
    fontSize: 14,
    fontWeight: "600",
  },
  changeContainer: {
    alignItems: "flex-end",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  accountChangeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  separator: {
    height: 3,
    marginBottom: 20,
  },
  // Skeleton styles améliorés
  skeletonCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  skeletonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  skeletonLineSmall: {
    height: 16,
    borderRadius: 8,
  },
  skeletonBalance: {
    marginBottom: 20,
  },
  skeletonSeparator: {
    height: 1,
    marginBottom: 20,
  },
  skeletonActions: {
    flexDirection: "row",
    gap: 12,
  },
  skeletonButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
  },
  skeletonButtonSmall: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  // Empty state amélioré
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    lineHeight: 24,
  },
  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  createAccountText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 40,
  },
})
