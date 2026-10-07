'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authApi, tokenStore, type User } from './api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isAuthenticated: false })

  const refreshUser = useCallback(async () => {
    const token = tokenStore.get()
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return
    }
    try {
      const user = await authApi.me()
      setState({ user, isLoading: false, isAuthenticated: true })
    } catch {
      tokenStore.clear()
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  useEffect(() => { refreshUser() }, [refreshUser])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    tokenStore.set(res.accessToken)
    tokenStore.setRefresh(res.refreshToken)
    setState({ user: res.user, isLoading: false, isAuthenticated: true })
  }

  const register = async (data: { name: string; email: string; phone?: string; password: string }) => {
    const res = await authApi.register(data)
    tokenStore.set(res.accessToken)
    tokenStore.setRefresh(res.refreshToken)
    setState({ user: res.user, isLoading: false, isAuthenticated: true })
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    tokenStore.clear()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Admin auth context
interface AdminAuthState {
  admin: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AdminAuthContextValue extends AdminAuthState {
  adminLogin: (email: string, password: string) => Promise<void>
  adminLogout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({ admin: null, isLoading: true, isAuthenticated: false })

  useEffect(() => {
    const token = tokenStore.getAdmin()
    if (!token) { setState({ admin: null, isLoading: false, isAuthenticated: false }); return }
    // Decode token payload to get admin info without an extra API call
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setState({ admin: { id: payload.id, email: payload.email, name: payload.name, role: payload.role }, isLoading: false, isAuthenticated: true })
    } catch {
      tokenStore.clearAdmin()
      setState({ admin: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  const adminLogin = async (email: string, password: string) => {
    const { authApi } = await import('./api')
    const res = await authApi.adminLogin({ email, password })
    tokenStore.setAdmin(res.accessToken)
    tokenStore.setAdminRefresh(res.refreshToken)
    setState({ admin: res.admin, isLoading: false, isAuthenticated: true })
  }

  const adminLogout = () => {
    tokenStore.clearAdmin()
    setState({ admin: null, isLoading: false, isAuthenticated: false })
  }

  return (
    <AdminAuthContext.Provider value={{ ...state, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
