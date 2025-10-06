"use client"

import { useState, useRef } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Animated } from "react-native"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 48

interface Card {
  id: string
  name: string
  number: string
  type: "Visa" | "Mastercard"
  expiry: string
  status: "active" | "blocked" | "expired"
  balance: number
  isBlocked: boolean
  cardholderName: string
}

export default function CardsScreen() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current

  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]

  const [cards] = useState<Card[]>([
    {
      id: "1",
      name: "GOLD",
      number: "4386 •••• •••• 2624",
      type: "Visa",
      expiry: "08/26",
      status: "active",
      balance: 48200,
      isBlocked: false,
      cardholderName: "Mr YOLOGO MOHAMED YACINE T",
    },
  ])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  })

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH)
    setActiveCardIndex(index)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cartes</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cards Carousel */}
        <View style={styles.carouselContainer}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
          >
            {cards.map((card, index) => (
              <View key={card.id} style={[styles.cardContainer, { width: CARD_WIDTH }]}>
                <LinearGradient
                  colors={["#F4D03F", "#F9E79F", "#F4D03F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goldCard}
                >
                  {/* Card pattern overlay */}
                  <View style={styles.cardPattern}>
                    <View style={[styles.patternCircle, styles.patternCircle1]} />
                    <View style={[styles.patternCircle, styles.patternCircle2]} />
                    <View style={[styles.patternCircle, styles.patternCircle3]} />
                  </View>

                  {/* Card content */}
                  <View style={styles.cardContent}>
                    {/* Bank logo and GOLD text */}
                    <View style={styles.cardHeader}>
                      <View style={styles.bankLogo}>
                        <Text style={styles.bankLogoText}>BNG</Text>
                        <Text style={styles.bankLogoSubtext}>BANK</Text>
                      </View>
                      <Text style={styles.goldText}>{card.name}</Text>
                    </View>

                    {/* Chip and contactless */}
                    <View style={styles.chipContainer}>
                      <View style={styles.chip}>
                        <View style={styles.chipPattern} />
                      </View>
                      <IconSymbol name="wave.3.right" size={24} color="rgba(255,255,255,0.9)" />
                    </View>

                    {/* Card number */}
                    <Text style={styles.cardNumber}>{card.number}</Text>

                    {/* Expiry date */}
                    <Text style={styles.expiryDate}>{card.expiry}</Text>

                    {/* Cardholder name */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.cardholderLabel}>CARDHOLDER NAME</Text>
                        <Text style={styles.cardholderName}>{card.cardholderName}</Text>
                      </View>
                      <Text style={styles.visaLogo}>VISA</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.ScrollView>

          {/* Pagination dots */}
          {cards.length > 1 && (
            <View style={styles.pagination}>
              {cards.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: index === activeCardIndex ? colors.text : colors.textSecondary,
                      opacity: index === activeCardIndex ? 1 : 0.3,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.actionIconContainer, { backgroundColor: "#FFE5E5" }]}>
              <IconSymbol name="lock.fill" size={20} color="#FF4444" />
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Bloquer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.actionIconContainer, { backgroundColor: "#E5F0FF" }]}>
              <IconSymbol name="eye.fill" size={20} color="#0066FF" />
            </View>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Détails de la carte</Text>
          </TouchableOpacity>
        </View>

        {/* Request card section */}
        <TouchableOpacity style={[styles.requestCardContainer, { backgroundColor: "#0066FF" }]}>
          <View style={styles.requestCardContent}>
            <View style={styles.requestCardIcon}>
              <IconSymbol name="creditcard.fill" size={32} color="white" />
            </View>
            <View style={styles.requestCardText}>
              <Text style={styles.requestCardTitle}>Demande d'une carte</Text>
              <Text style={styles.requestCardSubtitle}>Obtenez votre carte en quelques clics</Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color="white" />
          </View>
        </TouchableOpacity>

        {/* Info section */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.infoContent}>
            <View style={styles.infoImagePlaceholder}>
              <IconSymbol name="creditcard" size={48} color={colors.textSecondary} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>BNG VISA INFINITE</Text>
              <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                est la carte bancaire la plus prestigieuse du réseau VISA émise par BNG Bank International.
              </Text>
              <TouchableOpacity>
                <Text style={[styles.infoLink, { color: "#0066FF" }]}>Voir plus</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carouselContent: {
    paddingHorizontal: 24,
  },
  cardContainer: {
    paddingRight: 0,
  },
  goldCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 220,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  cardPattern: {
    position: "absolute",
    inset: 0,
  },
  patternCircle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -75,
  },
  patternCircle3: {
    width: 100,
    height: 100,
    top: 60,
    right: 80,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  bankLogo: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bankLogoText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F4D03F",
    letterSpacing: 1,
  },
  bankLogoSubtext: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 2,
  },
  goldText: {
    fontSize: 24,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 2,
  },
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  chip: {
    width: 48,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chipPattern: {
    width: 32,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 4,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: "600",
    color: "white",
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  expiryDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardholderLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  visaLogo: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  requestCardContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  requestCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  requestCardIcon: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  requestCardText: {
    flex: 1,
  },
  requestCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  requestCardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  infoContainer: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoContent: {
    flexDirection: "row",
    gap: 20,
  },
  infoImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoLink: {
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
})
