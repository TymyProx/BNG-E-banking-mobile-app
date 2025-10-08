"use client"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { IconSymbol } from "@/components/ui/IconSymbol"

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
  backButtonColor = "#FEF3C7",
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
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}

        {!showAddButton && <View style={styles.placeholder} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  placeholder: {
    width: 48,
    height: 48,
  },
})
