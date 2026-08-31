import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PASSWORD_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function generateTempPassword(length = 12) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => PASSWORD_CHARSET[byte % PASSWORD_CHARSET.length]).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: isMaster } = await userClient.rpc('is_master_admin')

    if (!isMaster) return json({ error: 'Apenas o Admin master pode definir senhas de acesso.' }, 403)

    const payload = await request.json()
    const email = String(payload.email || '').trim().toLowerCase()
    const userId = payload.userId ? String(payload.userId) : null
    const inviteToken = payload.inviteToken ? String(payload.inviteToken) : null
    if (!email || !email.includes('@')) return json({ error: 'Informe um e-mail válido.' }, 400)

    const requestedLength = Number(payload.passwordLength) || 12
    const passwordLength = Math.min(64, Math.max(12, requestedLength))
    const tempPassword = generateTempPassword(passwordLength)

    let targetUser = null
    if (userId) {
      const { data: userResult, error: userError } = await adminClient.auth.admin.getUserById(userId)
      if (userError) throw userError
      targetUser = userResult.user
      if (!targetUser || targetUser.email?.toLowerCase() !== email) {
        return json({ error: 'A conta informada nao corresponde ao representante selecionado.' }, 400)
      }
    } else {
      for (let page = 1; page <= 20 && !targetUser; page += 1) {
        const { data: pageResult, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })
        if (listError) throw listError
        targetUser = pageResult.users.find((user) => user.email?.toLowerCase() === email) || null
        if (pageResult.users.length < 200) break
      }
    }

    let resultUser
    let created = false
    if (targetUser) {
      const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
        password: tempPassword,
        user_metadata: { ...targetUser.user_metadata, must_change_password: true },
      })
      if (updateError) throw updateError
      resultUser = updated.user
    } else {
      const { data: createdData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { must_change_password: true },
      })
      if (createError) throw createError
      resultUser = createdData.user
      created = true
    }

    let inviteFinalized = false
    let inviteError: string | null = null
    if (inviteToken) {
      const { data: invite, error: inviteLookupError } = await adminClient
        .from('representative_invites')
        .select('*')
        .eq('token', inviteToken)
        .eq('status', 'ativo')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      if (inviteLookupError) throw inviteLookupError
      if (!invite || invite.invited_email.toLowerCase() !== email) {
        inviteError = 'Convite inválido, expirado ou de outro e-mail.'
      } else {
        const { error: upsertError } = await adminClient
          .from('platform_representatives')
          .upsert(
            { user_id: resultUser.id, email, invited_by: invite.created_by, status: 'ativo', updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
          )
        if (upsertError) throw upsertError
        const { error: markUsedError } = await adminClient
          .from('representative_invites')
          .update({ status: 'usado', accepted_by: resultUser.id, accepted_at: new Date().toISOString() })
          .eq('id', invite.id)
        if (markUsedError) throw markUsedError
        inviteFinalized = true
      }
    }

    return json({ success: true, email, tempPassword, created, inviteFinalized, inviteError, userId: resultUser.id })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno.' }, 500)
  }
})

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
