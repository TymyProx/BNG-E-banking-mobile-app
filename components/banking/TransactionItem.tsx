import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface TransactionItemProps {
  id: string
  title: string
  subtitle: string
  amount: string
  type: "credit" | "debit"
  category: "transfer" | "payment" | "deposit" | "withdrawal" | "fee"
  date: string
  onPress?: () => void
}

export function TransactionItem({ title, subtitle, amount, type, category, date, onPress }: TransactionItemProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const getIconName = () => {
    switch (category) {
      case "transfer":
        return "arrow.up.arrow.down"
      case "payment":
        return "banknote.fill"
      case "deposit":
        return "plus.circle.fill"
      case "withdrawal":
        return "minus.circle.fill"
      case "fee":
        return "percent"
      default:
        return "banknote.fill"
    }
  }

  const getIconColor = () => {
    if (type === "credit") return colors.success
    if (category === "fee") return colors.warning
    return colors.error
  }

  const getIconBackground = () => {
    if (type === "credit") return colors.successBackground
    if (category === "fee") return colors.warningBackground
    return colors.errorBackground
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={[styles.iconContainer, { backgroundColor: getIconBackground() }]}>
        <IconSymbol name={getIconName()} size={22} color={getIconColor()} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        <Text style={[styles.date, { color: colors.textTertiary }]}>{date}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            {
              color: type === "credit" ? colors.success : colors.text,
            },
          ]}
        >
          {type === "credit" ? "+" : "-"}
          {amount}
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.iconSecondary} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 3,
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: {
    fontSize: 17,
    fontWeight: "700",
    marginRight: 12,
    letterSpacing: -0.3,
  },
})
