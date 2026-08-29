import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: isMaster } = await userClient.rpc('is_master_admin')

    if (!isMaster) return json({ error: 'Apenas o Admin master pode enviar este convite.' }, 403)

    const { data: settings, error: settingsError } = await adminClient
      .from('platform_settings')
      .select('invite_email_enabled, invite_sender_name, invite_sender_email, invite_reply_to_email')
      .eq('id', 1)
      .single()
    if (settingsError) throw settingsError

    const configured = Boolean(resendKey && settings.invite_sender_email)
    const payload = await request.json()
    if (payload.action === 'status') return json({ configured, enabled: settings.invite_email_enabled })
    if (!configured || !settings.invite_email_enabled) return json({ error: 'Envio automático ainda não está conectado.' }, 409)

    const { email, inviteUrl } = payload
    if (!email || !inviteUrl) return json({ error: 'Dados do convite incompletos.' }, 400)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${settings.invite_sender_name} <${settings.invite_sender_email}>`,
        to: [email],
        reply_to: settings.invite_reply_to_email || settings.invite_sender_email,
        subject: 'Convite para representar prestadores no Meu Serviço Online',
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>Você recebeu um convite</h2><p>Crie seu acesso de representante para gerenciar os prestadores vinculados à sua carteira.</p><p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">Aceitar convite</a></p><p style="font-size:12px;color:#64748b">Se você não esperava este convite, ignore esta mensagem.</p></div>`,
      }),
    })
    const result = await response.json()
    if (!response.ok) return json({ error: result.message || 'Falha no envio do e-mail.' }, response.status)
    return json({ sent: true, id: result.id })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno.' }, 500)
  }
})

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
