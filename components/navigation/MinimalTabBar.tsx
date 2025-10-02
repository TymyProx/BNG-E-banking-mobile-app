"use client"

import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface TabItem {
  id: string
  title: string
  icon: string
  isActive: boolean
  onPress: () => void
}

interface MinimalTabBarProps {
  tabs: TabItem[]
}

export function MinimalTabBar({ tabs }: MinimalTabBarProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.id} style={styles.tab} onPress={tab.onPress}>
            <Text style={[styles.tabText, { color: tab.isActive ? colors.text : colors.textSecondary }]}>
              {tab.title}
            </Text>
            {tab.isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  tab: {
    position: "relative",
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 18,
    fontWeight: "500",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -16,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
})
