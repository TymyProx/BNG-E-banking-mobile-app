"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { Alert } from "react-native"
import * as SecureStore from "expo-secure-store"
import { API_CONFIG, API_ENDPOINTS } from "@/constants/Api"

interface Tenant {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById: string
  updatedById: string
  userId: string
  roles: string[]
  invitationToken?: string
  status: string
  tenantId: string
  tenant: {
    id: string
    createdAt: string
    updatedAt: string
    deletedAt?: string
    createdById: string
    updatedById: string
    name: string
    url?: string
    plan: string
    planStatus: string
    planStripeCustomerId?: string
    planUserId?: string
    settings?: any[]
  }
}

interface User {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById: string
  updatedById: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  emailVerified: boolean
  emailVerificationTokenExpiresAt?: string
  provider?: string
  providerId?: string
  passwordResetTokenExpiresAt?: string
  jwtTokenInvalidBefore?: string
  importHash?: string
  tenants: Tenant[]
  avatars?: Array<{
    id: string
    createdAt: string
    updatedAt: string
    deletedAt?: string
    createdById: string
    updatedById: string
    name: string
    sizeInBytes: number
    privateUrl: string
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
      console.log("[v0] Fetching user data from /auth/me")
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.log("[v0] Failed to fetch user data, status:", response.status)
        throw new Error("Failed to fetch user data")
      }

      const userData = await response.json()
      console.log("[v0] User data fetched successfully, tenants count:", userData.tenants?.length || 0)

      // Map API response to User interface with all fields
      const mappedUser: User = {
        id: userData.id,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        deletedAt: userData.deletedAt,
        createdById: userData.createdById,
        updatedById: userData.updatedById,
        fullName: userData.fullName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        emailVerified: userData.emailVerified,
        emailVerificationTokenExpiresAt: userData.emailVerificationTokenExpiresAt,
        provider: userData.provider,
        providerId: userData.providerId,
        passwordResetTokenExpiresAt: userData.passwordResetTokenExpiresAt,
        jwtTokenInvalidBefore: userData.jwtTokenInvalidBefore,
        importHash: userData.importHash,
        tenants: userData.tenants || [],
        avatars: userData.avatars || [],
        // Legacy fields for backward compatibility
        name: userData.fullName,
        phone: userData.phoneNumber,
        accountNumber: "", // Will be populated from accounts
        isVerified: userData.emailVerified,
      }

      if (mappedUser.tenants.length > 0) {
        const userTenantId = mappedUser.tenants[0].tenantId
        console.log("[v0] Setting tenantId:", userTenantId)
        setTenantId(userTenantId)
        await SecureStore.setItemAsync("tenantId", userTenantId)
      } else {
        console.log("[v0] No tenants found for user")
      }

      return mappedUser
    } catch (error) {
      console.error("[v0] Error fetching user data:", error)
      return null
    }
  }

  const refreshUserData = async () => {
    try {
      console.log("[v0] Refreshing user data")
      const storedToken = await SecureStore.getItemAsync("token")
      if (storedToken) {
        setToken(storedToken)
        const userData = await fetchUserData(storedToken)
        if (userData) {
          setUser(userData)
          console.log("[v0] User data refreshed successfully")
        } else {
          console.log("[v0] Failed to refresh user data, clearing stored token")
          await SecureStore.deleteItemAsync("token")
          await SecureStore.deleteItemAsync("tenantId")
          setToken(null)
          setTenantId(null)
        }
      } else {
        console.log("[v0] No stored token found")
      }
    } catch (error) {
      console.error("[v0] Error refreshing user data:", error)
    }
  }

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("[v0] Checking auth status on app startup")
        const storedToken = await SecureStore.getItemAsync("token")
        const storedTenantId = await SecureStore.getItemAsync("tenantId")

        console.log("[v0] Stored token exists:", !!storedToken)
        console.log("[v0] Stored tenantId:", storedTenantId)

        if (storedTenantId) {
          setTenantId(storedTenantId)
        }

        if (storedToken) {
          setToken(storedToken)
          setIsLoading(true)
          const userData = await fetchUserData(storedToken)
          if (userData) {
            setUser(userData)
            console.log("[v0] User session restored successfully")
          } else {
            console.log("[v0] Failed to restore user session, clearing stored data")
            await SecureStore.deleteItemAsync("token")
            await SecureStore.deleteItemAsync("tenantId")
            setToken(null)
            setTenantId(null)
          }
          setIsLoading(false)
        } else {
          console.log("[v0] No stored token, user not authenticated")
        }
      } catch (error) {
        console.error("[v0] Error checking auth status:", error)
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      console.log("[v0] Attempting login for:", email)
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.SIGN_IN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          invitationToken: "",
          tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
        }),
      })

      if (!response.ok) {
        console.log("[v0] Login failed, status:", response.status)
        const errorText = await response.text()
        Alert.alert("Erreur", errorText || "Email ou mot de passe incorrect")
        return false
      }

      const authToken = await response.text()

      if (!authToken) {
        console.log("[v0] No token received from server")
        Alert.alert("Erreur", "Aucun token reçu du serveur")
        return false
      }

      console.log("[v0] Login successful, storing token")
      await SecureStore.setItemAsync("token", authToken)
      setToken(authToken)

      console.log("[v0] Fetching user data after login")
      const userData = await fetchUserData(authToken)
      if (userData) {
        setUser(userData)
        console.log("[v0] User data set successfully, tenantId:", tenantId)
        return true
      } else {
        console.log("[v0] Failed to fetch user data after login")
        Alert.alert("Erreur", "Impossible de récupérer les informations utilisateur")
        return false
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
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
        createdAt: "",
        updatedAt: "",
        createdById: "",
        updatedById: "",
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
      console.log("[v0] Logging out user")
      await SecureStore.deleteItemAsync("token")
      await SecureStore.deleteItemAsync("tenantId")
      setUser(null)
      setToken(null)
      setTenantId(null)
      setPendingOTPVerification(false)
      console.log("[v0] Logout successful, all data cleared")
    } catch (error) {
      console.error("[v0] Logout error:", error)
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
