export type Language = "vi" | "en";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export type TranslationKey = keyof typeof TRANSLATIONS.vi;

export const TRANSLATIONS = {
  vi: {
    // ───────────── Common ─────────────
    "common.loading": "Đang tải…",
    "common.search": "Tìm kiếm",
    "common.apply": "Áp dụng",
    "common.cancel": "Huỷ",
    "common.save": "Lưu",
    "common.saveChanges": "Lưu thay đổi",
    "common.update": "Cập nhật",
    "common.create": "Tạo mới",
    "common.edit": "Sửa",
    "common.delete": "Xoá",
    "common.confirm": "Xác nhận",
    "common.close": "Đóng",
    "common.view": "Xem chi tiết",
    "common.actions": "Thao tác",
    "common.status": "Trạng thái",
    "common.type": "Loại",
    "common.optional": "Tuỳ chọn",
    "common.required": "Bắt buộc",
    "common.somethingWentWrong": "Có lỗi xảy ra. Vui lòng thử lại.",
    "common.errorTitle": "Không tải được dữ liệu",
    "common.errorRetry": "Đã xảy ra lỗi khi tải. Vui lòng tải lại trang.",
    "common.justNow": "vừa xong",
    "common.minutesAgo": "phút trước",
    "common.hoursAgo": "giờ trước",
    "common.daysAgo": "ngày trước",
    "common.remote": "Làm việc từ xa",

    // ───────────── Avatar dropdown ─────────────
    "menu.account": "Tài khoản",
    "menu.changePassword": "Đổi mật khẩu",
    "menu.language": "Ngôn ngữ",
    "menu.signOut": "Đăng xuất",
    "menu.signedInAs": "Đăng nhập với vai trò",

    // ───────────── Roles ─────────────
    "role.admin": "Quản trị viên",
    "role.issuer": "Tổ chức cấp văn bằng",
    "role.candidate": "Ứng viên",
    "role.recruiter": "Nhà tuyển dụng",
    "role.all": "Tất cả vai trò",

    // ───────────── Sidebar — admin ─────────────
    "nav.dashboard": "Trang chính",
    "nav.users": "Người dùng",
    "nav.institutions": "Tổ chức",
    "nav.credentialTypes": "Loại văn bằng",
    "nav.blockchain": "Blockchain",
    "nav.auditLogs": "Nhật ký hệ thống",

    // ───────────── Sidebar — candidate ─────────────
    "nav.profile": "Hồ sơ",
    "nav.credentials": "Văn bằng của tôi",
    "nav.jobs": "Việc làm",
    "nav.applications": "Đơn ứng tuyển",
    "nav.recommendations": "Gợi ý phù hợp",

    // ───────────── Sidebar — issuer ─────────────
    "nav.issue": "Cấp văn bằng",
    "nav.batch": "Cấp hàng loạt",

    // ───────────── Sidebar — recruiter ─────────────
    "nav.myJobs": "Tin tuyển dụng",
    "nav.findJobs": "Tìm việc",
    "nav.allCredentials": "Tất cả văn bằng",

    // ───────────── Sidebar section headers ─────────────
    "navSection.manage": "Quản lý",
    "navSection.monitor": "Giám sát",
    "navSection.credentials": "Văn bằng",
    "navSection.myCareer": "Sự nghiệp của tôi",
    "navSection.findWork": "Tìm việc",
    "navSection.hiring": "Tuyển dụng",

    // ───────────── Workspace names ─────────────
    "workspace.admin": "Trang quản trị",
    "workspace.issuer": "Cổng tổ chức cấp",
    "workspace.candidate": "Khu vực ứng viên",
    "workspace.recruiter": "Trang tuyển dụng",

    // ───────────── Common buttons (legacy compat) ─────────────
    "btn.save": "Lưu",
    "btn.cancel": "Huỷ",
    "btn.update": "Cập nhật",
    "btn.confirm": "Xác nhận",
    "btn.delete": "Xoá",

    // ───────────── Settings ─────────────
    "settings.title": "Cài đặt",
    "settings.password": "Đổi mật khẩu",
    "settings.passwordDescription":
      "Mật khẩu mới phải có ít nhất 8 ký tự. Sau khi đổi, bạn cần đăng nhập lại trên mọi thiết bị.",

    // ───────────── Change password modal/form ─────────────
    "password.title": "Đổi mật khẩu",
    "password.description":
      "Mật khẩu mới phải có ít nhất 8 ký tự. Bạn cần đăng nhập lại trên mọi thiết bị sau khi đổi.",
    "password.current": "Mật khẩu hiện tại",
    "password.new": "Mật khẩu mới",
    "password.confirm": "Xác nhận mật khẩu mới",
    "password.mismatch": "Mật khẩu xác nhận không trùng",
    "password.tooShort": "Mật khẩu mới phải có tối thiểu 8 ký tự",
    "password.success": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    "password.failed": "Đổi mật khẩu thất bại",

    // ───────────── Status — account ─────────────
    "status.account.active": "Hoạt động",
    "status.account.suspended": "Bị khoá",
    "status.account.inactive": "Không hoạt động",
    "status.account.pending_verification": "Chờ xác minh",
    "status.account.all": "Tất cả trạng thái",

    // ───────────── Status — approval (institution) ─────────────
    "status.approval.pending": "Chờ duyệt",
    "status.approval.approved": "Đã duyệt",
    "status.approval.rejected": "Bị từ chối",
    "status.approval.all": "Tất cả",

    // ───────────── Status — credential ─────────────
    "status.cred.pending": "Chờ xử lý",
    "status.cred.issued": "Đã cấp",
    "status.cred.revoked": "Đã thu hồi",
    "status.cred.reissued": "Đã cấp lại",
    "status.cred.all": "Tất cả trạng thái",

    // ───────────── Status — transaction (blockchain) ─────────────
    "status.tx.queued": "Trong hàng đợi",
    "status.tx.submitted": "Đã gửi",
    "status.tx.retrying": "Đang thử lại",
    "status.tx.confirmed": "Đã xác nhận",
    "status.tx.failed": "Thất bại",
    "status.tx.all": "Tất cả trạng thái",

    // ───────────── Status — batch import ─────────────
    "status.batch.uploading": "Đang tải lên",
    "status.batch.validating": "Đang kiểm tra",
    "status.batch.processing": "Đang xử lý",
    "status.batch.completed": "Hoàn tất",
    "status.batch.failed": "Thất bại",
    "status.batch.partially_completed": "Hoàn tất một phần",

    // ───────────── Status — job ─────────────
    "status.job.draft": "Bản nháp",
    "status.job.open": "Đang tuyển",
    "status.job.closed": "Đã đóng",
    "status.job.expired": "Hết hạn",
    "status.job.all": "Tất cả trạng thái",

    // ───────────── Status — application ─────────────
    "status.app.applied": "Đã ứng tuyển",
    "status.app.reviewing": "Đang xem xét",
    "status.app.shortlisted": "Vào vòng tiếp theo",
    "status.app.interview": "Phỏng vấn",
    "status.app.offered": "Đã có offer",
    "status.app.rejected": "Bị từ chối",
    "status.app.withdrawn": "Đã rút đơn",

    // ───────────── Transaction types ─────────────
    "tx.type.issue_credential": "Cấp văn bằng",
    "tx.type.revoke_credential": "Thu hồi văn bằng",
    "tx.type.add_issuer": "Thêm tổ chức cấp",
    "tx.type.remove_issuer": "Xoá tổ chức cấp",

    // ───────────── Credential categories ─────────────
    "credCategory.degree": "Bằng cấp",
    "credCategory.it_certificate": "Chứng chỉ CNTT",
    "credCategory.language_certificate": "Chứng chỉ ngôn ngữ",
    "credCategory.award": "Giải thưởng",
    "credCategory.professional_certificate": "Chứng chỉ nghề nghiệp",
    "credCategory.other": "Khác",

    // ───────────── Auth — login ─────────────
    "login.title": "Đăng nhập TrustLink",
    "login.subtitle":
      "Quản lý văn bằng số, việc làm và đơn ứng tuyển của bạn.",
    "login.email": "Email",
    "login.emailPlaceholder": "you@example.com",
    "login.password": "Mật khẩu",
    "login.passwordPlaceholder": "••••••••",
    "login.forgotPassword": "Quên mật khẩu?",
    "login.submit": "Đăng nhập",
    "login.submitting": "Đang đăng nhập…",
    "login.newToTrustLink": "Chưa có tài khoản TrustLink?",
    "login.createAccount": "Tạo tài khoản",

    // ───────────── Auth — register ─────────────
    "register.title": "Tạo tài khoản TrustLink",
    "register.subtitle":
      "Chọn vai trò sử dụng — chúng tôi sẽ hiển thị các tính năng phù hợp với bạn.",
    "register.accountType": "Loại tài khoản",
    "register.accountDetails": "Thông tin tài khoản",
    "register.institutionSection": "Tổ chức",
    "register.companySection": "Công ty",
    "register.fullName": "Họ và tên",
    "register.contactPerson": "Người liên hệ",
    "register.fullNamePlaceholder": "Người quản lý tài khoản này",
    "register.email": "Email",
    "register.phone": "Số điện thoại",
    "register.password": "Mật khẩu",
    "register.passwordHint": "Tối thiểu 8 ký tự",
    "register.institutionName": "Tên tổ chức",
    "register.institutionNamePlaceholder": "VD: Trường Đại học Bách Khoa",
    "register.institutionType": "Loại hình tổ chức",
    "register.taxCode": "Mã số thuế / đăng ký",
    "register.website": "Website",
    "register.companyName": "Tên công ty",
    "register.companyNamePlaceholder": "VD: Mercurial Labs",
    "register.industry": "Ngành nghề",
    "register.companySize": "Quy mô công ty",
    "register.selectPlaceholder": "Chọn…",
    "register.submit": "Tạo tài khoản",
    "register.submitting": "Đang tạo tài khoản…",
    "register.alreadyHaveAccount": "Đã có tài khoản?",
    "register.signIn": "Đăng nhập",
    "register.pickAccountType": "Vui lòng chọn loại tài khoản.",

    // Institution types (register form)
    "institutionType.university": "Đại học",
    "institutionType.college": "Cao đẳng / Trường nghề",
    "institutionType.training_center": "Trung tâm đào tạo",
    "institutionType.professional_body": "Hiệp hội nghề nghiệp",
    "institutionType.other": "Khác",

    // Company sizes
    "companySize.1_10": "1–10 nhân viên",
    "companySize.11_50": "11–50 nhân viên",
    "companySize.51_200": "51–200 nhân viên",
    "companySize.201_1000": "201–1,000 nhân viên",
    "companySize.1000_plus": "1,000+ nhân viên",

    // Role selector descriptions
    "roleSelect.candidate": "Ứng viên",
    "roleSelect.candidateDesc":
      "Hiển thị văn bằng đã xác thực và ứng tuyển vào việc làm.",
    "roleSelect.recruiter": "Nhà tuyển dụng",
    "roleSelect.recruiterDesc":
      "Đăng tin tuyển dụng và tìm ứng viên có văn bằng on-chain.",
    "roleSelect.issuer": "Tổ chức cấp văn bằng",
    "roleSelect.issuerDesc":
      "Cấp văn bằng xác thực cho học viên, nhân viên và đối tác của bạn.",

    // ───────────── Auth — forgot password ─────────────
    "forgot.title": "Đặt lại mật khẩu",
    "forgot.subtitle":
      "Nhập email tài khoản, hệ thống sẽ gửi link đặt lại mật khẩu.",
    "forgot.successTitle": "Kiểm tra email của bạn",
    "forgot.successSubtitle":
      "Nếu tài khoản tồn tại cho {email}, chúng tôi vừa gửi link đặt lại.",
    "forgot.submit": "Gửi link đặt lại",
    "forgot.submitting": "Đang gửi…",
    "forgot.alertNote":
      "Link sẽ hết hạn sau 1 giờ. Không thấy? Kiểm tra hộp Spam rồi thử lại.",
    "forgot.backToSignIn": "Quay lại đăng nhập",

    // ───────────── Auth — reset password ─────────────
    "reset.invalidTitle": "Link đặt lại không hợp lệ",
    "reset.invalidSubtitle": "Link bị thiếu hoặc không đúng định dạng.",
    "reset.title": "Đặt mật khẩu mới",
    "reset.subtitle": "Chọn mật khẩu mạnh mà bạn chưa từng dùng.",
    "reset.successTitle": "Đã cập nhật mật khẩu",
    "reset.successSubtitle":
      "Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.",
    "reset.newPassword": "Mật khẩu mới",
    "reset.confirmPassword": "Xác nhận mật khẩu mới",
    "reset.passwordHint": "Tối thiểu 8 ký tự",
    "reset.submit": "Cập nhật mật khẩu",
    "reset.submitting": "Đang cập nhật…",
    "reset.invalidAlert":
      "Vui lòng mở link từ email hoặc yêu cầu link mới.",
    "reset.successAlert": "Đang chuyển bạn về trang đăng nhập…",
    "reset.tooShort": "Mật khẩu tối thiểu 8 ký tự.",
    "reset.mismatch": "Mật khẩu không trùng khớp.",
    "reset.requestNew": "Yêu cầu link mới",

    // ───────────── Admin — dashboard ─────────────
    "admin.dashboard.title": "Trang chính",
    "admin.dashboard.description":
      "Tổng quan hệ thống — người dùng, văn bằng, tổ chức chờ duyệt và hoạt động on-chain.",
    "admin.dashboard.totalUsers": "Tổng người dùng",
    "admin.dashboard.credentials": "Văn bằng",
    "admin.dashboard.pendingInstitutions": "Tổ chức chờ duyệt",
    "admin.dashboard.failedTransactions": "Giao dịch thất bại",
    "admin.dashboard.candidates": "ứng viên",
    "admin.dashboard.recruiters": "nhà tuyển dụng",
    "admin.dashboard.issuers": "tổ chức",
    "admin.dashboard.issued": "đã cấp",
    "admin.dashboard.revoked": "đã thu hồi",
    "admin.dashboard.approved": "đã duyệt",
    "admin.dashboard.total": "tổng",
    "admin.dashboard.queued": "đang chờ",
    "admin.dashboard.confirmed": "đã xác nhận",
    "admin.dashboard.overview": "Tổng quan hệ thống",
    "admin.dashboard.overviewDesc": "Phân bố người dùng và tình trạng on-chain theo thời gian thực.",
    "admin.dashboard.usersByRole": "Người dùng theo vai trò",
    "admin.dashboard.credentialHealth": "Tình trạng văn bằng",
    "admin.dashboard.txHealth": "Giao dịch on-chain",
    "admin.dashboard.institutionHealth": "Tổ chức cấp văn bằng",
    "admin.dashboard.failed": "thất bại",
    "admin.dashboard.pendingShort": "chờ duyệt",
    "admin.dashboard.rejected": "từ chối",
    "admin.dashboard.recentActivity": "Hoạt động gần đây",
    "admin.dashboard.recentActivityDesc":
      "Hoạt động có đặc quyền mới nhất từ nhật ký hệ thống.",
    "admin.dashboard.noActivity": "Chưa có hoạt động nào.",
    "admin.dashboard.viewAllAuditLogs": "Xem tất cả nhật ký →",
    "admin.dashboard.quickLinks": "Truy cập nhanh",
    "admin.dashboard.quickLinksDesc": "Đi nhanh tới các mục cần xử lý.",
    "admin.dashboard.approveInstitutions": "Duyệt tổ chức",
    "admin.dashboard.reviewFailedTx": "Xem giao dịch thất bại",
    "admin.dashboard.suspendedUsers": "Tài khoản bị khoá",
    "admin.dashboard.actLoggedIn": "đăng nhập",
    "admin.dashboard.actIssuedCredential": "đã cấp một văn bằng",
    "admin.dashboard.actRevokedCredential": "đã thu hồi một văn bằng",
    "admin.dashboard.actApprovedInstitution": "đã duyệt một tổ chức",
    "admin.dashboard.actRejectedInstitution": "đã từ chối một tổ chức",
    "admin.dashboard.actSuspendedUser": "đã khoá tài khoản",
    "admin.dashboard.actUpdatedUser": "đã cập nhật tài khoản",
    "admin.dashboard.actSetOverride": "đã áp dụng giới hạn thao tác",
    "admin.dashboard.actRemovedOverride": "đã gỡ giới hạn thao tác",
    "admin.dashboard.systemActor": "Hệ thống",

    // ───────────── Admin — users ─────────────
    "admin.users.title": "Người dùng",
    "admin.users.description":
      "Tìm, lọc, khoá và phân quyền chi tiết cho từng người dùng.",
    "admin.users.searchPlaceholder": "Tìm theo tên hoặc email…",
    "admin.users.userColumn": "Người dùng",
    "admin.users.roleColumn": "Vai trò",
    "admin.users.lastLogin": "Đăng nhập gần nhất",
    "admin.users.overrides": "Giới hạn quyền",
    "admin.users.block": "Khoá",
    "admin.users.unblock": "Mở khoá",
    "admin.users.loading": "Đang tải người dùng…",
    "admin.users.empty": "Không có người dùng nào phù hợp với bộ lọc.",
    "admin.users.summaryOne": "{n} người dùng",
    "admin.users.summaryMany": "{n} người dùng",

    // ───────────── Admin — institutions ─────────────
    "admin.institutions.title": "Tổ chức",
    "admin.institutions.description":
      "Duyệt các tổ chức cấp văn bằng để cấp quyền on-chain cho họ.",
    "admin.institutions.tabPending": "Chờ duyệt",
    "admin.institutions.tabApproved": "Đã duyệt",
    "admin.institutions.tabRejected": "Bị từ chối",
    "admin.institutions.tabAll": "Tất cả",
    "admin.institutions.empty": "Không có tổ chức nào trong mục này.",

    // ───────────── Admin — blockchain ─────────────
    "admin.blockchain.title": "Giao dịch blockchain",
    "admin.blockchain.description":
      "Theo dõi mọi giao dịch Polygon mà hệ thống đã đưa vào hàng đợi, đã gửi, đã xác nhận hoặc thất bại.",
    "admin.blockchain.txHash": "Tx hash",
    "admin.blockchain.block": "Block",
    "admin.blockchain.initiatedBy": "Khởi tạo bởi",
    "admin.blockchain.queuedAt": "Thời điểm",
    "admin.blockchain.retries": "Số lần thử lại",
    "admin.blockchain.loading": "Đang tải giao dịch…",
    "admin.blockchain.empty": "Không có giao dịch nào phù hợp.",
    "admin.blockchain.viewOnPolygonScan": "Xem trên PolygonScan",
    "admin.blockchain.clickFailureReason": "Nhấn để xem chi tiết lỗi",
    "admin.blockchain.summaryOne": "{n} giao dịch",
    "admin.blockchain.summaryMany": "{n} giao dịch",

    // ───────────── Admin — credential types ─────────────
    "admin.credTypes.title": "Loại văn bằng",
    "admin.credTypes.description":
      "Định nghĩa schema (các trường biểu mẫu) cho từng loại văn bằng mà tổ chức có thể cấp.",
    "admin.credTypes.newType": "Loại mới",
    "admin.credTypes.modalNewTitle": "Loại văn bằng mới",
    "admin.credTypes.modalEditTitle": "Sửa loại văn bằng",
    "admin.credTypes.modalDescription":
      "Cấu trúc trường này xác định biểu mẫu mà tổ chức cấp sẽ điền khi cấp văn bằng loại này.",
    "admin.credTypes.colName": "Tên",
    "admin.credTypes.colCategory": "Danh mục",
    "admin.credTypes.colFields": "Số trường",
    "admin.credTypes.fldName": "Tên",
    "admin.credTypes.fldNameEn": "Tên (Tiếng Anh)",
    "admin.credTypes.fldNamePlaceholder": "VD: Bằng Cử nhân Kỹ thuật",
    "admin.credTypes.fldNameEnPlaceholder": "Tuỳ chọn — tên tiếng Anh",
    "admin.credTypes.fldCategory": "Danh mục",
    "admin.credTypes.fldDescription": "Mô tả",
    "admin.credTypes.fldDescriptionPlaceholder":
      "Mô tả ngắn hiển thị cho tổ chức cấp",
    "admin.credTypes.fldSchema": "Cấu trúc biểu mẫu (JSON)",
    "admin.credTypes.fldActive": "Đang hoạt động (cho phép tổ chức cấp)",
    "admin.credTypes.fldSchemaHint": "Ví dụ:",
    "admin.credTypes.empty":
      'Chưa có loại văn bằng nào. Nhấn "Loại mới" để bắt đầu.',
    "admin.credTypes.summaryOne": "{n} loại",
    "admin.credTypes.summaryMany": "{n} loại",
    "admin.credTypes.invalidJson": "JSON không hợp lệ:",
    "admin.credTypes.invalidSchema": "Schema JSON không hợp lệ",
    "admin.credTypes.failedSave": "Lưu thất bại",
    "admin.credTypes.mustHaveFields":
      'JSON phải chứa mảng "fields"',

    // ───────────── Admin — audit logs ─────────────
    "admin.auditLogs.title": "Nhật ký hệ thống",
    "admin.auditLogs.description":
      "Theo dõi mọi thao tác quan trọng trong hệ thống (mới nhất ở đầu).",
    "admin.auditLogs.action": "Thao tác",
    "admin.auditLogs.entityType": "Loại đối tượng",
    "admin.auditLogs.limit": "Giới hạn",
    "admin.auditLogs.allActions": "Tất cả thao tác",
    "admin.auditLogs.allEntities": "Tất cả đối tượng",
    "admin.auditLogs.colWhen": "Thời điểm",
    "admin.auditLogs.colActor": "Người thực hiện",
    "admin.auditLogs.colEntity": "Đối tượng",
    "admin.auditLogs.empty": "Không có nhật ký nào phù hợp với bộ lọc.",
    "admin.auditLogs.summaryOne": "{n} bản ghi",
    "admin.auditLogs.summaryMany": "{n} bản ghi",

    // ───────────── Candidate — credentials ─────────────
    "candidate.credentials.title": "Văn bằng của tôi",
    "candidate.credentials.description":
      "Tất cả văn bằng đã được cấp cho bạn. Có thể tải xuống dạng W3C Verifiable Credential JSON hoặc xác minh on-chain bất kỳ lúc nào.",
    "candidate.credentials.emptyTitle": "Chưa có văn bằng nào",
    "candidate.credentials.emptyDesc":
      "Khi một tổ chức cấp văn bằng cho bạn, nó sẽ hiển thị ở đây.",
    "candidate.credentials.verify": "Xác minh",
    "candidate.credentials.downloadVc": "Tải VC",
    "candidate.credentials.issued": "Đã cấp",
    "candidate.credentials.expires": "Hết hạn",
    "candidate.credentials.authentic": "Hợp lệ và còn hiệu lực",
    "candidate.credentials.verifyResult": "Kết quả: {result}",
    "candidate.credentials.onChain": "On-chain",
    "candidate.credentials.vcSignature": "Chữ ký VC",
    "candidate.credentials.issuerAuthorized": "Tổ chức được uỷ quyền",
    "candidate.credentials.contentIntegrity": "Nội dung khớp hash on-chain",
    "candidate.credentials.cannotVerify": "Không thể xác minh lúc này (lỗi kết nối blockchain). Vui lòng thử lại sau.",
    "candidate.credentials.verifyFailed": "Xác minh thất bại",
    "candidate.credentials.downloadFailed": "Tải xuống thất bại. Vui lòng thử lại.",
    "candidate.credentials.downloadForbidden": "Tính năng tải văn bằng đã bị hạn chế trên tài khoản này. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
    "candidate.credentials.all": "Tất cả",
    "candidate.credentials.issuer": "Tổ chức cấp",
    "candidate.credentials.skills": "Kỹ năng",
    "candidate.credentials.details": "Thông tin văn bằng",
    "candidate.credentials.credentialId": "Mã văn bằng",
    "candidate.credentials.transaction": "Giao dịch",
    "candidate.credentials.verification": "Xác minh",
    "candidate.credentials.verifyHint": "Kiểm tra tính xác thực on-chain của văn bằng.",
    "candidate.credentials.notVerifiedYet": "Chưa kiểm tra",
    "candidate.credentials.viewDetail": "Xem chi tiết",

    // ───────────── Candidate — applications ─────────────
    "candidate.applications.title": "Đơn ứng tuyển của tôi",
    "candidate.applications.description":
      "Tất cả công việc bạn đã ứng tuyển. Nhà tuyển dụng nhìn thấy điểm phù hợp tại thời điểm bạn ứng tuyển.",
    "candidate.applications.emptyTitle": "Chưa ứng tuyển công việc nào",
    "candidate.applications.emptyDescBefore": "Xem ",
    "candidate.applications.emptyDescJobsLink": "danh sách việc làm",
    "candidate.applications.emptyDescOr": " hoặc ",
    "candidate.applications.emptyDescRecsLink": "gợi ý AI",
    "candidate.applications.emptyDescAfter":
      " để gửi đơn ứng tuyển đầu tiên.",
    "candidate.applications.appliedTime": "đã ứng tuyển {time}",
    "candidate.applications.recruiterNote": "Lời nhắn từ nhà tuyển dụng:",

    // ───────────── Candidate — dashboard ─────────────
    "candidate.dashboard.title": "Tổng quan",
    "candidate.dashboard.description":
      "Văn bằng đã xác thực, đơn ứng tuyển và gợi ý việc làm bằng AI.",
    "candidate.dashboard.roadmap":
      "Module ứng viên đang trong kế hoạch phát triển.",
    "candidate.dashboard.pipeline": "Tiến trình ứng tuyển",
    "candidate.dashboard.topMatches": "Việc làm phù hợp nhất",
    "candidate.dashboard.credentialsTitle": "Văn bằng",
    "candidate.dashboard.profileTitle": "Hồ sơ",
    "candidate.dashboard.viewAll": "Xem tất cả",
    "candidate.dashboard.onChainCount": "{n} đã lên blockchain",
    "candidate.dashboard.applicationsTotal": "{n} đơn ứng tuyển",
    "candidate.dashboard.noApplications": "Chưa có đơn ứng tuyển nào.",
    "candidate.dashboard.noMatches": "Hoàn thiện hồ sơ để nhận gợi ý phù hợp.",
    "candidate.dashboard.noCredentials": "Chưa có văn bằng nào.",
    "candidate.dashboard.completeProfile": "Hoàn thiện hồ sơ",

    // ───────────── Issuer — dashboard ─────────────
    "issuer.dashboard.title": "Tổng quan",
    "issuer.dashboard.description":
      "Văn bằng đã cấp, tình trạng on-chain và tổ chức của bạn.",
    "issuer.dashboard.roadmap":
      "Module tổ chức cấp đang trong kế hoạch phát triển.",
    "issuer.dashboard.issuanceTrend": "Văn bằng cấp theo tháng",
    "issuer.dashboard.statusBreakdown": "Trạng thái văn bằng",
    "issuer.dashboard.recent": "Cấp gần đây",
    "issuer.dashboard.institutionTitle": "Tổ chức",
    "issuer.dashboard.totalIssued": "Đã cấp",
    "issuer.dashboard.onChain": "On-chain",
    "issuer.dashboard.revokedCount": "Đã thu hồi",
    "issuer.dashboard.candidatesReached": "Ứng viên đã cấp",
    "issuer.dashboard.noRecent": "Chưa cấp văn bằng nào.",
    "issuer.dashboard.viewAll": "Xem tất cả",

    // ───────────── Issuer — issue ─────────────
    "issuer.issue.title": "Cấp văn bằng",
    "issuer.issue.description":
      "Chọn loại văn bằng, điền thông tin — hệ thống sẽ ký và đưa lên blockchain.",
    "issuer.issue.queued":
      "Đã cấp văn bằng — đang chờ xác nhận trên blockchain.",
    "issuer.issue.viewInList": "Xem trong danh sách",
    "issuer.issue.stepType": "Loại văn bằng",
    "issuer.issue.stepRecipient": "Người nhận",
    "issuer.issue.stepDetails": "Thông tin văn bằng",
    "issuer.issue.stepTypeDesc":
      "Loại văn bằng quyết định các trường thông tin bên dưới.",
    "issuer.issue.stepRecipientDesc":
      "Ứng viên cần có sẵn tài khoản TrustLink.",
    "issuer.issue.stepDetailsDesc": "Các trường có dấu * là bắt buộc.",
    "issuer.issue.fldType": "Loại",
    "issuer.issue.fldCredNumber": "Số văn bằng",
    "issuer.issue.fldTitle": "Tên văn bằng",
    "issuer.issue.fldIssuedDate": "Ngày cấp",
    "issuer.issue.fldExpiryDate": "Ngày hết hạn",
    "issuer.issue.fldExpiryHint": "Để trống nếu không có thời hạn",
    "issuer.issue.selectTypePlaceholder": "Chọn loại văn bằng…",
    "issuer.issue.credNumberPlaceholder": "VD: HUST-2026-0123",
    "issuer.issue.titlePlaceholder": "VD: Cử nhân Khoa học Máy tính",
    "issuer.issue.dynFieldsLabel": "Các trường của {type}",
    "issuer.issue.submit": "Cấp văn bằng",
    "issuer.issue.errLookupFirst":
      "Vui lòng tra cứu ứng viên bằng email trước.",
    "issuer.issue.errPickType": "Vui lòng chọn loại văn bằng.",
    "issuer.issue.errSubmit": "Cấp văn bằng thất bại. Vui lòng thử lại.",

    // ───────────── Issuer — credentials list ─────────────
    "issuer.credentials.title": "Văn bằng đã cấp",
    "issuer.credentials.description":
      "Tất cả văn bằng tổ chức của bạn đã cấp. Có thể thu hồi bất kỳ lúc nào, dữ liệu on-chain tự động cập nhật.",
    "issuer.credentials.searchPlaceholder":
      "Tìm theo tiêu đề hoặc số văn bằng…",
    "issuer.credentials.colCredential": "Văn bằng",
    "issuer.credentials.colCandidate": "Ứng viên",
    "issuer.credentials.colTxHash": "Tx hash",
    "issuer.credentials.colIssued": "Đã cấp",
    "issuer.credentials.revoke": "Thu hồi",
    "issuer.credentials.issueCta": "Cấp văn bằng",
    "issuer.credentials.showReason": "Xem lý do thu hồi",
    "issuer.credentials.reasonModalTitle": "Lý do thu hồi",
    "issuer.credentials.reasonLabel": "Văn bằng",
    "issuer.credentials.loading": "Đang tải văn bằng…",
    "issuer.credentials.empty": "Không có văn bằng nào trong mục này.",
    "issuer.credentials.registerFirst":
      "Vui lòng đăng ký tổ chức trước để bắt đầu cấp văn bằng.",
    "issuer.credentials.failedLoad": "Tải dữ liệu thất bại",

    // ───────────── Issuer — batch import ─────────────
    "issuer.batch.title": "Cấp hàng loạt",
    "issuer.batch.description":
      "Upload file Excel để cấp nhiều văn bằng cùng lúc. Mỗi dòng là một văn bằng — các dòng lỗi sẽ được report lại để bạn fix và upload lại.",
    "issuer.batch.newUpload": "Upload mới",
    "issuer.batch.credentialType": "Loại văn bằng",
    "issuer.batch.dropFile": "Kéo thả file Excel vào đây, hoặc click để chọn",
    "issuer.batch.fileNote":
      ".xlsx hoặc .xls — dòng đầu phải khớp với mẫu cấu trúc của loại văn bằng",
    "issuer.batch.readyToUpload": "{size} KB · sẵn sàng upload",
    "issuer.batch.selectType": "Chọn loại văn bằng…",
    "issuer.batch.loadingTypes": "Đang tải loại…",
    "issuer.batch.removeFile": "Xoá file",
    "issuer.batch.uploadQueue": "Tải lên & xử lý",
    "issuer.batch.currentBatch": "Batch hiện tại",
    "issuer.batch.history": "Lịch sử batch",
    "issuer.batch.colFile": "File",
    "issuer.batch.colTotal": "Tổng",
    "issuer.batch.colSuccess": "Thành công",
    "issuer.batch.colErrors": "Lỗi",
    "issuer.batch.colCreated": "Tạo lúc",
    "issuer.batch.emptyHistory": "Chưa có batch import nào.",
    "issuer.batch.invalidFile": "Chỉ chấp nhận file .xlsx hoặc .xls.",
    "issuer.batch.uploadFailed": "Upload thất bại",

    // ───────────── Recruiter — dashboard ─────────────
    "recruiter.dashboard.title": "Tổng quan",
    "recruiter.dashboard.description":
      "Tin tuyển dụng, ứng viên và tiến trình tuyển dụng của bạn.",
    "recruiter.dashboard.roadmap":
      "Module nhà tuyển dụng đang trong kế hoạch phát triển.",
    "recruiter.dashboard.applicationsTrend": "Đơn ứng tuyển theo tháng",
    "recruiter.dashboard.funnel": "Phân loại đơn ứng tuyển",
    "recruiter.dashboard.recent": "Ứng viên gần đây",
    "recruiter.dashboard.companyTitle": "Công ty",
    "recruiter.dashboard.openJobs": "Tin đang mở",
    "recruiter.dashboard.totalApplicants": "Tổng ứng viên",
    "recruiter.dashboard.totalJobs": "Tổng tin",
    "recruiter.dashboard.noApplicants": "Chưa có đơn ứng tuyển nào.",
    "recruiter.dashboard.viewAll": "Xem tất cả",

    // ───────────── Recruiter — jobs list ─────────────
    "recruiter.jobs.title": "Tin tuyển dụng của tôi",
    "recruiter.jobs.description":
      "Quản lý các vị trí đang tuyển. Nhấn vào tin để xem ứng viên phù hợp và đơn ứng tuyển.",
    "recruiter.jobs.postJob": "Đăng tin",
    "recruiter.jobs.searchPlaceholder": "Tìm theo tiêu đề…",
    "recruiter.jobs.emptyTitle": "Chưa có tin tuyển dụng nào",
    "recruiter.jobs.emptyDesc":
      "Đăng vị trí đầu tiên để bắt đầu nhận ứng viên được AI xếp hạng.",
    "recruiter.jobs.viewsCount": "{n} lượt xem",

    // ───────────── Recruiter — new job ─────────────
    "recruiter.newJob.title": "Đăng tin tuyển dụng mới",
    "recruiter.newJob.description":
      "Lưu dưới dạng bản nháp. Bạn có thể xuất bản từ trang chi tiết công việc khi đã ưng ý nội dung.",
    "recruiter.newJob.submit": "Lưu nháp",

    // ───────────── Recruiter — JobForm ─────────────
    "jobForm.basics": "Thông tin cơ bản",
    "jobForm.compensation": "Lương",
    "jobForm.description": "Mô tả",
    "jobForm.skills": "Kỹ năng",
    "jobForm.title": "Tiêu đề",
    "jobForm.jobType": "Loại hợp đồng",
    "jobForm.experienceLevel": "Cấp độ kinh nghiệm",
    "jobForm.industry": "Ngành",
    "jobForm.city": "Thành phố",
    "jobForm.salaryMin": "Lương tối thiểu",
    "jobForm.salaryMax": "Lương tối đa",
    "jobForm.descriptionLabel": "Mô tả công việc",
    "jobForm.requirements": "Yêu cầu",
    "jobForm.benefits": "Quyền lợi",
    "jobForm.requiredSkills": "Kỹ năng bắt buộc",
    "jobForm.preferredSkills": "Kỹ năng ưu tiên",
    "jobForm.salaryUnit": "Nghìn VNĐ / tháng",
    "jobForm.remoteCheck": "Có thể làm việc từ xa",
    "jobForm.salaryVisible": "Hiển thị mức lương công khai",
    "jobForm.requiredSkillsHint":
      "Hệ thống dùng để xếp hạng ứng viên (chiếm 40% điểm phù hợp)",
    "jobForm.preferredSkillsHint":
      "Điểm cộng — không bắt buộc ứng viên phải có",
    "jobForm.descriptionPlaceholder":
      "Mô tả vai trò, team và định nghĩa thành công.",
    "jobForm.titlePlaceholder": "VD: Senior Smart Contract Engineer",
    "jobForm.industryPlaceholder": "VD: Fintech",
    "jobForm.cityPlaceholder": "VD: Hà Nội",
    "jobForm.requiredSkillsPlaceholder": "VD: Solidity",
    "jobForm.preferredSkillsPlaceholder": "VD: Foundry",
    "jobForm.failedSave": "Lưu thất bại",

    // Job type options
    "jobType.full_time": "Toàn thời gian",
    "jobType.part_time": "Bán thời gian",
    "jobType.contract": "Hợp đồng",
    "jobType.internship": "Thực tập",

    // Experience level
    "expLevel.any": "Mọi cấp độ",
    "expLevel.entry": "Mới đi làm",
    "expLevel.mid": "Trung cấp",
    "expLevel.senior": "Cao cấp",
    "expLevel.lead": "Lead",

    // ───────────── Modals — RevokeModal ─────────────
    "revoke.title": 'Thu hồi "{title}"?',
    "revoke.description":
      "Văn bằng sẽ bị đánh dấu thu hồi và một giao dịch sẽ được đưa vào hàng đợi trên Polygon. Ứng viên sẽ thấy thay đổi ngay.",
    "revoke.reason": "Lý do",
    "revoke.reasonPlaceholder": "VD: Cấp nhầm — trùng với CR-2026-0034.",
    "revoke.reasonHint":
      "Lý do này sẽ được lưu cùng văn bằng và ứng viên có thể thấy.",
    "revoke.submit": "Thu hồi văn bằng",
    "revoke.failed": "Thu hồi thất bại",

    // ───────────── Modals — UserActionsModal ─────────────
    "userActions.title": "Tuỳ chỉnh quyền",
    "userActions.description":
      "Hạn chế các thao tác cụ thể của [user]. Áp dụng ngay và ghi đè quyền mặc định của vai trò.",
    "userActions.loading": "Đang tải danh sách thao tác…",
    "userActions.reasonPlaceholder": "Lý do (tuỳ chọn)",
    "userActions.failedLoad": "Tải danh sách thao tác thất bại",
    "userActions.failedSave": "Lưu thất bại",

    // ───────────── Action names & descriptions ─────────────
    "action.credential.view.name": "Xem văn bằng",
    "action.credential.view.desc": "Xem danh sách và chi tiết văn bằng",
    "action.credential.download.name": "Tải văn bằng",
    "action.credential.download.desc": "Tải bản sao VC JSON / PDF",
    "action.credential.issue.name": "Cấp văn bằng",
    "action.credential.issue.desc": "Cấp văn bằng mới cho ứng viên",
    "action.credential.revoke.name": "Thu hồi văn bằng",
    "action.credential.revoke.desc": "Thu hồi văn bằng đã cấp",
    "action.credential.batch_import.name": "Cấp hàng loạt",
    "action.credential.batch_import.desc": "Tải Excel để cấp nhiều văn bằng cùng lúc",
    "action.credential.verify.name": "Xác thực văn bằng",
    "action.credential.verify.desc": "Xác thực chữ ký blockchain và VC",
    "action.credential.manage_types.name": "Quản lý loại văn bằng",
    "action.credential.manage_types.desc": "Tạo và cập nhật định nghĩa loại văn bằng",
    "action.job.create.name": "Đăng tin tuyển dụng",
    "action.job.create.desc": "Tạo tin tuyển dụng mới",
    "action.job.edit.name": "Sửa tin tuyển dụng",
    "action.job.edit.desc": "Chỉnh sửa tin tuyển dụng hiện có",
    "action.job.view.name": "Xem tin tuyển dụng",
    "action.job.view.desc": "Duyệt và tìm kiếm tin tuyển dụng",
    "action.application.create.name": "Nộp hồ sơ",
    "action.application.create.desc": "Gửi hồ sơ ứng tuyển",
    "action.application.review.name": "Xét duyệt hồ sơ",
    "action.application.review.desc": "Xem và cập nhật trạng thái hồ sơ ứng tuyển",
    "action.matching.view.name": "Xem gợi ý AI",
    "action.matching.view.desc": "Xem điểm phù hợp và gợi ý từ AI",
    "action.admin.users.name": "Quản lý người dùng",
    "action.admin.users.desc": "Xem, tìm kiếm, khoá tài khoản, tuỳ chỉnh quyền",
    "action.admin.institutions.name": "Quản lý tổ chức",
    "action.admin.institutions.desc": "Duyệt / từ chối tổ chức đăng ký",
    "action.admin.blockchain.name": "Theo dõi blockchain",
    "action.admin.blockchain.desc": "Xem hàng đợi giao dịch blockchain",
    "action.admin.dashboard.name": "Dashboard admin",
    "action.admin.dashboard.desc": "Truy cập thống kê hệ thống và nhật ký kiểm toán",

    // ───────────── Modals — TxFailureModal ─────────────
    "txFailure.title": "Giao dịch thất bại",
    "txFailure.description":
      "Smart contract đã từ chối giao dịch sau các lần thử lại. Dưới đây là lý do được trả về.",
    "txFailure.reason": "Lý do",
    "txFailure.initiatedBy": "Khởi tạo bởi",
    "txFailure.retries": "Số lần thử lại",
    "txFailure.contractMethod": "Phương thức",
    "txFailure.showDetails": "Hiển thị chi tiết kỹ thuật",
    "txFailure.hideDetails": "Ẩn chi tiết",

    // ───────────── Modals — InstitutionCard ─────────────
    "instCard.approve": "Duyệt",
    "instCard.reject": "Từ chối",
    "instCard.rejectTitle": 'Từ chối "{name}"?',
    "instCard.rejectDescription":
      "Nhập lý do — người liên hệ sẽ thấy ở dashboard của họ.",
    "instCard.rejectPlaceholder":
      "VD: Thiếu giấy phép đăng ký kinh doanh — vui lòng nộp lại.",
    "instCard.rejectButton": "Từ chối tổ chức",
    "instCard.contact": "Liên hệ:",
    "instCard.onChainIssuer": "Tổ chức cấp trên blockchain",
    "instCard.rejectionReason": "Lý do từ chối:",

    // ───────────── Score breakdown ─────────────
    "score.outOf": "/ 100 điểm phù hợp",
    "score.keyword": "Từ khoá",
    "score.semantic": "Ngữ nghĩa",
    "score.verified": "Đã xác thực",
    "score.weight": "({percentage} trọng số)",
    "score.outOfShort": "/ 100",

    // ───────────── Candidate — recommendations (Suggested jobs) ─────────────
    "candidate.recs.title": "Việc làm phù hợp với bạn",
    "candidate.recs.description":
      "Những vị trí hàng đầu được AI xếp hạng theo 3 lớp: từ khoá (40%), ngữ nghĩa (50%) và bằng cấp đã xác thực (10%).",
    "candidate.recs.loading": "Đang tải gợi ý…",
    "candidate.recs.emptyTitle": "Chưa có gợi ý nào",
    "candidate.recs.emptyDesc":
      "Khi bạn hoàn thiện hồ sơ và có văn bằng, hệ thống sẽ gợi ý việc làm phù hợp với kỹ năng thực tế đã được xác thực.",
    "candidate.recs.applied": "Đã ứng tuyển",
    "candidate.recs.failedJob": "Không tải được tin tuyển dụng",
    "candidate.recs.whyMatch": "Vì sao phù hợp · AI xếp hạng",
    "candidate.recs.requiredSkills": "Kỹ năng yêu cầu",
    "candidate.recs.skillsVerified":
      "{n}/{total} kỹ năng yêu cầu đã được xác minh on-chain trên hồ sơ của bạn",
    "candidate.recs.applyVerified": "Ứng tuyển với hồ sơ đã xác minh",
    "candidate.recs.match": "phù hợp",

    // ───────────── Candidate — jobs (Search) ─────────────
    "candidate.jobs.title": "Tìm việc làm",
    "candidate.jobs.description":
      "Lọc các vị trí đang tuyển theo thành phố, hình thức, mức lương và làm việc từ xa. Nhấn Ứng tuyển để gửi đơn cùng văn bằng đã xác thực.",
    "candidate.jobs.searchPlaceholder": "Tìm theo tiêu đề…",
    "candidate.jobs.cityPlaceholder": "Thành phố",
    "candidate.jobs.anyType": "Mọi hình thức",
    "candidate.jobs.minSalaryPlaceholder": "Lương tối thiểu (k VND)",
    "candidate.jobs.anyLocation": "Mọi địa điểm",
    "candidate.jobs.remoteOnly": "Chỉ remote",
    "candidate.jobs.onsiteOnly": "Chỉ tại văn phòng",
    "candidate.jobs.matchCount": "{n} việc làm phù hợp với bộ lọc",
    "candidate.jobs.loading": "Đang tải việc làm…",
    "candidate.jobs.empty":
      "Không có việc làm phù hợp. Thử mở rộng bộ lọc của bạn.",
    "candidate.jobs.pageOf": "Trang {current} / {total}",
    "candidate.jobs.previous": "Trước",
    "candidate.jobs.next": "Sau",
    "candidate.jobs.failedJobs": "Không tải được danh sách việc làm",

    // ───────────── Candidate — profile ─────────────
    "candidate.profile.title": "Hồ sơ",
    "candidate.profile.description":
      "Bio, liên kết và mong muốn của bạn sẽ ảnh hưởng đến cách nhà tuyển dụng và AI nhìn nhận bạn.",
    "candidate.profile.openToWork": "Sẵn sàng nhận việc",
    "candidate.profile.closedToOffers": "Tạm dừng nhận việc",
    "candidate.profile.loading": "Đang tải hồ sơ…",
    "candidate.profile.notFound": "Không tìm thấy hồ sơ.",
    "candidate.profile.failedLoad": "Không tải được hồ sơ",
    "candidate.profile.saveFailed": "Lưu thất bại. Vui lòng thử lại.",
    "candidate.profile.saved": "Đã lưu hồ sơ.",
    "candidate.profile.sectionAbout": "Giới thiệu",
    "candidate.profile.sectionLinks": "Liên kết",
    "candidate.profile.sectionCareer": "Mong muốn công việc",
    "candidate.profile.sectionSkills": "Kỹ năng",
    "candidate.profile.sectionPersonal": "Thông tin cá nhân",
    "candidate.profile.fldDob": "Ngày sinh",
    "candidate.profile.fldGender": "Giới tính",
    "candidate.profile.genderUnspecified": "Không xác định",
    "candidate.profile.genderMale": "Nam",
    "candidate.profile.genderFemale": "Nữ",
    "candidate.profile.genderOther": "Khác",
    "candidate.profile.skillsHint":
      "{n} kỹ năng đã được xác minh on-chain từ văn bằng của bạn.",
    "candidate.profile.completenessHint":
      "Hồ sơ đầy đủ giúp bạn được gợi ý chính xác hơn.",
    "candidate.profile.fldBio": "Giới thiệu ngắn",
    "candidate.profile.fldBioHint":
      "Vài câu — dùng cho cả AI gợi ý việc làm theo ngữ nghĩa.",
    "candidate.profile.fldBioPlaceholder":
      "Mô tả ngắn về kinh nghiệm, định hướng và công việc bạn đang tìm.",
    "candidate.profile.fldResume": "Link CV",
    "candidate.profile.fldLinkedIn": "LinkedIn",
    "candidate.profile.fldGithub": "GitHub",
    "candidate.profile.fldPortfolio": "Portfolio",
    "candidate.profile.fldDesiredPosition": "Vị trí mong muốn",
    "candidate.profile.fldDesiredPositionPlaceholder":
      "VD: Kỹ sư Smart Contract",
    "candidate.profile.fldYearsExperience": "Số năm kinh nghiệm",
    "candidate.profile.fldSalaryMin": "Lương mong muốn (tối thiểu)",
    "candidate.profile.fldSalaryMax": "Lương mong muốn (tối đa)",
    "candidate.profile.fldSalaryUnit": "Nghìn VNĐ / tháng",
    "candidate.profile.fldLocations": "Khu vực ưu tiên",
    "candidate.profile.fldLocationPlaceholder": "VD: Hà Nội",
    "candidate.profile.fldLocationAdd": "Thêm",
    "candidate.profile.openToWorkLabel": "Tôi đang sẵn sàng nhận cơ hội mới",
    "candidate.profile.openToWorkHint":
      "Tắt để ẩn hồ sơ khỏi tìm kiếm của nhà tuyển dụng.",
    "candidate.profile.discard": "Huỷ thay đổi",
    "candidate.profile.save": "Lưu hồ sơ",

    // ───────────── JobCard (shared candidate component) ─────────────
    "jobCard.apply": "Ứng tuyển",
    "jobCard.salaryFrom": "Từ {amount}",
    "jobCard.salaryUpTo": "Tối đa {amount}",
    "jobCard.salaryUndisclosed": "Thoả thuận",
    "jobCard.applied": "Đã ứng tuyển",
    "jobCard.viewDetail": "Xem chi tiết",
    "jobModal.secDescription": "Mô tả công việc",
    "jobModal.secRequirements": "Yêu cầu",
    "jobModal.secBenefits": "Quyền lợi",
    "jobModal.secRequiredSkills": "Kỹ năng bắt buộc",
    "jobModal.secPreferredSkills": "Kỹ năng ưu tiên",
    "jobModal.noSkills": "Chưa có.",
    "jobModal.deadline": "Hạn ứng tuyển",
    "jobModal.industry": "Ngành",
    "jobModal.postedAt": "Đăng ngày",
    "jobModal.viewRecruiter": "Xem nhà tuyển dụng",

    // ───────────── RecruiterInfoModal (candidate xem nhà tuyển dụng) ─────────────
    "recruiterInfo.title": "Nhà tuyển dụng",
    "recruiterInfo.verified": "Đã xác thực",
    "recruiterInfo.industry": "Lĩnh vực",
    "recruiterInfo.size": "Quy mô",
    "recruiterInfo.location": "Địa điểm",
    "recruiterInfo.website": "Website",
    "recruiterInfo.about": "Giới thiệu",
    "recruiterInfo.empty": "Chưa có thông tin nhà tuyển dụng.",
    "recruiterInfo.loadFailed": "Không tải được thông tin nhà tuyển dụng.",

    // ───────────── ApplyModal ─────────────
    "applyModal.title": "Ứng tuyển vị trí",
    "applyModal.description":
      "Đơn ứng tuyển sẽ được gửi cùng văn bằng đã xác thực của bạn. Nhà tuyển dụng có thể xem hồ sơ và liên hệ.",
    "applyModal.coverLetter": "Thư xin việc",
    "applyModal.coverLetterHint":
      "Tuỳ chọn — vài câu cho nhà tuyển dụng biết bạn phù hợp như thế nào.",
    "applyModal.coverLetterPlaceholder":
      "Tôi rất hứng thú với vị trí này vì…",
    "applyModal.submit": "Gửi đơn ứng tuyển",
    "applyModal.submitting": "Đang gửi…",
    "applyModal.failed": "Gửi đơn thất bại",
    "applyModal.alreadyApplied": "Bạn đã ứng tuyển vị trí này rồi.",

    // ───────────── Recruiter — job detail ─────────────
    "recruiter.jobDetail.titleFallback": "Tin tuyển dụng",
    "recruiter.jobDetail.failedLoad": "Không tải được tin tuyển dụng",
    "recruiter.jobDetail.statusUpdateFailed": "Cập nhật trạng thái thất bại",
    "recruiter.jobDetail.publish": "Đăng tin",
    "recruiter.jobDetail.close": "Đóng tin",
    "recruiter.jobDetail.edit": "Chỉnh sửa",
    "recruiter.jobDetail.tabOverview": "Tổng quan",
    "recruiter.jobDetail.tabCandidates": "Ứng viên phù hợp",
    "recruiter.jobDetail.tabApplications": "Đơn ứng tuyển",
    "recruiter.jobDetail.secDescription": "Mô tả công việc",
    "recruiter.jobDetail.secRequirements": "Yêu cầu",
    "recruiter.jobDetail.secBenefits": "Quyền lợi",
    "recruiter.jobDetail.secRequiredSkills": "Kỹ năng bắt buộc",
    "recruiter.jobDetail.secPreferredSkills": "Kỹ năng ưu tiên",
    "recruiter.jobDetail.secSkills": "Kỹ năng",
    "recruiter.jobDetail.requiredLabel": "Bắt buộc",
    "recruiter.jobDetail.preferredLabel": "Ưu tiên",
    "recruiter.jobDetail.noSkills": "Chưa thêm.",
    "recruiter.jobDetail.candidatesLoading": "Đang tính điểm AI cho ứng viên…",
    "recruiter.jobDetail.candidatesEmpty":
      "Chưa có ứng viên nào được xếp hạng — cần có hồ sơ ứng viên trong hệ thống trước.",
    "recruiter.jobDetail.candidatesFailedLoad": "Không tải được danh sách ứng viên",
    "recruiter.jobDetail.appsFailedLoad": "Không tải được đơn ứng tuyển",
    "recruiter.jobDetail.appsEmpty": "Chưa có đơn ứng tuyển nào.",
    "recruiter.jobDetail.verifyClick": "Xác thực văn bằng",
    "recruiter.jobDetail.anonymousCandidate": "Ứng viên ẩn danh",
    "recruiter.jobDetail.viewProfile": "Xem hồ sơ",
    "candInfo.title": "Hồ sơ ứng viên",
    "candInfo.phone": "Số điện thoại",
    "candInfo.bio": "Giới thiệu",
    "candInfo.desiredPosition": "Vị trí mong muốn",
    "candInfo.yearsExp": "Kinh nghiệm",
    "candInfo.yearsExpValue": "{n} năm",
    "candInfo.openToWork": "Đang tìm việc",
    "candInfo.salaryExpect": "Mức lương mong muốn",
    "candInfo.links": "Liên kết",
    "candInfo.linkedin": "LinkedIn",
    "candInfo.github": "GitHub",
    "candInfo.portfolio": "Portfolio",
    "candInfo.dateOfBirth": "Ngày sinh",
    "candInfo.gender": "Giới tính",
    "candInfo.gender.male": "Nam",
    "candInfo.gender.female": "Nữ",
    "candInfo.gender.other": "Khác",
    "candInfo.preferredLocations": "Địa điểm mong muốn",
    "candInfo.resume": "Hồ sơ / CV",
    "candInfo.resumeView": "Xem CV",
    "candInfo.coverLetter": "Thư ứng tuyển",
    "candInfo.noCoverLetter": "Không có thư ứng tuyển.",
    "candInfo.noProfile": "Ứng viên chưa cập nhật hồ sơ.",

    // ───────────── Recruiter — profile (Company profile) ─────────────
    "recruiter.profile.title": "Hồ sơ công ty",
    "recruiter.profile.description":
      "Thông tin để ứng viên và AI hiểu công ty của bạn khi họ ứng tuyển.",
    "recruiter.profile.verified": "Công ty đã xác thực",
    "recruiter.profile.notVerified": "Chưa xác thực",
    "recruiter.profile.loading": "Đang tải…",
    "recruiter.profile.notFound": "Không tìm thấy hồ sơ.",
    "recruiter.profile.failedLoad": "Không tải được hồ sơ",
    "recruiter.profile.saveFailed": "Lưu thất bại. Vui lòng thử lại.",
    "recruiter.profile.saved": "Đã lưu hồ sơ.",
    "recruiter.profile.sectionCompany": "Thông tin công ty",
    "recruiter.profile.sectionLocation": "Địa điểm",
    "recruiter.profile.sectionAbout": "Giới thiệu",
    "recruiter.profile.fldCompanyName": "Tên công ty",
    "recruiter.profile.fldCompanyNameEn": "Tên tiếng Anh",
    "recruiter.profile.fldIndustry": "Ngành nghề",
    "recruiter.profile.fldCompanySize": "Quy mô công ty",
    "recruiter.profile.fldSelect": "Chọn…",
    "recruiter.profile.fldEmployees": "{size} nhân viên",
    "recruiter.profile.fldTaxCode": "Mã số thuế",
    "recruiter.profile.fldWebsite": "Website",
    "recruiter.profile.fldLogoUrl": "Link logo",
    "recruiter.profile.fldCity": "Thành phố",
    "recruiter.profile.fldCountry": "Quốc gia",
    "recruiter.profile.fldAddress": "Địa chỉ",
    "recruiter.profile.fldDescription": "Mô tả công ty",
    "recruiter.profile.fldDescriptionPlaceholder":
      "Giới thiệu ngắn về công ty, văn hoá và lĩnh vực hoạt động.",
    "recruiter.profile.discard": "Huỷ thay đổi",
    "recruiter.profile.save": "Lưu hồ sơ",

    // ───────────── Issuer — Recipient lookup (Candidate Lookup) ─────────────
    "candLookup.label": "Tìm ứng viên",
    "candLookup.placeholder": "Nhập tên hoặc email ứng viên…",
    "candLookup.find": "Tìm",
    "candLookup.hint": "Gõ ít nhất 2 ký tự để tìm theo tên hoặc email.",
    "candLookup.notFound": "Không tìm thấy ứng viên phù hợp.",
    "candLookup.failed": "Tìm kiếm thất bại.",
    "candLookup.remove": "Xoá",
    "candLookup.change": "Đổi ứng viên",

    // ───────────── Issuer — profile (Institution profile) ─────────────
    "issuer.profile.title": "Hồ sơ tổ chức",
    "issuer.profile.description":
      "Cập nhật thông tin tổ chức của bạn. Trạng thái duyệt do quản trị viên quyết định.",
    "issuer.profile.notRegistered": "Bạn chưa đăng ký tổ chức.",
    "issuer.profile.notFound": "Không tìm thấy hồ sơ tổ chức.",
    "issuer.profile.failedLoad": "Không tải được hồ sơ",
    "issuer.profile.loading": "Đang tải…",
    "issuer.profile.saved": "Đã lưu hồ sơ.",
    "issuer.profile.saveFailed": "Lưu thất bại",
    "issuer.profile.rejectedTitle": "Đã bị quản trị viên từ chối",
    "issuer.profile.onChainAuthorized":
      "Đã được cấp quyền là tổ chức trên blockchain",
    "issuer.profile.onChainAddress": "Địa chỉ on-chain",
    "issuer.profile.sectionBasic": "Thông tin cơ bản",
    "issuer.profile.sectionAbout": "Giới thiệu",
    "issuer.profile.fldName": "Tên tổ chức",
    "issuer.profile.fldNameEn": "Tên tiếng Anh",
    "issuer.profile.fldAbbreviation": "Tên viết tắt",
    "issuer.profile.fldType": "Loại hình",
    "issuer.profile.fldTypePlaceholder":
      "đại học / cao đẳng / trung tâm đào tạo",
    "issuer.profile.fldTaxCode": "Mã số thuế",
    "issuer.profile.fldWebsite": "Website",
    "issuer.profile.fldCity": "Thành phố",
    "issuer.profile.fldCountry": "Quốc gia",
    "issuer.profile.fldAddress": "Địa chỉ",
    "issuer.profile.fldDescription": "Mô tả",
    "issuer.profile.fldDescriptionPlaceholder":
      "Giới thiệu ngắn về tổ chức và văn bằng tổ chức cấp.",
    "issuer.profile.discard": "Huỷ thay đổi",
    "issuer.profile.save": "Lưu hồ sơ",

    // ───────────── Recruiter — edit job ─────────────
    "recruiter.editJob.title": "Chỉnh sửa tin tuyển dụng",
    "recruiter.editJob.description":
      "Khi cập nhật, hệ thống sẽ tính lại điểm AI để gợi ý ứng viên chính xác hơn.",
    "recruiter.editJob.submit": "Lưu thay đổi",
    "recruiter.editJob.failedLoad": "Không tải được tin tuyển dụng",

    // ───────────── CandidateVerifyModal (Recruiter) ─────────────
    "candVerify.title": "Xác thực văn bằng",
    "candVerify.descBefore": "Kiểm tra tất cả văn bằng của ",
    "candVerify.descAfter":
      " trên blockchain — đối chiếu hash, chữ ký VC và quyền cấp của tổ chức.",
    "candVerify.failed": "Xác minh thất bại",
    "candVerify.running": "Đang kiểm tra…",
    "candVerify.summary":
      "{valid} hợp lệ · {revoked} đã thu hồi · {invalid} không hợp lệ",
    "candVerify.noCredentials": "Ứng viên này chưa có văn bằng.",
    "candVerify.clickToExpand":
      "Bấm vào từng dòng để xem chi tiết kiểm tra on-chain.",

    // ───────────── ApplicationStatusSelect (Recruiter) ─────────────
    "appStatus.saving": "Đang lưu…",
    "appStatus.updateFailed": "Cập nhật thất bại",

    // ───────────── BatchProgress (Issuer) ─────────────
    "batchProgress.loading": "Đang tải tiến độ batch…",
    "batchProgress.rows": "{processed} / {total} dòng",
    "batchProgress.tileTotal": "Tổng",
    "batchProgress.tileSuccess": "Thành công",
    "batchProgress.tileErrors": "Lỗi",
    "batchProgress.errorReport": "Báo cáo lỗi",
    "batchProgress.colRow": "Dòng",
    "batchProgress.colField": "Trường",
    "batchProgress.colError": "Lỗi",

    // ───────────── DynamicForm (Issuer) ─────────────
    "dynForm.selectPlaceholder": "Chọn…",

    // ───────────── SkillChipsInput (shared) ─────────────
    "skillChips.placeholder": "Nhập kỹ năng và nhấn Enter…",
    "skillChips.add": "Thêm",

    // ───────────── Public verify page ─────────────
    "publicVerify.verifying": "Đang xác minh văn bằng trên blockchain…",
    "publicVerify.notFoundTitle": "Không tìm thấy văn bằng",
    "publicVerify.notFoundDesc":
      "Văn bằng này không tồn tại hoặc đã bị xoá.",
    "publicVerify.statusVerified": "ĐÃ XÁC THỰC",
    "publicVerify.statusRevoked": "ĐÃ THU HỒI",
    "publicVerify.statusInvalid": "KHÔNG HỢP LỆ",
    "publicVerify.statusError": "CHƯA XÁC MINH ĐƯỢC",
    "publicVerify.cannotVerifyNow": "Không thể xác minh lúc này (lỗi kết nối blockchain). Vui lòng thử lại sau.",
    "publicVerify.issuedTo": "Cấp cho",
    "publicVerify.by": "bởi",
    "publicVerify.fldCredNumber": "Số văn bằng",
    "publicVerify.fldIssuedDate": "Ngày cấp",
    "publicVerify.fldExpiryDate": "Ngày hết hạn",
    "publicVerify.fldStatus": "Trạng thái",
    "publicVerify.verificationDetails": "Chi tiết xác minh",
    "publicVerify.checkOnChain": "Hash được ghi trên blockchain",
    "publicVerify.checkContentIntegrity": "Nội dung khớp hash on-chain",
    "publicVerify.checkSignature": "Chữ ký W3C VC hợp lệ",
    "publicVerify.checkIssuer": "Tổ chức cấp được uỷ quyền",
    "publicVerify.passed": "✓ Đạt",
    "publicVerify.failedCheck": "✗ Không đạt",
    "publicVerify.blockchainProof": "Bằng chứng blockchain",
    "publicVerify.block": "Block",
    "publicVerify.footer": "Xác minh bởi TrustLink • Được hỗ trợ bởi Polygon",
    "publicVerify.unableToVerify": "Không thể xác minh văn bằng",

    // ───────────── Landing — Hero ─────────────
    "landing.hero.eyebrow": "Nền tảng văn bằng số",
    "landing.hero.titlePartA": "Tuyển dụng dựa trên",
    "landing.hero.titleHighlight": "bằng chứng",
    "landing.hero.titlePartB": ", không chỉ lời tự khai.",
    "landing.hero.description":
      "TrustLink ghi văn bằng lên blockchain để nhà tuyển dụng nhìn thấy bằng chứng, ứng viên sở hữu hồ sơ của mình, và tổ chức cấp tự tin xuất hiện.",
    "landing.hero.ctaPrimary": "Bắt đầu miễn phí",
    "landing.hero.ctaSecondary": "Xem cách hoạt động",
    "landing.hero.demoTitle": "Thạc sĩ Khoa học Máy tính",
    "landing.hero.demoVerified": "✓ Đã xác thực · 0x4a8f…b21c",
    "landing.hero.heroImageAlt":
      "Hai chuyên gia đang trao đổi về quyết định tuyển dụng",

    // ───────────── Landing — Trusted by ─────────────
    "landing.trustedBy.title":
      "Được tin dùng bởi các tổ chức và công ty tiên phong",

    // ───────────── Landing — Role sections ─────────────
    "landing.role.candidates.eyebrow": "Dành cho ứng viên",
    "landing.role.candidates.title":
      "Sở hữu văn bằng đã xác thực. Toả sáng đúng nơi quan trọng.",
    "landing.role.candidates.description":
      "Lưu trữ mọi bằng cấp, chứng chỉ và thành tựu trong một ví duy nhất. Tổ chức ghi nhận on-chain — nhà tuyển dụng tin tưởng ngay, không cần xác minh lại.",
    "landing.role.candidates.bullet1":
      "Nhận văn bằng trực tiếp từ trường hoặc công ty",
    "landing.role.candidates.bullet2":
      "Chia sẻ một link duy nhất để chứng minh tính xác thực ngay lập tức",
    "landing.role.candidates.bullet3":
      "Được gợi ý việc làm phù hợp với kỹ năng thật, đã được xác thực",
    "landing.role.candidates.cta": "Khởi tạo ví của bạn",
    "landing.role.candidates.imageAlt":
      "Ứng viên đang xem văn bằng đã xác thực trên laptop",

    "landing.role.recruiters.eyebrow": "Dành cho nhà tuyển dụng",
    "landing.role.recruiters.title":
      "Tuyển dựa trên bằng chứng, không phải lời tự khai.",
    "landing.role.recruiters.description":
      "Không còn phải lục tìm PDF hay liên hệ xác minh. TrustLink dùng AI xếp hạng ứng viên theo kỹ năng đã xác thực, đồng thời hiển thị bằng chứng on-chain cho mọi văn bằng trước khi bạn liên hệ.",
    "landing.role.recruiters.bullet1":
      "AI xếp hạng 184 ứng viên cho vị trí của bạn trong 2,3 giây",
    "landing.role.recruiters.bullet2":
      "Mỗi văn bằng đều có link tới giao dịch on-chain",
    "landing.role.recruiters.bullet3":
      "Gửi offer dựa trên bằng chứng xác thực, không chỉ CV",
    "landing.role.recruiters.cta": "Đăng tin tuyển dụng",
    "landing.role.recruiters.imageAlt":
      "Đội ngũ tuyển dụng đang xem ứng viên được AI xếp hạng",

    "landing.role.issuers.eyebrow": "Dành cho tổ chức",
    "landing.role.issuers.title":
      "Cấp văn bằng mà sinh viên thực sự có thể sử dụng.",
    "landing.role.issuers.description":
      "Thay vì giấy chứng nhận hay PDF dễ thất lạc, hãy ký và phát hành văn bằng on-chain chỉ với vài thao tác. Cựu sinh viên có bản ghi không thể giả mạo, tổ chức có dấu vết kiểm toán rõ ràng.",
    "landing.role.issuers.bullet1":
      "Cấp hàng loạt nghìn văn bằng từ một file Excel duy nhất",
    "landing.role.issuers.bullet2":
      "Thu hồi hoặc cấp lại với lịch sử kiểm toán minh bạch",
    "landing.role.issuers.bullet3":
      "Tham gia mạng lưới mở được 184+ đối tác tin dùng",
    "landing.role.issuers.cta": "Trở thành tổ chức cấp",
    "landing.role.issuers.imageAlt":
      "Sinh viên đại học đang nhận văn bằng tốt nghiệp",

    // ───────────── Landing — How it works ─────────────
    "landing.how.eyebrow": "Cách hoạt động",
    "landing.how.title": "Ba bước. Một bản ghi xác thực.",
    "landing.how.description":
      "Mỗi văn bằng đều đi cùng một con đường — cấp, sở hữu, xác minh — để sự tin tưởng là mặc định, không phải ngoại lệ.",
    "landing.how.step1.title": "Tổ chức ký văn bằng",
    "landing.how.step1.description":
      "Trường, công ty hoặc trung tâm đào tạo của bạn phát hành văn bằng lên Polygon chỉ với một cú nhấp.",
    "landing.how.step2.title": "Ứng viên sở hữu vĩnh viễn",
    "landing.how.step2.description":
      "Văn bằng được gửi vào ví của ứng viên — không phải cơ sở dữ liệu của bên thứ ba. Họ quyết định nơi nó được chia sẻ.",
    "landing.how.step3.title": "Nhà tuyển dụng xác minh trong 1 cú nhấp",
    "landing.how.step3.description":
      "Nhà tuyển dụng nhìn thấy bằng chứng on-chain ngay tại chỗ, trong khi AI gợi ý ứng viên cho đúng vị trí.",

    // ───────────── Landing — Stats ─────────────
    "landing.stats.label1": "Văn bằng đã ghi trên blockchain",
    "landing.stats.label2": "Tổ chức và công ty đối tác",
    "landing.stats.label3": "Kỹ năng đã được xác thực",
    "landing.stats.label4": "Lượt ứng tuyển trên nền tảng",

    // ───────────── Landing — CTA banner ─────────────
    "landing.cta.titlePartA": "Sẵn sàng nâng cấp tuyển dụng bằng",
    "landing.cta.titleHighlight": "niềm tin xác thực",
    "landing.cta.titlePartB": "?",
    "landing.cta.description":
      "Tham gia mạng lưới nơi văn bằng đi kèm bằng chứng — và mọi kết nối đều dựa trên dữ liệu thật.",
    "landing.cta.ctaPrimary": "Tạo tài khoản miễn phí",
    "landing.cta.ctaSecondary": "Đăng nhập",

    // ───────────── Public nav ─────────────
    "publicNav.product": "Sản phẩm",
    "publicNav.howItWorks": "Cách hoạt động",
    "publicNav.pricing": "Bảng giá",
    "publicNav.docs": "Tài liệu",

    // ───────────── Header (public) ─────────────
    "header.trustlinkHome": "TrustLink — Trang chủ",
    "header.signIn": "Đăng nhập",
    "header.getStarted": "Bắt đầu",
    "header.signOut": "Đăng xuất",
    "header.openMenu": "Mở menu",
    "header.closeMenu": "Đóng menu",

    // ───────────── Footer ─────────────
    "footer.tagline":
      "Văn bằng xác thực và tuyển dụng bằng AI cho lực lượng lao động hiện đại. Ghi sự thật lên blockchain.",
    "footer.copyright": "© {year} TrustLink. Mọi quyền được bảo lưu.",
    "footer.colProduct": "Sản phẩm",
    "footer.colCompany": "Công ty",
    "footer.colResources": "Tài nguyên",
    "footer.colLegal": "Pháp lý",
    "footer.product.candidates": "Dành cho ứng viên",
    "footer.product.recruiters": "Dành cho nhà tuyển dụng",
    "footer.product.institutions": "Dành cho tổ chức",
    "footer.product.pricing": "Bảng giá",
    "footer.company.about": "Về chúng tôi",
    "footer.company.careers": "Tuyển dụng",
    "footer.company.contact": "Liên hệ",
    "footer.resources.docs": "Tài liệu",
    "footer.resources.api": "Tài liệu API",
    "footer.resources.changelog": "Nhật ký cập nhật",
    "footer.resources.status": "Tình trạng hệ thống",
    "footer.legal.privacy": "Bảo mật",
    "footer.legal.terms": "Điều khoản",
    "footer.legal.security": "An toàn",

    // ───────────── A11y / tooltips ─────────────
    "a11y.close": "Đóng",
    "a11y.notifications": "Thông báo",
    "notif.empty": "Không có thông báo nào.",
    "notif.markAllRead": "Đánh dấu đã đọc tất cả",
    "notif.justNow": "Vừa xong",
    "notif.type.credential_issued": "Văn bằng mới",
    "notif.type.credential_revoked": "Văn bằng bị thu hồi",
    "notif.type.credential_reissued": "Văn bằng được cấp lại",
    "notif.type.application_received": "Đơn ứng tuyển mới",
    "notif.type.application_status_changed": "Trạng thái đơn thay đổi",
    "notif.type.job_recommendation": "Gợi ý việc làm",
    "notif.type.institution_approved": "Tổ chức được duyệt",
    "notif.type.institution_rejected": "Tổ chức bị từ chối",
    "notif.type.system_announcement": "Thông báo hệ thống",
    "a11y.copyHash": "Sao chép hash",
    "a11y.languagePicker": "Ngôn ngữ",
    "a11y.toggleLanguage": "Chuyển sang tiếng Anh",
    "a11y.showPassword": "Hiển thị mật khẩu",
    "a11y.hidePassword": "Ẩn mật khẩu",

    // ───────────── Not Found (404) ─────────────
    "notFound.eyebrow": "Lỗi 404",
    "notFound.title": "Không tìm thấy trang bạn cần",
    "notFound.description":
      "Trang bạn đang truy cập có thể đã bị di chuyển, đổi tên hoặc chưa từng tồn tại. Hãy kiểm tra lại đường dẫn — hoặc quay về nơi an toàn.",
    "notFound.goHome": "Về trang chủ",
    "notFound.goBack": "Quay lại",
    "notFound.helpfulLinksTitle": "Bạn có thể thử",
    "notFound.helpfulLinks.login": "Đăng nhập tài khoản",
    "notFound.helpfulLinks.register": "Tạo tài khoản mới",
    "notFound.helpfulLinks.product": "Khám phá sản phẩm",

    // ───────────── Avatar (ảnh đại diện) ─────────────
    "avatar.section": "Ảnh đại diện",
    "avatar.change": "Đổi ảnh",
    "avatar.remove": "Xoá ảnh",
    "avatar.uploading": "Đang tải lên…",
    "avatar.hint": "JPG, PNG, WebP hoặc GIF. Tối đa 5MB.",
    "avatar.errorType": "Định dạng ảnh không hỗ trợ. Dùng JPEG, PNG, WebP hoặc GIF.",
    "avatar.errorSize": "Ảnh quá lớn. Kích thước tối đa 5MB.",
    "avatar.errorUpload": "Tải ảnh lên thất bại. Vui lòng thử lại.",
  },
  en: {
    // ───────────── Common ─────────────
    "common.loading": "Loading…",
    "common.search": "Search",
    "common.apply": "Apply",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saveChanges": "Save changes",
    "common.update": "Update",
    "common.create": "Create",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.view": "View",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.type": "Type",
    "common.optional": "Optional",
    "common.required": "Required",
    "common.somethingWentWrong": "Something went wrong. Please try again.",
    "common.errorTitle": "Couldn’t load data",
    "common.errorRetry": "Something went wrong while loading. Please reload the page.",
    "common.justNow": "just now",
    "common.minutesAgo": "m ago",
    "common.hoursAgo": "h ago",
    "common.daysAgo": "d ago",
    "common.remote": "Remote",

    // Avatar dropdown
    "menu.account": "Account",
    "menu.changePassword": "Change password",
    "menu.language": "Language",
    "menu.signOut": "Sign out",
    "menu.signedInAs": "Signed in as",

    // Roles
    "role.admin": "Administrator",
    "role.issuer": "Issuer",
    "role.candidate": "Candidate",
    "role.recruiter": "Recruiter",
    "role.all": "All roles",

    // Sidebar — admin
    "nav.dashboard": "Dashboard",
    "nav.users": "Users",
    "nav.institutions": "Institutions",
    "nav.credentialTypes": "Credential types",
    "nav.blockchain": "Blockchain",
    "nav.auditLogs": "Audit logs",

    // Sidebar — candidate
    "nav.profile": "Profile",
    "nav.credentials": "My credentials",
    "nav.jobs": "Jobs",
    "nav.applications": "Applications",
    "nav.recommendations": "Recommendations",

    // Sidebar — issuer
    "nav.issue": "Issue credential",
    "nav.batch": "Batch import",

    // Sidebar — recruiter
    "nav.myJobs": "My jobs",
    "nav.findJobs": "Find jobs",
    "nav.allCredentials": "All credentials",

    // Sidebar section headers
    "navSection.manage": "Manage",
    "navSection.monitor": "Monitor",
    "navSection.credentials": "Credentials",
    "navSection.myCareer": "My career",
    "navSection.findWork": "Find work",
    "navSection.hiring": "Hiring",

    // Workspace names
    "workspace.admin": "Admin Console",
    "workspace.issuer": "Issuer Portal",
    "workspace.candidate": "Candidate Workspace",
    "workspace.recruiter": "Recruiter Hub",

    // Common buttons (legacy)
    "btn.save": "Save",
    "btn.cancel": "Cancel",
    "btn.update": "Update",
    "btn.confirm": "Confirm",
    "btn.delete": "Delete",

    // Settings
    "settings.title": "Settings",
    "settings.password": "Change password",
    "settings.passwordDescription":
      "New password must be at least 8 characters. You will be signed out of all devices after changing.",

    // Change password
    "password.title": "Change password",
    "password.description":
      "New password must be at least 8 characters. You will be signed out of all devices after changing.",
    "password.current": "Current password",
    "password.new": "New password",
    "password.confirm": "Confirm new password",
    "password.mismatch": "Passwords do not match",
    "password.tooShort": "New password must be at least 8 characters",
    "password.success": "Password changed successfully. Please sign in again.",
    "password.failed": "Failed to change password",

    // Status — account
    "status.account.active": "Active",
    "status.account.suspended": "Suspended",
    "status.account.inactive": "Inactive",
    "status.account.pending_verification": "Pending verification",
    "status.account.all": "All statuses",

    // Status — approval
    "status.approval.pending": "Pending review",
    "status.approval.approved": "Approved",
    "status.approval.rejected": "Rejected",
    "status.approval.all": "All",

    // Status — credential
    "status.cred.pending": "Pending",
    "status.cred.issued": "Issued",
    "status.cred.revoked": "Revoked",
    "status.cred.reissued": "Reissued",
    "status.cred.all": "All statuses",

    // Status — tx
    "status.tx.queued": "Queued",
    "status.tx.submitted": "Submitted",
    "status.tx.retrying": "Retrying",
    "status.tx.confirmed": "Confirmed",
    "status.tx.failed": "Failed",
    "status.tx.all": "All statuses",

    // Status — batch
    "status.batch.uploading": "Uploading",
    "status.batch.validating": "Validating",
    "status.batch.processing": "Processing",
    "status.batch.completed": "Completed",
    "status.batch.failed": "Failed",
    "status.batch.partially_completed": "Partially completed",

    // Status — job
    "status.job.draft": "Draft",
    "status.job.open": "Open",
    "status.job.closed": "Closed",
    "status.job.expired": "Expired",
    "status.job.all": "All statuses",

    // Status — application
    "status.app.applied": "Applied",
    "status.app.reviewing": "Reviewing",
    "status.app.shortlisted": "Shortlisted",
    "status.app.interview": "Interview",
    "status.app.offered": "Offered",
    "status.app.rejected": "Rejected",
    "status.app.withdrawn": "Withdrawn",

    // Transaction types
    "tx.type.issue_credential": "Issue credential",
    "tx.type.revoke_credential": "Revoke credential",
    "tx.type.add_issuer": "Add issuer",
    "tx.type.remove_issuer": "Remove issuer",

    // Credential categories
    "credCategory.degree": "Degree",
    "credCategory.it_certificate": "IT certificate",
    "credCategory.language_certificate": "Language certificate",
    "credCategory.award": "Award",
    "credCategory.professional_certificate": "Professional certificate",
    "credCategory.other": "Other",

    // Auth — login
    "login.title": "Sign in to TrustLink",
    "login.subtitle":
      "Manage verifiable credentials, jobs and applications.",
    "login.email": "Email",
    "login.emailPlaceholder": "you@example.com",
    "login.password": "Password",
    "login.passwordPlaceholder": "••••••••",
    "login.forgotPassword": "Forgot password?",
    "login.submit": "Sign in",
    "login.submitting": "Signing in…",
    "login.newToTrustLink": "New to TrustLink?",
    "login.createAccount": "Create an account",

    // Auth — register
    "register.title": "Create your TrustLink account",
    "register.subtitle":
      "Pick how you'll use TrustLink — your role decides which tools you'll see next.",
    "register.accountType": "Account type",
    "register.accountDetails": "Account details",
    "register.institutionSection": "Institution",
    "register.companySection": "Company",
    "register.fullName": "Full name",
    "register.contactPerson": "Contact person",
    "register.fullNamePlaceholder": "Person managing this account",
    "register.email": "Email",
    "register.phone": "Phone",
    "register.password": "Password",
    "register.passwordHint": "At least 8 characters",
    "register.institutionName": "Institution name",
    "register.institutionNamePlaceholder":
      "e.g. Hanoi University of Science",
    "register.institutionType": "Institution type",
    "register.taxCode": "Tax / registration code",
    "register.website": "Website",
    "register.companyName": "Company name",
    "register.companyNamePlaceholder": "e.g. Mercurial Labs",
    "register.industry": "Industry",
    "register.companySize": "Company size",
    "register.selectPlaceholder": "Select…",
    "register.submit": "Create account",
    "register.submitting": "Creating account…",
    "register.alreadyHaveAccount": "Already have an account?",
    "register.signIn": "Sign in",
    "register.pickAccountType": "Please choose an account type.",

    "institutionType.university": "University",
    "institutionType.college": "College / vocational school",
    "institutionType.training_center": "Training provider",
    "institutionType.professional_body": "Professional body",
    "institutionType.other": "Other",

    "companySize.1_10": "1–10 employees",
    "companySize.11_50": "11–50 employees",
    "companySize.51_200": "51–200 employees",
    "companySize.201_1000": "201–1,000 employees",
    "companySize.1000_plus": "1,000+ employees",

    "roleSelect.candidate": "Candidate",
    "roleSelect.candidateDesc":
      "Showcase verified credentials and apply to jobs.",
    "roleSelect.recruiter": "Recruiter",
    "roleSelect.recruiterDesc":
      "Post jobs and find candidates with on-chain credentials.",
    "roleSelect.issuer": "Issuing Institution",
    "roleSelect.issuerDesc":
      "Issue verifiable credentials to your members and graduates.",

    // Auth — forgot password
    "forgot.title": "Reset your password",
    "forgot.subtitle":
      "Enter the email tied to your account and we'll send you a reset link.",
    "forgot.successTitle": "Check your email",
    "forgot.successSubtitle":
      "If an account exists for {email}, we just sent a reset link.",
    "forgot.submit": "Send reset link",
    "forgot.submitting": "Sending…",
    "forgot.alertNote":
      "The link expires in 1 hour. Don't see it? Check your spam folder, then try again.",
    "forgot.backToSignIn": "Back to sign in",

    // Auth — reset password
    "reset.invalidTitle": "Invalid reset link",
    "reset.invalidSubtitle": "The reset link is missing or malformed.",
    "reset.title": "Set a new password",
    "reset.subtitle": "Choose a strong password you haven't used before.",
    "reset.successTitle": "Password updated",
    "reset.successSubtitle":
      "You can now sign in with your new password.",
    "reset.newPassword": "New password",
    "reset.confirmPassword": "Confirm new password",
    "reset.passwordHint": "At least 8 characters",
    "reset.submit": "Update password",
    "reset.submitting": "Updating…",
    "reset.invalidAlert":
      "Open the link from the email we sent, or request a new one.",
    "reset.successAlert": "Redirecting you to the sign-in page…",
    "reset.tooShort": "Password must be at least 8 characters.",
    "reset.mismatch": "Passwords don't match.",
    "reset.requestNew": "Request a new link",

    // Admin — dashboard
    "admin.dashboard.title": "Dashboard",
    "admin.dashboard.description":
      "System health at a glance — users, credentials, pending approvals and on-chain activity.",
    "admin.dashboard.totalUsers": "Total users",
    "admin.dashboard.credentials": "Credentials",
    "admin.dashboard.pendingInstitutions": "Pending institutions",
    "admin.dashboard.failedTransactions": "Failed transactions",
    "admin.dashboard.candidates": "candidates",
    "admin.dashboard.recruiters": "recruiters",
    "admin.dashboard.issuers": "issuers",
    "admin.dashboard.issued": "issued",
    "admin.dashboard.revoked": "revoked",
    "admin.dashboard.approved": "approved",
    "admin.dashboard.total": "total",
    "admin.dashboard.queued": "queued",
    "admin.dashboard.confirmed": "confirmed",
    "admin.dashboard.overview": "System overview",
    "admin.dashboard.overviewDesc": "Real-time user distribution and on-chain health.",
    "admin.dashboard.usersByRole": "Users by role",
    "admin.dashboard.credentialHealth": "Credential status",
    "admin.dashboard.txHealth": "On-chain transactions",
    "admin.dashboard.institutionHealth": "Issuing institutions",
    "admin.dashboard.failed": "failed",
    "admin.dashboard.pendingShort": "pending",
    "admin.dashboard.rejected": "rejected",
    "admin.dashboard.recentActivity": "Recent activity",
    "admin.dashboard.recentActivityDesc":
      "Latest privileged actions from the audit log.",
    "admin.dashboard.noActivity": "No activity yet.",
    "admin.dashboard.viewAllAuditLogs": "View all audit logs →",
    "admin.dashboard.quickLinks": "Quick links",
    "admin.dashboard.quickLinksDesc": "Jump straight to what needs attention.",
    "admin.dashboard.approveInstitutions": "Approve institutions",
    "admin.dashboard.reviewFailedTx": "Review failed transactions",
    "admin.dashboard.suspendedUsers": "Suspended users",
    "admin.dashboard.actLoggedIn": "logged in",
    "admin.dashboard.actIssuedCredential": "issued a credential",
    "admin.dashboard.actRevokedCredential": "revoked a credential",
    "admin.dashboard.actApprovedInstitution": "approved an institution",
    "admin.dashboard.actRejectedInstitution": "rejected an institution",
    "admin.dashboard.actSuspendedUser": "suspended a user",
    "admin.dashboard.actUpdatedUser": "updated a user",
    "admin.dashboard.actSetOverride": "set a permission override",
    "admin.dashboard.actRemovedOverride": "removed a permission override",
    "admin.dashboard.systemActor": "System",

    // Admin — users
    "admin.users.title": "Users",
    "admin.users.description":
      "Search, filter, suspend and manage per-user action overrides.",
    "admin.users.searchPlaceholder": "Search by name or email…",
    "admin.users.userColumn": "User",
    "admin.users.roleColumn": "Role",
    "admin.users.lastLogin": "Last login",
    "admin.users.overrides": "Overrides",
    "admin.users.block": "Block",
    "admin.users.unblock": "Unblock",
    "admin.users.loading": "Loading users…",
    "admin.users.empty": "No users match these filters.",
    "admin.users.summaryOne": "{n} user",
    "admin.users.summaryMany": "{n} users",

    // Admin — institutions
    "admin.institutions.title": "Institutions",
    "admin.institutions.description":
      "Approve issuers to grant them on-chain credential issuance rights.",
    "admin.institutions.tabPending": "Pending",
    "admin.institutions.tabApproved": "Approved",
    "admin.institutions.tabRejected": "Rejected",
    "admin.institutions.tabAll": "All",
    "admin.institutions.empty": "No institutions in this view.",

    // Admin — blockchain
    "admin.blockchain.title": "Blockchain transactions",
    "admin.blockchain.description":
      "Monitor every Polygon transaction the system has queued, submitted, confirmed or failed.",
    "admin.blockchain.txHash": "Tx hash",
    "admin.blockchain.block": "Block",
    "admin.blockchain.initiatedBy": "Initiated by",
    "admin.blockchain.queuedAt": "Queued at",
    "admin.blockchain.retries": "Retries",
    "admin.blockchain.loading": "Loading transactions…",
    "admin.blockchain.empty": "No transactions match this filter.",
    "admin.blockchain.viewOnPolygonScan": "View on PolygonScan",
    "admin.blockchain.clickFailureReason": "Click to see failure reason",
    "admin.blockchain.summaryOne": "{n} transaction",
    "admin.blockchain.summaryMany": "{n} transactions",

    // Admin — credential types
    "admin.credTypes.title": "Credential types",
    "admin.credTypes.description":
      "Define the schema (dynamic form fields) for credentials that issuers can grant.",
    "admin.credTypes.newType": "New type",
    "admin.credTypes.modalNewTitle": "New credential type",
    "admin.credTypes.modalEditTitle": "Edit credential type",
    "admin.credTypes.modalDescription":
      "The field schema drives the dynamic form issuers fill when granting a credential of this type.",
    "admin.credTypes.colName": "Name",
    "admin.credTypes.colCategory": "Category",
    "admin.credTypes.colFields": "Fields",
    "admin.credTypes.fldName": "Name",
    "admin.credTypes.fldNameEn": "Name (English)",
    "admin.credTypes.fldNamePlaceholder": "e.g. Bachelor of Engineering",
    "admin.credTypes.fldNameEnPlaceholder": "Optional English name",
    "admin.credTypes.fldCategory": "Category",
    "admin.credTypes.fldDescription": "Description",
    "admin.credTypes.fldDescriptionPlaceholder":
      "Short description shown to issuers",
    "admin.credTypes.fldSchema": "Field schema (JSON)",
    "admin.credTypes.fldActive": "Active (issuers can use this type)",
    "admin.credTypes.fldSchemaHint": "Example:",
    "admin.credTypes.empty":
      'No credential types yet. Click "New type" to create the first one.',
    "admin.credTypes.summaryOne": "{n} type",
    "admin.credTypes.summaryMany": "{n} types",
    "admin.credTypes.invalidJson": "Invalid JSON:",
    "admin.credTypes.invalidSchema": "Invalid field schema JSON",
    "admin.credTypes.failedSave": "Failed to save",
    "admin.credTypes.mustHaveFields": 'JSON must contain a "fields" array',

    // Admin — audit logs
    "admin.auditLogs.title": "Audit logs",
    "admin.auditLogs.description":
      "Track every privileged action across the system (latest first).",
    "admin.auditLogs.action": "Action",
    "admin.auditLogs.entityType": "Entity type",
    "admin.auditLogs.limit": "Limit",
    "admin.auditLogs.allActions": "All actions",
    "admin.auditLogs.allEntities": "All entities",
    "admin.auditLogs.colWhen": "When",
    "admin.auditLogs.colActor": "Actor",
    "admin.auditLogs.colEntity": "Entity",
    "admin.auditLogs.empty": "No audit logs match this filter.",
    "admin.auditLogs.summaryOne": "{n} entry",
    "admin.auditLogs.summaryMany": "{n} entries",

    // Candidate — credentials
    "candidate.credentials.title": "My credentials",
    "candidate.credentials.description":
      "Every credential issued to you. Download as a W3C Verifiable Credential JSON, or verify on-chain at any time.",
    "candidate.credentials.emptyTitle": "No credentials yet",
    "candidate.credentials.emptyDesc":
      "When an issuing institution publishes a credential to your account, it will appear here.",
    "candidate.credentials.verify": "Verify",
    "candidate.credentials.downloadVc": "Download VC",
    "candidate.credentials.issued": "Issued",
    "candidate.credentials.expires": "Expires",
    "candidate.credentials.authentic": "Authentic & unrevoked",
    "candidate.credentials.verifyResult": "Verification result: {result}",
    "candidate.credentials.onChain": "On-chain",
    "candidate.credentials.vcSignature": "VC signature",
    "candidate.credentials.issuerAuthorized": "Issuer authorized",
    "candidate.credentials.contentIntegrity": "Content matches on-chain hash",
    "candidate.credentials.cannotVerify": "Can't verify right now (blockchain connection error). Please try again later.",
    "candidate.credentials.verifyFailed": "Verification failed",
    "candidate.credentials.downloadFailed": "Download failed. Please try again.",
    "candidate.credentials.downloadForbidden": "Downloading credentials has been restricted on this account. Please contact your administrator for more details.",
    "candidate.credentials.all": "All",
    "candidate.credentials.issuer": "Issued by",
    "candidate.credentials.skills": "Skills",
    "candidate.credentials.details": "Credential details",
    "candidate.credentials.credentialId": "Credential ID",
    "candidate.credentials.transaction": "Transaction",
    "candidate.credentials.verification": "Verification",
    "candidate.credentials.verifyHint": "Run an on-chain authenticity check for this credential.",
    "candidate.credentials.notVerifiedYet": "Not checked yet",
    "candidate.credentials.viewDetail": "View detail",

    // Candidate — applications
    "candidate.applications.title": "My applications",
    "candidate.applications.description":
      "Every job you've applied to. Recruiters see the match score that was snapshotted at the time you applied.",
    "candidate.applications.emptyTitle": "No applications yet",
    "candidate.applications.emptyDescBefore": "Browse ",
    "candidate.applications.emptyDescJobsLink": "jobs",
    "candidate.applications.emptyDescOr": " or ",
    "candidate.applications.emptyDescRecsLink": "AI recommendations",
    "candidate.applications.emptyDescAfter":
      " to send your first application.",
    "candidate.applications.appliedTime": "applied {time}",
    "candidate.applications.recruiterNote": "Recruiter note:",

    // Candidate — dashboard
    "candidate.dashboard.title": "Overview",
    "candidate.dashboard.description":
      "Your verified credentials, applications, and AI job matches.",
    "candidate.dashboard.roadmap": "Candidate module is on the roadmap.",
    "candidate.dashboard.pipeline": "Application pipeline",
    "candidate.dashboard.topMatches": "Top matches",
    "candidate.dashboard.credentialsTitle": "Credentials",
    "candidate.dashboard.profileTitle": "Profile",
    "candidate.dashboard.viewAll": "View all",
    "candidate.dashboard.onChainCount": "{n} on-chain",
    "candidate.dashboard.applicationsTotal": "{n} applications",
    "candidate.dashboard.noApplications": "No applications yet.",
    "candidate.dashboard.noMatches": "Complete your profile to get matches.",
    "candidate.dashboard.noCredentials": "No credentials yet.",
    "candidate.dashboard.completeProfile": "Complete profile",

    // Issuer — dashboard
    "issuer.dashboard.issuanceTrend": "Credentials issued per month",
    "issuer.dashboard.statusBreakdown": "Credential status",
    "issuer.dashboard.recent": "Recently issued",
    "issuer.dashboard.institutionTitle": "Institution",
    "issuer.dashboard.totalIssued": "Issued",
    "issuer.dashboard.onChain": "On-chain",
    "issuer.dashboard.revokedCount": "Revoked",
    "issuer.dashboard.candidatesReached": "Candidates reached",
    "issuer.dashboard.noRecent": "No credentials issued yet.",
    "issuer.dashboard.viewAll": "View all",
    "issuer.dashboard.title": "Overview",
    "issuer.dashboard.description":
      "Credentials issued, on-chain status, and your institution.",
    "issuer.dashboard.roadmap": "Issuer module is on the roadmap.",

    // Issuer — issue
    "issuer.issue.title": "Issue credential",
    "issuer.issue.description":
      "Pick a credential type, fill the dynamic fields, and we'll sign + queue the on-chain transaction.",
    "issuer.issue.queued":
      "Credential issued — queued for blockchain confirmation.",
    "issuer.issue.viewInList": "View in credentials list",
    "issuer.issue.stepType": "Credential type",
    "issuer.issue.stepRecipient": "Recipient",
    "issuer.issue.stepDetails": "Credential details",
    "issuer.issue.stepTypeDesc":
      "The chosen type defines the metadata fields below.",
    "issuer.issue.stepRecipientDesc":
      "The candidate must already have a TrustLink account.",
    "issuer.issue.stepDetailsDesc":
      "Required fields are marked with an asterisk.",
    "issuer.issue.fldType": "Type",
    "issuer.issue.fldCredNumber": "Credential number",
    "issuer.issue.fldTitle": "Title",
    "issuer.issue.fldIssuedDate": "Issued date",
    "issuer.issue.fldExpiryDate": "Expiry date",
    "issuer.issue.fldExpiryHint": "Leave empty for permanent credentials",
    "issuer.issue.selectTypePlaceholder": "Select credential type…",
    "issuer.issue.credNumberPlaceholder": "e.g. HUST-2026-0123",
    "issuer.issue.titlePlaceholder": "e.g. Bachelor of Computer Science",
    "issuer.issue.dynFieldsLabel": "{type} fields",
    "issuer.issue.submit": "Issue credential",
    "issuer.issue.errLookupFirst":
      "Please look up the candidate by email first.",
    "issuer.issue.errPickType": "Please choose a credential type.",
    "issuer.issue.errSubmit": "Issue failed. Please try again.",

    // Issuer — credentials list
    "issuer.credentials.title": "My credentials",
    "issuer.credentials.description":
      "Every credential your institution has issued. Revoke any time — the on-chain record is updated automatically.",
    "issuer.credentials.searchPlaceholder":
      "Search by title or credential number…",
    "issuer.credentials.colCredential": "Credential",
    "issuer.credentials.colCandidate": "Candidate",
    "issuer.credentials.colTxHash": "Tx hash",
    "issuer.credentials.colIssued": "Issued",
    "issuer.credentials.revoke": "Revoke",
    "issuer.credentials.issueCta": "Issue credential",
    "issuer.credentials.showReason": "View revocation reason",
    "issuer.credentials.reasonModalTitle": "Revocation reason",
    "issuer.credentials.reasonLabel": "Credential",
    "issuer.credentials.loading": "Loading credentials…",
    "issuer.credentials.empty": "No credentials match this view.",
    "issuer.credentials.registerFirst":
      "Register your institution first to start issuing credentials.",
    "issuer.credentials.failedLoad": "Failed to load",

    // Issuer — batch
    "issuer.batch.title": "Batch import",
    "issuer.batch.description":
      "Upload an Excel file to issue credentials in bulk. Each row becomes one credential — invalid rows are reported back so you can fix and re-upload.",
    "issuer.batch.newUpload": "New upload",
    "issuer.batch.credentialType": "Credential type",
    "issuer.batch.dropFile": "Drop Excel file here, or click to browse",
    "issuer.batch.fileNote":
      ".xlsx or .xls — first row should match the credential type schema",
    "issuer.batch.readyToUpload": "{size} KB · ready to upload",
    "issuer.batch.selectType": "Select credential type…",
    "issuer.batch.loadingTypes": "Loading types…",
    "issuer.batch.removeFile": "Remove file",
    "issuer.batch.uploadQueue": "Upload & queue",
    "issuer.batch.currentBatch": "Current batch",
    "issuer.batch.history": "Batch history",
    "issuer.batch.colFile": "File",
    "issuer.batch.colTotal": "Total",
    "issuer.batch.colSuccess": "Success",
    "issuer.batch.colErrors": "Errors",
    "issuer.batch.colCreated": "Created",
    "issuer.batch.emptyHistory": "No batch imports yet.",
    "issuer.batch.invalidFile": "Only .xlsx or .xls files are accepted.",
    "issuer.batch.uploadFailed": "Upload failed",

    // Recruiter — dashboard
    "recruiter.dashboard.applicationsTrend": "Applications per month",
    "recruiter.dashboard.funnel": "Application funnel",
    "recruiter.dashboard.recent": "Recent applicants",
    "recruiter.dashboard.companyTitle": "Company",
    "recruiter.dashboard.openJobs": "Open jobs",
    "recruiter.dashboard.totalApplicants": "Total applicants",
    "recruiter.dashboard.totalJobs": "Total jobs",
    "recruiter.dashboard.noApplicants": "No applications yet.",
    "recruiter.dashboard.viewAll": "View all",
    "recruiter.dashboard.title": "Overview",
    "recruiter.dashboard.description":
      "Your jobs, applicants and hiring pipeline.",
    "recruiter.dashboard.roadmap": "Recruiter module is on the roadmap.",

    // Recruiter — jobs list
    "recruiter.jobs.title": "My jobs",
    "recruiter.jobs.description":
      "Manage every role your team is hiring for. Click a job to see ranked candidates and applications.",
    "recruiter.jobs.postJob": "Post a job",
    "recruiter.jobs.searchPlaceholder": "Search by title…",
    "recruiter.jobs.emptyTitle": "No jobs yet",
    "recruiter.jobs.emptyDesc":
      "Post your first role to start receiving AI-ranked candidates.",
    "recruiter.jobs.viewsCount": "{n} views",

    // Recruiter — new job
    "recruiter.newJob.title": "Post a new job",
    "recruiter.newJob.description":
      "Saved as a draft. You can publish it from the job detail page once you're happy with the content.",
    "recruiter.newJob.submit": "Save as draft",

    // Recruiter — JobForm
    "jobForm.basics": "Basics",
    "jobForm.compensation": "Compensation",
    "jobForm.description": "Description",
    "jobForm.skills": "Skills",
    "jobForm.title": "Title",
    "jobForm.jobType": "Job type",
    "jobForm.experienceLevel": "Experience level",
    "jobForm.industry": "Industry",
    "jobForm.city": "City",
    "jobForm.salaryMin": "Salary min",
    "jobForm.salaryMax": "Salary max",
    "jobForm.descriptionLabel": "Description",
    "jobForm.requirements": "Requirements",
    "jobForm.benefits": "Benefits",
    "jobForm.requiredSkills": "Required skills",
    "jobForm.preferredSkills": "Preferred skills",
    "jobForm.salaryUnit": "Thousand VND / month",
    "jobForm.remoteCheck": "This role is remote-friendly",
    "jobForm.salaryVisible": "Show salary range publicly",
    "jobForm.requiredSkillsHint":
      "Used by AI matcher (keyword tier — 40% of total score)",
    "jobForm.preferredSkillsHint":
      "Nice-to-haves — they don't penalize candidates who lack them",
    "jobForm.descriptionPlaceholder":
      "Describe the role, the team and what success looks like.",
    "jobForm.titlePlaceholder": "e.g. Senior Smart Contract Engineer",
    "jobForm.industryPlaceholder": "e.g. Fintech",
    "jobForm.cityPlaceholder": "e.g. Hanoi",
    "jobForm.requiredSkillsPlaceholder": "e.g. Solidity",
    "jobForm.preferredSkillsPlaceholder": "e.g. Foundry",
    "jobForm.failedSave": "Save failed",

    "jobType.full_time": "Full time",
    "jobType.part_time": "Part time",
    "jobType.contract": "Contract",
    "jobType.internship": "Internship",

    "expLevel.any": "Any level",
    "expLevel.entry": "Entry",
    "expLevel.mid": "Mid",
    "expLevel.senior": "Senior",
    "expLevel.lead": "Lead",

    // RevokeModal
    "revoke.title": 'Revoke "{title}"?',
    "revoke.description":
      "The credential will be marked revoked and a revocation transaction will be queued on Polygon. The candidate will see this status change immediately.",
    "revoke.reason": "Reason",
    "revoke.reasonPlaceholder":
      "e.g. Issued in error — duplicate of CR-2026-0034.",
    "revoke.reasonHint":
      "This reason is stored on the credential and visible to the candidate.",
    "revoke.submit": "Revoke credential",
    "revoke.failed": "Revoke failed",

    // UserActionsModal
    "userActions.title": "Action overrides",
    "userActions.description":
      "Block specific actions for [user]. Overrides take effect immediately and replace the role default.",
    "userActions.loading": "Loading actions…",
    "userActions.reasonPlaceholder": "Reason (optional)",
    "userActions.failedLoad": "Failed to load actions",
    "userActions.failedSave": "Failed to save",

    // Action names & descriptions
    "action.credential.view.name": "View credentials",
    "action.credential.view.desc": "View credential records",
    "action.credential.download.name": "Download credential",
    "action.credential.download.desc": "Download VC JSON / PDF copy",
    "action.credential.issue.name": "Issue credential",
    "action.credential.issue.desc": "Issue a new credential to a candidate",
    "action.credential.revoke.name": "Revoke credential",
    "action.credential.revoke.desc": "Revoke a previously issued credential",
    "action.credential.batch_import.name": "Batch import credentials",
    "action.credential.batch_import.desc": "Upload Excel to issue multiple credentials at once",
    "action.credential.verify.name": "Verify credential",
    "action.credential.verify.desc": "Run blockchain + VC signature verification",
    "action.credential.manage_types.name": "Manage credential types",
    "action.credential.manage_types.desc": "Create and update credential type definitions",
    "action.job.create.name": "Create job",
    "action.job.create.desc": "Create a new job posting",
    "action.job.edit.name": "Edit job",
    "action.job.edit.desc": "Edit an existing job posting",
    "action.job.view.name": "View jobs",
    "action.job.view.desc": "Browse / search job postings",
    "action.application.create.name": "Apply to job",
    "action.application.create.desc": "Submit an application",
    "action.application.review.name": "Review applications",
    "action.application.review.desc": "View and update applicants for a job",
    "action.matching.view.name": "View AI matching",
    "action.matching.view.desc": "View AI match scores and recommendations",
    "action.admin.users.name": "Manage users",
    "action.admin.users.desc": "List, search, suspend, override permissions",
    "action.admin.institutions.name": "Manage institutions",
    "action.admin.institutions.desc": "Approve / reject institutions",
    "action.admin.blockchain.name": "Monitor blockchain",
    "action.admin.blockchain.desc": "View blockchain transaction queue",
    "action.admin.dashboard.name": "Admin dashboard",
    "action.admin.dashboard.desc": "Access system stats and audit logs",

    // TxFailureModal
    "txFailure.title": "Transaction failed",
    "txFailure.description":
      "The blockchain rejected this transaction after retries. Below is the reason reported by the contract.",
    "txFailure.reason": "Reason",
    "txFailure.initiatedBy": "Initiated by",
    "txFailure.retries": "Retries",
    "txFailure.contractMethod": "Contract method",
    "txFailure.showDetails": "Show technical details",
    "txFailure.hideDetails": "Hide technical details",

    // InstitutionCard
    "instCard.approve": "Approve",
    "instCard.reject": "Reject",
    "instCard.rejectTitle": 'Reject "{name}"?',
    "instCard.rejectDescription":
      "Provide a reason — the contact will see this in their dashboard.",
    "instCard.rejectPlaceholder":
      "e.g. Tax registration certificate is missing — please resubmit.",
    "instCard.rejectButton": "Reject institution",
    "instCard.contact": "Contact:",
    "instCard.onChainIssuer": "On-chain issuer",
    "instCard.rejectionReason": "Rejection reason:",

    // Score breakdown
    "score.outOf": "/ 100 match",
    "score.keyword": "Keyword",
    "score.semantic": "Semantic",
    "score.verified": "Verified",
    "score.weight": "weight {percentage}",
    "score.outOfShort": "/ 100",

    // Candidate — recommendations
    "candidate.recs.title": "Recommended for you",
    "candidate.recs.description":
      "Top open jobs ranked by our 3-tier AI matcher: keyword overlap (40%), semantic similarity (50%), and verified-skill bonus (10%).",
    "candidate.recs.loading": "Loading recommendations…",
    "candidate.recs.emptyTitle": "No recommendations yet",
    "candidate.recs.emptyDesc":
      "Once your profile and credentials are populated, we'll suggest jobs that fit your real, verified skills.",
    "candidate.recs.applied": "Applied",
    "candidate.recs.failedJob": "Failed to load job",
    "candidate.recs.whyMatch": "Why you match · AI ranked",
    "candidate.recs.requiredSkills": "Required skills",
    "candidate.recs.skillsVerified":
      "{n} of {total} required skills are blockchain-verified on your profile",
    "candidate.recs.applyVerified": "Apply with verified profile",
    "candidate.recs.match": "match",

    // Candidate — jobs (Search)
    "candidate.jobs.title": "Find jobs",
    "candidate.jobs.description":
      "Filter open roles by city, type, salary and remote-friendliness. Click apply to submit with your verified credentials.",
    "candidate.jobs.searchPlaceholder": "Search by title…",
    "candidate.jobs.cityPlaceholder": "City",
    "candidate.jobs.anyType": "Any type",
    "candidate.jobs.minSalaryPlaceholder": "Min salary (k VND)",
    "candidate.jobs.anyLocation": "Any location",
    "candidate.jobs.remoteOnly": "Remote only",
    "candidate.jobs.onsiteOnly": "On-site only",
    "candidate.jobs.matchCount": "{n} jobs match your filters",
    "candidate.jobs.loading": "Loading jobs…",
    "candidate.jobs.empty": "No jobs match these filters. Try widening your search.",
    "candidate.jobs.pageOf": "Page {current} of {total}",
    "candidate.jobs.previous": "Previous",
    "candidate.jobs.next": "Next",
    "candidate.jobs.failedJobs": "Failed to load jobs",

    // Candidate — profile
    "candidate.profile.title": "Profile",
    "candidate.profile.description":
      "Your bio, links and preferences shape how recruiters and the AI matcher see you.",
    "candidate.profile.openToWork": "Open to work",
    "candidate.profile.closedToOffers": "Closed to offers",
    "candidate.profile.loading": "Loading profile…",
    "candidate.profile.notFound": "Profile not found.",
    "candidate.profile.failedLoad": "Failed to load profile",
    "candidate.profile.saveFailed": "Save failed. Please try again.",
    "candidate.profile.saved": "Profile saved.",
    "candidate.profile.sectionAbout": "About",
    "candidate.profile.sectionLinks": "Links",
    "candidate.profile.sectionCareer": "Career preferences",
    "candidate.profile.sectionSkills": "Skills",
    "candidate.profile.sectionPersonal": "Personal information",
    "candidate.profile.fldDob": "Date of birth",
    "candidate.profile.fldGender": "Gender",
    "candidate.profile.genderUnspecified": "Prefer not to say",
    "candidate.profile.genderMale": "Male",
    "candidate.profile.genderFemale": "Female",
    "candidate.profile.genderOther": "Other",
    "candidate.profile.skillsHint":
      "{n} skill(s) blockchain-verified from your credentials.",
    "candidate.profile.completenessHint":
      "A complete profile leads to more accurate recommendations.",
    "candidate.profile.fldBio": "Short bio",
    "candidate.profile.fldBioHint":
      "A few sentences — used for AI semantic matching too.",
    "candidate.profile.fldBioPlaceholder":
      "Briefly describe your background, focus and what you're looking for.",
    "candidate.profile.fldResume": "Resume URL",
    "candidate.profile.fldLinkedIn": "LinkedIn",
    "candidate.profile.fldGithub": "GitHub",
    "candidate.profile.fldPortfolio": "Portfolio",
    "candidate.profile.fldDesiredPosition": "Desired position",
    "candidate.profile.fldDesiredPositionPlaceholder":
      "e.g. Smart Contract Engineer",
    "candidate.profile.fldYearsExperience": "Years of experience",
    "candidate.profile.fldSalaryMin": "Desired salary (min)",
    "candidate.profile.fldSalaryMax": "Desired salary (max)",
    "candidate.profile.fldSalaryUnit": "Thousand VND / month",
    "candidate.profile.fldLocations": "Preferred locations",
    "candidate.profile.fldLocationPlaceholder": "e.g. Hanoi",
    "candidate.profile.fldLocationAdd": "Add",
    "candidate.profile.openToWorkLabel": "I'm open to new opportunities",
    "candidate.profile.openToWorkHint":
      "Toggle off to hide yourself from recruiter searches.",
    "candidate.profile.discard": "Discard changes",
    "candidate.profile.save": "Save profile",

    // JobCard
    "jobCard.apply": "Apply",
    "jobCard.salaryFrom": "From {amount}",
    "jobCard.salaryUpTo": "Up to {amount}",
    "jobCard.salaryUndisclosed": "Negotiable",
    "jobCard.applied": "Applied",
    "jobCard.viewDetail": "View details",
    "jobModal.secDescription": "Job description",
    "jobModal.secRequirements": "Requirements",
    "jobModal.secBenefits": "Benefits",
    "jobModal.secRequiredSkills": "Required skills",
    "jobModal.secPreferredSkills": "Preferred skills",
    "jobModal.noSkills": "None listed.",
    "jobModal.deadline": "Application deadline",
    "jobModal.industry": "Industry",
    "jobModal.postedAt": "Posted",
    "jobModal.viewRecruiter": "View employer",

    // RecruiterInfoModal (candidate viewing the employer)
    "recruiterInfo.title": "Employer",
    "recruiterInfo.verified": "Verified",
    "recruiterInfo.industry": "Industry",
    "recruiterInfo.size": "Company size",
    "recruiterInfo.location": "Location",
    "recruiterInfo.website": "Website",
    "recruiterInfo.about": "About",
    "recruiterInfo.empty": "No employer information available.",
    "recruiterInfo.loadFailed": "Failed to load employer information.",

    // ApplyModal
    "applyModal.title": "Apply for this job",
    "applyModal.description":
      "Your application will be submitted with your verified credentials. The recruiter can review your profile and reach out.",
    "applyModal.coverLetter": "Cover letter",
    "applyModal.coverLetterHint":
      "Optional — a few sentences telling the recruiter why you're a fit.",
    "applyModal.coverLetterPlaceholder":
      "I'm excited about this role because…",
    "applyModal.submit": "Submit application",
    "applyModal.submitting": "Submitting…",
    "applyModal.failed": "Application failed",
    "applyModal.alreadyApplied": "You've already applied to this job.",

    // Recruiter — job detail
    "recruiter.jobDetail.titleFallback": "Job",
    "recruiter.jobDetail.failedLoad": "Failed to load job",
    "recruiter.jobDetail.statusUpdateFailed": "Status update failed",
    "recruiter.jobDetail.publish": "Publish",
    "recruiter.jobDetail.close": "Close",
    "recruiter.jobDetail.edit": "Edit",
    "recruiter.jobDetail.tabOverview": "Overview",
    "recruiter.jobDetail.tabCandidates": "Recommended candidates",
    "recruiter.jobDetail.tabApplications": "Applications",
    "recruiter.jobDetail.secDescription": "Description",
    "recruiter.jobDetail.secRequirements": "Requirements",
    "recruiter.jobDetail.secBenefits": "Benefits",
    "recruiter.jobDetail.secRequiredSkills": "Required skills",
    "recruiter.jobDetail.secPreferredSkills": "Preferred skills",
    "recruiter.jobDetail.secSkills": "Skills",
    "recruiter.jobDetail.requiredLabel": "Required",
    "recruiter.jobDetail.preferredLabel": "Preferred",
    "recruiter.jobDetail.noSkills": "None added.",
    "recruiter.jobDetail.candidatesLoading": "Computing AI rankings…",
    "recruiter.jobDetail.candidatesEmpty":
      "No candidates ranked yet — try once you have candidate embeddings in the system.",
    "recruiter.jobDetail.candidatesFailedLoad": "Failed to load candidates",
    "recruiter.jobDetail.appsFailedLoad": "Failed to load applications",
    "recruiter.jobDetail.appsEmpty": "No applications yet.",
    "recruiter.jobDetail.verifyClick": "Verify credentials",
    "recruiter.jobDetail.anonymousCandidate": "Anonymous candidate",
    "recruiter.jobDetail.viewProfile": "View profile",
    "candInfo.title": "Candidate profile",
    "candInfo.phone": "Phone",
    "candInfo.bio": "About",
    "candInfo.desiredPosition": "Desired position",
    "candInfo.yearsExp": "Experience",
    "candInfo.yearsExpValue": "{n} years",
    "candInfo.openToWork": "Open to work",
    "candInfo.salaryExpect": "Expected salary",
    "candInfo.links": "Links",
    "candInfo.linkedin": "LinkedIn",
    "candInfo.github": "GitHub",
    "candInfo.portfolio": "Portfolio",
    "candInfo.dateOfBirth": "Date of birth",
    "candInfo.gender": "Gender",
    "candInfo.gender.male": "Male",
    "candInfo.gender.female": "Female",
    "candInfo.gender.other": "Other",
    "candInfo.preferredLocations": "Preferred locations",
    "candInfo.resume": "Resume / CV",
    "candInfo.resumeView": "View CV",
    "candInfo.coverLetter": "Cover letter",
    "candInfo.noCoverLetter": "No cover letter provided.",
    "candInfo.noProfile": "Candidate hasn't updated their profile yet.",

    // Recruiter — profile
    "recruiter.profile.title": "Company profile",
    "recruiter.profile.description":
      "Information candidates and the AI matcher use to understand who they're applying to.",
    "recruiter.profile.verified": "Verified company",
    "recruiter.profile.notVerified": "Not verified",
    "recruiter.profile.loading": "Loading…",
    "recruiter.profile.notFound": "Profile not found.",
    "recruiter.profile.failedLoad": "Failed to load profile",
    "recruiter.profile.saveFailed": "Save failed. Please try again.",
    "recruiter.profile.saved": "Profile saved.",
    "recruiter.profile.sectionCompany": "Company",
    "recruiter.profile.sectionLocation": "Location",
    "recruiter.profile.sectionAbout": "About",
    "recruiter.profile.fldCompanyName": "Company name",
    "recruiter.profile.fldCompanyNameEn": "English name",
    "recruiter.profile.fldIndustry": "Industry",
    "recruiter.profile.fldCompanySize": "Company size",
    "recruiter.profile.fldSelect": "Select…",
    "recruiter.profile.fldEmployees": "{size} employees",
    "recruiter.profile.fldTaxCode": "Tax code",
    "recruiter.profile.fldWebsite": "Website",
    "recruiter.profile.fldLogoUrl": "Logo URL",
    "recruiter.profile.fldCity": "City",
    "recruiter.profile.fldCountry": "Country",
    "recruiter.profile.fldAddress": "Address",
    "recruiter.profile.fldDescription": "Description",
    "recruiter.profile.fldDescriptionPlaceholder":
      "Briefly describe the company, culture and industry.",
    "recruiter.profile.discard": "Discard changes",
    "recruiter.profile.save": "Save profile",

    // Issuer — Candidate Lookup
    "candLookup.label": "Find candidate",
    "candLookup.placeholder": "Type name or email…",
    "candLookup.find": "Find",
    "candLookup.hint": "Type at least 2 characters to search by name or email.",
    "candLookup.notFound": "No matching candidate found.",
    "candLookup.failed": "Search failed.",
    "candLookup.remove": "Remove",
    "candLookup.change": "Change candidate",

    // Issuer — profile
    "issuer.profile.title": "Institution profile",
    "issuer.profile.description":
      "Keep your institution information up to date. Approval status is managed by an admin.",
    "issuer.profile.notRegistered": "You haven't registered an institution yet.",
    "issuer.profile.notFound": "Institution not found.",
    "issuer.profile.failedLoad": "Failed to load profile",
    "issuer.profile.loading": "Loading…",
    "issuer.profile.saved": "Profile saved.",
    "issuer.profile.saveFailed": "Save failed",
    "issuer.profile.rejectedTitle": "Rejected by admin",
    "issuer.profile.onChainAuthorized": "On-chain issuer authorized",
    "issuer.profile.onChainAddress": "On-chain address",
    "issuer.profile.sectionBasic": "Basic information",
    "issuer.profile.sectionAbout": "About",
    "issuer.profile.fldName": "Institution name",
    "issuer.profile.fldNameEn": "English name",
    "issuer.profile.fldAbbreviation": "Abbreviation",
    "issuer.profile.fldType": "Type",
    "issuer.profile.fldTypePlaceholder":
      "university / college / training_center",
    "issuer.profile.fldTaxCode": "Tax code",
    "issuer.profile.fldWebsite": "Website",
    "issuer.profile.fldCity": "City",
    "issuer.profile.fldCountry": "Country",
    "issuer.profile.fldAddress": "Address",
    "issuer.profile.fldDescription": "Description",
    "issuer.profile.fldDescriptionPlaceholder":
      "Briefly describe your institution and what it issues.",
    "issuer.profile.discard": "Discard changes",
    "issuer.profile.save": "Save profile",

    // Recruiter — edit job
    "recruiter.editJob.title": "Edit job",
    "recruiter.editJob.description":
      "Updates re-generate the AI embedding so candidate matches stay accurate.",
    "recruiter.editJob.submit": "Save changes",
    "recruiter.editJob.failedLoad": "Failed to load job",

    // CandidateVerifyModal
    "candVerify.title": "Credential verification",
    "candVerify.descBefore": "Checking every credential for ",
    "candVerify.descAfter":
      " against on-chain hash, VC signature, and authorized issuer.",
    "candVerify.failed": "Verification failed",
    "candVerify.running": "Running checks…",
    "candVerify.summary": "{valid} valid · {revoked} revoked · {invalid} invalid",
    "candVerify.noCredentials": "This candidate has no credentials yet.",
    "candVerify.clickToExpand":
      "Click any row to expand its on-chain check details.",

    // ApplicationStatusSelect
    "appStatus.saving": "Saving…",
    "appStatus.updateFailed": "Update failed",

    // BatchProgress
    "batchProgress.loading": "Loading batch progress…",
    "batchProgress.rows": "{processed} / {total} rows",
    "batchProgress.tileTotal": "Total",
    "batchProgress.tileSuccess": "Success",
    "batchProgress.tileErrors": "Errors",
    "batchProgress.errorReport": "Error report",
    "batchProgress.colRow": "Row",
    "batchProgress.colField": "Field",
    "batchProgress.colError": "Error",

    // DynamicForm
    "dynForm.selectPlaceholder": "Select…",

    // SkillChipsInput
    "skillChips.placeholder": "Type a skill and press Enter…",
    "skillChips.add": "Add",

    // Public verify page
    "publicVerify.verifying": "Verifying credential on blockchain…",
    "publicVerify.notFoundTitle": "Credential not found",
    "publicVerify.notFoundDesc":
      "This credential does not exist or has been deleted.",
    "publicVerify.statusVerified": "VERIFIED",
    "publicVerify.statusRevoked": "REVOKED",
    "publicVerify.statusInvalid": "INVALID",
    "publicVerify.statusError": "CANNOT VERIFY",
    "publicVerify.cannotVerifyNow": "Can't verify right now (blockchain connection error). Please try again later.",
    "publicVerify.issuedTo": "Issued to",
    "publicVerify.by": "by",
    "publicVerify.fldCredNumber": "Credential Number",
    "publicVerify.fldIssuedDate": "Issued Date",
    "publicVerify.fldExpiryDate": "Expiry Date",
    "publicVerify.fldStatus": "Status",
    "publicVerify.verificationDetails": "Verification details",
    "publicVerify.checkOnChain": "Hash exists on blockchain",
    "publicVerify.checkContentIntegrity": "Content matches on-chain hash",
    "publicVerify.checkSignature": "W3C VC signature valid",
    "publicVerify.checkIssuer": "Issuer is authorized",
    "publicVerify.passed": "✓ Passed",
    "publicVerify.failedCheck": "✗ Failed",
    "publicVerify.blockchainProof": "Blockchain proof",
    "publicVerify.block": "Block",
    "publicVerify.footer": "Verified by TrustLink • Powered by Polygon",
    "publicVerify.unableToVerify": "Unable to verify credential",

    // Landing — Hero
    "landing.hero.eyebrow": "Verifiable Credentials Platform",
    "landing.hero.titlePartA": "Hire on what's been",
    "landing.hero.titleHighlight": "verified",
    "landing.hero.titlePartB": ", not just claimed.",
    "landing.hero.description":
      "TrustLink anchors credentials on-chain so recruiters see the truth, candidates own their record, and institutions issue with confidence.",
    "landing.hero.ctaPrimary": "Get started — it's free",
    "landing.hero.ctaSecondary": "See how it works",
    "landing.hero.demoTitle": "MSc Computer Science",
    "landing.hero.demoVerified": "✓ Verified · 0x4a8f…b21c",
    "landing.hero.heroImageAlt":
      "Two professionals collaborating on hiring decisions",

    // Landing — Trusted by
    "landing.trustedBy.title":
      "Trusted by leading institutions and forward-thinking companies",

    // Landing — Role sections
    "landing.role.candidates.eyebrow": "For Candidates",
    "landing.role.candidates.title":
      "Own your verified credentials. Stand out where it matters.",
    "landing.role.candidates.description":
      "Carry every degree, certificate and on-the-job achievement in one wallet. Issuers anchor them on-chain — recruiters trust them on sight, no follow-ups needed.",
    "landing.role.candidates.bullet1":
      "Receive credentials directly from your school or employer",
    "landing.role.candidates.bullet2":
      "Share a single link that proves authenticity instantly",
    "landing.role.candidates.bullet3":
      "Get matched to roles that fit your real, verified skills",
    "landing.role.candidates.cta": "Start your wallet",
    "landing.role.candidates.imageAlt":
      "Candidate reviewing their verified credentials on a laptop",

    "landing.role.recruiters.eyebrow": "For Recruiters",
    "landing.role.recruiters.title":
      "Hire on what's been verified, not just claimed.",
    "landing.role.recruiters.description":
      "Stop chasing PDFs and back-channel references. TrustLink ranks candidates by verified skills using AI, and shows you the on-chain proof for every credential before you reach out.",
    "landing.role.recruiters.bullet1":
      "AI ranks 184 candidates against your role in 2.3 seconds",
    "landing.role.recruiters.bullet2":
      "Every credential links to its on-chain transaction",
    "landing.role.recruiters.bullet3":
      "Send offers backed by verifiable evidence — not just resumes",
    "landing.role.recruiters.cta": "Post a verified job",
    "landing.role.recruiters.imageAlt":
      "Recruiting team reviewing ranked candidate matches",

    "landing.role.issuers.eyebrow": "For Institutions",
    "landing.role.issuers.title":
      "Issue credentials your graduates can actually use.",
    "landing.role.issuers.description":
      "Move beyond paper certificates and PDFs that get lost in inboxes. Sign and publish credentials on-chain in a few clicks — your alumni get tamper-proof records, you get audit-ready provenance.",
    "landing.role.issuers.bullet1":
      "Batch-issue thousands of credentials from a single Excel upload",
    "landing.role.issuers.bullet2":
      "Revoke or reissue with a clear audit trail",
    "landing.role.issuers.bullet3":
      "Joining an open registry trusted by 184+ partners",
    "landing.role.issuers.cta": "Become an issuer",
    "landing.role.issuers.imageAlt":
      "University graduates receiving their credentials",

    // Landing — How it works
    "landing.how.eyebrow": "How it works",
    "landing.how.title": "Three steps. One verifiable record.",
    "landing.how.description":
      "Every credential follows the same path — issued, owned, verified — so trust is the default, not the exception.",
    "landing.how.step1.title": "Issuer signs the credential",
    "landing.how.step1.description":
      "Your school, employer or training body publishes the credential on Polygon with a one-click signature.",
    "landing.how.step2.title": "Candidate owns it forever",
    "landing.how.step2.description":
      "It lands in the candidate's wallet — not a third-party database. They control where it goes.",
    "landing.how.step3.title": "Recruiter verifies in a click",
    "landing.how.step3.description":
      "Recruiters see the on-chain proof inline while AI matches the candidate to the right roles.",

    // Landing — Stats
    "landing.stats.label1": "Credentials anchored on-chain",
    "landing.stats.label2": "Partner institutions and employers",
    "landing.stats.label3": "Verified skills",
    "landing.stats.label4": "Applications on the platform",

    // Landing — CTA banner
    "landing.cta.titlePartA": "Ready to upgrade hiring with",
    "landing.cta.titleHighlight": "verifiable trust",
    "landing.cta.titlePartB": "?",
    "landing.cta.description":
      "Join the network where credentials carry the proof — and matches are made on real signal.",
    "landing.cta.ctaPrimary": "Create your free account",
    "landing.cta.ctaSecondary": "Sign in",

    // Public nav
    "publicNav.product": "Product",
    "publicNav.howItWorks": "How it works",
    "publicNav.pricing": "Pricing",
    "publicNav.docs": "Docs",

    // Header (public)
    "header.trustlinkHome": "TrustLink home",
    "header.signIn": "Sign in",
    "header.getStarted": "Get started",
    "header.signOut": "Sign out",
    "header.openMenu": "Open menu",
    "header.closeMenu": "Close menu",

    // Footer
    "footer.tagline":
      "Verifiable credentials and AI-powered hiring for the modern workforce. Anchor truth on-chain.",
    "footer.copyright": "© {year} TrustLink. All rights reserved.",
    "footer.colProduct": "Product",
    "footer.colCompany": "Company",
    "footer.colResources": "Resources",
    "footer.colLegal": "Legal",
    "footer.product.candidates": "For Candidates",
    "footer.product.recruiters": "For Recruiters",
    "footer.product.institutions": "For Institutions",
    "footer.product.pricing": "Pricing",
    "footer.company.about": "About",
    "footer.company.careers": "Careers",
    "footer.company.contact": "Contact",
    "footer.resources.docs": "Documentation",
    "footer.resources.api": "API reference",
    "footer.resources.changelog": "Changelog",
    "footer.resources.status": "Status",
    "footer.legal.privacy": "Privacy",
    "footer.legal.terms": "Terms",
    "footer.legal.security": "Security",

    // A11y / tooltips
    "a11y.close": "Close",
    "a11y.notifications": "Notifications",
    "notif.empty": "No notifications yet.",
    "notif.markAllRead": "Mark all as read",
    "notif.justNow": "Just now",
    "notif.type.credential_issued": "New credential",
    "notif.type.credential_revoked": "Credential revoked",
    "notif.type.credential_reissued": "Credential reissued",
    "notif.type.application_received": "New application",
    "notif.type.application_status_changed": "Application updated",
    "notif.type.job_recommendation": "Job recommendation",
    "notif.type.institution_approved": "Institution approved",
    "notif.type.institution_rejected": "Institution rejected",
    "notif.type.system_announcement": "System announcement",
    "a11y.copyHash": "Copy hash",
    "a11y.languagePicker": "Language",
    "a11y.toggleLanguage": "Switch to Vietnamese",
    "a11y.showPassword": "Show password",
    "a11y.hidePassword": "Hide password",

    // Not Found (404)
    "notFound.eyebrow": "Error 404",
    "notFound.title": "We can't find that page",
    "notFound.description":
      "The page you're looking for may have been moved, renamed, or never existed. Double-check the URL — or jump back to safer ground.",
    "notFound.goHome": "Back to home",
    "notFound.goBack": "Go back",
    "notFound.helpfulLinksTitle": "Try one of these",
    "notFound.helpfulLinks.login": "Sign in to your account",
    "notFound.helpfulLinks.register": "Create a new account",
    "notFound.helpfulLinks.product": "Explore the product",

    // Avatar
    "avatar.section": "Profile photo",
    "avatar.change": "Change photo",
    "avatar.remove": "Remove",
    "avatar.uploading": "Uploading…",
    "avatar.hint": "JPG, PNG, WebP or GIF. Max 5MB.",
    "avatar.errorType": "Unsupported image type. Use JPEG, PNG, WebP or GIF.",
    "avatar.errorSize": "Image is too large. Maximum size is 5MB.",
    "avatar.errorUpload": "Upload failed. Please try again.",
  },
} as const;
