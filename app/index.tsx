import { Redirect } from "expo-router"
import React from "react"

export default function Index() {
  // In a real app, you'd check authentication state here
  // For now, we'll redirect directly to the tabs (skipping auth for demo)
  return <Redirect href="/(tabs)" />
}
