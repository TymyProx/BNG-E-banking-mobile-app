"use client"

import { View, StyleSheet, Platform } from "react-native"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { Stack } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import BottomNavBar from "@/components/BottomNavBar"

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const navBarHeight = Platform.OS === "ios" ? 90 + insets.bottom : 90

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.contentArea, { paddingBottom: navBarHeight }]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="index"
            options={{
              animation: "slide_from_right",
              animationDuration: 300,
              gestureEnabled: false,
              gestureDirection: "horizontal",
            }}
          />
          <Stack.Screen name="transfer" />
          <Stack.Screen name="beneficiaries" />
          <Stack.Screen name="bills" />
          <Stack.Screen name="cards" />
          <Stack.Screen name="accounts" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="support" />
          <Stack.Screen name="statements" />
          <Stack.Screen
            name="menu"
            options={{
              animation: "slide_from_left",
              animationDuration: 300,
              gestureEnabled: true,
              gestureDirection: "horizontal",
            }}
          />
        </Stack>
      </View>
      <BottomNavBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
})
