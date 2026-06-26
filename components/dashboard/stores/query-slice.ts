import type { StateCreator } from "zustand"
import { api, getMessage } from "../api"
import { currentDate } from "../constants"
import { maskAccountNumber, maskName } from "@/lib/services/privacy"
import type {
  AccountsPayload,
  ApiState,
  BalancesPayload,
  UsagePayload,
  VerifyPayload,
  SelectOption,
} from "../types"
import { initialState } from "../types"
import type { DashboardStoreState } from "./types"

export interface QuerySlice {
  // State
  accountsState: ApiState<AccountsPayload>
  balancesState: ApiState<BalancesPayload>
  usageState: ApiState<UsagePayload>
  verifyState: ApiState<VerifyPayload>
  year: string
  month: string
  selectedAccount: string

  // Setters
  setYear: (year: string) => void
  setMonth: (month: string) => void
  setSelectedAccount: (selectedAccount: string) => void

  // Selectors
  accountItems: () => SelectOption[]

  // Async Actions
  verifySessions: () => Promise<void>
  refreshAccounts: () => Promise<void>
  loadCachedAccounts: () => Promise<void>
  queryBalancesAction: () => Promise<void>
  queryUsageAction: () => Promise<void>
}

// Utility selector helper
const getActiveSelector = (scope: string, selectedProfile: string) => ({
  profile: scope === "profile" ? selectedProfile || undefined : undefined,
  allProfiles: scope === "all",
})

export const createQuerySlice: StateCreator<
  DashboardStoreState,
  [],
  [],
  QuerySlice
> = (set, get) => ({
  accountsState: initialState,
  balancesState: initialState,
  usageState: initialState,
  verifyState: initialState,
  year: String(currentDate.getFullYear()),
  month: String(currentDate.getMonth() + 1),
  selectedAccount: "all",

  setYear: (year) => set({ year }),
  setMonth: (month) => set({ month }),
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),

  accountItems: () => [
    { label: "全部电表账户", value: "all" },
    ...(get().accountsState.data?.accounts || []).map((account) => ({
      label: `${maskAccountNumber(account.accountNumber)} · ${maskName(account.userName)}`,
      value: account.accountNumber,
    })),
  ],

  verifySessions: async () => {
    const { scope, selectedProfile } = get()
    set({ verifyState: { loading: true, data: null, error: null } })
    try {
      const data = await api<VerifyPayload>("/api/session/verify", {
        method: "POST",
        body: JSON.stringify(getActiveSelector(scope, selectedProfile)),
      })
      set({ verifyState: { loading: false, data, error: null } })
      await get().refreshProfiles()
    } catch (error) {
      set({ verifyState: { loading: false, data: null, error: getMessage(error) } })
    }
  },

  refreshAccounts: async () => {
    const { scope, selectedProfile } = get()
    set({ accountsState: { loading: true, data: null, error: null } })
    try {
      const query = new URLSearchParams()
      const selector = getActiveSelector(scope, selectedProfile)
      if (selector.profile) query.set("profile", selector.profile)
      if (selector.allProfiles) query.set("allProfiles", "true")
      query.set("refresh", "1")
      const data = await api<AccountsPayload>(`/api/accounts?${query.toString()}`)
      set({
        accountsState: { loading: false, data, error: null },
        selectedAccount: data.accounts[0]?.accountNumber || "all",
      })
    } catch (error) {
      set({ accountsState: { loading: false, data: null, error: getMessage(error) } })
    }
  },

  loadCachedAccounts: async () => {
    const { scope, selectedProfile } = get()
    set((state) => ({ accountsState: { ...state.accountsState, loading: true } }))
    try {
      const query = new URLSearchParams()
      const selector = getActiveSelector(scope, selectedProfile)
      if (selector.profile) query.set("profile", selector.profile)
      if (selector.allProfiles) query.set("allProfiles", "true")
      query.set("refresh", "0")
      const data = await api<AccountsPayload>(`/api/accounts?${query.toString()}`)
      set({
        accountsState: { loading: false, data, error: null },
        selectedAccount: data.accounts?.length ? data.accounts[0].accountNumber : "all",
      })
    } catch (error) {
      set({ accountsState: { loading: false, data: null, error: getMessage(error) } })
    }
  },

  queryBalancesAction: async () => {
    const { scope, selectedProfile, selectedAccount } = get()
    set({ balancesState: { loading: true, data: null, error: null } })
    try {
      const data = await api<BalancesPayload>("/api/balances", {
        method: "POST",
        body: JSON.stringify({
          ...getActiveSelector(scope, selectedProfile),
          allAccounts: selectedAccount === "all",
          accountNumbers: selectedAccount === "all" ? [] : [selectedAccount],
        }),
      })
      set({ balancesState: { loading: false, data, error: null } })
    } catch (error) {
      set({ balancesState: { loading: false, data: null, error: getMessage(error) } })
    }
  },

  queryUsageAction: async () => {
    const { scope, selectedProfile, selectedAccount, year, month } = get()
    set({ usageState: { loading: true, data: null, error: null } })
    try {
      const data = await api<UsagePayload>("/api/usage", {
        method: "POST",
        body: JSON.stringify({
          ...getActiveSelector(scope, selectedProfile),
          allAccounts: selectedAccount === "all",
          accountNumbers: selectedAccount === "all" ? [] : [selectedAccount],
          year,
          month,
        }),
      })
      set({ usageState: { loading: false, data, error: null } })
    } catch (error) {
      set({ usageState: { loading: false, data: null, error: getMessage(error) } })
    }
  },
})
