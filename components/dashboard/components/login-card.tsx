"use client"

import { useRef } from "react"
import { LogInIcon, QrCodeIcon, SendIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ErrorAlert } from "./common"
import { qrChannelOptions, type QrChannel } from "@/components/dashboard/constants"
import { useDashboardStore } from "@/components/dashboard/stores"

export function LoginCard() {
  const {
    smsSending,
    smsLoginLoading,
    qrCreating,
    qrCompleting,
    qrChannel,
    setQrChannel,
    qrLogin,
    setQrLogin,
    loginMessage,
    loginError,
    sendLoginSms,
    completeSmsLogin,
    createQrLogin,
    completeQrLogin,
  } = useDashboardStore()

  const smsFormRef = useRef<HTMLFormElement>(null)
  const qrChannelLabel =
    qrChannelOptions.find((option) => option.value === qrChannel)?.label || "微信"

  function sendLoginSmsFromForm() {
    const form = smsFormRef.current
    if (!form) return
    const formData = new FormData(form)
    sendLoginSms(String(formData.get("phoneNo") || ""))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>南方电网登录</CardTitle>
        <CardDescription>登录成功后会自动创建用户配置并保存服务端会话。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="qr" className="flex flex-col gap-4">
          <TabsList>
            <TabsTrigger value="qr">扫码登录</TabsTrigger>
            <TabsTrigger value="sms">短信登录</TabsTrigger>
          </TabsList>

          <TabsContent value="sms">
            <form ref={smsFormRef} action={completeSmsLogin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="login-alias">配置别名</FieldLabel>
                  <Input id="login-alias" name="alias" placeholder="default" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-label">显示标签</FieldLabel>
                  <Input id="login-label" name="label" placeholder="家里 / 办公室" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-phone">手机号</FieldLabel>
                  <Input id="login-phone" name="phoneNo" inputMode="tel" placeholder="南方电网账号手机号" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-password">密码</FieldLabel>
                  <Input id="login-password" name="password" type="password" placeholder="可留空使用短信验证码登录" />
                  <FieldDescription>填写密码时使用账号密码加短信验证码登录；留空时只使用短信验证码。</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-sms-code">短信验证码</FieldLabel>
                  <Input id="login-sms-code" name="smsCode" inputMode="numeric" placeholder="6 位验证码" required />
                </Field>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={sendLoginSmsFromForm} disabled={smsSending || smsLoginLoading}>
                    {smsSending ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
                    发送验证码
                  </Button>
                  <Button type="submit" disabled={smsLoginLoading || smsSending}>
                    {smsLoginLoading ? <Spinner data-icon="inline-start" /> : <LogInIcon data-icon="inline-start" />}
                    登录并保存
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="qr">
            <form action={completeQrLogin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="qr-alias">配置别名</FieldLabel>
                  <Input id="qr-alias" name="alias" placeholder="default" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="qr-label">显示标签</FieldLabel>
                  <Input id="qr-label" name="label" placeholder="家里 / 办公室" />
                </Field>
                <Field>
                  <FieldLabel>扫码平台</FieldLabel>
                  <ToggleGroup
                    value={[qrChannel]}
                    onValueChange={(value) => {
                      const next = value[0] as QrChannel | undefined
                      if (!next) return
                      setQrChannel(next)
                      setQrLogin(null)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {qrChannelOptions.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription>生成二维码前选择扫码平台；切换平台会清除已生成的二维码。</FieldDescription>
                </Field>
                {qrLogin ? (
                  <Field>
                    <FieldLabel>
                      {qrChannelOptions.find((option) => option.value === qrLogin.channel)?.label || qrChannelLabel}
                      登录二维码
                    </FieldLabel>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrLogin.qrUrl}
                      alt={`${qrChannelOptions.find((option) => option.value === qrLogin.channel)?.label || qrChannelLabel}登录二维码`}
                      className="size-44 rounded-lg border bg-background object-contain p-2"
                    />
                    <FieldDescription>
                      平台：{qrChannelOptions.find((option) => option.value === qrLogin.channel)?.label || qrChannelLabel} ·{" "}
                      {qrLogin.loginId}
                    </FieldDescription>
                  </Field>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={createQrLogin} disabled={qrCreating || qrCompleting}>
                    {qrCreating ? <Spinner data-icon="inline-start" /> : <QrCodeIcon data-icon="inline-start" />}
                    生成二维码
                  </Button>
                  <Button type="submit" disabled={!qrLogin || qrCompleting || qrCreating}>
                    {qrCompleting ? <Spinner data-icon="inline-start" /> : <LogInIcon data-icon="inline-start" />}
                    完成登录
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>
        {loginMessage ? (
          <Alert className="mt-4">
            <AlertTitle>登录状态</AlertTitle>
            <AlertDescription>{loginMessage}</AlertDescription>
          </Alert>
        ) : null}
        {loginError ? (
          <div className="mt-4">
            <ErrorAlert title="登录失败" message={loginError} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
