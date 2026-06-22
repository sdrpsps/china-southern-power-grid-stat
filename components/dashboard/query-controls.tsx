import { ActivityIcon, WalletCardsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SelectOption } from "@/components/dashboard/types"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export function QueryControls({
  accountItems,
  selectedAccount,
  setSelectedAccount,
  onSubmit,
  loading,
  disabled,
  label,
}: {
  accountItems: SelectOption[]
  selectedAccount: string
  setSelectedAccount: (value: string) => void
  onSubmit: () => void
  loading: boolean
  disabled: boolean
  label: string
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <AccountSelect
        accountItems={accountItems}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        disabled={disabled}
        className="w-full sm:w-52"
      />
      <Button onClick={onSubmit} disabled={disabled || loading}>
        {loading ? <Spinner data-icon="inline-start" /> : <WalletCardsIcon data-icon="inline-start" />}
        {label}
      </Button>
    </div>
  )
}

export function UsageControls({
  accountItems,
  selectedAccount,
  setSelectedAccount,
  year,
  setYear,
  month,
  setMonth,
  onSubmit,
  loading,
  disabled,
}: {
  accountItems: SelectOption[]
  selectedAccount: string
  setSelectedAccount: (value: string) => void
  year: string
  setYear: (value: string) => void
  month: string
  setMonth: (value: string) => void
  onSubmit: () => void
  loading: boolean
  disabled: boolean
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_90px_80px_auto]">
      <AccountSelect
        accountItems={accountItems}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        disabled={disabled}
        className="w-full"
      />
      <Input value={year} onChange={(event) => setYear(event.target.value)} inputMode="numeric" aria-label="年份" />
      <Input value={month} onChange={(event) => setMonth(event.target.value)} inputMode="numeric" aria-label="月份" />
      <Button onClick={onSubmit} disabled={disabled || loading}>
        {loading ? <Spinner data-icon="inline-start" /> : <ActivityIcon data-icon="inline-start" />}
        查询用量
      </Button>
    </div>
  )
}

function AccountSelect({
  accountItems,
  selectedAccount,
  setSelectedAccount,
  disabled,
  className,
}: {
  accountItems: SelectOption[]
  selectedAccount: string
  setSelectedAccount: (value: string) => void
  disabled: boolean
  className: string
}) {
  return (
    <Select
      items={accountItems}
      value={accountItems.find((item) => item.value === selectedAccount) || accountItems[0]}
      onValueChange={(value) => setSelectedAccount(value?.value || "all")}
      disabled={disabled}
      itemToStringValue={(item) => item.label}
    >
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {accountItems.map((item) => (
            <SelectItem key={item.value} value={item}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
