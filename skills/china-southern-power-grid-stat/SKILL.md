---
name: china-southern-power-grid-stat
description: 查询南方电网多用户配置下的电费余额、欠费状况及月度每日用电详情。
version: 1.0.1
requires:
  bins:
    - node
---

# 南方电网电费与用电数据查询

使用 `node ./scripts/cli.cjs` 查询本地已登录用户配置下的电表账户、余额和月度用电详情。所有命令成功时向标准输出输出 JSON；失败时向标准错误输出 `{"error":"..."}` 并返回非零退出码。

## 用户配置与凭证

- 优先使用 `--profile=<别名>` 指定本地用户配置。
- 使用 `--all-profiles` 可跨所有已配置用户配置查询。
- 如未指定用户配置，脚本使用默认用户配置；没有默认用户配置时先运行 `profiles` 查看可用项。
- 可用 `--session=/absolute/path/session.json` 临时指定单个会话文件。
- 不要在普通回答中展示完整会话、完整户号、完整地址或用户名，除非用户明确要求。

## 命令

### 列出用户配置

```bash
node ./scripts/cli.cjs --action=profiles
```

### 列出电表账户

```bash
node ./scripts/cli.cjs --action=accounts --profile=<别名>
node ./scripts/cli.cjs --action=accounts --all-profiles
```

查询余额或用量前，如果用户没有给出户号，先列出账户并让用户确认要查哪个用户配置/户号。

### 查询余额与欠费

```bash
node ./scripts/cli.cjs --action=balance --profile=<别名> --account=<缴费户号>
node ./scripts/cli.cjs --action=balance --profile=<别名> --account=<户号1> --account=<户号2>
node ./scripts/cli.cjs --action=balance --all-profiles --all-accounts
```

`--account` 必须使用账户列表返回的 `accountNumber`。不要把 `meteringPointNumber` 当作缴费户号重试。

### 查询月度每日用电详情

```bash
node ./scripts/cli.cjs --action=usage --profile=<别名> --account=<缴费户号> --year=<年份> --month=<月份>
node ./scripts/cli.cjs --action=usage --all-profiles --all-accounts --year=<年份> --month=<月份>
```

`--account` 必须使用账户列表返回的 `accountNumber`。不要把 `meteringPointNumber` 当作缴费户号重试。

### 验证登录状态

```bash
node ./scripts/cli.cjs --action=verify --profile=<别名>
node ./scripts/cli.cjs --action=verify --all-profiles
```

## 输出处理

- 单用户配置、单户号查询通常返回单个 JSON 对象。
- 多用户配置、多户号或部分失败时返回包含结果数组和 `errors` 数组的 JSON 对象。
- 如果账户列表只有一个明确匹配的账户，可以直接使用该账户的 `accountNumber` 查询余额或用量；多个账户或匹配不明确时再请用户确认。
- 回答月度每日用电详情时，把 `dailyDetails` 展示为 Markdown 表格，至少包含日期、用电量（度/kWh）和用电额/电费（元）。
- 如果每日 `charge` 均为 0 或缺失，但 `monthTotalCost` 不为 0，说明上游未返回可用的每日电费明细，不要自行分摊估算。
- 遇到用户配置或会话错误时，引导用户在项目本地运行登录流程生成或更新用户配置。
