export type ProfileSelector = {
  profile?: string
  allProfiles?: boolean
}

export type PublicProfile = {
  id: number
  alias: string
  label: string | null
  isDefault: boolean
  hasSession: boolean
  sessionValid: boolean | null
  lastVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type QueryError = {
  profile: string
  accountNumber?: string
  error: string
}

export type AccountRecord = {
  profile: string
  accountNumber: string
  areaCode: string
  eleCustomerId: string
  meteringPointId: string
  meteringPointNumber: string
  address: string
  userName: string
  refreshedAt?: string
}

export type BalanceRecord = {
  profile: string
  accountNumber: string
  address: string
  userName: string
  balance: number
  arrears: number
  queriedAt?: string
}

export type UsageRecord = {
  profile: string
  accountNumber: string
  address: string
  userName: string
  year: number
  month: number
  monthTotalCost: number | null
  monthTotalKwh: number | null
  ladder: {
    ladder: number | null
    startDate: string | null
    remainingKwh: number | null
    tariff: number | null
  }
  dailyDetails: Array<{ date: string; charge: number; kwh: number }>
  queriedAt?: string
}

export type VerifyRecord = {
  profile: string
  valid: boolean
  reason?: string
  lastVerifiedAt?: string
}

export type SessionProfile = {
  id: number
  alias: string
  label: string | null
  isDefault: boolean
  authToken: string
  createdAt: string
  updatedAt: string
}
