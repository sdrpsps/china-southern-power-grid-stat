import test from "node:test";
import assert from "node:assert/strict";
import { CSGElectricityAccount } from "../src/csg-client.js";
import { validateAccountNumber } from "../src/profile.js";
import { selectAccounts } from "../src/query-service.js";
import type { CSGProfile } from "../src/profile.js";

const profile: CSGProfile = {
  alias: "default",
  label: "测试用户配置",
  sessionPath: "/tmp/default.session.json",
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:00.000Z",
};

const discoveredAccount = new CSGElectricityAccount({
  accountNumber: "123456789012345",
  areaCode: "000000",
  eleCustomerId: "fixtureCustomer",
  meteringPointId: "fixture-metering-point-id",
  meteringPointNumber: "1234567890123456",
  address: "示例地址",
  userName: "测试用户",
});

test("validates discovered 15-digit payment account numbers", () => {
  assert.equal(validateAccountNumber("123456789012345"), "123456789012345");
});

test("rejects malformed payment account numbers", () => {
  assert.throws(() => validateAccountNumber("06343900121820A"), /数字字符串/);
  assert.throws(() => validateAccountNumber("123456789"), /10 到 20 位/);
});

test("selects accounts by accountNumber only", () => {
  const selected = selectAccounts(profile, [discoveredAccount], [
    "123456789012345",
  ]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0].account.accountNumber, "123456789012345");
});

test("does not treat meteringPointNumber as a payment account match", () => {
  assert.throws(
    () => selectAccounts(profile, [discoveredAccount], ["1234567890123456"]),
    /未绑定到用户配置/,
  );
});
