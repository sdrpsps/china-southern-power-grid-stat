import type { StateCreator } from "zustand"
import { api, getMessage } from "../api"
import type { PublicProfile } from "@/lib/services/types"
import type { SelectOption } from "../types"
import type { DashboardStoreState } from "./types"

export interface ProfileSlice {
  // State
  profiles: PublicProfile[]
  selectedProfile: string
  scope: string
  profileError: string | null
  deleteLoading: boolean

  // Setters
  setSelectedProfile: (selectedProfile: string) => void
  setScope: (scope: string) => void
  setProfileError: (error: string | null) => void

  // Selectors
  hasProfiles: () => boolean
  profileItems: () => SelectOption[]

  // Async Actions
  refreshProfiles: () => Promise<void>
  deleteProfile: (alias: string) => Promise<void>
}

export const createProfileSlice: StateCreator<
  DashboardStoreState,
  [],
  [],
  ProfileSlice
> = (set, get) => ({
  profiles: [],
  selectedProfile: "",
  scope: "profile",
  profileError: null,
  deleteLoading: false,

  setSelectedProfile: (selectedProfile) => set({ selectedProfile }),
  setScope: (scope) => set({ scope }),
  setProfileError: (profileError) => set({ profileError }),

  hasProfiles: () => get().profiles.length > 0,
  profileItems: () =>
    get().profiles.map((profile) => ({
      label: profile.isDefault ? `${profile.alias} · 默认` : profile.alias,
      value: profile.alias,
    })),

  refreshProfiles: async () => {
    set({ profileError: null })
    try {
      const payload = await api<{ profiles: PublicProfile[] }>("/api/profiles")
      set({ profiles: payload.profiles })
      const defaultProfile = payload.profiles.find((profile) => profile.isDefault)
      set((state) => ({
        selectedProfile: state.selectedProfile || defaultProfile?.alias || payload.profiles[0]?.alias || "",
      }))
    } catch (error) {
      set({ profileError: getMessage(error) })
    }
  },

  deleteProfile: async (alias) => {
    set({ deleteLoading: true, profileError: null })
    try {
      const payload = await api<{ profiles: PublicProfile[] }>("/api/profiles", {
        method: "DELETE",
        body: JSON.stringify({ alias }),
      })
      set({ profiles: payload.profiles })
      const remaining = payload.profiles
      const defaultProfile = remaining.find((p) => p.isDefault)
      set({ selectedProfile: defaultProfile?.alias || remaining[0]?.alias || "" })
    } catch (error) {
      set({ profileError: getMessage(error) })
    } finally {
      set({ deleteLoading: false })
    }
  },
})
