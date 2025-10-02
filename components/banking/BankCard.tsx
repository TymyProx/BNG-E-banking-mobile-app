import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface BankCardProps {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  balance: string
  cardType: "debit" | "credit"
  isVirtual?: boolean
  onPress?: () => void
}

export function BankCard({
  cardNumber,
  cardHolder,
  expiryDate,
  balance,
  cardType,
  isVirtual = false,
  onPress,
}: BankCardProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, "$1 ").trim()
  }

  const maskCardNumber = (number: string) => {
    return number.replace(/\d(?=\d{4})/g, "*")
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>
            {cardType.toUpperCase()} {isVirtual ? "• VIRTUAL" : ""}
          </Text>
          <IconSymbol name="creditcard.fill" size={24} color="#FFFFFF" />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.balance}>{balance}</Text>
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardNumber}>{formatCardNumber(maskCardNumber(cardNumber))}</Text>
            <Text style={styles.cardHolder}>{cardHolder}</Text>
          </View>
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryLabel}>VALID THRU</Text>
            <Text style={styles.expiryDate}>{expiryDate}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 200,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardType: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 2,
    marginBottom: 4,
  },
  cardHolder: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
  expiryContainer: {
    alignItems: "flex-end",
  },
  expiryLabel: {
    color: "#FFFFFF",
    fontSize: 8,
    opacity: 0.7,
    marginBottom: 2,
  },
  expiryDate: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
})
