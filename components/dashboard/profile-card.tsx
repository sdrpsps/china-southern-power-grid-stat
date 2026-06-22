import { ShieldCheckIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { SelectOption } from "@/components/dashboard/types"

export function ProfileCard({
  hasProfiles,
  profileItems,
  selectedProfile,
  setSelectedProfile,
  scope,
  setScope,
  verifyLoading,
  onVerifySessions,
}: {
  hasProfiles: boolean
  profileItems: SelectOption[]
  selectedProfile: string
  setSelectedProfile: (value: string) => void
  scope: string
  setScope: (value: string) => void
  verifyLoading: boolean
  onVerifySessions: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>用户配置</CardTitle>
        <CardDescription>会话会安全保存在服务端，不会在页面中显示完整令牌。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {hasProfiles ? (
          <FieldGroup>
            <Field>
              <FieldLabel>查询范围</FieldLabel>
              <ToggleGroup
                value={[scope]}
                onValueChange={(value) => setScope(value[0] || "profile")}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="profile" aria-label="单用户配置">
                  单配置
                </ToggleGroupItem>
                <ToggleGroupItem value="all" aria-label="所有用户配置">
                  全部配置
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-disabled={scope === "all" || undefined}>
              <FieldLabel htmlFor="profile-select">当前配置</FieldLabel>
              <Select
                items={profileItems}
                value={profileItems.find((item) => item.value === selectedProfile) || profileItems[0]}
                onValueChange={(value) => setSelectedProfile(value?.value || "")}
                disabled={scope === "all"}
                itemToStringValue={(item) => item.label}
              >
                <SelectTrigger id="profile-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {profileItems.map((item) => (
                      <SelectItem key={item.value} value={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>默认使用已标记的配置；全部配置会逐个查询并保留部分错误。</FieldDescription>
            </Field>
          </FieldGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheckIcon />
              </EmptyMedia>
              <EmptyTitle>还没有可用会话</EmptyTitle>
              <EmptyDescription>通过南方电网登录后再查询电表账户。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onVerifySessions} disabled={!hasProfiles || verifyLoading}>
          {verifyLoading ? <Spinner data-icon="inline-start" /> : <ShieldCheckIcon data-icon="inline-start" />}
          验证会话
        </Button>
      </CardFooter>
    </Card>
  )
}
