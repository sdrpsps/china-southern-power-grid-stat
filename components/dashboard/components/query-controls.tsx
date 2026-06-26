import { useMemo } from "react"
import { ActivityIcon, WalletCardsIcon, CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
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

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MonthPicker } from "@/components/ui/monthpicker"

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
    <FieldGroup className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Field className="flex-1 sm:w-52 sm:flex-none">
        <FieldLabel className="sr-only">选择电表账户</FieldLabel>
        <AccountSelect
          accountItems={accountItems}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          disabled={disabled}
          className="w-full"
        />
      </Field>
      <Button onClick={onSubmit} disabled={disabled || loading}>
        {loading ? <Spinner data-icon="inline-start" /> : <WalletCardsIcon data-icon="inline-start" />}
        {label}
      </Button>
    </FieldGroup>
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
  const currentDate = useMemo(() => {
    const y = parseInt(year, 10)
    const m = parseInt(month, 10) - 1
    return isNaN(y) || isNaN(m) ? new Date() : new Date(y, m)
  }, [year, month])

  return (
    <FieldGroup className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_160px_auto] sm:items-end">
      <Field>
        <FieldLabel className="sr-only">选择电表账户</FieldLabel>
        <AccountSelect
          accountItems={accountItems}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          disabled={disabled}
          className="w-full"
        />
      </Field>
      <Field>
        <FieldLabel className="sr-only">选择月份</FieldLabel>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={disabled}
              />
            }
          >
            <CalendarIcon data-icon="inline-start" />
            {year}年{month.padStart(2, "0")}月
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <MonthPicker
              selectedMonth={currentDate}
              onMonthSelect={(date) => {
                setYear(String(date.getFullYear()))
                setMonth(String(date.getMonth() + 1))
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Button onClick={onSubmit} disabled={disabled || loading}>
        {loading ? <Spinner data-icon="inline-start" /> : <ActivityIcon data-icon="inline-start" />}
        查询用量
      </Button>
    </FieldGroup>
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
