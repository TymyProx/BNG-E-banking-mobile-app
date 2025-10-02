"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { Alert } from "react-native"

interface User {
  id: string
  name: string
  email: string
  phone: string
  accountNumber: string
  isVerified: boolean
}

interface AuthContextType {
  user: User | null
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
  const [isLoading, setIsLoading] = useState(false)
  const [pendingOTPVerification, setPendingOTPVerification] = useState(false)

  const isAuthenticated = !!user && user.isVerified

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock validation
      if (email === "test@bng.gn" && password === "123456") {
        const mockUser: User = {
          id: "1",
          name: "Mamadou Diallo",
          email: email,
          phone: "+224 622 123 456",
          accountNumber: "BNG001234567890",
          isVerified: false,
        }
        setUser(mockUser)
        setPendingOTPVerification(true)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock registration
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
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
      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock OTP validation (accept "123456")
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
      // Simulate sending OTP
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
      // Simulate API call
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
      // Simulate password reset
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

  const logout = () => {
    setUser(null)
    setPendingOTPVerification(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
