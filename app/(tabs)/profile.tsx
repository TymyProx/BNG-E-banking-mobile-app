"use client"

import { IconSymbol } from "@/components/ui/IconSymbol"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import React, { useState } from "react"
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import * as SecureStore from 'expo-secure-store'

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light"
  const colors = Colors[colorScheme]
  const router = useRouter()

  // États pour les paramètres
  const [pushNotifications, setPushNotifications] = useState(true)
  const [biometricLogin, setBiometricLogin] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(colorScheme === "dark")

  // États pour l'édition du profil
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "Amadou",
    lastName: "Bah",
    email: "amadou.bah@bng.gn",
    phone: "+224 622 123 456",
    address: "Conakry, Guinée",
    dateOfBirth: "15/03/1990",
  })

  // États pour le changement de mot de passe
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleBack = () => {
    router.back()
  }

  const handleSaveProfile = () => {
    // Simulation de la sauvegarde
    Alert.alert("Succès", "Profil mis à jour avec succès", [
      { text: "OK", onPress: () => setIsEditingProfile(false) }
    ])
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas")
      return
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    
    // Simulation du changement de mot de passe
    Alert.alert("Succès", "Mot de passe modifié avec succès", [
      { text: "OK", onPress: () => {
        setIsChangingPassword(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      }}
    ])
  }

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", style: "destructive", onPress: async () => {
          try {
            // Supprimer le token du stockage sécurisé
            await SecureStore.deleteItemAsync("token")
            // Redirection vers la page de connexion
            router.replace("/(auth)/login")
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error)
            Alert.alert("Erreur", "Une erreur s'est produite lors de la déconnexion")
          }
        }}
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront supprimées définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => {
          Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès")
        }}
      ]
    )
  }

  const profileSections = [
    {
      title: "Informations personnelles",
      items: [
        { 
          id: "edit-profile", 
          title: "Modifier le profil", 
          icon: "person.fill", 
          onPress: () => setIsEditingProfile(true)
        },
        { 
          id: "change-password", 
          title: "Changer le mot de passe", 
          icon: "lock.fill", 
          onPress: () => setIsChangingPassword(true)
        },
        { 
          id: "security", 
          title: "Paramètres de sécurité", 
          icon: "shield.fill", 
          onPress: () => Alert.alert("Info", "Fonctionnalité en développement")
        },
      ],
    },
    // {
    //   title: "Documents et relevés",
    //   items: [
    //     { 
    //       id: "statements", 
    //       title: "Relevés de compte", 
    //       icon: "doc.text.fill", 
    //       onPress: () => router.push("/(tabs)/statements")
    //     },
    //     { 
    //       id: "tax-docs", 
    //       title: "Documents fiscaux", 
    //       icon: "folder.fill", 
    //       onPress: () => Alert.alert("Info", "Aucun document disponible")
    //     },
    //     { 
    //       id: "transaction-history", 
    //       title: "Historique des transactions", 
    //       icon: "clock.fill", 
    //       onPress: () => router.push("/(tabs)/transactions")
    //     },
    //   ],
    // },
    {
      title: "Paramètres de compte",
      items: [
        { 
          id: "limits", 
          title: "Limites de transaction", 
          icon: "dollarsign.circle.fill", 
          onPress: () => Alert.alert("Limites", "Limite quotidienne: 500,000 GNF\nLimite mensuelle: 5,000,000 GNF")
        },
        { 
          id: "linked-accounts", 
          title: "Comptes liés", 
          icon: "link", 
          onPress: () => Alert.alert("Info", "Aucun compte lié")
        },
        { 
          id: "beneficiaries", 
          title: "Mes bénéficiaires", 
          icon: "person.2.fill", 
          onPress: () => router.push("/(tabs)/beneficiaries")
        },
      ],
    },
    {
      title: "Support et aide",
      items: [
        { 
          id: "help", 
          title: "Centre d'aide", 
          icon: "questionmark.circle.fill", 
          onPress: () => router.push("/(tabs)/support")
        },
        { 
          id: "contact", 
          title: "Contacter le support", 
          icon: "message.fill", 
          onPress: () => Alert.alert("Support", "Email: support@bng.gn\nTéléphone: +224 30 45 67 89")
        },
        { 
          id: "branch", 
          title: "Trouver une agence", 
          icon: "location.fill", 
          onPress: () => Alert.alert("Info", "Fonctionnalité de géolocalisation en développement")
        },
        { 
          id: "feedback", 
          title: "Donner un avis", 
          icon: "star.fill", 
          onPress: () => Alert.alert("Merci", "Votre avis nous aide à améliorer nos services")
        },
      ],
    },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {/* <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mon Profil</Text>
        <View style={styles.headerRight} />
      </View> */}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profileData.firstName} {profileData.lastName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {profileData.email}
            </Text>
            <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
              {profileData.phone}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditingProfile(true)}
          >
            <IconSymbol name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Account Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Client depuis</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>Janvier 2020</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Type de compte</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>Premium</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Produits actifs</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>3 Comptes</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Statut</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, { color: "#10B981" }]}>Vérifié</Text>
            </View>
          </View>
        </View>

        {/* Notifications Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.sectionItems}>
            <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <IconSymbol name="bell.fill" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Notifications push</Text>
              <Switch 
                trackColor={{ false: colors.border, true: colors.primary }} 
                thumbColor="#FFFFFF" 
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
            </View>
            
            <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Notifications email</Text>
              <Switch 
                trackColor={{ false: colors.border, true: colors.primary }} 
                thumbColor="#FFFFFF" 
                value={emailNotifications}
                onValueChange={setEmailNotifications}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <IconSymbol name="message.fill" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Notifications SMS</Text>
              <Switch 
                trackColor={{ false: colors.border, true: colors.primary }} 
                thumbColor="#FFFFFF" 
                value={smsNotifications}
                onValueChange={setSmsNotifications}
              />
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sécurité</Text>
          <View style={styles.sectionItems}>
            <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <IconSymbol name="faceid" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Connexion biométrique</Text>
              <Switch 
                trackColor={{ false: colors.border, true: colors.primary }} 
                thumbColor="#FFFFFF" 
                value={biometricLogin}
                onValueChange={setBiometricLogin}
              />
            </View>

            {/* <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <IconSymbol name="moon.fill" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Mode sombre</Text>
              <Switch 
                trackColor={{ false: colors.border, true: colors.primary }} 
                thumbColor="#FFFFFF" 
                value={darkMode}
                onValueChange={setDarkMode}
              />
            </View> */}
          </View>
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sectionItem, { backgroundColor: colors.cardBackground }]}
                  onPress={item.onPress}
                >
                  <View style={[styles.itemIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <IconSymbol name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionItems}>
            <TouchableOpacity
              style={[styles.sectionItem, { backgroundColor: colors.cardBackground }]}
              onPress={handleLogout}
            >
              <View style={[styles.itemIcon, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                <IconSymbol name="arrow.right.square" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.itemTitle, { color: "#EF4444" }]}>Se déconnecter</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            AstraEbanking v1.0.0 - BNG Guinée
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.textSecondary }]}>
            Dernière mise à jour: 15 janvier 2024
          </Text>
        </View>
      </ScrollView>

      {/* Modal d'édition du profil */}
      <Modal
        visible={isEditingProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setIsEditingProfile(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Modifier le profil</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Prénom</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={profileData.firstName}
                onChangeText={(text) => setProfileData({...profileData, firstName: text})}
                placeholder="Prénom"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nom</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={profileData.lastName}
                onChangeText={(text) => setProfileData({...profileData, lastName: text})}
                placeholder="Nom"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={profileData.email}
                onChangeText={(text) => setProfileData({...profileData, email: text})}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Téléphone</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={profileData.phone}
                onChangeText={(text) => setProfileData({...profileData, phone: text})}
                placeholder="Téléphone"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Adresse</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={profileData.address}
                onChangeText={(text) => setProfileData({...profileData, address: text})}
                placeholder="Adresse"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Date de naissance</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={profileData.dateOfBirth}
                onChangeText={(text) => setProfileData({...profileData, dateOfBirth: text})}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal
        visible={isChangingPassword}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setIsChangingPassword(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Changer le mot de passe</Text>
            <TouchableOpacity onPress={handleChangePassword}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Confirmer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mot de passe actuel</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                placeholder="Mot de passe actuel"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nouveau mot de passe</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmer le nouveau mot de passe</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementsTitle, { color: colors.text }]}>
                Exigences du mot de passe:
              </Text>
              <Text style={[styles.requirementItem, { color: colors.textSecondary }]}>
                • Au moins 6 caractères
              </Text>
              <Text style={[styles.requirementItem, { color: colors.textSecondary }]}>
                • Contenir au moins une lettre majuscule
              </Text>
              <Text style={[styles.requirementItem, { color: colors.textSecondary }]}>
                • Contenir au moins un chiffre
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionItems: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
  },
  versionSubtext: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordRequirements: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 12,
    marginBottom: 4,
  },
})
