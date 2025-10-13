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
import { LinearGradient } from "expo-linear-gradient"
import React from "react"

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
  const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [activeTypeIndex, setActiveTypeIndex] = useState(0)
  const typeScrollViewRef = useRef<ScrollView>(null)
  const typeAutoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      const token = await SecureStore.getItemAsync("token")

      if (!token || !tenantId) {
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

  const activeAccounts = accounts.filter(
    (account) => account.status.toLowerCase() === "actif" || account.status.toLowerCase() === "active",
  )

  const pendingAccounts = accounts.filter(
    (account) =>
      account.status.toLowerCase() === "en attente" ||
      account.status.toLowerCase() === "pending" ||
      account.status.toLowerCase() === "attente",
  )

  useEffect(() => {
    if (activeAccounts.length > 1 && !isLoading) {
      autoScrollInterval.current = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % activeAccounts.length
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_SPACING),
            animated: true,
          })
          return nextIndex
        })
      }, 4000)

      return () => {
        if (autoScrollInterval.current) {
          clearInterval(autoScrollInterval.current)
        }
      }
    }
  }, [activeAccounts.length, isLoading])

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

  const getAccountTypeBackground = (type: string) => {
    switch (type) {
      case "primary":
      case "checking":
        return "rgba(251, 191, 36, 0.1)" // Yellow background
      case "savings":
      case "credit":
        return "rgba(45, 122, 79, 0.1)" // Green background
      default:
        return "rgba(251, 191, 36, 0.1)"
    }
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

    const getGradientColors = () => {
      if (account.type === "primary" || account.type === "checking") {
        return ["#F59E0B", "#FBBF24", "#FCD34D", "#F59E0B"]
      }
      return ["#059669", "#10B981", "#34D399", "#059669"]
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
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.accountCard}
          >
            <View style={styles.cardPattern}>
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
              <View style={styles.patternCircle3} />
            </View>
            <View style={styles.cardHeader}>
              <View style={styles.accountLeft}>
                <View
                  style={[
                    styles.accountIcon,
                    {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.4)",
                    },
                  ]}
                >
                  <IconSymbol name={getAccountIcon(account.type) as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.accountInfo}>
                  <Text
                    style={[
                      styles.accountName,
                      {
                        color: "#FFFFFF",
                        textShadowColor: "rgba(0, 0, 0, 0.2)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      },
                    ]}
                  >
                    {account.name}
                  </Text>
                  <Text style={[styles.accountNumber, { color: "rgba(255, 255, 255, 0.9)" }]}>
                    •••• •••• •••• {account.number.slice(-4)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.4)",
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: "#FFFFFF" }]}>{account.status}</Text>
              </View>
            </View>
            <View style={styles.balanceSection}>
              <Text style={[styles.balanceLabel, { color: "rgba(255, 255, 255, 0.9)" }]}>Solde disponible</Text>
              <View style={styles.balanceAmountRow}>
                <Text
                  style={[
                    styles.accountBalance,
                    {
                      color: "#FFFFFF",
                      textShadowColor: "rgba(0, 0, 0, 0.15)",
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    },
                  ]}
                >
                  {formatAmount(account.balance)}
                </Text>
                <Text style={[styles.currency, { color: "rgba(255, 255, 255, 0.95)" }]}>{account.currency}</Text>
              </View>
              {account.change !== 0 && (
                <View style={styles.changeContainer}>
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.4)",
                      },
                    ]}
                  >
                    <IconSymbol name={account.change > 0 ? "arrow.up" : "arrow.down"} size={10} color="#FFFFFF" />
                    <Text style={[styles.accountChangeText, { color: "#FFFFFF" }]}>
                      {account.change > 0 ? "+" : ""}
                      {account.change}%
                    </Text>
                  </View>
                  <Text style={[styles.changeLabel, { color: "rgba(255, 255, 255, 0.9)" }]}>Ce mois</Text>
                </View>
              )}
            </View>
            <View style={styles.footerInfo}>
              <IconSymbol name="clock" size={12} color="rgba(255, 255, 255, 0.9)" />
              <Text style={[styles.lastUpdateText, { color: "rgba(255, 255, 255, 0.9)" }]}>
                Mis à jour le {account.lastUpdate}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#FBBF24" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Comptes</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gérez vos finances</Text>
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: "#2D7A4F" }]} onPress={handleNewAccount}>
            <IconSymbol name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FBBF24" />}
      >
        {!isLoading && activeAccounts.length > 0 && (
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
              {activeAccounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </ScrollView>
            {activeAccounts.length > 1 && (
              <View style={styles.paginationContainer}>
                {activeAccounts.map((_, index) => (
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
        {!isLoading && pendingAccounts.length > 0 && (
          <Animated.View style={[styles.pendingSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.pendingSectionHeader}>
              <View style={styles.pendingHeaderLeft}>
                <View style={styles.pendingIconContainer}>
                  <IconSymbol name="clock.fill" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.pendingSectionTitle, { color: colors.text }]}>Comptes en attente</Text>
                  <Text style={[styles.pendingSectionSubtitle, { color: colors.textSecondary }]}>
                    {pendingAccounts.length} compte{pendingAccounts.length > 1 ? "s" : ""} en cours de validation
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.pendingAccountsList}>
              {pendingAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.pendingAccountCard, { backgroundColor: colors.cardBackground }]}
                  onPress={() => handleAccountPress(account)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pendingCardLeft}>
                    <View style={[styles.pendingAccountIcon, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                      <IconSymbol name={getAccountIcon(account.type) as any} size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.pendingAccountInfo}>
                      <Text style={[styles.pendingAccountName, { color: colors.text }]}>{account.name}</Text>
                      <Text style={[styles.pendingAccountNumber, { color: colors.textSecondary }]}>
                        •••• {account.number.slice(-4)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pendingCardRight}>
                    <View style={styles.pendingStatusBadge}>
                      <View style={styles.pendingDot} />
                      <Text style={styles.pendingStatusText}>En attente</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.pendingInfoBox, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
              <IconSymbol name="info.circle.fill" size={16} color="#F59E0B" />
              <Text style={[styles.pendingInfoText, { color: "#F59E0B" }]}>
                Ces comptes seront activés après validation par notre équipe
              </Text>
            </View>
          </Animated.View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.skeletonCard, { opacity: fadeAnim, backgroundColor: colors.borderLight }]}>
              <View style={[styles.skeletonShimmer, { backgroundColor: colors.border }]} />
            </Animated.View>
          </View>
        )}
        {!isLoading && accounts.length === 0 && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.emptyIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
              <IconSymbol name="creditcard.fill" size={56} color="#FBBF24" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun compte trouvé</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Ouvrez votre premier compte pour commencer à gérer vos finances
            </Text>
            <TouchableOpacity
              style={[styles.createAccountButton, { backgroundColor: "#2D7A4F" }]}
              onPress={handleNewAccount}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.createAccountText}>Ouvrir un compte</Text>
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
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={[styles.accountTypeCard, { backgroundColor: colors.cardBackground }]}>
                      <View style={[styles.accountTypeIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                        <IconSymbol name="creditcard.fill" size={32} color="#FBBF24" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Courant</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Pour vos transactions quotidiennes
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#FBBF24" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Carte bancaire gratuite
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#FBBF24" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Virements illimités
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#FBBF24" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Découvert autorisé
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.popularBadge, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                        <Text style={[styles.popularBadgeText, { color: "#FBBF24" }]}>POPULAIRE</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={[styles.accountTypeCard, { backgroundColor: colors.cardBackground }]}>
                      <View style={[styles.accountTypeIcon, { backgroundColor: "rgba(45, 122, 79, 0.15)" }]}>
                        <IconSymbol name="banknote.fill" size={32} color="#2D7A4F" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Épargne</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Faites fructifier votre argent
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Taux d'intérêt 3.5%
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Pas de frais de gestion
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Retraits flexibles
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={[styles.accountTypeCard, { backgroundColor: colors.cardBackground }]}>
                      <View style={[styles.accountTypeIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
                        <IconSymbol name="briefcase.fill" size={32} color="#FBBF24" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Professionnel</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Pour votre activité professionnelle
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Gestion multi-devises
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Outils comptables</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Terminal de paiement
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={[styles.accountTypeCard, { backgroundColor: colors.cardBackground }]}>
                      <View style={[styles.accountTypeIcon, { backgroundColor: "rgba(45, 122, 79, 0.15)" }]}>
                        <IconSymbol name="star.fill" size={32} color="#2D7A4F" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={[styles.accountTypeTitle, { color: colors.text }]}>Compte Premium</Text>
                        <Text style={[styles.accountTypeDescription, { color: colors.textSecondary }]}>
                          Services exclusifs et privilèges
                        </Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Conseiller dédié</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                              Assurances incluses
                            </Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#2D7A4F" }]} />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Cashback 2%</Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.exclusiveBadge, { backgroundColor: "rgba(45, 122, 79, 0.15)" }]}>
                        <Text style={[styles.exclusiveBadgeText, { color: "#2D7A4F" }]}>EXCLUSIF</Text>
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
                        backgroundColor: index === activeTypeIndex ? "#FBBF24" : colors.borderLight,
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
  header: {
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
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    overflow: "hidden",
  },
  sectionTitleMain: {
    fontSize: 20,
    fontWeight: "700",
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
    padding: 20,
    minHeight: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },
  cardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  patternCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -80,
    right: -60,
  },
  patternCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    bottom: -40,
    left: -30,
  },
  patternCircle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: 100,
    right: 20,
  },
  cardHeader: {
    marginBottom: 20,
    zIndex: 1,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  balanceSection: {
    marginBottom: 16,
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  accountBalance: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  currency: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
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
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountChangeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 1,
  },
  lastUpdateText: {
    fontSize: 11,
    fontWeight: "600",
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
    height: 220,
    borderRadius: 20,
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
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
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
  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
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
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
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
  accountTypeCard: {
    padding: 24,
    borderRadius: 24,
    minHeight: 280,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  accountTypeIcon: {
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
  pendingSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  pendingSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pendingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pendingSectionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  pendingAccountsList: {
    gap: 12,
    marginBottom: 16,
  },
  pendingAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pendingAccountIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingAccountInfo: {
    flex: 1,
  },
  pendingAccountName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  pendingAccountNumber: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  pendingCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  pendingStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
  },
  pendingInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
})
