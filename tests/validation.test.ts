import { describe, expect, it } from "vitest"

import { maskAccountNumber, maskAddress, maskName, sanitizeErrorMessage } from "@/lib/services/privacy"
import { validateAccountNumber, validateMonth, validateProfileAlias, validateYear } from "@/lib/services/validation"

describe("validation helpers", () => {
  it("accepts supported profile aliases and 10-20 digit account numbers", () => {
    expect(validateProfileAlias("default-01")).toBe("default-01")
    expect(validateAccountNumber("030000000000001")).toBe("030000000000001")
  })

  it("rejects invalid aliases, account numbers, years, and months", () => {
    expect(() => validateProfileAlias("_bad")).toThrow()
    expect(() => validateAccountNumber("abc")).toThrow()
    expect(() => validateYear(1999)).toThrow()
    expect(() => validateMonth(13)).toThrow()
  })
})

describe("privacy helpers", () => {
  it("masks sensitive display fields", () => {
    expect(maskAccountNumber("030000000000001")).toBe("030********0001")
    expect(maskName("测试用户")).toBe("测***")
    expect(maskAddress("广东省广州市示例路1号")).toContain("***")
  })

  it("sanitizes credential-like error messages", () => {
    expect(sanitizeErrorMessage('failed {"auth_token":"secret","password":"pw","code":"123"}')).not.toContain("secret")
  })
})
