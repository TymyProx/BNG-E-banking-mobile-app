import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

interface BNGBankCardProps {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  balance: string
  cardType: "debit" | "credit"
  isVirtual?: boolean
  onPress?: () => void
}

export function BNGBankCard({
  cardNumber,
  cardHolder,
  expiryDate,
  balance,
  cardType,
  isVirtual = false,
  onPress,
}: BNGBankCardProps) {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, "$1 ").trim()
  }

  const maskCardNumber = (number: string) => {
    return number.replace(/\d(?=\d{4})/g, "*")
  }

  // Gradients modernes selon le type de carte
  const getCardGradient = () => {
    if (cardType === "credit") {
      return [colors.secondary, colors.secondaryDark, colors.accent]
    }
    return [colors.primary, colors.primaryDark, colors.accent]
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient colors={getCardGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {/* Motif décoratif moderne */}
        <View style={styles.decorativeElements}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
          <View style={styles.wave} />
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.bankInfo}>
            <Text style={styles.bankName}>BNG</Text>
            <Text style={styles.countryName}>Guinée</Text>
          </View>
          <View style={styles.cardTypeContainer}>
            <Text style={styles.cardType}>
              {cardType.toUpperCase()} {isVirtual ? "• VIRTUELLE" : ""}
            </Text>
            <Text style={styles.flagEmoji}>🇬🇳</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.balance}>{balance}</Text>
          <Text style={styles.balanceLabel}>Solde Disponible</Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardNumber}>{formatCardNumber(maskCardNumber(cardNumber))}</Text>
            <Text style={styles.cardHolder}>{cardHolder}</Text>
          </View>
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryLabel}>EXPIRE</Text>
            <Text style={styles.expiryDate}>{expiryDate}</Text>
          </View>
        </View>

        {/* Logo BNG en filigrane moderne */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>BNG</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 200,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 8,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
  },
  decorativeElements: {
    position: "absolute",
    top: -30,
    right: -30,
  },
  circle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    position: "absolute",
  },
  circle2: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    position: "absolute",
    top: 25,
    right: 25,
  },
  circle3: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    position: "absolute",
    top: 45,
    right: 45,
  },
  wave: {
    position: "absolute",
    bottom: -100,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  bankInfo: {
    flexDirection: "column",
  },
  bankName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },
  countryName: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    opacity: 0.9,
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  cardTypeContainer: {
    alignItems: "flex-end",
  },
  cardType: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.9,
    marginBottom: 6,
    letterSpacing: 1,
  },
  flagEmoji: {
    fontSize: 18,
  },
  cardBody: {
    flex: 1,
    justifyContent: "center",
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 3,
    marginBottom: 6,
    fontFamily: "monospace",
  },
  cardHolder: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
  },
  expiryContainer: {
    alignItems: "flex-end",
  },
  expiryLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 3,
    letterSpacing: 1,
  },
  expiryDate: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  watermark: {
    position: "absolute",
    bottom: 24,
    right: 24,
    opacity: 0.08,
  },
  watermarkText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
  },
})
