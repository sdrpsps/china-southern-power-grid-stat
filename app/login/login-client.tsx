"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Key, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Field,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field"

interface LoginPageClientProps {
  hasUsers: boolean
}

export function LoginPageClient({ hasUsers }: LoginPageClientProps) {
  const router = useRouter()
  const isRegister = !hasUsers
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 注册表单状态
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  // 登录表单状态
  const [loginId, setLoginId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isRegister) {
        // 注册管理员
        const { error: signUpErr } = await authClient.signUp.email({
          email: email.trim(),
          password: password,
          name: name.trim() || username.trim(),
          username: username.trim().toLowerCase(),
        })

        if (signUpErr) {
          setError(signUpErr.message || "注册失败，请检查输入")
        } else {
          router.push("/")
          router.refresh()
        }
      } else {
        // 用户名密码登录
        const isEmail = loginId.includes("@")
        const signInPromise = isEmail
          ? authClient.signIn.email({
              email: loginId.trim(),
              password: password,
            })
          : authClient.signIn.username({
              username: loginId.trim().toLowerCase(),
              password: password,
            })

        const { error: signInErr } = await signInPromise

        if (signInErr) {
          setError(signInErr.message || "用户名或密码错误")
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (err) {
      setError("网络错误，请稍后再试")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md shadow-lg border border-border bg-card text-card-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary shadow-sm">
            <Key className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight mt-4">
            {isRegister ? "创建管理员账户" : "南方电网电费查询"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {isRegister
              ? "这是您首次访问本应用，请设置管理员凭据以进行加固。"
              : "本应用已启用访问控制，请输入您的管理员账户。"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {error && (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>安全警告</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup className="flex flex-col gap-4">
              {isRegister ? (
                <>
                  <Field data-invalid={!!error || undefined}>
                    <FieldLabel htmlFor="username">用户名</FieldLabel>
                    <Input
                      id="username"
                      type="text"
                      required
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      aria-invalid={!!error || undefined}
                    />
                  </Field>

                  <Field data-invalid={!!error || undefined}>
                    <FieldLabel htmlFor="name">显示昵称</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="管理员"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={!!error || undefined}
                    />
                  </Field>

                  <Field data-invalid={!!error || undefined}>
                    <FieldLabel htmlFor="email">电子邮箱</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={!!error || undefined}
                    />
                  </Field>
                </>
              ) : (
                <Field data-invalid={!!error || undefined}>
                  <FieldLabel htmlFor="loginId">用户名 / 邮箱</FieldLabel>
                  <Input
                    id="loginId"
                    type="text"
                    required
                    placeholder="admin"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    aria-invalid={!!error || undefined}
                  />
                </Field>
              )}

              <Field data-invalid={!!error || undefined}>
                <FieldLabel htmlFor="password">密码</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error || undefined}
                />
              </Field>

              <Button type="submit" disabled={loading} size="lg" className="w-full mt-4">
                {loading && <Spinner data-icon="inline-start" />}
                {loading ? "提交中..." : isRegister ? "注册并初始化管理员" : "登录"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
