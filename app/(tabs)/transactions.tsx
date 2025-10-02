import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from "react-native"
import { TransactionItem } from "@/components/banking/TransactionItem"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import React from "react"

export default function TransactionsScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const allTransactions = [
    {
      id: "1",
      title: "Starbucks Coffee",
      subtitle: "Food & Dining • Card ending 1234",
      amount: "$12.50",
      type: "debit" as const,
      category: "payment" as const,
      date: "Today, 2:30 PM",
    },
    {
      id: "2",
      title: "Salary Deposit",
      subtitle: "ABC Corporation",
      amount: "$3,500.00",
      type: "credit" as const,
      category: "deposit" as const,
      date: "Yesterday, 9:00 AM",
    },
    {
      id: "3",
      title: "Netflix Subscription",
      subtitle: "Entertainment • Auto-pay",
      amount: "$15.99",
      type: "debit" as const,
      category: "payment" as const,
      date: "Dec 28, 2024",
    },
    {
      id: "4",
      title: "ATM Withdrawal",
      subtitle: "Chase ATM • Main Street",
      amount: "$100.00",
      type: "debit" as const,
      category: "withdrawal" as const,
      date: "Dec 27, 2024",
    },
    {
      id: "5",
      title: "Transfer to Savings",
      subtitle: "Internal Transfer",
      amount: "$500.00",
      type: "debit" as const,
      category: "transfer" as const,
      date: "Dec 26, 2024",
    },
    {
      id: "6",
      title: "Grocery Store",
      subtitle: "Food & Dining • Card ending 1234",
      amount: "$85.32",
      type: "debit" as const,
      category: "payment" as const,
      date: "Dec 25, 2024",
    },
    {
      id: "7",
      title: "Freelance Payment",
      subtitle: "XYZ Company",
      amount: "$1,200.00",
      type: "credit" as const,
      category: "deposit" as const,
      date: "Dec 24, 2024",
    },
    {
      id: "8",
      title: "Electric Bill",
      subtitle: "Utilities • Auto-pay",
      amount: "$120.45",
      type: "debit" as const,
      category: "payment" as const,
      date: "Dec 23, 2024",
    },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Transactions</Text>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.cardBackground }]}>
          <IconSymbol name="gear" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.icon}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {["All", "Income", "Expenses", "Transfers"].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, { backgroundColor: index === 0 ? colors.primary : colors.cardBackground }]}
          >
            <Text style={[styles.filterTabText, { color: index === 0 ? "#FFFFFF" : colors.text }]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        {allTransactions.map((transaction) => (
          <TransactionItem key={transaction.id} {...transaction} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterTabs: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
})
