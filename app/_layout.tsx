"use client"

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import "react-native-reanimated"

import { useColorScheme } from "@/hooks/useColorScheme"
import { AuthProvider } from "@/contexts/AuthContext"
import { BankingProvider } from "@/contexts/BankingContext"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <AuthProvider>
      <BankingProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="account-details" options={{ headerShown: false }} />
            <Stack.Screen name="add-beneficiary" options={{ headerShown: false }} />
            <Stack.Screen name="beneficiary-details" options={{ headerShown: false }} />
            <Stack.Screen name="checkbook-request" options={{ headerShown: false }} />
            <Stack.Screen name="credit-request" options={{ headerShown: false }} />
            <Stack.Screen name="edit-beneficiary" options={{ headerShown: false }} />
            <Stack.Screen name="new-account" options={{ headerShown: false }} />
            <Stack.Screen name="new-request" options={{ headerShown: false }} />
            <Stack.Screen name="request-form" options={{ headerShown: false }} />
            <Stack.Screen name="rib-request" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </BankingProvider>
    </AuthProvider>
  )
}
