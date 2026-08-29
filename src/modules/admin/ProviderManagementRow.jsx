import { Check, ChevronRight, KeyRound, Link2, UserRoundCheck, X } from 'lucide-react'
import { useState } from 'react'

export function ProviderManagementRow({
  isMasterAdmin,
  linkOwner,
  onApprove,
  onOpen,
  onProvisionOwner,
  onToggle,
  onTransfer,
  provider,
  representatives,
}) {
  const [linking, setLinking] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [provisionResult, setProvisionResult] = useState(null)
  const [transferTarget, setTransferTarget] = useState(provider.representativeUserId || '')
  const [pendingAction, setPendingAction] = useState('')
  const transferChanged = transferTarget !== (provider.representativeUserId || '')

  const submitOwner = async (event) => {
    event.preventDefault()
    if (pendingAction) return
    setPendingAction('link')
    try {
      const linked = await linkOwner(provider.id, event.currentTarget.elements.ownerEmail.value)
      if (linked) setLinking(false)
    } finally {
      setPendingAction('')
    }
  }

  const submitProvision = async (event) => {
    event.preventDefault()
    if (pendingAction) return
    setPendingAction('provision')
    try {
      const result = await onProvisionOwner(provider.id, event.currentTarget.elements.provisionEmail.value)
      if (result?.tempPassword) {
        setProvisionResult(result)
        setProvisioning(false)
      }
    } finally {
      setPendingAction('')
    }
  }

  const runStatusAction = async () => {
    if (pendingAction) return
    setPendingAction('status')
    try {
      if (provider.approvalStatus === 'analise') await onApprove(provider.id)
      else await onToggle(provider.id)
    } finally {
      setPendingAction('')
    }
  }

  const applyTransfer = async () => {
    if (pendingAction) return
    setPendingAction('transfer')
    try {
      await onTransfer(provider.id, transferTarget)
    } finally {
      setPendingAction('')
    }
  }

  return (
    <article className={`providerManagementRow${isMasterAdmin ? '' : ' representativeView'}`}>
      <div className="providerManagementIdentity">
        <strong>{provider.name}</strong>
        <span>{provider.owner} · {provider.category} · {provider.city}</span>
      </div>

      <div className="providerManagementStatus">
        <span className="fieldCaption">Status</span>
        {provider.approvalStatus === 'analise' ? (
          <button type="button" className="toggle review" disabled={Boolean(pendingAction)} onClick={runStatusAction}>{pendingAction === 'status' ? 'Salvando' : 'Aprovar'}</button>
        ) : (
          <button type="button" className={provider.active ? 'toggle on' : 'toggle'} aria-pressed={provider.active} disabled={Boolean(pendingAction)} onClick={runStatusAction}>
            {pendingAction === 'status' ? 'Salvando' : provider.active ? 'Ativo' : 'Pausado'}
          </button>
        )}
      </div>

      <div className="providerManagementAccount">
        <span className="fieldCaption">Conta de acesso</span>
        {provider.ownerUserId ? (
          <span className="ownerLinked"><UserRoundCheck size={15} /> Vinculada</span>
        ) : linking ? (
          <form className="providerAccountLink" onSubmit={submitOwner}>
            <label className="srOnly" htmlFor={`owner-${provider.id}`}>E-mail da conta do prestador</label>
            <input id={`owner-${provider.id}`} name="ownerEmail" type="email" placeholder="E-mail da conta" autoFocus required />
            <button type="submit" className="iconConfirm" disabled={Boolean(pendingAction)} title="Confirmar vínculo" aria-label="Confirmar vínculo"><Check size={17} /></button>
            <button type="button" className="iconCancel" disabled={Boolean(pendingAction)} title="Cancelar" aria-label="Cancelar vínculo" onClick={() => setLinking(false)}><X size={17} /></button>
          </form>
        ) : provisioning ? (
          <form className="providerAccountLink" onSubmit={submitProvision}>
            <label className="srOnly" htmlFor={`provision-${provider.id}`}>E-mail para criar acesso do prestador</label>
            <input id={`provision-${provider.id}`} name="provisionEmail" type="email" placeholder="E-mail do prestador" autoFocus required />
            <button type="submit" className="iconConfirm" disabled={Boolean(pendingAction)} title="Criar acesso" aria-label="Criar acesso"><Check size={17} /></button>
            <button type="button" className="iconCancel" disabled={Boolean(pendingAction)} title="Cancelar" aria-label="Cancelar" onClick={() => setProvisioning(false)}><X size={17} /></button>
          </form>
        ) : (
          <div className="shareActions">
            <button type="button" className="accountLinkTrigger" onClick={() => setLinking(true)}><Link2 size={16} /> Vincular conta</button>
            <button type="button" className="accountLinkTrigger" onClick={() => setProvisioning(true)}><KeyRound size={16} /> Criar acesso</button>
          </div>
        )}
        {provisionResult && <div className="requestRow" role="status">
          <div><strong>{provisionResult.email}</strong><span>Senha temporária: <code>{provisionResult.tempPassword}</code></span></div>
          <div className="shareActions">
            <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(provisionResult.tempPassword)}>Copiar</button>
            <button type="button" className="secondaryAction" onClick={() => setProvisionResult(null)}>Fechar</button>
          </div>
        </div>}
      </div>

      {isMasterAdmin && <div className="providerManagementRepresentative">
        <label className="fieldCaption" htmlFor={`representative-${provider.id}`}>Responsável</label>
        <div className="representativeTransferControl">
          <select id={`representative-${provider.id}`} value={transferTarget} disabled={Boolean(pendingAction)} onChange={(event) => setTransferTarget(event.target.value)}>
            <option value="">Admin master</option>
            {representatives.filter((representative) => representative.status === 'ativo').map((representative) => (
              <option key={representative.user_id} value={representative.user_id}>{representative.email}</option>
            ))}
          </select>
          {transferChanged && <button type="button" disabled={Boolean(pendingAction)} onClick={applyTransfer}>{pendingAction === 'transfer' ? 'Salvando' : 'Aplicar'}</button>}
        </div>
      </div>}

      <button type="button" className="openProviderAction" disabled={Boolean(pendingAction)} onClick={() => onOpen(provider.id)} title={`Abrir painel de ${provider.name}`}>
        <span>Abrir painel</span><ChevronRight size={17} />
      </button>
    </article>
  )
}
