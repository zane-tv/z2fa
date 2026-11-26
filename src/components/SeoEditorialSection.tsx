import React from 'react';
import { ChevronDown, Github, Lock, QrCode, ShieldCheck, Zap } from 'lucide-react';
import type { Language } from '../types';
import { Z2FALogo } from './Z2FALogo';

interface SeoEditorialSectionProps {
  lang: Language;
}

const CONTENT = {
  vi: {
    howToBadge: 'HƯỚNG DẪN NHANH',
    howToTitle: 'Cách lấy mã 2FA online an toàn trong 3 bước',
    howToSub:
      'Tương thích chuẩn TOTP (RFC 6238) của Google, Facebook, GitHub, Binance, Discord, Microsoft, TikTok, Shopee và mọi dịch vụ xác thực 2 lớp.',
    steps: [
      {
        step: '01',
        title: 'Nhập Secret Key hoặc tải mã QR',
        desc: 'Dán chuỗi Base32 Secret, nhiều dòng UID|PASS|2FA, link otpauth:// vào khung Lấy Mã Tức Thì — hoặc nhấn Ctrl+V dán thẳng ảnh chụp màn hình mã QR.',
      },
      {
        step: '02',
        title: 'Nhận & sao chép mã 6 số thông minh',
        desc: 'Mã TOTP được tạo trực tiếp trên trình duyệt. Chạm vào thẻ để copy; khi đồng hồ còn dưới 2 giây, Smart Copy tự lấy sẵn mã của chu kỳ mới.',
      },
      {
        step: '03',
        title: 'Lưu vào kho & khóa AES-256-GCM',
        desc: 'Lưu các tài khoản dùng thường xuyên vào kho cá nhân, gắn nhãn phân loại, xuất file Backup JSON hoặc đặt mật khẩu mã hóa chuẩn AES-256-GCM.',
      },
    ],
    trustPills: [
      { icon: ShieldCheck, text: '100% Zero-Knowledge Client-Side' },
      { icon: Lock, text: 'Mã hóa PBKDF2 + AES-256-GCM' },
      { icon: QrCode, text: 'Hỗ trợ QR Google Authenticator' },
      { icon: Zap, text: 'Cài đặt PWA chạy Offline' },
    ],
    faqTitle: 'Câu hỏi thường gặp về mã 2FA (TOTP)',
    faqs: [
      {
        q: 'Z2FA có lưu trữ hay gửi mã Secret 2FA của tôi lên máy chủ không?',
        a: 'Hoàn toàn không. Mọi phép tính tạo mã TOTP (RFC 6238), giải mã ảnh QR và khóa kho AES-256-GCM đều chạy 100% cục bộ trên trình duyệt của bạn bằng Web Crypto API. Không có bất kỳ dữ liệu tài khoản nào được truyền ra ngoài.',
      },
      {
        q: 'Làm sao để lấy mã 2FA từ chuỗi định dạng UID|PASS|2FA hoặc nhiều tài khoản cùng lúc?',
        a: 'Bạn chỉ cần dán trực tiếp một hoặc nhiều dòng có dạng UID|PASS|2FA_SECRET|EMAIL vào khung Lấy Mã Tức Thì. Z2FA sẽ tự động nhận diện đoạn mã Base32 Secret trên từng dòng và hiển thị danh sách mã 6 số sống theo thời gian thực.',
      },
      {
        q: 'Có thể lấy mã 2FA từ ảnh chụp màn hình mã QR mà không cần điện thoại không?',
        a: 'Có. Bạn có thể bấm Ctrl+V (hoặc Cmd+V trên Mac) ở bất kỳ đâu trên trang Z2FA ngay sau khi chụp màn hình mã QR, hoặc kéo-thả file ảnh vào cửa sổ web để giải mã tức thì, kể cả ảnh QR xuất hàng loạt từ Google Authenticator.',
      },
      {
        q: 'Tại sao tôi nhập mã 2FA đúng nhưng trang đăng nhập báo mã không hợp lệ?',
        a: 'Mã TOTP phụ thuộc chính xác vào đồng hồ hệ thống theo chu kỳ 30 giây. Hãy kiểm tra cài đặt ngày giờ trên máy tính hoặc điện thoại của bạn đã bật chế độ Tự động đồng bộ thời gian Internet (Automatic Time) chưa.',
      },
      {
        q: 'Tính năng Smart Copy chống hết hạn trên Z2FA hoạt động như thế nào?',
        a: 'Khi đồng hồ đếm ngược còn từ 5 giây trở xuống, Z2FA tự động hé lộ trước Mã kế tiếp. Đặc biệt khi còn từ 2 giây trở xuống, thao tác chạm copy sẽ tự động sao chép sẵn mã của chu kỳ 30 giây mới để bạn sang tab đăng nhập dán vào không bao giờ bị hết hạn.',
      },
    ],
    footerTagline:
      'Trình lấy mã xác thực 2 lớp (2FA / TOTP) tốc độ cao & kho lưu trữ bảo mật trực tiếp trên trình duyệt.',
    sourceLabel: 'Mã nguồn mở GitHub',
  },
  en: {
    howToBadge: 'QUICK GUIDE',
    howToTitle: 'How to generate 2FA codes safely in 3 steps',
    howToSub:
      'Fully compatible with standard RFC 6238 TOTP tokens across Google, Facebook, GitHub, Binance, Discord, Microsoft, AWS, and any two-factor service.',
    steps: [
      {
        step: '01',
        title: 'Paste Secret Keys or QR Screenshot',
        desc: 'Paste a Base32 Secret, multi-line UID|PASS|2FA strings, or otpauth:// URI — or press Ctrl+V anywhere to decode a QR screenshot instantly.',
      },
      {
        step: '02',
        title: 'Smart-Copy Live 6-Digit Tokens',
        desc: 'Tokens are computed locally via Web Crypto. Tap any card to copy; under 2 seconds remaining, Smart Copy automatically grabs the next cycle code.',
      },
      {
        step: '03',
        title: 'Save to Vault & Lock with AES-256',
        desc: 'Pin frequent accounts, organize with custom tags, export JSON backups, or encrypt your local browser vault with AES-256-GCM.',
      },
    ],
    trustPills: [
      { icon: ShieldCheck, text: '100% Zero-Knowledge Client-Side' },
      { icon: Lock, text: 'PBKDF2 + AES-256-GCM Vault' },
      { icon: QrCode, text: 'Google Authenticator QR Import' },
      { icon: Zap, text: 'Installable Offline PWA' },
    ],
    faqTitle: 'Frequently Asked Questions (2FA / TOTP)',
    faqs: [
      {
        q: 'Does Z2FA store or transmit my 2FA Secret keys to any server?',
        a: 'Never. All RFC 6238 TOTP calculations, QR image decoding, and AES-256-GCM encryption execute 100% locally inside your browser via the native Web Crypto API. Zero secrets ever leave your device.',
      },
      {
        q: 'How do I generate codes from bulk UID|PASS|2FA lines?',
        a: 'Simply paste one or multiple lines formatted as UID|PASS|2FA_SECRET|EMAIL into the Instant TOTP Studio. Z2FA automatically extracts the Base32 secret on each row and streams live 6-digit codes.',
      },
      {
        q: 'Can I scan a 2FA QR code from a screenshot without a phone?',
        a: 'Yes. Press Ctrl+V (or Cmd+V on macOS) anywhere on Z2FA right after taking a screenshot of a QR code, or drag and drop the image file — including Google Authenticator export QR codes.',
      },
      {
        q: 'Why is my 2FA code rejected as invalid on a login website?',
        a: 'TOTP codes rely on exact 30-second UTC time windows. Make sure your computer or phone has Automatic Internet Time Synchronization enabled in system settings.',
      },
      {
        q: 'How does Z2FA Smart Copy prevent expired codes?',
        a: 'When 5 seconds or fewer remain, Z2FA previews the upcoming code. If you click copy with 2 seconds or fewer left, Z2FA automatically copies the fresh next-cycle code so it never expires before you paste it.',
      },
    ],
    footerTagline:
      'High-precision client-side 2FA / TOTP generator and encrypted browser vault.',
    sourceLabel: 'Open-Source on GitHub',
  },
} as const;

export const SeoEditorialSection: React.FC<SeoEditorialSectionProps> = ({ lang }) => {
  const c = CONTENT[lang];

  return (
    <div className="mt-14 border-t border-[#ebe8e4] pt-12 sm:mt-20 sm:pt-16 dark:border-[#292623]">
      {/* How-To 3-Step Section */}
      <section aria-labelledby="z2fa-howto-heading" className="space-y-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ebe8e4] bg-[#f5f3f1] px-3 py-1 text-[11px] font-medium text-[#44403b] dark:border-[#292623] dark:bg-[#191816] dark:text-[#a59f97]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0447ff]" />
            {c.howToBadge}
          </span>
          <h2
            id="z2fa-howto-heading"
            className="font-editorial-display mt-3 text-[26px] leading-[1.15] text-[#000000] sm:text-[34px] dark:text-[#fdfcfc]"
          >
            {c.howToTitle}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#777169] sm:text-[15px] dark:text-[#a59f97]">
            {c.howToSub}
          </p>
        </div>

        {/* Security & Capability Pills */}
        <div className="flex flex-wrap gap-2">
          {c.trustPills.map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ebe8e4] bg-[#fdfcfc] px-3.5 py-1.5 text-[12px] font-medium text-[#44403b] dark:border-[#292623] dark:bg-[#191816] dark:text-[#fdfcfc]"
              >
                <Icon className="h-3.5 w-3.5 text-[#10B981]" />
                {item.text}
              </span>
            );
          })}
        </div>

        {/* 3 Bauhaus Taupe Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {c.steps.map((s) => (
            <article
              key={s.step}
              className="rounded-[20px] bg-[#f5f3f1] p-6 dark:bg-[#191816]"
            >
              <span className="font-mono-tabular inline-block rounded-full border border-[#ebe8e4] bg-[#fdfcfc] px-2.5 py-0.5 text-[11px] font-medium text-[#777169] dark:border-[#292623] dark:bg-[#11100f] dark:text-[#a59f97]">
                {s.step}
              </span>
              <h3 className="mt-3.5 text-[16px] font-medium text-[#000000] dark:text-[#fdfcfc]">
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.6] text-[#777169] dark:text-[#a59f97]">
                {s.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section (1-to-1 Match with FAQPage JSON-LD, Crawl-Friendly Native <details>) */}
      <section
        aria-labelledby="z2fa-faq-heading"
        className="mt-12 border-t border-[#ebe8e4] pt-10 sm:mt-16 sm:pt-14 dark:border-[#292623]"
      >
        <h2
          id="z2fa-faq-heading"
          className="font-editorial-display text-[26px] leading-[1.15] text-[#000000] sm:text-[34px] dark:text-[#fdfcfc]"
        >
          {c.faqTitle}
        </h2>

        <div className="mt-6 divide-y divide-[#ebe8e4] rounded-[20px] border border-[#ebe8e4] bg-[#fdfcfc] px-5 sm:px-7 dark:divide-[#292623] dark:border-[#292623] dark:bg-[#151412]">
          {c.faqs.map((item, idx) => (
            <details key={item.q} className="group py-4 sm:py-5" open={idx === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-medium text-[#000000] sm:text-[15px] dark:text-[#fdfcfc]">
                <span>{item.q}</span>
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#ebe8e4] bg-[#f5f3f1] text-[#777169] transition-transform duration-200 group-open:rotate-180 dark:border-[#292623] dark:bg-[#1f1d1b]">
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </summary>
              <p className="mt-3 pr-8 text-[13px] leading-[1.65] text-[#777169] sm:text-[14px] dark:text-[#a59f97]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Semantic Editorial Footer */}
      <footer className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#ebe8e4] pt-8 text-[12px] text-[#777169] sm:flex-row sm:items-center dark:border-[#292623] dark:text-[#a59f97]">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          <Z2FALogo size={28} />
          <span className="hidden text-[#ebe8e4] sm:inline dark:text-[#292623]">|</span>
          <p>{c.footerTagline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/zane-tv/z2fa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-[#fdfcfc] px-3.5 py-1.5 text-[12px] font-medium text-[#000000] transition-colors hover:bg-[#f5f3f1] dark:border-[#2f2c28] dark:bg-[#191816] dark:text-[#fdfcfc]"
          >
            <Github className="h-3.5 w-3.5" />
            <span>{c.sourceLabel}</span>
          </a>
          <span className="font-mono-tabular text-[11px] text-[#a59f97]">
            © {new Date().getFullYear()} z2fa.devlab.vn
          </span>
        </div>
      </footer>
    </div>
  );
};
