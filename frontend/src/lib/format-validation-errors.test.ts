import { describe, expect, it } from "vitest";
import {
  formatValidationMessages,
  localizeBackendMessage,
  statusFallbackMessage,
} from "./format-validation-errors";

describe("formatValidationMessages", () => {
  it("rewrites class-validator messages with friendly labels (VI)", () => {
    const result = formatValidationMessages(["email must be an email"], "vi");
    expect(result.summary).toBe("Email phải đúng định dạng");
    expect(result.fields).toEqual({ email: "Email phải đúng định dạng" });
  });

  it("rewrites class-validator messages with friendly labels (EN)", () => {
    const result = formatValidationMessages(["email must be an email"], "en");
    expect(result.summary).toBe("Email must be a valid email");
  });

  it("rewrites min/max length with the captured number", () => {
    const vi = formatValidationMessages(
      ["password must be longer than or equal to 8 characters"],
      "vi",
    );
    expect(vi.summary).toBe("Mật khẩu phải có ít nhất 8 ký tự");

    const en = formatValidationMessages(
      ["bio must be shorter than or equal to 500 characters"],
      "en",
    );
    expect(en.summary).toBe("Bio must be at most 500 characters");
  });

  it("rewrites 'should not be empty' as required", () => {
    const result = formatValidationMessages(["fullName should not be empty"], "vi");
    expect(result.summary).toBe("Họ và tên là bắt buộc");
  });

  it("derives a label from camelCase for unknown fields", () => {
    const result = formatValidationMessages(
      ["someCustomField should not be empty"],
      "en",
    );
    expect(result.summary).toBe("Some custom field is required");
  });

  it("keeps unrecognized messages, replacing the field with its label", () => {
    const result = formatValidationMessages(
      ["email looks suspicious somehow"],
      "vi",
    );
    expect(result.summary).toBe("Email looks suspicious somehow");
  });

  it("uses a generic summary when there are multiple distinct errors", () => {
    const result = formatValidationMessages(
      ["email must be an email", "password should not be empty"],
      "vi",
    );
    expect(result.summary).toBe(
      "Vui lòng kiểm tra lại các trường được đánh dấu bên dưới.",
    );
    expect(Object.keys(result.fields)).toEqual(["email", "password"]);
  });

  it("keeps the first message per field", () => {
    const result = formatValidationMessages(
      [
        "password should not be empty",
        "password must be longer than or equal to 8 characters",
      ],
      "en",
    );
    expect(result.fields.password).toBe("Password is required");
  });
});

describe("localizeBackendMessage", () => {
  it("maps known NestJS messages to Vietnamese", () => {
    expect(localizeBackendMessage("Invalid credentials", "vi")).toBe(
      "Email hoặc mật khẩu không đúng",
    );
    expect(localizeBackendMessage("Forbidden", "vi")).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });

  it("maps the hidden-profile rejection to Vietnamese", () => {
    expect(
      localizeBackendMessage("Candidate has hidden their profile", "vi"),
    ).toBe("Ứng viên đã tạm ẩn hồ sơ");
  });

  it("maps permission-guard messages with dynamic action lists", () => {
    expect(
      localizeBackendMessage(
        "Missing required action(s): credential.download",
        "vi",
      ),
    ).toBe("Bạn không có quyền thực hiện thao tác này.");
    expect(
      localizeBackendMessage(
        "Missing required action(s): credential.download",
        "en",
      ),
    ).toBe("You don't have permission to perform this action.");
  });

  it("localizes dynamic candidate-email messages", () => {
    expect(
      localizeBackendMessage("candidate not found for email a@b.vn", "vi"),
    ).toBe("Không tìm thấy ứng viên với email a@b.vn");
  });

  it("returns unknown messages unchanged for debuggability", () => {
    expect(localizeBackendMessage("Weird internal thing", "vi")).toBe(
      "Weird internal thing",
    );
  });

  it("returns the original message for EN (no map entries)", () => {
    expect(localizeBackendMessage("Invalid credentials", "en")).toBe(
      "Invalid credentials",
    );
  });
});

describe("statusFallbackMessage", () => {
  it("maps known HTTP statuses per language", () => {
    expect(statusFallbackMessage(403, "vi")).toBe(
      "Bạn không có quyền thực hiện thao tác này.",
    );
    expect(statusFallbackMessage(404, "en")).toBe(
      "The requested data was not found.",
    );
  });

  it("falls back to a generic message for unknown statuses", () => {
    expect(statusFallbackMessage(418, "vi")).toBe(
      "Đã xảy ra lỗi. Vui lòng thử lại.",
    );
    expect(statusFallbackMessage(418, "en")).toBe(
      "An error occurred. Please try again.",
    );
  });
});
