"use client"

import { ShieldCheckIcon, Trash2Icon, AlertCircleIcon } from "lucide-react"
import { useState } from "react"

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
import { useDashboardStore } from "@/components/dashboard/stores"

export function ProfileCard() {
  const {
    profiles,
    selectedProfile,
    setSelectedProfile,
    scope,
    setScope,
    verifyState,
    verifySessions,
    deleteProfile,
    deleteLoading,
    profileItems,
  } = useDashboardStore()

  const hasProfiles = profiles.length > 0
  const items = profileItems()
  const verifyLoading = verifyState.loading

  // 等待确认的配置别名，非空时显示确认提示
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  function handleDeleteClick() {
    if (!selectedProfile || scope === "all") return
    setPendingDelete(selectedProfile)
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    deleteProfile(pendingDelete)
    setPendingDelete(null)
  }

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
              <div className="flex gap-2">
                <Select
                  items={items}
                  value={items.find((item) => item.value === selectedProfile) || items[0]}
                  onValueChange={(value) => {
                    setPendingDelete(null)
                    setSelectedProfile(value?.value || "")
                  }}
                  disabled={scope === "all"}
                  itemToStringValue={(item) => item.label}
                >
                  <SelectTrigger id="profile-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* 删除当前配置按钮 */}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="删除当前配置"
                  disabled={scope === "all" || !selectedProfile || deleteLoading}
                  onClick={handleDeleteClick}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                >
                  {deleteLoading ? <Spinner data-icon="inline-start" className="h-4 w-4" /> : <Trash2Icon className="h-4 w-4" />}
                </Button>
              </div>
              <FieldDescription>默认使用已标记的配置；全部配置会逐个查询并保留部分错误。</FieldDescription>
            </Field>

            {/* 删除确认提示区域 */}
            {pendingDelete && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex flex-col gap-2">
                  <span className="text-destructive font-medium">
                    确认删除配置「{pendingDelete}」？
                  </span>
                  <span className="text-muted-foreground text-xs">
                    关联的会话、电表账户及历史用量数据将一并删除，且无法恢复。
                  </span>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleConfirmDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <Spinner data-icon="inline-start" /> : null}
                      确认删除
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingDelete(null)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
        <Button onClick={verifySessions} disabled={!hasProfiles || verifyLoading}>
          {verifyLoading ? <Spinner data-icon="inline-start" /> : <ShieldCheckIcon data-icon="inline-start" />}
          验证会话
        </Button>
      </CardFooter>
    </Card>
  )
}
