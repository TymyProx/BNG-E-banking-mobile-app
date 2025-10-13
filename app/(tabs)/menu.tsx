"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuth } from "@/contexts/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"

interface MenuItem {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  isNew?: boolean
  color: string
  gradientColors: [string, string, ...string[]]
}

const { width } = Dimensions.get("window")
const cardWidth = (width - 64) / 2

export default function MenuScreen() {
  const { logout, user } = useAuth()

  const menuItems: MenuItem[] = [
    {
      id: "accounts",
      title: "Mes comptes",
      subtitle: "Consulter",
      icon: "wallet-outline",
      route: "/(tabs)/accounts",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "cards",
      title: "Mes cartes",
      subtitle: "Gérer",
      icon: "card-outline",
      route: "/(tabs)/cards",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "transfer",
      title: "Virement",
      subtitle: "Transférer",
      icon: "swap-horizontal-outline",
      route: "/(tabs)/transfer",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "beneficiaries",
      title: "Bénéficiaires",
      subtitle: "Gérer",
      icon: "people-outline",
      route: "/(tabs)/beneficiaries",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "bills",
      title: "Factures",
      subtitle: "Payer",
      icon: "receipt-outline",
      route: "/(tabs)/bills",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "reclamation",
      title: "Réclamation",
      subtitle: "Signaler",
      icon: "alert-circle-outline",
      route: "/(tabs)/reclamation",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "profile",
      title: "Mon profil",
      subtitle: "Informations",
      icon: "person-outline",
      route: "/profile",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "e-services",
      title: "E-Services",
      subtitle: "Demandes",
      icon: "document-text-outline",
      route: "/(tabs)/e-services",
      isNew: true,
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "support",
      title: "Support",
      subtitle: "Aide",
      icon: "help-circle-outline",
      route: "/(tabs)/support",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
    {
      id: "settings",
      title: "Paramètres",
      subtitle: "Configuration",
      icon: "settings-outline",
      route: "/(tabs)/settings",
      color: "#FBBF24",
      gradientColors: ["#FBBF24", "#F59E0B"],
    },
  ]

  const handleMenuPress = (route: string) => {
    console.log(`Navigating to: ${route}`)
    router.push(route as any)
  }

  const handleLogout = async () => {
    console.log("Logging out...")
    await logout()
    router.replace("/(auth)/login")
  }

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U"
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.gridContainer}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuCard}
                  onPress={() => handleMenuPress(item.route)}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.cardGradient}>
                    {item.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}

                    <LinearGradient colors={item.gradientColors} style={styles.cardIconContainer}>
                      <Ionicons name={item.icon} size={28} color="#FFFFFF" />
                    </LinearGradient>

                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.logoutContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                <LinearGradient colors={["#FEE2E2", "#FECACA"]} style={styles.logoutGradient}>
                  <View style={styles.logoutIconContainer}>
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.logoutText}>Déconnexion</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuCard: {
    width: cardWidth,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 12,
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  logoutContainer: {
    marginTop: 24,
  },
  logoutButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  logoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: -0.3,
  },
})
