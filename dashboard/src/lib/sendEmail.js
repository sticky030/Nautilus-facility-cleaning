const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('VITE_RESEND_API_KEY nicht gesetzt, E-Mail wird nicht gesendet.')
    return
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nautilus Facility Cleaning <benachrichtigung@nautilus-facility.de>',
        to,
        subject,
        html,
      }),
    })
  } catch (err) {
    console.error('E-Mail Fehler:', err)
  }
}
