"use client"

import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Platform } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "@/contexts/AuthContext"
import React from "react"

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()
  const { user } = useAuth()

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U"
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase()
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#10b981", "#059669", "#34d399"]} style={styles.gradientBackground} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.glassHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user?.firstName?.toLocaleUpperCase() || "Utilisateur"}</Text>
                  <Text style={styles.userEmail}>{user?.email || ""}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.whiteSection}>
            {(user?.firstName || user?.lastName) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={["#FBBF24", "#F59E0B"] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sectionIcon}
                    >
                      <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.sectionTitle}>Informations personnelles</Text>
                </View>
                <View style={styles.card}>
                  {user?.firstName && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Prénom</Text>
                        <Text style={styles.infoValue}>{user.firstName}</Text>
                      </View>
                      {user?.lastName && <View style={styles.divider} />}
                    </>
                  )}
                  {user?.lastName && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Nom</Text>
                      <Text style={styles.infoValue}>{user.lastName}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {(user?.email || user?.phoneNumber) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={["#FBBF24", "#F59E0B"] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sectionIcon}
                    >
                      <IconSymbol name="envelope.fill" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.sectionTitle}>Contact</Text>
                </View>
                <View style={styles.card}>
                  {user?.email && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user.email}</Text>
                      </View>
                      {user?.phoneNumber && <View style={styles.divider} />}
                    </>
                  )}
                  {user?.phoneNumber && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Téléphone</Text>
                      <Text style={styles.infoValue}>{user.phoneNumber}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.bottomSpacer} />
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
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "40%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  glassHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
  },
  whiteSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 20,
    minHeight: 600,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  bottomSpacer: {
    height: 32,
  },
})
