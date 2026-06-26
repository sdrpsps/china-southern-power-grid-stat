"use client"

import { useEffect, useState } from "react"
import { Key, Copy, Check, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { api } from "@/components/dashboard/api"

type McpTokenMetadata = {
  id: number
  name: string
  expiresAt: string
  createdAt: string
}

type McpTokenPayload = {
  token: string
  expiresAt: string
  lifetimeDays: number
  lifetimeSeconds: number
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface TokenDialogProps {
  open: boolean
  onClose: () => void
}

export function TokenDialog({ open, onClose }: TokenDialogProps) {
  const [tokens, setTokens] = useState<McpTokenMetadata[]>([])
  const [newTokenName, setNewTokenName] = useState("")
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadTokens()
  }, [])

  async function loadTokens() {
    setLoadingTokens(true)
    try {
      const data = await api<{ tokens: McpTokenMetadata[] }>("/api/mcp/token")
      setTokens(data.tokens)
    } catch (error) {
      console.error("加载 MCP 凭证列表失败:", error)
    } finally {
      setLoadingTokens(false)
    }
  }

  async function generateToken(e: React.FormEvent) {
    e.preventDefault()
    if (!newTokenName.trim()) return
    setGenerating(true)
    try {
      const data = await api<McpTokenPayload>("/api/mcp/token", {
        method: "POST",
        body: JSON.stringify({ name: newTokenName.trim() }),
      })
      setGeneratedToken(data.token)
      setNewTokenName("")
      await loadTokens()
    } catch (error) {
      console.error("生成 MCP 凭证失败:", error)
    } finally {
      setGenerating(false)
    }
  }

  async function revokeToken(id: number) {
    if (!confirm("确定要吊销该 MCP 凭证吗？吊销后使用该凭证的 Agent 将无法访问接口。")) return
    try {
      await api(`/api/mcp/token?id=${id}`, {
        method: "DELETE",
      })
      await loadTokens()
      setGeneratedToken(null)
    } catch (error) {
      console.error("吊销 MCP 凭证失败:", error)
    }
  }

  function handleCopyToken() {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border bg-card p-6 text-card-foreground shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">Agent MCP 凭证管理</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              aria-label="关闭 MCP 凭证弹窗"
            >
              x
            </button>
          </div>

          {/* 1. 已生成的新凭证展示 */}
          {generatedToken && (
            <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Key className="size-4" />
                新凭证已成功生成！
              </div>
              <p className="text-xs text-muted-foreground">
                请立即复制下方凭证，关闭或刷新弹窗后您将**无法再次查看**此凭证。
              </p>
              <div className="relative rounded-lg border bg-muted/40 p-3 mt-1">
                <textarea
                  readOnly
                  value={generatedToken}
                  className="h-24 w-full resize-none bg-transparent font-mono text-xs text-foreground focus:outline-none"
                />
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    onClick={handleCopyToken}
                    className="h-8 gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        复制凭证
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 2. 凭证列表展示 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">已有凭证列表</span>
            {loadingTokens ? (
              <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                加载中...
              </div>
            ) : tokens.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                暂无活动的 MCP 访问凭证
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>到期时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium text-xs">{token.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(token.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(token.expiresAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => revokeToken(token.id)}
                            title="吊销此凭证"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* 3. 新建凭证表单 */}
          <form onSubmit={generateToken} className="border-t pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="token-name">新建 MCP 凭证</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="token-name"
                    placeholder="例如: Cline, Claude Desktop"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="flex-1 h-9 text-sm"
                    required
                    disabled={generating}
                  />
                  <Button type="submit" disabled={generating || !newTokenName.trim()} className="h-9 gap-1.5">
                    <Plus className="size-4" />
                    {generating ? "生成中..." : "生成凭证"}
                  </Button>
                </div>
                <FieldDescription>
                  为新的 Agent 分配一个唯一的备注名称，便于后续吊销管理。
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>

          <div className="border-t pt-3 text-[10px] text-muted-foreground">
            提示：MCP 凭证是长期 API 密钥，请勿将完整 token 分享至不信任环境。吊销凭证可即刻中断 Agent 对南网 API 的访问。
          </div>
        </div>
      </div>
    </div>
  )
}
