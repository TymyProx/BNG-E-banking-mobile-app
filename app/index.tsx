"use client"

import { Redirect } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { useAuth } from "@/contexts/AuthContext"

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#10B981" }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  // Redirect to login if not authenticated, otherwise go to main app
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />
}
