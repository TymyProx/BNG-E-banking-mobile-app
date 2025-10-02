"use client"

import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface MinimalAccountCardProps {
  accountName: string
  accountNumber: string
  balance: string
  currency?: string
  onPress?: () => void
  onFavorite?: () => void
  onMore?: () => void
  isFavorite?: boolean
}

export function MinimalAccountCard({
  accountName,
  accountNumber,
  balance,
  currency = "GNF",
  onPress,
  onFavorite,
  onMore,
  isFavorite = false,
}: MinimalAccountCardProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>BNG</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onFavorite} style={styles.actionButton}>
            <IconSymbol
              name={isFavorite ? "heart.fill" : "heart"}
              size={20}
              color={isFavorite ? colors.primary : colors.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMore} style={styles.actionButton}>
            <IconSymbol name="ellipsis.circle" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.accountName, { color: colors.text }]}>{accountName}</Text>
        <Text style={[styles.accountNumber, { color: colors.textSecondary }]}>{accountNumber}</Text>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={[styles.balance, { color: colors.text }]}>{balance}</Text>
        <Text style={[styles.currency, { color: colors.textSecondary }]}>{currency}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  currency: {
    fontSize: 12,
  },
})
