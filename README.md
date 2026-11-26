<div align="center">
  <img src="public/favicon.svg" width="76" height="76" alt="Z2FA Logo" />
  <h1>Z2FA — Precision 2FA Studio & Vault</h1>
  <p><strong>Trình lấy mã 2FA tức thì & Kho lưu trữ bảo mật AES-256 trực tiếp trên trình duyệt.</strong></p>
</div>

---

## Giới thiệu

**Z2FA** kết hợp sự nhanh gọn của một công cụ lấy mã TOTP tức thì (hỗ trợ dán đơn lẻ, hàng loạt chuỗi `UID|PASS|2FA_SECRET`, `otpauth://`, ảnh chụp màn hình mã QR) với trải nghiệm quản lý kho 2FA cá nhân tinh tế theo ngôn ngữ thiết kế **Warm Editorial Bauhaus** (`#fdfcfc` Eggshell, `#f5f3f1` Warm Taupe, `#000000` Ink).

Toàn bộ quá trình tạo mã, đọc mã QR và mã hóa kho đều diễn ra **100% trên trình duyệt (Zero-Knowledge Client-Side)** thông qua Web Crypto API — không gửi bất kỳ khóa bí mật nào lên máy chủ.

## Tính năng chính

- **Instant TOTP Studio (Lấy mã nhanh 1 chạm)**:
  - Tự động bóc tách Secret Base32 từ chuỗi đơn, nhiều dòng định dạng `UID|PASS|2FA_SECRET|EMAIL`, link `otpauth://totp/...` hoặc mã chuyển thiết bị `otpauth-migration://` từ Google Authenticator.
  - Hỗ trợ nhấn **`Ctrl+V` / `Cmd+V`** ở bất kỳ đâu trên trang để dán thẳng ảnh chụp màn hình mã QR, kéo-thả ảnh QR, hoặc mở **Camera** quét trực tiếp.
- **Hiệu ứng 60fps & Smart Copy chống trễ nhịp**:
  - **Spring Odometer Digits**: Từng chữ số cuộn trục lò xo mượt mà mỗi chu kỳ 30 giây.
  - **Colorful Perimeter Countdown**: Viền tiến trình chạy quanh mép thẻ chuyển sắc trực quan (`Xanh ngọc` → `Vàng hổ phách ≤ 8s` → `Đỏ cam ≤ 4s`).
  - **Smart Copy**: Tự hé lộ **Mã kế tiếp** khi còn `≤ 5s`; nếu bấm sao chép lúc `≤ 2s` cuối chu kỳ, Z2FA tự động copy sẵn mã mới kèm thông báo **Dynamic Island**.
- **Kho lưu trữ thông minh & Bảo mật AES-256-GCM**:
  - Tự nhận diện logo màu sắc của hơn 15+ nền tảng phổ biến (Google, GitHub, Facebook, Binance, Discord, OpenAI, Telegram, Microsoft, AWS, Cloudflare, Shopee, TikTok, Steam...).
  - Hỗ trợ Ghim (Pin), phân loại theo Tag với chấm chỉ báo trượt mượt, tìm kiếm nhanh **`⌘K / Ctrl+K`** và xuất ngược mã QR cho từng tài khoản.
  - Khóa bảo vệ kho tùy chọn chuẩn **AES-256-GCM** (`PBKDF2 210.000 vòng`), Xuất/Nhập file Backup `.json`, hỗ trợ song ngữ **VI / EN**, **Light / Dark Mode** và cài đặt **PWA Offline**.

## Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite 6
- **Styling & Typography**: Tailwind CSS v4, Inter (300/400/500) & Geist Mono
- **Motion**: Framer Motion (`spring` odometer, FLIP `layout` cards, Dynamic Island)
- **Cryptography & QR**: Native Web Crypto API (`HMAC SHA-1/256/512`, `AES-256-GCM`, `PBKDF2`), `jsQR`, `qrcode`, `vite-plugin-pwa`

## Cài đặt & Chạy cục bộ

```bash
# Cài đặt thư viện
pnpm install

# Chạy máy chủ phát triển (http://localhost:5173)
pnpm run dev

# Kiểm tra TypeScript & đóng gói bản Production
pnpm run build
```

## Bản quyền

MIT © [zane-tv](https://github.com/zane-tv)
