// 邮件发送 — QQ SMTP (smtp.qq.com:465 SSL)
// 必填环境变量:
//   SMTP_USER  — 你的 QQ 邮箱地址 (例如 12345@qq.com)
//   SMTP_PASS  — QQ 邮箱授权码 (不是 QQ 密码! 在 QQ 邮箱 → 设置 → 账户 → 开启 SMTP 服务时拿到的 16 位)
//   SMTP_FROM  — 发件人显示名 (可选,默认 "砚 Inkwell <SMTP_USER>")
const nodemailer = require('nodemailer');

let cachedTransporter = null;

const isConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
};

const sendVerificationCode = async (email, code) => {
  const subject = `【砚 Inkwell】您的验证码:${code}`;
  const html = `
    <div style="font-family: -apple-system, 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fdfbf6; border-radius: 12px;">
      <div style="font-size: 22px; color: #2a2622; margin-bottom: 8px;">砚 Inkwell</div>
      <div style="color: #6b6b6b; font-size: 14px; margin-bottom: 24px;">A quiet place for slow writing.</div>
      <div style="background: #fff; border: 1px solid #e8e2d6; border-radius: 8px; padding: 24px; text-align: center;">
        <div style="color: #6b6b6b; font-size: 13px; margin-bottom: 12px;">您的注册验证码</div>
        <div style="font-size: 36px; letter-spacing: 8px; color: #c5704a; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">${code}</div>
        <div style="color: #999; font-size: 12px; margin-top: 16px;">10 分钟内有效,请勿向他人透露。</div>
      </div>
      <div style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">如果不是您本人操作,请忽略此邮件。</div>
    </div>
  `;
  const text = `您的砚 Inkwell 注册验证码是: ${code}\n\n该验证码 10 分钟内有效,请勿向他人透露。\n如果不是您本人操作,请忽略此邮件。`;

  const from = process.env.SMTP_FROM || `"砚 Inkwell" <${process.env.SMTP_USER}>`;

  const transporter = getTransporter();
  if (!transporter) {
    // 开发模式 fallback:打到日志,方便本地调试
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[DEV] SMTP 未配置,验证码发往 ${email}: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { dev: true };
  }

  const info = await transporter.sendMail({ from, to: email, subject, text, html });
  return { messageId: info.messageId };
};

module.exports = { sendVerificationCode, isConfigured };
