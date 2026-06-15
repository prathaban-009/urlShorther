const nodemailer = require('nodemailer');

// Set up transporter (it will be null if credentials aren't provided)
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an OTP email to the user for registration verification.
 * @param {string} toEmail - The recipient's email address
 * @param {string} otp - The 6-digit OTP code
 */
async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"LinkZap" <${process.env.SMTP_USER || 'noreply@linkzap.com'}>`,
    to: toEmail,
    subject: 'Your LinkZap Verification Code',
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f7; padding: 40px 20px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #7c3aed, #06b6d4); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
             <span style="color: white; font-size: 24px; font-weight: bold;">⚡</span>
          </div>
          <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">Verify Your Email</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Welcome to LinkZap! To complete your registration, please enter the following 6-digit verification code:
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="font-size: 36px; letter-spacing: 6px; color: #7c3aed; margin: 0;">${otp}</h2>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #94a3b8; font-size: 12px;">
              Built & designed with ♥ by Yashiladevi &middot; <a href="mailto:yashiladevi09@gmail.com" style="color: #7c3aed; text-decoration: none;">yashiladevi09@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ OTP Email sent successfully to ${toEmail}`);
    } catch (error) {
      console.error(`❌ Error sending OTP email to ${toEmail}:`, error.message);
      // We don't throw here to allow fallback to console logging if SMTP is misconfigured during dev
      console.log(`⚠️ DEVELOPMENT MODE: Your OTP for ${toEmail} is: ${otp}`);
    }
  } else {
    // Development fallback
    console.log('\n---------------------------------------------------------');
    console.log('✉️  EMAIL SIMULATION (SMTP not fully configured)');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Your LinkZap Verification Code`);
    console.log(`OTP: ${otp}`);
    console.log('---------------------------------------------------------\n');
  }
}

module.exports = {
  sendOtpEmail,
};
