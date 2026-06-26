import type { ProfileSlice } from "./profile-slice"
import type { LoginSlice } from "./login-slice"
import type { QuerySlice } from "./query-slice"

export type DashboardStoreState = ProfileSlice & LoginSlice & QuerySlice
