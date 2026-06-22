import type {
  AccountRecord,
  BalanceRecord,
  QueryError,
  UsageRecord,
  VerifyRecord,
} from "@/lib/services/types"

export type ApiState<T> = {
  loading: boolean
  data: T | null
  error: string | null
}

export const initialState = {
  loading: false,
  data: null,
  error: null,
}

export type SelectOption = {
  label: string
  value: string
}

export type AccountsPayload = {
  accounts: AccountRecord[]
  errors: QueryError[]
}

export type BalancesPayload = {
  balances: BalanceRecord[]
  errors: QueryError[]
}

export type UsagePayload = {
  usages: UsageRecord[]
  errors: QueryError[]
}

export type VerifyPayload = {
  profiles: VerifyRecord[]
}
