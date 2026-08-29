import { AlertCircle, CheckCircle2, KeyRound, Laptop, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

export function AccountSecurity({
  accountLoading,
  accountNotice,
  accountSessions,
  authUser,
  changeOwnPassword,
  closeOtherSessions,
  closeSelectedSessions,
  deviceName,
  forcedPasswordChange,
  formatDateTime,
  loadAccountSessions,
  minPasswordLength,
  passwordForm,
  passwordRecovery,
  session,
  setPasswordForm,
}) {
  const [selectedSessions, setSelectedSessions] = useState([])
  const selectableSessions = accountSessions.filter((item) => !item.is_current)
  const allSelected = selectableSessions.length > 0 && selectableSessions.every((item) => selectedSessions.includes(item.session_id))
  const toggleSession = (sessionId) => setSelectedSessions((current) => current.includes(sessionId) ? current.filter((id) => id !== sessionId) : [...current, sessionId])
  const toggleAllSessions = () => setSelectedSessions(allSelected ? [] : selectableSessions.map((item) => item.session_id))
  const revokeSelected = async () => {
    const revoked = await closeSelectedSessions(selectedSessions)
    if (revoked) setSelectedSessions([])
  }
  const roleLabel = session.isMasterAdmin
    ? 'Admin master'
    : session.isRepresentative
      ? 'Representante'
    : session.role === 'admin'
      ? 'Administrador'
      : session.role === 'prestador'
        ? 'Prestador'
        : 'Cliente'

  return (
    <section className="accountWorkspace">
      {accountNotice.text && <div className={`accountNotice ${accountNotice.type}`} role="status">{accountNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{accountNotice.text}</div>}
      <div className="panel accountProfile">
        <div className="panelHeader compact">
          <div><p className="eyebrow">Acesso</p><h2>{authUser.email}</h2></div>
          <ShieldCheck size={22} />
        </div>
        <div className="accountMetadata">
          <span><strong>Perfil</strong>{roleLabel}</span>
          <span><strong>Último acesso</strong>{formatDateTime(authUser.last_sign_in_at)}</span>
        </div>
      </div>
      <form className="panel form passwordPanel" onSubmit={changeOwnPassword}>
        <div className="panelHeader compact">
          <div><p className="eyebrow">Credencial</p><h2>Alterar senha</h2></div>
          <KeyRound size={22} />
        </div>
        {passwordRecovery && <p className="privacyHint">Defina uma nova senha para concluir a recuperação da conta.</p>}
        {forcedPasswordChange && !passwordRecovery && <p className="privacyHint">Este acesso foi criado por um administrador. Defina uma nova senha para continuar.</p>}
        {!passwordRecovery && !forcedPasswordChange && <label>Senha atual
          <input type="password" autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} required />
        </label>}
        <div className="inlineFields">
          <label>Nova senha
            <input type="password" autoComplete="new-password" minLength={minPasswordLength} value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} required />
          </label>
          <label>Confirmar nova senha
            <input type="password" autoComplete="new-password" minLength={minPasswordLength} value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} required />
          </label>
        </div>
        <small className="fieldCaption">Mínimo de {minPasswordLength} caracteres.</small>
        <button type="submit" className="primary accountPrimary">Atualizar senha</button>
      </form>
      <div className="panel sessionsPanel">
        <div className="panelHeader compact">
          <div><p className="eyebrow">Segurança</p><h2>Dispositivos conectados</h2></div>
          <Laptop size={22} />
        </div>
        <div className="sessionList">
          {!accountLoading && selectableSessions.length > 1 && <label className="sessionSelectAll">
            <input type="checkbox" checked={allSelected} onChange={toggleAllSessions} /> Selecionar outros dispositivos
          </label>}
          {accountLoading && <span className="emptyText">Consultando sessões...</span>}
          {!accountLoading && accountSessions.map((item) => (
            <article className="sessionRow" key={item.session_id}>
              <div className="sessionSelection">
                {!item.is_current && <input type="checkbox" checked={selectedSessions.includes(item.session_id)} onChange={() => toggleSession(item.session_id)} aria-label={`Selecionar ${deviceName(item.user_agent)}`} />}
              </div>
              <div className="sessionIcon"><Laptop size={19} /></div>
              <div><strong>{deviceName(item.user_agent)}</strong><span>{item.ip_address || 'IP não informado'} • Atividade em {formatDateTime(item.last_seen_at)}</span></div>
              {item.is_current && <small>Sessão atual</small>}
            </article>
          ))}
          {!accountLoading && accountSessions.length === 0 && <span className="emptyText">Nenhuma sessão ativa encontrada.</span>}
        </div>
        <div className="sessionActions">
          <button type="button" className="secondaryAction" onClick={loadAccountSessions} disabled={accountLoading}>Atualizar lista</button>
          <button type="button" className="dangerAction" onClick={revokeSelected} disabled={accountLoading || selectedSessions.length === 0}>Encerrar selecionadas</button>
          <button type="button" className="dangerAction" onClick={closeOtherSessions} disabled={accountLoading || accountSessions.length <= 1}>Encerrar outras sessões</button>
        </div>
      </div>
    </section>
  )
}
