import nodemailer from 'nodemailer'

// Sends OTP to user's email. Falls back to console log if SMTP is not configured.
export async function sendRideOtpEmail({ to, otp, rideId, pickup, destination }) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 0)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.MAIL_FROM || user

  const subject = `Your ride OTP: ${otp}`
  const text = `Your OTP to start the ride is ${otp} (Ride ID: ${rideId}). Share it only with your captain when you board.\nPickup: ${pickup}\nDrop: ${destination}`

  // If SMTP not configured, log and return gracefully
  if (!host || !port || !user || !pass || !from) {
    console.log('[Notifier] SMTP not configured. OTP:', { to, otp, rideId })
    return { queued: false, reason: 'smtp_not_configured' }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })

  await transporter.sendMail({ from, to, subject, text })
  return { queued: true }
}
