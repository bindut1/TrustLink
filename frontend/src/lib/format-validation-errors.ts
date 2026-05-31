/**
 * Turns class-validator messages from the backend into user-friendly strings
 * localized to the current UI language.
 *
 *   EN: "email must be an email" → "Email must be a valid email"
 *   VI: "email must be an email" → "Email phải đúng định dạng"
 *
 * Strategy: detect the leading camelCase field name, replace with a friendly
 * label (translated), then apply pattern rewrites for awkward phrases.
 *
 * Called from `api.ts` which is outside React — pass `lang` explicitly.
 */

import type { Language } from "./i18n/translations";

type LabelMap = Record<string, string>;

const FIELD_LABELS: Record<Language, LabelMap> = {
  en: {
    email: "Email",
    password: "Password",
    fullName: "Full name",
    phone: "Phone",
    role: "Account type",
    institutionName: "Institution name",
    institutionType: "Institution type",
    taxCode: "Tax code",
    website: "Website",
    companyName: "Company name",
    industry: "Industry",
    companySize: "Company size",
    token: "Reset link",
    newPassword: "New password",
    currentPassword: "Current password",
    credentialNumber: "Credential number",
    title: "Title",
    issuedDate: "Issued date",
    expiryDate: "Expiry date",
    bio: "Bio",
    desiredPosition: "Desired position",
    yearsOfExperience: "Years of experience",
    desiredSalaryMin: "Minimum salary",
    desiredSalaryMax: "Maximum salary",
    description: "Description",
    requirements: "Requirements",
    benefits: "Benefits",
    salaryMin: "Minimum salary",
    salaryMax: "Maximum salary",
    name: "Name",
    abbreviation: "Abbreviation",
    address: "Address",
    city: "City",
    country: "Country",
    coverLetter: "Cover letter",
    reason: "Reason",
  },
  vi: {
    email: "Email",
    password: "Mật khẩu",
    fullName: "Họ và tên",
    phone: "Số điện thoại",
    role: "Loại tài khoản",
    institutionName: "Tên tổ chức",
    institutionType: "Loại hình tổ chức",
    taxCode: "Mã số thuế",
    website: "Website",
    companyName: "Tên công ty",
    industry: "Ngành nghề",
    companySize: "Quy mô công ty",
    token: "Link đặt lại",
    newPassword: "Mật khẩu mới",
    currentPassword: "Mật khẩu hiện tại",
    credentialNumber: "Số văn bằng",
    title: "Tên văn bằng",
    issuedDate: "Ngày cấp",
    expiryDate: "Ngày hết hạn",
    bio: "Giới thiệu",
    desiredPosition: "Vị trí mong muốn",
    yearsOfExperience: "Số năm kinh nghiệm",
    desiredSalaryMin: "Lương tối thiểu",
    desiredSalaryMax: "Lương tối đa",
    description: "Mô tả",
    requirements: "Yêu cầu",
    benefits: "Quyền lợi",
    salaryMin: "Lương tối thiểu",
    salaryMax: "Lương tối đa",
    name: "Tên",
    abbreviation: "Tên viết tắt",
    address: "Địa chỉ",
    city: "Thành phố",
    country: "Quốc gia",
    coverLetter: "Thư giới thiệu",
    reason: "Lý do",
  },
};

type Rewrite = {
  test: RegExp;
  build: Record<Language, (label: string, match: RegExpMatchArray) => string>;
};

const REWRITES: Rewrite[] = [
  {
    test: /^\w+ must be an email$/,
    build: {
      en: (label) => `${label} must be a valid email`,
      vi: (label) => `${label} phải đúng định dạng`,
    },
  },
  {
    test: /^\w+ must be longer than or equal to (\d+) characters?$/,
    build: {
      en: (label, m) => `${label} must be at least ${m[1]} characters`,
      vi: (label, m) => `${label} phải có ít nhất ${m[1]} ký tự`,
    },
  },
  {
    test: /^\w+ must be shorter than or equal to (\d+) characters?$/,
    build: {
      en: (label, m) => `${label} must be at most ${m[1]} characters`,
      vi: (label, m) => `${label} không được dài quá ${m[1]} ký tự`,
    },
  },
  {
    test: /^\w+ must be a (?:valid )?URL/i,
    build: {
      en: (label) => `${label} must be a valid URL`,
      vi: (label) => `${label} phải là URL hợp lệ`,
    },
  },
  {
    test: /^\w+ must be a phone number/i,
    build: {
      en: (label) => `${label} must be a valid phone number`,
      vi: (label) => `${label} phải là số điện thoại hợp lệ`,
    },
  },
  {
    test: /^\w+ must be one of the following values/,
    build: {
      en: (label) => `${label} is not valid`,
      vi: (label) => `${label} không hợp lệ`,
    },
  },
  {
    test: /^\w+ should not be empty$/,
    build: {
      en: (label) => `${label} is required`,
      vi: (label) => `${label} là bắt buộc`,
    },
  },
  {
    test: /^\w+ must be a string$/,
    build: {
      en: (label) => `${label} must be text`,
      vi: (label) => `${label} phải là chuỗi ký tự`,
    },
  },
  {
    test: /^\w+ must be a number/i,
    build: {
      en: (label) => `${label} must be a number`,
      vi: (label) => `${label} phải là số`,
    },
  },
  {
    test: /^\w+ must be a Date instance|must be a valid ISO/i,
    build: {
      en: (label) => `${label} must be a valid date`,
      vi: (label) => `${label} phải là ngày hợp lệ`,
    },
  },
  {
    test: /^\w+ must be a UUID/i,
    build: {
      en: (label) => `${label} must be a valid identifier`,
      vi: (label) => `${label} phải là định danh hợp lệ`,
    },
  },
];

function labelFor(field: string, lang: Language): string {
  const map = FIELD_LABELS[lang];
  if (map[field]) return map[field];
  const spaced = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatOne(
  raw: string,
  lang: Language,
): { field: string; message: string } {
  const fieldMatch = raw.match(/^(\w+)\s/);
  const field = fieldMatch?.[1] ?? "";
  const label = labelFor(field, lang);

  for (const r of REWRITES) {
    const m = raw.match(r.test);
    if (m) return { field, message: r.build[lang](label, m) };
  }

  const replaced = field
    ? raw.replace(new RegExp(`^${field}`), label)
    : raw;
  return { field, message: capitalize(replaced) };
}

export type FormattedValidation = {
  summary: string;
  fields: Record<string, string>;
};

const SUMMARY_FALLBACK: Record<Language, string> = {
  en: "Please review the highlighted fields below.",
  vi: "Vui lòng kiểm tra lại các trường được đánh dấu bên dưới.",
};

export function formatValidationMessages(
  raw: string[],
  lang: Language = "vi",
): FormattedValidation {
  const fields: Record<string, string> = {};
  const messages: string[] = [];

  for (const r of raw) {
    const { field, message } = formatOne(r, lang);
    messages.push(message);
    if (field && !fields[field]) fields[field] = message;
  }

  const unique = Array.from(new Set(messages));
  const summary = unique.length === 1 ? unique[0] : SUMMARY_FALLBACK[lang];

  return { summary, fields };
}

/**
 * Maps known NestJS exception messages (Unauthorized/BadRequest/Conflict/
 * Forbidden/NotFound) to the current UI language. Unknown messages are
 * returned as-is so devs/admin can still debug.
 */
const BACKEND_MESSAGE_MAP: Record<Language, Record<string, string>> = {
  en: {},
  vi: {
    // ── Auth ──
    "Invalid credentials": "Email hoặc mật khẩu không đúng",
    "Account is not active": "Tài khoản đang bị khoá hoặc chưa kích hoạt",
    "Account not found": "Không tìm thấy tài khoản",
    "Current password is incorrect": "Mật khẩu hiện tại không đúng",
    "Invalid refresh token": "Phiên đăng nhập không hợp lệ",
    "Refresh token expired": "Phiên đăng nhập đã hết hạn",
    "User not found": "Không tìm thấy người dùng",
    "Not authenticated": "Bạn cần đăng nhập để tiếp tục",
    "Email already in use": "Email này đã được sử dụng",
    "Cannot self-register as admin": "Không thể tự đăng ký tài khoản quản trị",
    "Invalid or already used token": "Link không hợp lệ hoặc đã được dùng",
    "Token expired": "Link đã hết hạn",
    "Email required": "Cần nhập email",

    // ── Resource not found ──
    "Action not found": "Không tìm thấy thao tác",
    "Application not found": "Không tìm thấy đơn ứng tuyển",
    "Batch import not found": "Không tìm thấy batch import",
    "Candidate not found": "Không tìm thấy ứng viên",
    "Candidate profile not found": "Không tìm thấy hồ sơ ứng viên",
    "Credential not found": "Không tìm thấy văn bằng",
    "Credential type not found": "Không tìm thấy loại văn bằng",
    "Institution not found": "Không tìm thấy tổ chức",
    "Job not found": "Không tìm thấy tin tuyển dụng",
    "No candidate found with that email":
      "Không tìm thấy ứng viên với email này",
    "No institution registered for this user": "Bạn chưa đăng ký tổ chức",
    "Notification not found": "Không tìm thấy thông báo",
    "Override not found": "Không tìm thấy giới hạn quyền",
    "Recruiter profile not found": "Không tìm thấy hồ sơ nhà tuyển dụng",

    // ── Permissions / ownership ──
    "Not the owner of this institution":
      "Bạn không có quyền với tổ chức này",
    "Not the owner of this job":
      "Bạn không có quyền với tin tuyển dụng này",
    "Not the owner of this job / application":
      "Bạn không có quyền với tin tuyển dụng hoặc đơn ứng tuyển này",
    "You do not own this resource":
      "Bạn không có quyền truy cập tài nguyên này",
    "Only candidates can apply to jobs": "Chỉ ứng viên mới có thể ứng tuyển",
    "Institution is not approved": "Tổ chức của bạn chưa được duyệt",
    "Issuer has no registered institution":
      "Tài khoản tổ chức cấp chưa đăng ký thông tin",
    "User already has an institution": "Người dùng đã có tổ chức",
    "Target user is not a candidate": "Người dùng không phải ứng viên",

    // ── Business rules ──
    "Credential is already revoked": "Văn bằng đã bị thu hồi",
    "Credential type is inactive": "Loại văn bằng đang bị tắt",
    "Excel file is required (field: file)": "Cần đính kèm file Excel",
    "Job is not open for applications": "Tin tuyển dụng đã đóng",
    "Already applied to this job": "Bạn đã ứng tuyển vị trí này rồi",
    "salaryMin must be <= salaryMax":
      "Lương tối thiểu phải nhỏ hơn hoặc bằng lương tối đa",
    "New password must differ from current password":
      "Mật khẩu mới phải khác mật khẩu hiện tại",
  },
};

export function localizeBackendMessage(
  message: string,
  lang: Language = "vi",
): string {
  const map = BACKEND_MESSAGE_MAP[lang];
  if (map[message]) return map[message];

  // Common patterns with dynamic content
  const m1 = message.match(/^candidate not found for email (.+)$/i);
  if (m1) {
    return lang === "vi"
      ? `Không tìm thấy ứng viên với email ${m1[1]}`
      : message;
  }

  const m2 = message.match(/^user (.+) is not a candidate$/i);
  if (m2) {
    return lang === "vi" ? `Người dùng ${m2[1]} không phải ứng viên` : message;
  }

  return message;
}
