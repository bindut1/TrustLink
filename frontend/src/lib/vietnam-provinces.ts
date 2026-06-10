/**
 * Đơn vị hành chính cấp tỉnh của Việt Nam — danh sách 34 tỉnh/thành phố
 * sau sắp xếp, sáp nhập có hiệu lực từ 01/07/2025 (6 thành phố trực thuộc
 * trung ương + 28 tỉnh).
 *
 * Dùng cho các dropdown chọn Tỉnh/Thành phố trong hồ sơ (issuer, recruiter,
 * candidate). Sắp theo nhóm thành phố trực thuộc trung ương trước, rồi tới
 * các tỉnh theo thứ tự bảng chữ cái tiếng Việt.
 */

// 6 thành phố trực thuộc trung ương
const CENTRAL_CITIES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Hải Phòng",
  "Đà Nẵng",
  "Cần Thơ",
  "Huế",
] as const;

// 28 tỉnh (theo thứ tự bảng chữ cái tiếng Việt)
const PROVINCES = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
] as const;

/** Tên đầy đủ của tất cả 34 đơn vị hành chính cấp tỉnh hiện tại. */
export const VIETNAM_PROVINCES: readonly string[] = [
  ...CENTRAL_CITIES,
  ...PROVINCES,
];

/** Tùy chọn dạng { value, label } dùng trực tiếp cho SelectMenu. */
export const VIETNAM_PROVINCE_OPTIONS: { value: string; label: string }[] =
  VIETNAM_PROVINCES.map((name) => ({ value: name, label: name }));
