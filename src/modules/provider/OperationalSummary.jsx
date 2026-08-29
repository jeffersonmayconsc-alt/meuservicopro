import { AlertCircle, CheckCircle2, Clock3, Store } from 'lucide-react'
import { Stat } from '../../components/Stat'

export function OperationalSummary({ clientsWithoutReturn, completedBookings, currency, providerConsultationBookings, providerRevenue }) {
  return (
    <div className="providerSection">
      <div className="sectionTools">
        <div>
          <h3>Resumo operacional</h3>
          <span className="sectionSub">Indicadores da agenda, receita e relacionamento com clientes.</span>
        </div>
      </div>
      <div className="metricGrid operationalMetrics">
        <Stat label="Receita estimada" value={currency(providerRevenue)} icon={<Store />} />
        <Stat label="Sob consulta" value={providerConsultationBookings} icon={<AlertCircle />} />
        <Stat label="Atendimentos concluídos" value={completedBookings} icon={<CheckCircle2 />} />
        <Stat label="Clientes sem retorno" value={clientsWithoutReturn} icon={<Clock3 />} />
      </div>
    </div>
  )
}
