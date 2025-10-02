"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface DynamicBalanceProps {
  balance: number
  isVisible?: boolean
  onToggleVisibility?: () => void
}

export function DynamicBalance({ balance, isVisible = true, onToggleVisibility }: DynamicBalanceProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const [displayBalance, setDisplayBalance] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Animate balance changes
  useEffect(() => {
    if (displayBalance !== balance) {
      setIsAnimating(true)
      const difference = balance - displayBalance
      const steps = 20
      const stepValue = difference / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayBalance(balance)
          setIsAnimating(false)
          clearInterval(interval)
        } else {
          setDisplayBalance((prev) => prev + stepValue)
        }
      }, 50)

      return () => clearInterval(interval)
    }
  }, [balance, displayBalance])

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={[styles.balanceText, { color: colors.text }]}>
          {isVisible ? formatBalance(displayBalance) : "••••••"}
        </Text>
        {isAnimating && <View style={[styles.animationIndicator, { backgroundColor: colors.success }]} />}
      </View>
      <TouchableOpacity onPress={onToggleVisibility} style={styles.visibilityButton}>
        <IconSymbol name={isVisible ? "eye.fill" : "eye.slash.fill"} size={20} color={colors.icon} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  animationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  visibilityButton: {
    padding: 8,
  },
})
