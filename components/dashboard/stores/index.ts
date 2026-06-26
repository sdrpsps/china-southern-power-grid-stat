import { create } from "zustand"
import { createProfileSlice } from "./profile-slice"
import { createLoginSlice } from "./login-slice"
import { createQuerySlice } from "./query-slice"
import type { DashboardStoreState } from "./types"

export const useDashboardStore = create<DashboardStoreState>()((...a) => ({
  ...createProfileSlice(...a),
  ...createLoginSlice(...a),
  ...createQuerySlice(...a),
}))
