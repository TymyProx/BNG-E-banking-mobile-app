"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuth } from "@/contexts/AuthContext"
import React from "react"

interface MenuItem {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  isNew?: boolean
}

const { width } = Dimensions.get("window")
const cardWidth = (width - 60) / 2

export default function MenuScreen() {
  const { logout } = useAuth()

  const user = {
    name: "Utilisateur",
    email: "user@example.com",
  }

  const menuItems: MenuItem[] = [
    {
      id: "profile",
      title: "Mon profil",
      subtitle: "Informations",
      icon: "person-outline",
      route: "/profile",
    },
     {
      id: "e-services",
      title: "E-Services",
      subtitle: "Demandes",
      icon: "document-text-outline",
      route: "/(tabs)/e-services",
      isNew: true,
    },
    {
      id: "accounts",
      title: "Mes comptes",
      subtitle: "Consulter",
      icon: "wallet-outline",
      route: "/(tabs)/accounts",
    },
    {
      id: "cards",
      title: "Mes cartes",
      subtitle: "Gérer",
      icon: "card-outline",
      route: "/(tabs)/cards",
    },
    {
      id: "transfer",
      title: "Virement",
      subtitle: "Transférer",
      icon: "swap-horizontal-outline",
      route: "/(tabs)/transfer",
    },
    {
      id: "beneficiaries",
      title: "Bénéficiaires",
      subtitle: "Gérer",
      icon: "people-outline",
      route: "/(tabs)/beneficiaries",
    },
    {
      id: "bills",
      title: "Factures",
      subtitle: "Payer",
      icon: "receipt-outline",
      route: "/(tabs)/bills",
    },
    {
      id: "reclamation",
      title: "Réclamation",
      subtitle: "Signaler",
      icon: "alert-circle-outline",
      route: "/(tabs)/reclamation",
    },
    {
      id: "support",
      title: "Support",
      subtitle: "Aide",
      icon: "help-circle-outline",
      route: "/(tabs)/support",
    },
    {
      id: "settings",
      title: "Paramètres",
      subtitle: "Configuration",
      icon: "settings-outline",
      route: "/(tabs)/settings",
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
              <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.gridContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {item.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  <View style={styles.cardIconContainer}>
                    <Ionicons name={item.icon} size={28} color="#111827" />
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuContainer: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuCard: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardContent: {
    padding: 20,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  logoutContainer: {
    padding: 20,
    paddingTop: 8,
  },
  logoutButton: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 12,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
  },
})
