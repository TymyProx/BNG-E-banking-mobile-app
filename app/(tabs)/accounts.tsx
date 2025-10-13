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
          <View
            style={[
              styles.accountCard,
              {
                backgroundColor: colors.cardBackground,
                borderLeftWidth: 4,
                borderLeftColor: account.type === "primary" || account.type === "checking" ? "#FBBF24" : "#2D7A4F",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.accountLeft}>
                <View
                  style={[
                    styles.accountIcon,
                    {
                      backgroundColor: getAccountTypeBackground(account.type),
                    },
                  ]}
                >
                  <IconSymbol
                    name={getAccountIcon(account.type) as any}
                    size={24}
                    color={account.type === "primary" || account.type === "checking" ? "#FBBF24" : "#2D7A4F"}
                  />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                  <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>
                    •••• {account.number.slice(-4)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(account.status).background,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(account.status).color }]}>
                  {account.status}
                </Text>
              </View>
            </View>

            {/* Balance Section */}
            <View style={styles.balanceSection}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde disponible</Text>
              <View style={styles.balanceAmountRow}>
                <Text style={[styles.accountBalance, { color: colors.text }]}>{formatAmount(account.balance)}</Text>
                <Text style={[styles.currency, { color: colors.textSecondary }]}>{account.currency}</Text>
              </View>
              {account.change !== 0 && (
                <View style={styles.changeContainer}>
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor: account.change > 0 ? colors.successBackground : colors.errorBackground,
                      },
                    ]}
                  >
                    <IconSymbol
                      name={account.change > 0 ? "arrow.up" : "arrow.down"}
                      size={10}
                      color={account.change > 0 ? colors.success : colors.error}
                    />
                    <Text
                      style={[styles.accountChangeText, { color: account.change > 0 ? colors.success : colors.error }]}
                    >
                      {account.change > 0 ? "+" : ""}
                      {account.change}%
                    </Text>
                  </View>
                  <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>Ce mois</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footerInfo}>
              <IconSymbol name="clock" size={12} color={colors.textSecondary} />
              <Text style={[styles.lastUpdateText, { color: colors.textSecondary }]}>
                Mis à jour le {account.lastUpdate}
              </Text>
            </View>
          </View>
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
          {/* </CHANGE> */}
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
         {/* Accounts Carousel */}
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
                        width: index === activeIndex ? 32 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {!isLoading && accounts.length > 0 && (
          <View style={styles.currencyCardsContainer}>
            {Object.entries(getTotalsByCurrency()).map(([currency, total], index) => (
              <Animated.View
                key={currency}
                style={[styles.currencyCardWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <View
                  style={[
                    styles.currencyCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderLeftWidth: 4,
                      borderLeftColor: index % 2 === 0 ? "#FBBF24" : "#2D7A4F",
                    },
                  ]}
                >
                  <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>{currency}</Text>
                  <Text style={[styles.currencyAmount, { color: colors.text }]}>{formatAmount(total)}</Text>
                </View>
              </Animated.View>
            ))}
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
                {/* Compte Courant */}
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

                {/* Compte Épargne */}
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

                {/* Compte Professionnel */}
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

                {/* Compte Premium */}
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
    elevation: 5,
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  currencyAmount: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardHeader: {
    marginBottom: 20,
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
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  accountBalance: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
  },
  currency: {
    fontSize: 14,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  accountChangeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lastUpdateText: {
    fontSize: 11,
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
})
