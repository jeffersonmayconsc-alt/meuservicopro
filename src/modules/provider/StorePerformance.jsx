import { CalendarCheck, Eye, TrendingUp, Users } from 'lucide-react'
import { Stat } from '../../components/Stat'

const percentage = (value) => value.toFixed(1).replace('.', ',')

export function StorePerformance({ analyticsDays, bookingStarts, funnelConversion, generatedBookings, providerServiceAnalytics, serviceViews, setAnalyticsDays, startConversion, uniqueVisitors }) {
  return (
    <div className="providerSection analyticsSection">
      <div className="sectionTools analyticsHeader">
        <div>
          <h3>Desempenho da loja</h3>
          <span className="sectionSub">Acompanhe como visitantes se transformam em agendamentos.</span>
        </div>
        <label className="compactSelect">Período
          <select value={analyticsDays} onChange={(event) => setAnalyticsDays(Number(event.target.value))}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </label>
      </div>
      <div className="metricGrid analyticsMetrics">
        <Stat label="Visualizações" value={serviceViews} icon={<Eye />} />
        <Stat label="Inícios de agendamento" value={bookingStarts} icon={<TrendingUp />} />
        <Stat label="Agendamentos gerados" value={generatedBookings} icon={<CalendarCheck />} />
        <Stat label="Visitantes únicos" value={uniqueVisitors} icon={<Users />} />
      </div>
      <div className="funnelPanel">
        <div className="funnelHeader">
          <div><h3>Do primeiro clique até o agendamento</h3><span className="sectionSub">Quantas pessoas avançam em cada etapa, da visualização até o pedido confirmado.</span></div>
          <strong>{percentage(funnelConversion)}% <small>completaram o pedido</small></strong>
        </div>
        <div className="funnelRows">
          <div><span>Visualizaram um serviço</span><div><i style={{ width: serviceViews ? '100%' : '0%' }} /></div><strong>{serviceViews}</strong></div>
          <div><span>Iniciaram o agendamento</span><div><i style={{ width: `${serviceViews ? Math.min(100, (bookingStarts / serviceViews) * 100) : 0}%` }} /></div><strong>{bookingStarts}</strong></div>
          <div><span>Concluíram o pedido</span><div><i style={{ width: `${serviceViews ? Math.min(100, (generatedBookings / serviceViews) * 100) : 0}%` }} /></div><strong>{generatedBookings}</strong></div>
        </div>
        <p className="funnelHint">{bookingStarts ? `${percentage(startConversion)}% de quem iniciou chegou ao fim.` : 'Os dados aparecerão conforme os clientes usarem seu link.'}</p>
      </div>
      <div className="servicePerformance">
        <div><h3>Desempenho por serviço</h3><span className="sectionSub">Compare interesse e conversão da sua oferta.</span></div>
        <div className="performanceTable">
          <div className="performanceHead"><span>Serviço</span><span>Visualizações</span><span>Inícios</span><span>Agendamentos</span><span>Taxa de conclusão</span></div>
          {providerServiceAnalytics.map((service) => (
            <div className="performanceRow" key={service.id}>
              <strong>{service.name}</strong><span>{service.views}</span><span>{service.starts}</span><span>{service.bookings}</span><span>{percentage(service.conversion)}%</span>
            </div>
          ))}
          {providerServiceAnalytics.length === 0 && <span className="emptyState">Cadastre um serviço para começar a acompanhar.</span>}
        </div>
      </div>
    </div>
  )
}
