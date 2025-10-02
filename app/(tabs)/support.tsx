"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React from "react"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface SupportOption {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  action: () => void
}

export default function SupportScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isAdvisorAvailable, setIsAdvisorAvailable] = useState(Math.random() > 0.3)
  const scrollViewRef = useRef<ScrollView>(null)

  const supportOptions: SupportOption[] = [
    {
      id: "chatbot",
      title: "ChatBot BNG",
      subtitle: "Assistant virtuel disponible 24h/24",
      icon: "chatbubble-ellipses-outline",
      color: "#4a5d4a",
      action: () => startChatBot(),
    },
    {
      id: "advisor",
      title: "Conseiller BNG",
      subtitle: isAdvisorAvailable ? "Conseillers disponibles maintenant" : "Aucun conseiller disponible actuellement",
      icon: "person-outline",
      color: isAdvisorAvailable ? "#4a5d4a" : "#9CA3AF",
      action: () => startAdvisorChat(),
    },
  ]

  const botResponses = [
    "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
    "Je suis là pour répondre à vos questions sur vos comptes BNG.",
    "Avez-vous besoin d'aide avec un virement ou une autre opération ?",
    "Pour plus d'informations détaillées, je peux vous mettre en relation avec un conseiller.",
    "Y a-t-il autre chose que je puisse faire pour vous ?",
    "N'hésitez pas à me poser toutes vos questions bancaires !",
    "Je peux vous aider avec vos comptes, virements, cartes et bien plus encore.",
  ]

  const startChatBot = () => {
    setSelectedOption("chatbot")
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Bonjour ! Je suis l'assistant virtuel BNG. Comment puis-je vous aider aujourd'hui ?",
      isUser: false,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  const startAdvisorChat = () => {
    if (!isAdvisorAvailable) {
      Alert.alert(
        "Service indisponible",
        "Aucun conseiller n'est disponible actuellement. Veuillez réessayer plus tard ou utiliser notre ChatBot.",
        [{ text: "OK" }],
      )
      return
    }

    setSelectedOption("advisor")
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Bonjour ! Un conseiller BNG va vous répondre dans quelques instants. En quoi puis-je vous aider ?",
      isUser: false,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  const sendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    setIsTyping(true)

    // Simulate response delay
    setTimeout(() => {
      setIsTyping(false)
      const responseText =
        selectedOption === "chatbot"
          ? botResponses[Math.floor(Math.random() * botResponses.length)]
          : "Merci pour votre message. Un conseiller vous répondra dans quelques instants."

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    }, 1500)
  }

  const goBack = () => {
    if (selectedOption) {
      setSelectedOption(null)
      setMessages([])
      setInputText("")
      setIsTyping(false)
    } else {
      router.back()
    }
  }

  const callSupport = () => {
    const phoneNumber = "+224622000000"
    Linking.openURL(`tel:${phoneNumber}`)
  }

  const emailSupport = () => {
    const email = "support@bng.gn"
    Linking.openURL(`mailto:${email}`)
  }

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (selectedOption) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#4a5d4a" />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle}>
                {selectedOption === "chatbot" ? "ChatBot BNG" : "Conseiller BNG"}
              </Text>
              <Text style={styles.chatHeaderSubtitle}>{selectedOption === "chatbot" ? "En ligne" : "Disponible"}</Text>
            </View>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: selectedOption === "chatbot" ? "#4a5d4a" : "#efe444",
                },
              ]}
            />
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: Platform.OS === "ios" ? 120 : 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[styles.messageWrapper, message.isUser ? styles.userMessageWrapper : styles.botMessageWrapper]}
              >
                <View style={[styles.messageBubble, message.isUser ? styles.userMessage : styles.botMessage]}>
                  <Text style={[styles.messageText, message.isUser ? styles.userMessageText : styles.botMessageText]}>
                    {message.text}
                  </Text>
                </View>
                <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
              </View>
            ))}

            {isTyping && (
              <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
                <View style={[styles.messageBubble, styles.botMessage]}>
                  <Text style={styles.typingText}>En train d'écrire...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { paddingBottom: Platform.OS === "ios" ? 40 : 20 }]}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tapez votre message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                {
                  opacity: inputText.trim() ? 1 : 0.5,
                },
              ]}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4a5d4a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assistance</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment souhaitez-vous être aidé ?</Text>

          {supportOptions.map((option) => (
            <TouchableOpacity key={option.id} style={styles.optionCard} onPress={option.action}>
              <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres moyens de contact</Text>

          <TouchableOpacity style={styles.contactCard} onPress={callSupport}>
            <View style={[styles.contactIcon, { backgroundColor: "#4a5d4a15" }]}>
              <Ionicons name="call-outline" size={24} color="#4a5d4a" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Téléphone</Text>
              <Text style={styles.contactSubtitle}>+224 622 000 000</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={emailSupport}>
            <View style={[styles.contactIcon, { backgroundColor: "#4a5d4a15" }]}>
              <Ionicons name="mail-outline" size={24} color="#4a5d4a" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactSubtitle}>support@bng.gn</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.hoursCard}>
            <View style={[styles.contactIcon, { backgroundColor: "#efe44415" }]}>
              <Ionicons name="time-outline" size={24} color="#efe444" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Horaires d'ouverture</Text>
              <Text style={styles.contactSubtitle}>Lun-Ven: 8h00-17h00</Text>
              <Text style={styles.contactSubtitle}>Sam: 8h00-12h00</Text>
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
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hoursCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: "#4a5d4a",
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  userMessageWrapper: {
    alignItems: "flex-end",
  },
  botMessageWrapper: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: "#4a5d4a",
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: "#111827",
  },
  messageTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    marginHorizontal: 16,
  },
  typingText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: "#111827",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4a5d4a",
    alignItems: "center",
    justifyContent: "center",
  },
})
