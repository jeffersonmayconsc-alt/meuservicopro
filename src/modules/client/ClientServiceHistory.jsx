import { CalendarClock, CheckCircle2, Clock3, RotateCcw, Store } from 'lucide-react'

const STATUS_LABELS = {
  cancelado: 'Cancelado',
  concluido: 'Concluído',
  confirmado: 'Confirmado',
  pendente: 'Aguardando confirmação',
}

export function ClientServiceHistory({ entries, formatDate, onRebook, providerId }) {
  const visibleEntries = providerId ? entries.filter((entry) => entry.provider.id === providerId) : entries
  if (visibleEntries.length === 0) return null

  return (
    <section className="panel clientHistory" aria-labelledby="client-history-title">
      <div className="panelHeader compact">
        <div><p className="eyebrow">Seu histórico</p><h2 id="client-history-title">Agende novamente</h2></div>
        <CalendarClock size={22} />
      </div>
      <p className="clientHistoryIntro">Seus últimos pedidos ficam à mão para repetir o serviço sem procurar tudo de novo.</p>
      <div className="clientHistoryList">
        {visibleEntries.map((entry) => (
          <article className="clientHistoryItem" key={entry.provider.id}>
            <div className="clientHistoryProvider">
              <span className="clientHistoryLogo">{entry.provider.logoUrl ? <img src={entry.provider.logoUrl} alt="" /> : <Store size={19} />}</span>
              <div><strong>{entry.provider.name}</strong><span>{entry.service.name}</span></div>
            </div>
            <div className="clientHistoryDate">
              <span><Clock3 size={15} /> Última solicitação</span>
              <strong>{formatDate(entry.booking.date)} às {entry.booking.time}</strong>
              <small className={`bookingStatus ${entry.booking.status}`}>
                {entry.booking.status === 'concluido' && <CheckCircle2 size={13} />}
                {STATUS_LABELS[entry.booking.status] || entry.booking.status}
              </small>
            </div>
            <button type="button" className="rebookAction" onClick={() => onRebook(entry)}>
              <RotateCcw size={17} /> Agendar novamente
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
