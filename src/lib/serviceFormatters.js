export function currency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatServicePrice(service, showPrices = true) {
  if (!service) return ''
  if (!showPrices || service.priceMode === 'sob_consulta') return 'Sob consulta'
  if (service.priceMode === 'a_partir_de') return 'A partir de ' + currency(service.price)
  return currency(service.price)
}

export function formatServiceDuration(service) {
  return service?.duration ? service.duration + ' min' : 'Duração variável'
}
