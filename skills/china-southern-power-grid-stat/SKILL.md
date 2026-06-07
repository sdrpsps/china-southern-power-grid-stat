---
name: china-southern-power-grid-stat
description: 查询南方电网电费余额、欠费状况及月度每日用电详情的技能包。
version: 1.0.0
requires:
  bins:
    - node
---

# 南方电网电费与用电数据查询

本技能允许你通过调用底层的 `cli.cjs` 脚本，查询当前用户名下绑定电表的余额、欠费和特定月份的用电量细节。

## 使用条件

1. 用户必须已经在项目根目录下成功运行过 `pnpm run login` 生成了 `session.json`。
2. 本项目已经成功运行了 `pnpm run build` 完成编译。

---

## 技能接口与调用规则

当你需要执行查询操作时，在终端运行以下相对路径脚本：

### 1. 查询绑定的所有用电账户

- **命令**: `node ./scripts/cli.cjs --action=accounts`
- **返回**: 包含所有电表信息的 JSON 数组，例如：
  ```json
  [
    {
      "account_number": "1234567890123456",
      "area_code": "030000",
      "ele_customer_id": "xxx",
      "metering_point_id": "xxx",
      "metering_point_number": "xxx",
      "address": "广东省广州市某某区某某路xx号",
      "user_name": "*某某"
    }
  ]
  ```

### 2. 查询指定户号的电费余额及欠费

- **命令**: `node ./scripts/cli.cjs --action=balance --account=<缴费户号>`
- **参数说明**: `<缴费户号>` 为 16 位数字字符串。
- **返回**: 包含余额与欠费的 JSON 对象，例如：
  ```json
  {
    "accountNumber": "1234567890123456",
    "address": "广东省广州市某某区某某路xx号",
    "userName": "*某某",
    "balance": 150.25,
    "arrears": 0.0
  }
  ```

### 3. 查询指定户号在某月每日的用电细则

- **命令**: `node ./scripts/cli.cjs --action=usage --account=<缴费户号> --year=<年份> --month=<月份>`
- **参数说明**: `<年份>` 为 4 位数字（例如 2026），`<月份>` 为 1~12 的整数。
- **返回**: 包含月度总计、当前阶梯电价状况、每日用电明细的 JSON 对象，例如：
  ```json
  {
    "accountNumber": "1234567890123456",
    "address": "广东省广州市某某区某某路xx号",
    "userName": "*某某",
    "year": 2026,
    "month": 6,
    "monthTotalCost": 128.5,
    "monthTotalKwh": 210,
    "ladder": {
      "ladder": 1,
      "startDate": "2026-06-01 00:00:00.0",
      "remainingKwh": 190.0,
      "tariff": 0.64
    },
    "dailyDetails": [{ "date": "2026-06-01", "charge": 4.1, "kwh": 6.4 }]
  }
  ```
