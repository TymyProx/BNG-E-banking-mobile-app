"use client"

import { View, StyleSheet } from "react-native"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { Stack } from "expo-router"
import React from "react"

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>      
      <View style={styles.contentArea}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{ headerShown: false, animation: "slide_from_right", animationDuration: 300, gestureEnabled: false, gestureDirection: "horizontal" }}
          />
          <Stack.Screen name="transfer" options={{ headerShown: false }} />
          <Stack.Screen name="beneficiaries" options={{ headerShown: false }} />
          <Stack.Screen name="bills" options={{ headerShown: false }} />
          <Stack.Screen name="cards" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
          <Stack.Screen name="statements" options={{ headerShown: false }} />
         {/* <Stack.Screen name="new-account" options={{ headerShown: false }} /> */}
          <Stack.Screen
            name="menu"
            options={{ headerShown: false, animation: "slide_from_left", animationDuration: 300, gestureEnabled: true, gestureDirection: "horizontal" }}
          />
        </Stack>
      </View>
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
