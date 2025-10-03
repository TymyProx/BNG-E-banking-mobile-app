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
          return ["#667eea", "#764ba2"]
        case "savings":
          return ["#11998e", "#38ef7d"]
        case "checking":
          return ["#4facfe", "#00f2fe"]
        case "credit":
          return ["#fa709a", "#fee140"]
        default:
          return ["#667eea", "#764ba2"]
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
                <View style={[styles.statusBadgeGlass, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: "#0A0A0F" }]}>
      <ExpoLinearGradient
        colors={["#0A0A0F", "#1A1A2E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mes Comptes</Text>
            <Text style={styles.headerSubtitle}>Gérez vos finances</Text>
          </View>
          <TouchableOpacity style={styles.addButtonGlass} onPress={handleNewAccount}>
            <IconSymbol name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ExpoLinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
      >
        {!isLoading && accounts.length > 0 && (
          <View style={styles.currencyCardsContainer}>
            {Object.entries(getTotalsByCurrency()).map(([currency, total], index) => {
              const gradients = [
                ["#667eea", "#764ba2"],
                ["#f093fb", "#f5576c"],
                ["#4facfe", "#00f2fe"],
                ["#43e97b", "#38f9d7"],
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
                        backgroundColor: index === activeIndex ? "#667eea" : "rgba(255,255,255,0.3)",
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
            <Animated.View style={[styles.skeletonCard, { opacity: fadeAnim }]}>
              <View style={styles.skeletonShimmer} />
            </Animated.View>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && accounts.length === 0 && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.emptyIconGlass}>
              <IconSymbol name="creditcard.fill" size={56} color="#667eea" />
            </View>
            <Text style={styles.emptyTitle}>Aucun compte trouvé</Text>
            <Text style={styles.emptyMessage}>Ouvrez votre premier compte pour commencer à gérer vos finances</Text>
            <TouchableOpacity style={styles.createAccountButtonGlass} onPress={handleNewAccount}>
              <ExpoLinearGradient
                colors={["#667eea", "#764ba2"]}
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
              <Text style={styles.sectionTitle}>Types de comptes</Text>
              <Text style={styles.sectionSubtitle}>Choisissez le compte adapté à vos besoins</Text>
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
                    <View style={styles.accountTypeCardGlass}>
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: "rgba(102, 126, 234, 0.2)" }]}>
                        <IconSymbol name="creditcard.fill" size={32} color="#667eea" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={styles.accountTypeTitle}>Compte Courant</Text>
                        <Text style={styles.accountTypeDescription}>Pour vos transactions quotidiennes</Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#667eea" }]} />
                            <Text style={styles.featureText}>Carte bancaire gratuite</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#667eea" }]} />
                            <Text style={styles.featureText}>Virements illimités</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#667eea" }]} />
                            <Text style={styles.featureText}>Découvert autorisé</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compte Épargne */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={styles.accountTypeCardGlass}>
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: "rgba(17, 153, 142, 0.2)" }]}>
                        <IconSymbol name="banknote.fill" size={32} color="#11998e" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={styles.accountTypeTitle}>Compte Épargne</Text>
                        <Text style={styles.accountTypeDescription}>Faites fructifier votre argent</Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#11998e" }]} />
                            <Text style={styles.featureText}>Taux d'intérêt 3.5%</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#11998e" }]} />
                            <Text style={styles.featureText}>Pas de frais de gestion</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#11998e" }]} />
                            <Text style={styles.featureText}>Retraits flexibles</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compte Professionnel */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={styles.accountTypeCardGlass}>
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
                        <IconSymbol name="briefcase.fill" size={32} color="#F59E0B" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={styles.accountTypeTitle}>Compte Professionnel</Text>
                        <Text style={styles.accountTypeDescription}>Pour votre activité professionnelle</Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#F59E0B" }]} />
                            <Text style={styles.featureText}>Gestion multi-devises</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#F59E0B" }]} />
                            <Text style={styles.featureText}>Outils comptables</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#F59E0B" }]} />
                            <Text style={styles.featureText}>Terminal de paiement</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Compte Premium */}
                <View style={styles.typeCarouselCard}>
                  <TouchableOpacity onPress={handleNewAccount} activeOpacity={0.8}>
                    <View style={styles.accountTypeCardGlass}>
                      <View style={[styles.accountTypeIconGlass, { backgroundColor: "rgba(168, 85, 247, 0.2)" }]}>
                        <IconSymbol name="star.fill" size={32} color="#A855F7" />
                      </View>
                      <View style={styles.accountTypeContent}>
                        <Text style={styles.accountTypeTitle}>Compte Premium</Text>
                        <Text style={styles.accountTypeDescription}>Services exclusifs et privilèges</Text>
                        <View style={styles.accountTypeFeatures}>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#A855F7" }]} />
                            <Text style={styles.featureText}>Conseiller dédié</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#A855F7" }]} />
                            <Text style={styles.featureText}>Assurances incluses</Text>
                          </View>
                          <View style={styles.featureItem}>
                            <View style={[styles.featureDot, { backgroundColor: "#A855F7" }]} />
                            <Text style={styles.featureText}>Cashback 2%</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.exclusiveBadge}>
                        <Text style={styles.exclusiveBadgeText}>EXCLUSIF</Text>
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
                        backgroundColor: index === activeTypeIndex ? "#667eea" : "rgba(255,255,255,0.3)",
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
    backgroundColor: "#0A0A0F",
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
    backgroundColor: "rgba(255,255,255,0.15)",
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
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
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
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(102, 126, 234, 0.3)",
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    lineHeight: 22,
    color: "rgba(255,255,255,0.6)",
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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    color: "#FFFFFF",
  },
  accountTypeDescription: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
    lineHeight: 18,
    color: "rgba(255,255,255,0.7)",
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
    color: "rgba(255,255,255,0.8)",
  },
  popularBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(102, 126, 234, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.5)",
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#667eea",
  },
  exclusiveBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  exclusiveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#A855F7",
  },
  bottomSpacing: {
    height: 60,
  },
})
