"use client"

import AddBeneficiaryForm from "@/components/AddBeneficiaryForm"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import React from "react"
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

export default function AddBeneficiary() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()

  const handleSuccess = () => {
    router.back()
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.replace("/beneficiaries")} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nouveau bénéficiaire</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Ajouter un nouveau contact de virement
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <AddBeneficiaryForm onSuccess={handleSuccess} />
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
})
