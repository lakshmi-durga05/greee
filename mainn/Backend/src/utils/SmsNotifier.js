import twilio from 'twilio'

export async function sendRideOtpSms({ to, otp, rideId, pickup, destination }) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM
  const text = `OTP ${otp} for ride ${rideId}. Pickup: ${pickup}. Drop: ${destination}. Share only with your captain.`

  if (!sid || !token || !from || !to) {
    console.log('[SmsNotifier] SMS not sent. Missing configuration or recipient.', { to, hasSid: !!sid, hasFrom: !!from })
    return { queued: false, reason: 'sms_not_configured' }
  }
  const client = twilio(sid, token)
  await client.messages.create({ to, from, body: text })
  return { queued: true }
}
