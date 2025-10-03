"use client"

import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { router } from "expo-router"
import { useEffect, useState, useRef } from "react"
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
const CARD_WIDTH = width - 48
const CARD_SPACING = 16

export default function AccountsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  const { tenantId } = useAuth()

  const [activeIndex, setActiveIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null)

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
        console.log("[v0] No token or tenantId available")
        setAccounts([])
        setIsLoading(false)
        return
      }

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

      const mappedAccounts: Account[] = data.rows.map((account: any) => ({
        id: account.id,
        name: account.accountName || "Compte sans nom",
        number: account.accountNumber || "N/A",
        balance: Number.parseFloat(account.availableBalance || "0"),
        type: account.type?.toLowerCase() || "checking",
        change: 0,
        status: account.status?.toLowerCase() || "active",
        currency: account.currency || "GNF",
        lastUpdate: account.updatedAt ? new Date(account.updatedAt).toLocaleDateString("fr-FR") : "N/A",
      }))

      setAccounts(mappedAccounts)

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
    if (accounts.length > 1 && !isLoading) {
      autoScrollInterval.current = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % accounts.length
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_SPACING),
            animated: true,
          })
          return nextIndex
        })
      }, 4000) // Auto-scroll every 4 seconds

      return () => {
        if (autoScrollInterval.current) {
          clearInterval(autoScrollInterval.current)
        }
      }
    }
  }, [accounts.length, isLoading])

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveIndex(index)
  }

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveIndex(index)
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
  }

  const getTotalsByCurrency = () => {
    const totals: { [currency: string]: number } = {}
    accounts.forEach((account) => {
      if (!totals[account.currency]) {
        totals[account.currency] = 0
      }
      totals[account.currency] += account.balance
    })
    return totals
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
          background: "#FEF3C7",
          color: "#F59E0B",
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

  const AccountCard = ({ account }: { account: Account }) => {
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
          styles.carouselCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
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
                  size={32}
                  color={getAccountColor(account.type)}
                />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                  •••• •••• •••• {account.number.slice(-4)}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(account.status).background }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(account.status).color }]} />
              <Text style={[styles.statusText, { color: getStatusColor(account.status).color }]}>{account.status}</Text>
            </View>
          </View>

          {/* Solde principal - plus grand pour le carousel */}
          <View style={styles.balanceSection}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
            <View style={styles.balanceAmountRow}>
              <Text style={[styles.accountBalance, { color: account.balance >= 0 ? colors.text : colors.error }]}>
                {account.balance >= 0 ? "" : "-"}
                {formatAmount(account.balance)}
              </Text>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>{account.currency}</Text>
            </View>
            {account.change !== 0 && (
              <View style={styles.changeContainer}>
                <View
                  style={[
                    styles.changeBadge,
                    { backgroundColor: account.change > 0 ? colors.successBackground : colors.errorBackground },
                  ]}
                >
                  <IconSymbol
                    name={account.change > 0 ? "arrow.up" : "arrow.down"}
                    size={14}
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
            )}
          </View>

          <View style={styles.footerInfo}>
            <IconSymbol name="clock" size={14} color={colors.textTertiary} />
            <Text style={[styles.lastUpdateText, { color: colors.textTertiary }]}>
              Mis à jour le {account.lastUpdate}
            </Text>
          </View>
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
        {!isLoading && accounts.length > 0 && (
          <Animated.View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.primary, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.summaryLabel}>Soldes totaux</Text>
            {Object.entries(getTotalsByCurrency()).map(([currency, total]) => (
              <View key={currency} style={styles.summaryAmountRow}>
                <Text style={styles.summaryAmount}>{formatAmount(total)}</Text>
                <Text style={styles.summaryCurrency}>{currency}</Text>
              </View>
            ))}
            <View style={styles.summaryFooter}>
              <Text style={styles.summarySubtext}>{accounts.length} compte(s)</Text>
            </View>
          </Animated.View>
        )}

        {!isLoading && accounts.length > 0 && (
          <View style={styles.carouselContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </ScrollView>

            {accounts.length > 1 && (
              <View style={styles.paginationContainer}>
                {accounts.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleDotPress(index)}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === activeIndex ? colors.primary : colors.borderLight,
                        width: index === activeIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <View style={styles.carouselContainer}>
            <View style={[styles.carouselCard, { backgroundColor: colors.cardBackground }]}>
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
            </View>
          </View>
        )}

        {/* Empty State */}
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

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const colors = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F3F6",
  primary: "#6C4AB6",
  primaryLight: "#A88BEB",
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
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "rgba(255,255,255,0.8)",
  },
  summaryAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: "#FFFFFF",
  },
  summaryCurrency: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  summaryFooter: {
    marginTop: 4,
  },
  summarySubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  carouselContainer: {
    marginBottom: 32,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: CARD_SPACING,
  },
  carouselCard: {
    width: CARD_WIDTH,
  },
  accountCard: {
    padding: 28,
    borderRadius: 28,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 280,
  },
  cardHeader: {
    marginBottom: 24,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 12,
  },
  accountIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 12,
  },
  accountBalance: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  currency: {
    fontSize: 18,
    fontWeight: "600",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  accountChangeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: "all 0.3s ease",
  },
  // Skeleton styles
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  skeletonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  // Empty state
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
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  lastUpdateText: {
    fontSize: 12,
    fontWeight: "500",
  },
})
