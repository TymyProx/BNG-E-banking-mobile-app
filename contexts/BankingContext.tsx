"use client"

import React from 'react';
import { createContext, useContext, useState } from "react"

interface User {
  name: string
  email: string
}

interface Transaction {
  id: string
  title: string
  subtitle: string
  amount: string
  type: "credit" | "debit"
  category: "transfer" | "payment" | "deposit" | "withdrawal" | "fee"
  date: string
  timestamp: number
}

interface BankCard {
  id: string
  cardNumber: string
  cardHolder: string
  expiryDate: string
  balance: number
  cardType: "debit" | "credit"
  isLocked: boolean
  isVirtual?: boolean
}

interface BankingContextType {
  // State
  user: User
  cards: BankCard[]
  transactions: Transaction[]
  totalBalance: number
  isLoading: boolean

  // Actions
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
  updateCardBalance: (cardId: string, amount: number) => void
  toggleCardLock: (cardId: string) => void
  refreshData: () => void
}

const BankingContext = createContext<BankingContextType | undefined>(undefined)

export function BankingProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>({
    name: "Amadou Barry",
    email: "amadou.barry@example.com"
  })

  const [cards, setCards] = useState<BankCard[]>([
    {
      id: "1",
      cardNumber: "1234567890123456",
      cardHolder: "AMADOU BARRY",
      expiryDate: "12/28",
      balance: 12450.75,
      cardType: "debit",
      isLocked: false,
    },
    {
      id: "2",
      cardNumber: "9876543210987654",
      cardHolder: "AMADOU BARRY",
      expiryDate: "08/27",
      balance: 5200.0,
      cardType: "credit",
      isLocked: false,
    },
  ])

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      title: "Starbucks Coffee",
      subtitle: "Food & Dining",
      amount: "$12.50",
      type: "debit",
      category: "payment",
      date: "Today, 2:30 PM",
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    },
    {
      id: "2",
      title: "Salary Deposit",
      subtitle: "ABC Corporation",
      amount: "$3,500.00",
      type: "credit",
      category: "deposit",
      date: "Yesterday, 9:00 AM",
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    },
    {
      id: "3",
      title: "Netflix Subscription",
      subtitle: "Entertainment",
      amount: "$15.99",
      type: "debit",
      category: "payment",
      date: "Dec 28, 2024",
      timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    },
  ])

  const [isLoading, setIsLoading] = useState(false)

  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0)

  const addTransaction = (newTransaction: Omit<Transaction, "id" | "timestamp">) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    setTransactions((prev) => [transaction, ...prev])

    // Update card balance
    const amount = Number.parseFloat(newTransaction.amount.replace("$", "").replace(",", ""))
    if (newTransaction.type === "debit") {
      updateCardBalance("1", -amount) // Assume primary card
    } else {
      updateCardBalance("1", amount)
    }
  }

  const updateCardBalance = (cardId: string, amount: number) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, balance: Math.max(0, card.balance + amount) } : card)),
    )
  }

  const toggleCardLock = (cardId: string) => {
    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, isLocked: !card.isLocked } : card)))
  }

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <BankingContext.Provider
      value={{
        user,
        cards,
        transactions,
        totalBalance,
        isLoading,
        addTransaction,
        updateCardBalance,
        toggleCardLock,
        refreshData,
      }}
    >
      {children}
    </BankingContext.Provider>
  )
}

export function useBanking() {
  const context = useContext(BankingContext)
  if (context === undefined) {
    throw new Error("useBanking must be used within a BankingProvider")
  }
  return context
}
