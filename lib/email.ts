import axios from 'axios'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const SENDER_EMAIL = 'no-reply@ignohub.com'
const SENDER_NAME = 'IgnoHub'

const brevo = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json'
  }
})

export async function sendEmail({
  to,
  subject,
  htmlContent
}: {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
}) {
  try {
    const response = await brevo.post('/smtp/email', {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to,
      subject,
      htmlContent
    })
    return response.data
  } catch (error: unknown) {
    const err = error as { response?: { data: unknown }; message: string };
    console.error('[Brevo] Error sending email:', err.response?.data || err.message)
    throw error
  }
}

export async function sendTrialStartedEmail(email: string, name: string) {
  return sendEmail({
    to: [{ email, name }],
    subject: 'Bem-vindo ao IgnoHub! Seu Trial Começou 🚀',
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #3337f5;">Olá, ${name}!</h1>
        <p>Estamos muito felizes em ter você no <strong>IgnoHub</strong>.</p>
        <p>Seu período de trial de 7 dias foi ativado com sucesso. Você agora tem acesso total às nossas análises de sentimento e resumos automáticos.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background-color: #3337f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Explorar Dashboard</a>
        </div>
        <p style="color: #666; font-size: 14px;">Se precisar de qualquer ajuda, basta responder a este e-mail.</p>
      </div>
    `
  })
}

export async function sendTrialExpiringSoonEmail(email: string, name: string) {
  return sendEmail({
    to: [{ email, name }],
    subject: 'Atenção: Seu trial do IgnoHub expira amanhã! ⏳',
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #3337f5;">Olá, ${name}!</h1>
        <p>O seu período de trial no <strong>IgnoHub</strong> está chegando ao fim.</p>
        <p>Para não perder o acesso às suas análises e manter o monitoramento dos seus grupos, adicione uma forma de pagamento agora.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/billing" style="background-color: #3337f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ativar Assinatura</a>
        </div>
      </div>
    `
  })
}

export async function sendHighSeverityAlertEmail(email: string, name: string, alertTitle: string, groupName: string) {
  return sendEmail({
    to: [{ email, name }],
    subject: `🚨 ALERTA CRÍTICO: ${alertTitle} em ${groupName}`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 10px;">
        <h1 style="color: #ef4444;">Alerta de Alta Severidade</h1>
        <p>Olá, <strong>${name}</strong>,</p>
        <p>A Inteligência do IgnoHub detectou um evento crítico no grupo <strong>${groupName}</strong>:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #991b1b; font-size: 18px;">${alertTitle}</h2>
          <p style="margin-bottom: 0; color: #7f1d1d;">Este evento requer sua atenção imediata para garantir a segurança e integridade da sua comunidade.</p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/inbox" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver no IgnoHub</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">Este é um e-mail automático do sistema de monitoramento IgnoHub Sentinel.</p>
      </div>
    `
  })
}
