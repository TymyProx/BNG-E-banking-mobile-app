"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { Alert } from "react-native"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

interface Tenant {
  id: string
  userId: string
  roles: string[]
  status: string
  tenantId: string
  tenant: {
    id: string
    name: string
    plan: string
    planStatus: string
  }
}

interface User {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  emailVerified: boolean
  tenants: Tenant[]
  avatars?: Array<{
    id: string
    publicUrl: string
    downloadUrl: string
  }>
  // Legacy fields for backward compatibility
  name: string
  phone: string
  accountNumber: string
  isVerified: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  verifyOTP: (otp: string) => Promise<boolean>
  sendOTP: () => Promise<boolean>
  updateProfile: (userData: Partial<User>) => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
  pendingOTPVerification: boolean
  setPendingOTPVerification: (pending: boolean) => void
  tenantId: string | null
  refreshUserData: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  phone: string
  accountNumber: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingOTPVerification, setPendingOTPVerification] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const isAuthenticated = !!user && user.isVerified

  const fetchUserData = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      const userData = await response.json()

      // Map API response to User interface
      const mappedUser: User = {
        id: userData.id,
        fullName: userData.fullName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        emailVerified: userData.emailVerified,
        tenants: userData.tenants || [],
        avatars: userData.avatars || [],
        // Legacy fields for backward compatibility
        name: userData.fullName,
        phone: userData.phoneNumber,
        accountNumber: "", // Will be populated from accounts
        isVerified: userData.emailVerified,
      }

      // Set tenantId from first tenant
      if (mappedUser.tenants.length > 0) {
        setTenantId(mappedUser.tenants[0].tenantId)
      }

      return mappedUser
    } catch (error) {
      console.error("Error fetching user data:", error)
      return null
    }
  }

  const refreshUserData = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("token")
      if (storedToken) {
        setToken(storedToken)
        const userData = await fetchUserData(storedToken)
        if (userData) {
          setUser(userData)
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token")
        if (storedToken) {
          setToken(storedToken)
          setIsLoading(true)
          const userData = await fetchUserData(storedToken)
          if (userData) {
            setUser(userData)
          } else {
            await SecureStore.deleteItemAsync("token")
            setToken(null)
          }
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.SIGN_IN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        Alert.alert("Erreur", "Email ou mot de passe incorrect")
        return false
      }

      const data = await response.json()
      const authToken = data.token || data.accessToken

      if (!authToken) {
        Alert.alert("Erreur", "Aucun token reçu du serveur")
        return false
      }

      await SecureStore.setItemAsync("token", authToken)
      setToken(authToken)

      const userData = await fetchUserData(authToken)
      if (userData) {
        setUser(userData)
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newUser: User = {
        id: Date.now().toString(),
        fullName: userData.name,
        firstName: userData.name.split(" ")[0],
        lastName: userData.name.split(" ").slice(1).join(" "),
        email: userData.email,
        phoneNumber: userData.phone,
        emailVerified: false,
        tenants: [],
        name: userData.name,
        phone: userData.phone,
        accountNumber: userData.accountNumber,
        isVerified: false,
      }

      setUser(newUser)
      setPendingOTPVerification(true)
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async (otp: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (otp === "123456") {
        if (user) {
          setUser({ ...user, isVerified: true })
          setPendingOTPVerification(false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error("OTP verification error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendOTP = async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      Alert.alert("OTP Envoyé", "Un code de vérification a été envoyé à votre téléphone")
      return true
    } catch (error) {
      console.error("Send OTP error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (user) {
        setUser({ ...user, ...userData })
        return true
      }
      return false
    } catch (error) {
      console.error("Update profile error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      Alert.alert("Email Envoyé", "Un lien de réinitialisation a été envoyé à votre email")
      return true
    } catch (error) {
      console.error("Reset password error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("token")
      setUser(null)
      setToken(null)
      setTenantId(null)
      setPendingOTPVerification(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        verifyOTP,
        sendOTP,
        updateProfile,
        resetPassword,
        pendingOTPVerification,
        setPendingOTPVerification,
        tenantId,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
