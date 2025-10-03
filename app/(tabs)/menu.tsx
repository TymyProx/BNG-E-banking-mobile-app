"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

interface MenuItem {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  color: string
  gradient: string[]
  isNew?: boolean
}

const { width } = Dimensions.get("window")
const cardWidth = (width - 60) / 2 // 2 cards per row with padding

export default function MenuScreen() {
  // Default user data since BankingContext might not be available
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
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
    },
    {
      id: "accounts",
      title: "Mes comptes",
      subtitle: "Consulter",
      icon: "wallet-outline",
      route: "/(tabs)/accounts",
      color: "#FFD700",
      gradient: ["#FFD700", "#F4A460"],
    },
    {
      id: "cards",
      title: "Mes cartes",
      subtitle: "Gérer",
      icon: "card-outline",
      route: "/(tabs)/cards",
      color: "#8B5CF6",
      gradient: ["#8B5CF6", "#7C3AED"],
    },
    {
      id: "e-services",
      title: "E-Services",
      subtitle: "Demandes",
      icon: "document-text-outline",
      route: "/(tabs)/e-services",
      color: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
      isNew: true,
    },
    {
      id: "statements",
      title: "Relevés",
      subtitle: "Télécharger",
      icon: "document-outline",
      route: "/(tabs)/statements",
      color: "#3B82F6",
      gradient: ["#3B82F6", "#2563EB"],
    },
    {
      id: "beneficiaries",
      title: "Bénéficiaires",
      subtitle: "Gérer",
      icon: "people-outline",
      route: "/(tabs)/beneficiaries",
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
    },
    {
      id: "bills",
      title: "Factures",
      subtitle: "Payer",
      icon: "receipt-outline",
      route: "/(tabs)/bills",
      color: "#EF4444",
      gradient: ["#EF4444", "#DC2626"],
    },
    {
      id: "insights",
      title: "Analyses",
      subtitle: "Dépenses",
      icon: "analytics-outline",
      route: "/(tabs)/insights",
      color: "#06B6D4",
      gradient: ["#06B6D4", "#0891B2"],
    },
    {
      id: "support",
      title: "Support",
      subtitle: "Aide",
      icon: "help-circle-outline",
      route: "/(tabs)/support",
      color: "#6B7280",
      gradient: ["#6B7280", "#4B5563"],
    },
    {
      id: "settings",
      title: "Paramètres",
      subtitle: "Configuration",
      icon: "settings-outline",
      route: "/(tabs)/settings",
      color: "#64748B",
      gradient: ["#64748B", "#475569"],
    },
  ]

  const handleMenuPress = (route: string) => {
    console.log(`Navigating to: ${route}`)
    router.push(route as any)
  }

  const handleLogout = () => {
    console.log("Logging out...")
    router.replace("/(auth)/login")
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#10B981", "#059669"]} style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
              <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
            </View>
          </View>
        </LinearGradient>

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
                <LinearGradient colors={item.gradient} style={styles.cardGradient}>
                  {item.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  <View style={styles.cardIconContainer}>
                    <Ionicons name={item.icon} size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.logoutGradient}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </LinearGradient>
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
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
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
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.5,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  logoutContainer: {
    padding: 20,
    paddingTop: 8,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 12,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
})
