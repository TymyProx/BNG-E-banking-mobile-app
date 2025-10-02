"use client"

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React from "react"

interface MenuItem {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  color?: string
  isNew?: boolean
}

export default function MenuScreen() {
  // Default user data since BankingContext might not be available
  const user = {
    name: "Utilisateur",
    email: "user@example.com"
  }

  const menuItems: MenuItem[] = [
    {
      id: "profile",
      title: "Mon profil",
      subtitle: "Informations personnelles",
      icon: "person-outline",
      route: "/profile",
    },
    {
      id: "accounts",
      title: "Mes comptes",
      subtitle: "Consulter mes comptes",
      icon: "wallet-outline",
      route: "/(tabs)/accounts",
    },
    {
      id: "cards",
      title: "Mes cartes",
      subtitle: "Gérer mes cartes bancaires",
      icon: "card-outline",
      route: "/(tabs)/cards",
    },
    {
      id: "e-services",
      title: "E-Services",
      subtitle: "Demandes en ligne",
      icon: "document-text-outline",
      route: "/(tabs)/e-services",
      color: "#efe444",
      isNew: true,
    },
    {
      id: "statements",
      title: "Relevés",
      subtitle: "Télécharger mes relevés",
      icon: "document-outline",
      route: "/(tabs)/statements",
    },
    {
      id: "beneficiaries",
      title: "Bénéficiaires",
      subtitle: "Gérer mes bénéficiaires",
      icon: "people-outline",
      route: "/(tabs)/beneficiaries",
    },
    {
      id: "bills",
      title: "Factures",
      subtitle: "Payer mes factures",
      icon: "receipt-outline",
      route: "/(tabs)/bills",
    },
    {
      id: "insights",
      title: "Analyses",
      subtitle: "Mes dépenses et revenus",
      icon: "analytics-outline",
      route: "/(tabs)/insights",
    },
    {
      id: "support",
      title: "Support",
      subtitle: "Aide et assistance",
      icon: "help-circle-outline",
      route: "/(tabs)/support",
    },
  ]

  const handleMenuPress = (route: string) => {
    console.log(`Navigating to: ${route}`)
    router.push(route as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.color && { borderLeftWidth: 3, borderLeftColor: item.color }]}
              onPress={() => handleMenuPress(item.route)}
            >
              <View
                style={[
                  styles.menuIcon,
                  {
                    backgroundColor: item.color ? `${item.color}15` : "#4a5d4a15",
                  },
                ]}
              >
                <Ionicons name={item.icon} size={24} color={item.color || "#4a5d4a"} />
              </View>
              <View style={styles.menuContent}>
                <View style={styles.menuTitleContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NOUVEAU</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
            <Text style={styles.settingsText}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.settingsText, { color: "#EF4444" }]}>Déconnexion</Text>
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
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4a5d4a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  newBadge: {
    backgroundColor: "#efe444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#111827",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  settingsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settingsText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    marginLeft: 16,
  },
})
