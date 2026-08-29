import { CalendarCheck, CheckCircle2, Copy, Mail, Store, UserRoundCheck } from 'lucide-react'
import { Stat } from '../../components/Stat'
import { ProviderManagementRow } from '../admin/ProviderManagementRow'

export function RepresentativePreview({
  bookings, inviteForm, inviteNotice, invites, isMasterPreview, linkOwner, onApprove,
  onCreateInvite, onOpenProvider, onSelectRepresentative, onToggle, providerClients,
  providers, representativeId, representatives, setInviteForm, tab,
}) {
  const activeRepresentatives = representatives.filter((item) => item.status === 'ativo')
  const representative = activeRepresentatives.find((item) => item.user_id === representativeId)
  const providerIds = new Set(providers.map((item) => item.id))
  const scopedBookings = bookings.filter((item) => providerIds.has(item.providerId))
  const scopedClients = new Set(providerClients.filter((item) => providerIds.has(item.providerId)).map((item) => item.clientId))
  const activeInvites = invites.filter((item) => item.status === 'ativo')
  const hasContext = isMasterPreview ? Boolean(representative) : true

  return (
    <section className="representativeWorkspace">
      {isMasterPreview && <div className="panel representativeContextPanel">
        <div className="panelHeader compact"><div><p className="eyebrow">Escopo delegado</p><h2>Visualização do representante</h2></div><UserRoundCheck size={22} /></div>
        <label className="representativeSelector">Representante
          <select value={representativeId} onChange={(event) => onSelectRepresentative(event.target.value)}>
            <option value="">Selecione um representante</option>
            {activeRepresentatives.map((item) => <option key={item.user_id} value={item.user_id}>{item.email}</option>)}
          </select>
        </label>
      </div>}

      {hasContext ? <>
        {tab === 'visao-geral' && <>
          <div className="metricGrid representativeMetrics">
            <Stat label="Prestadores" value={providers.length} icon={<Store />} />
            <Stat label="Ativos" value={providers.filter((item) => item.active).length} icon={<CheckCircle2 />} />
            <Stat label="Agendamentos" value={scopedBookings.length} icon={<CalendarCheck />} />
            <Stat label="Clientes atendidos" value={scopedClients.size} icon={<UserRoundCheck />} />
          </div>
          <div className="panel representativeSummaryPanel">
            <div className="panelHeader compact"><div><p className="eyebrow">Ações necessárias</p><h2>Resumo da carteira</h2></div><Store size={22} /></div>
            <div className="representativeSummaryList">
              <span><strong>{providers.filter((item) => item.approvalStatus === 'analise').length}</strong> aguardando aprovação</span>
              <span><strong>{providers.filter((item) => !item.active).length}</strong> prestadores pausados</span>
              <span><strong>{activeInvites.length}</strong> convites pendentes</span>
            </div>
          </div>
        </>}

        {tab === 'carteira' && <div className="panel representativeProvidersPanel">
          <div className="panelHeader compact"><div><p className="eyebrow">Gestão delegada</p><h2>Prestadores sob responsabilidade</h2></div><Store size={22} /></div>
          <div className="providerRows">
            {providers.map((provider) => <ProviderManagementRow key={provider.id} isMasterAdmin={false} linkOwner={linkOwner} onApprove={onApprove} onOpen={onOpenProvider} onToggle={onToggle} onTransfer={() => false} provider={provider} representatives={[]} />)}
            {providers.length === 0 && <span className="emptyState">Nenhum prestador vinculado a esta carteira.</span>}
          </div>
        </div>}

        {tab === 'convites' && <div className="panel representativeInvitePanel">
          <div className="panelHeader compact"><div><p className="eyebrow">Expansão da carteira</p><h2>Convidar prestador</h2></div><Mail size={22} /></div>
          {!isMasterPreview && <form className="shareBox" onSubmit={onCreateInvite}>
            <div><strong>Novo convite</strong><input type="email" required placeholder="email@prestador.com.br" value={inviteForm.email} onChange={(event) => setInviteForm({ email: event.target.value })} />{inviteNotice && <span>{inviteNotice}</span>}</div>
            <div className="shareActions"><button type="submit">Gerar link</button>{inviteNotice.startsWith('http') && <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(inviteNotice)}><Copy size={16} /> Copiar</button>}</div>
          </form>}
          {isMasterPreview && <p className="representativePreviewNotice">O Admin master consulta os convites aqui. O representante cria convites vinculados ao acessar a própria conta.</p>}
          <div className="representativeInviteList">
            {invites.map((invite) => <article key={invite.id}><div><strong>{invite.invitedEmail}</strong><span>{invite.status === 'ativo' ? 'Aguardando cadastro' : 'Convite utilizado'}</span></div><span>{invite.status}</span></article>)}
            {invites.length === 0 && <span className="emptyState">Nenhum convite criado por este representante.</span>}
          </div>
        </div>}
      </> : <div className="panel representativeEmptyState"><UserRoundCheck size={24} /><div><strong>Selecione um representante</strong><span>A carteira e as ações delegadas aparecerão aqui.</span></div></div>}
    </section>
  )
}
