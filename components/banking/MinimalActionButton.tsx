"use client"

import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface MinimalActionButtonProps {
  title: string
  subtitle?: string
  icon: string
  onPress?: () => void
}

export function MinimalActionButton({ title, subtitle, icon, onPress }: MinimalActionButtonProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        <IconSymbol name={icon as any} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    minWidth: 80,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
  },
})
