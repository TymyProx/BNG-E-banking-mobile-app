"use client"

import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface BNGHeaderProps {
  greeting: string
  userName: string
  notificationCount?: number
  onNotificationPress?: () => void
}

export function BNGHeader({ greeting, userName, notificationCount = 0, onNotificationPress }: BNGHeaderProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd, colors.gradientGreen]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.bngLogo}>BNG</Text>
            <Text style={styles.guineaText}>Guinée</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.flagButton}>
            <Text style={styles.flagEmoji}>🇬🇳</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
            <IconSymbol name="bell.fill" size={24} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>
                  {notificationCount > 9 ? "9+" : notificationCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Motif décoratif africain */}
      <View style={styles.decorativePattern}>
        <View style={[styles.patternDot, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
        <View style={[styles.patternDot, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
        <View style={[styles.patternDot, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: "relative",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  bngLogo: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  guineaText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.9,
    fontStyle: "italic",
  },
  userInfo: {
    marginTop: 8,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 4,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  flagEmoji: {
    fontSize: 20,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCount: {
    color: "#E53E3E",
    fontSize: 10,
    fontWeight: "bold",
  },
  decorativePattern: {
    position: "absolute",
    bottom: 10,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
