import { StyleSheet, View, Text, ScrollView, SafeAreaView, Dimensions } from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import React from "react"

const { width } = Dimensions.get("window")

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const spendingCategories = [
    { name: "Food & Dining", amount: 450, percentage: 35, color: colors.primary },
    { name: "Shopping", amount: 320, percentage: 25, color: colors.secondary },
    { name: "Transportation", amount: 180, percentage: 14, color: colors.accent },
    { name: "Entertainment", amount: 150, percentage: 12, color: colors.warning },
    { name: "Bills & Utilities", amount: 180, percentage: 14, color: colors.error },
  ]

  const monthlyStats = [
    { title: "Total Income", amount: "$4,200.00", change: "+5.2%", isPositive: true },
    { title: "Total Expenses", amount: "$2,850.00", change: "-2.1%", isPositive: true },
    { title: "Savings", amount: "$1,350.00", change: "+12.5%", isPositive: true },
    { title: "Investments", amount: "$800.00", change: "+8.3%", isPositive: true },
  ]

  const savingsGoals = [
    { name: "Emergency Fund", current: 2500, target: 5000, color: colors.primary },
    { name: "Vacation", current: 800, target: 2000, color: colors.secondary },
    { name: "New Car", current: 3200, target: 8000, color: colors.accent },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Financial Insights</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>December 2024</Text>
        </View>

        {/* Monthly Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Overview</Text>
          <View style={styles.statsGrid}>
            {monthlyStats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.statAmount, { color: colors.text }]}>{stat.amount}</Text>
                <Text style={[styles.statTitle, { color: colors.icon }]}>{stat.title}</Text>
                <Text style={[styles.statChange, { color: stat.isPositive ? colors.success : colors.error }]}>
                  {stat.change}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spending Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Breakdown</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
            {/* Simple bar chart representation */}
            <View style={styles.chartContainer}>
              {spendingCategories.map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={[styles.categoryAmountText, { color: colors.text }]}>${category.amount}</Text>
                    <Text style={[styles.categoryPercentage, { color: colors.icon }]}>{category.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Savings Goals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Savings Goals</Text>
          <View style={styles.goalsContainer}>
            {savingsGoals.map((goal, index) => {
              const progress = (goal.current / goal.target) * 100
              return (
                <View key={index} style={[styles.goalCard, { backgroundColor: colors.cardBackground }]}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                    <Text style={[styles.goalProgress, { color: colors.icon }]}>{Math.round(progress)}%</Text>
                  </View>
                  <View style={styles.goalAmount}>
                    <Text style={[styles.goalCurrent, { color: colors.text }]}>${goal.current.toLocaleString()}</Text>
                    <Text style={[styles.goalTarget, { color: colors.icon }]}>of ${goal.target.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: goal.color, width: `${progress}%` }]} />
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Smart Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.insightIcon, { backgroundColor: `${colors.success}15` }]}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={colors.success} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Great Progress!</Text>
                <Text style={[styles.insightText, { color: colors.icon }]}>
                  You've saved 15% more this month compared to last month.
                </Text>
              </View>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.insightIcon, { backgroundColor: `${colors.warning}15` }]}>
                <IconSymbol name="banknote.fill" size={20} color={colors.warning} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Spending Alert</Text>
                <Text style={[styles.insightText, { color: colors.icon }]}>
                  Your dining expenses are 20% higher than usual this month.
                </Text>
              </View>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.insightIcon, { backgroundColor: `${colors.primary}15` }]}>
                <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.primary} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Investment Tip</Text>
                <Text style={[styles.insightText, { color: colors.icon }]}>
                  Consider investing your extra $500 in a high-yield savings account.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
    gap: 16,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
  },
  categoryAmount: {
    alignItems: "flex-end",
  },
  categoryAmountText: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryPercentage: {
    fontSize: 12,
  },
  goalsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: "600",
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: "600",
  },
  goalAmount: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
    gap: 8,
  },
  goalCurrent: {
    fontSize: 20,
    fontWeight: "bold",
  },
  goalTarget: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
})
