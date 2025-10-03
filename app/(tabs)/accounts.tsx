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
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient"

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

  const [activeTypeIndex, setActiveTypeIndex] = useState(0)
  const typeScrollViewRef = useRef<ScrollView>(null)
  const typeAutoScrollInterval = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (!isLoading) {
      const accountTypes = 4 // Number of account types
      typeAutoScrollInterval.current = setInterval(() => {
        setActiveTypeIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % accountTypes
          typeScrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_SPACING),
            animated: true,
          })
          return nextIndex
        })
      }, 5000) // Auto-scroll every 5 seconds

      return () => {
        if (typeAutoScrollInterval.current) {
          clearInterval(typeAutoScrollInterval.current)
        }
      }
    }
  }, [isLoading])

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveIndex(index)
  }

  const handleTypeScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING))
    setActiveTypeIndex(index)
  }

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveIndex(index)
  }

  const handleTypeDotPress = (index: number) => {
    typeScrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    })
    setActiveTypeIndex(index)
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
        toValue: 0.97,
        useNativeDriver: true,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start()
    }

    const getGradientColors = (type: string) => {
      switch (type) {
        case "primary":
          return ["rgba(20, 184, 166, 0.75)", "rgba(14, 165, 233, 0.7)"]
        case "savings":
          return ["rgba(34, 197, 94, 0.75)", "rgba(22, 163, 74, 0.7)"]
        case "checking":
          return ["rgba(139, 92, 246, 0.75)", "rgba(124, 58, 237, 0.7)"]
        case "credit":
          return ["rgba(236, 72, 153, 0.75)", "rgba(219, 39, 119, 0.7)"]
        default:
          return ["rgba(20, 184, 166, 0.75)", "rgba(14, 165, 233, 0.7)"]
      }
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
          onPress={() => handleAccountPress(account)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <ExpoLinearGradient
            colors={getGradientColors(account.type)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.accountCard}
          >
            {/* Glass morphism overlay */}
            <View style={styles.glassOverlay}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.accountLeft}>
                  <View style={styles.accountIconGlass}>
                    <IconSymbol name={getAccountIcon(account.type) as any} size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountNumber}>•••• {account.number.slice(-4)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadgeGlass, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                  <Text style={styles.statusTextGlass}>{account.status}</Text>
                </View>
              </View>

              {/* Balance Section */}
              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Solde disponible</Text>
                <View style={styles.balanceAmountRow}>
                  <Text style={styles.accountBalance}>{formatAmount(account.balance)}</Text>
                  <Text style={styles.currencyGlass}>{account.currency}</Text>
                </View>
                {account.change !== 0 && (
                  <View style={styles.changeContainer}>
                    <View style={styles.changeBadgeGlass}>
                      <IconSymbol name={account.change > 0 ? "arrow.up" : "arrow.down"} size={12} color="#FFFFFF" />
                      <Text style={styles.accountChangeTextGlass}>
                        {account.change > 0 ? "+" : ""}
                        {account.change}%
                      </Text>
                    </View>
                    <Text style={styles.changeLabelGlass}>Ce mois</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.footerInfo}>
                <IconSymbol name="clock" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.lastUpdateTextGlass}>Mis à jour le {account.lastUpdate}</Text>
              </View>
            </View>
          </ExpoLinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ExpoLinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(30, 41, 59, 0.98)", "rgba(51, 65, 85, 0.95)"]
            : ["rgba(248, 250, 252, 0.98)", "rgba(241, 245, 249, 0.95)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primaryBackground }]}
            onPress={() => router.push("/")}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Comptes</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérez vos finances</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButtonGlass, { backgroundColor: colors.primaryBackground, borderColor: colors.primary }]}
            onPress={handleNewAccount}
          >
            <IconSymbol name="plus" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ExpoLinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!isLoading && accounts.length > 0 && (
          <View style={styles.currencyCardsContainer}>
            {Object.entries(getTotalsByCurrency()).map(([currency, total], index) => {
              const gradients = [
                ["rgba(20, 184, 166, 0.8)", "rgba(14, 165, 233, 0.75)"], // Soft teal to blue
                ["rgba(251, 191, 36, 0.8)", "rgba(245, 158, 11, 0.75)"], // Soft amber/gold
                ["rgba(139, 92, 246, 0.8)", "rgba(124, 58, 237, 0.75)"], // Soft purple
                ["rgba(34, 197, 94, 0.8)", "rgba(22, 163, 74, 0.75)"], // Soft green
              ]

              return (
                <Animated.View
                  key={currency}
                  style={[styles.currencyCardWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                >
                  <ExpoLinearGradient
                    colors={gradients[index % gradients.length]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.currencyCard}
                  >
                    <Text style={styles.currencyLabel}>{currency}</Text>
                    <Text style={styles.currencyAmount}>{formatAmount(total)}</Text>
                  </ExpoLinearGradient>
                </Animated.View>
              )
            })}
          </View>
        )}

        {/* Accounts Carousel */}
        {!isLoading && accounts.length > 0 && (
          <View style={styles.carouselContainer}>
            <Text style={styles.sectionTitleMain}>Vos Comptes</Text>
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
                        width: index === activeIndex ? 32 : 8,
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
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.skeletonCard, { opacity: fadeAnim, backgroundColor: colors.borderLight }]}>
              <View style={[styles.skeletonShimmer, { backgroundColor: colors.border }]} />
            </Animated.View>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && accounts.length === 0 && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View
              style={[
                styles.emptyIconGlass,
                { backgroundColor: colors.primaryBackground, borderColor: colors.primary },
              ]}
            >
              <IconSymbol name="creditcard.fill" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun compte trouvé</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Ouvrez votre premier compte pour commencer à gérer vos finances
            </Text>
            <TouchableOpacity style={styles.createAccountButtonGlass} onPress={handleNewAccount}>
              <ExpoLinearGradient
                colors={["rgba(20, 184, 166, 0.85)", "rgba(14, 165, 233, 0.8)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createAccountGradient}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.createAccountText}>Ouvrir un compte</Text>
              </ExpoLinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!isLoading && (
          <Animated.View style={[styles.accountTypesSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Types de comptes</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Choisissez le compte adapté à vos besoins
              </Text>
            </View>

            <View style={styles.typesCarouselContainer}>
              <ScrollView
                ref={typeScrollViewRef}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                contentContainerStyle={styles.typesCarouselContent}
                onScroll={handleTypeScroll}
                scrollEventThrottle={16}
              >
                {/* Compte Courant */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View
                      style={[
                        styles.accountTypeCardGlass,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: colors.primaryBackground }]}>
                        <IconSymbol name="creditcard.fill" size={32} color={colors.primary} />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Courant</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Pour vos transactions quotidiennes
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Carte bancaire gratuite
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Virements illimités
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Découvert autorisé
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.popularBadge,
                          { backgroundColor: colors.primaryBackground, borderColor: colors.primary },
                        ]}
                      >
                        <Text style={[styles.popularBadgeText, { color: colors.primary }]}>POPULAIRE</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compte Épargne */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View
                      style={[
                        styles.accountTypeCardGlass,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: colors.successBackground }]}>
                        <IconSymbol name="banknote.fill" size={32} color={colors.success} />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Épargne</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Faites fructifier votre argent
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Taux d'intérêt 3.5%
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Pas de frais de gestion
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Retraits flexibles
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compte Professionnel */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View
                      style={[
                        styles.accountTypeCardGlass,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: colors.warningBackground }]}>
                        <IconSymbol name="briefcase.fill" size={32} color={colors.warning} />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Professionnel</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Pour votre activité professionnelle
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.warning }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Gestion multi-devises
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.warning }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Outils comptables</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.warning }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Terminal de paiement
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compte Premium */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View
                      style={[
                        styles.accountTypeCardGlass,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: `${colors.accent}20` }]}>
                        <IconSymbol name="star.fill" size={32} color={colors.accent} />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Premium</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Services exclusifs et privilèges
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.accent }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Conseiller dédié</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.accent }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Assurances incluses
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: colors.accent }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Cashback 2%</Text>
                          </View>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.exclusiveBadge,
                          { backgroundColor: `${colors.accent}30`, borderColor: colors.accent },
                        ]}
                      >
                        <Text style={[styles.exclusiveBadgeText, { color: colors.accent }]}>EXCLUSIF</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.paginationContainer}>
                {[0, 1, 2, 3].map((index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleTypeDotPress(index)}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === activeTypeIndex ? colors.primary : colors.borderLight,
                        width: index === activeTypeIndex ? 32 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
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
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  addButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(102, 126, 234, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  currencyCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  currencyCardWrapper: {
    flex: 1,
    minWidth: "45%",
  },
  currencyCard: {
    padding: 20,
    borderRadius: 20,
    minHeight: 100,
    justifyContent: "space-between",
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  currencyAmount: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  sectionTitleMain: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    marginLeft: 24,
  },
  carouselContainer: {
    marginBottom: 40,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: CARD_SPACING,
  },
  carouselCard: {
    width: CARD_WIDTH,
  },
  accountCard: {
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 240,
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)", // Increased from 0.15 to 0.2 for softer look
    padding: 24,
    backdropFilter: "blur(10px)",
  },
  cardHeader: {
    marginBottom: 24,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  accountIconGlass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
    color: "#FFFFFF",
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.8)",
  },
  statusBadgeGlass: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusTextGlass: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  balanceSection: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.7)",
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  accountBalance: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#FFFFFF",
  },
  currencyGlass: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeBadgeGlass: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  accountChangeTextGlass: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  changeLabelGlass: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lastUpdateTextGlass: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
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
  },
  loadingContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  skeletonCard: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
  },
  skeletonShimmer: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconGlass: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    lineHeight: 22,
  },
  createAccountButtonGlass: {
    borderRadius: 16,
    overflow: "hidden",
  },
  createAccountGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  createAccountText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  accountTypesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
    color: "#FFFFFF",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
  },
  typesCarouselContainer: {
    marginBottom: 20,
  },
  typesCarouselContent: {
    paddingHorizontal: 24,
    gap: CARD_SPACING,
  },
  typeCarouselCard: {
    width: CARD_WIDTH,
  },
  accountTypeCardGlass: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 280,
    position: "relative",
  },
  accountTypeIconGlass: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  accountTypeContent: {
    flex: 1,
  },
  accountTypeTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  accountTypeDescription: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
    lineHeight: 18,
  },
  accountTypeFeatures: {
    gap: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  popularBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exclusiveBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  exclusiveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 60,
  },
})
