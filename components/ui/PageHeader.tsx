"use client"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"
import React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  showBackButton?: boolean
  showAddButton?: boolean
  onAddPress?: () => void
  backButtonColor?: string
  addButtonColor?: string
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  showAddButton = false,
  onAddPress,
  backButtonColor = "rgba(251, 191, 36, 0.15)", // Changed default to match accounts page
  addButtonColor = "#2D7A4F",
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: backButtonColor }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#FBBF24" />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>

        {showAddButton && onAddPress && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: addButtonColor }]} onPress={onAddPress}>
            <IconSymbol name="plus" size={22} color="white" />
          </TouchableOpacity>
        )}

        {!showAddButton && <View style={styles.placeholder} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16, // Reduced from 60 to 16 to match accounts page
    paddingBottom: 24, // Increased from 20 to 24 to match accounts page
    paddingHorizontal: 24, // Increased from 20 to 24 to match accounts page
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44, // Reduced from 48 to 44 to match accounts page
    height: 44, // Reduced from 48 to 44 to match accounts page
    borderRadius: 22, // Adjusted to match new size
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800", // Increased from "bold" to "800" to match accounts page
    letterSpacing: -0.5, // Added letter spacing
    marginBottom: 4, // Added margin bottom
  },
  description: {
    fontSize: 13, // Reduced from 14 to 13 to match accounts page
    fontWeight: "500", // Added font weight
    marginTop: 0, // Removed margin top since we have marginBottom on title
  },
  addButton: {
    width: 44, // Reduced from 48 to 44 to match accounts page
    height: 44, // Reduced from 48 to 44 to match accounts page
    borderRadius: 22, // Adjusted to match new size
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 44, // Reduced from 48 to 44 to match accounts page
    height: 44, // Reduced from 48 to 44 to match accounts page
  },
})
