"use client"

import React from "react"
import { View, TouchableOpacity, StyleSheet, Text, Animated, Platform } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type NavItem = {
  name: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  route: string
}

const navItems: NavItem[] = [
  { name: "home", icon: "home", label: "Accueil", route: "/(tabs)/" },
  { name: "transfer", icon: "swap-horizontal", label: "Transfert", route: "/(tabs)/transfer" },
  { name: "beneficiaries", icon: "people", label: "Bénéficiaires", route: "/(tabs)/beneficiaries" },
  { name: "cards", icon: "card", label: "Cartes", route: "/(tabs)/cards" },
  { name: "menu", icon: "menu", label: "Menu", route: "/(tabs)/menu" },
]

export default function BottomNavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const [animations] = React.useState(navItems.map(() => new Animated.Value(1)))

  const handlePress = (route: string, index: number) => {
    // Animation de pression
    Animated.sequence([
      Animated.timing(animations[index], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    router.replace(route as any)
  }

  const isActive = (route: string) => {
    if (route === "/(tabs)/") {
      return pathname === "/" || pathname === "/(tabs)/" || pathname === "/(tabs)"
    }
    return pathname === route || pathname.startsWith(route)
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 12,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {navItems.map((item, index) => {
          const active = isActive(item.route)
          return (
            <Animated.View
              key={item.name}
              style={[styles.navItemWrapper, { transform: [{ scale: animations[index] }] }]}
            >
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handlePress(item.route, index)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    active && {
                      backgroundColor: `${colors.primary}15`,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={24} color={active ? colors.primary : colors.icon} />
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: active ? colors.primary : colors.textSecondary,
                      fontWeight: active ? "600" : "400",
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {active && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItemWrapper: {
    flex: 1,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
})
