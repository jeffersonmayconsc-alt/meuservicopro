export function currency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatServicePrice(service, showPrices = true) {
  if (!service) return ''
  if (!showPrices || service.priceMode === 'sob_consulta') return 'Sob consulta'
  if (service.priceMode === 'a_partir_de') return 'A partir de ' + currency(service.price)
  return currency(service.price)
}

// A etiqueta aparece em caixa alta ao lado de "50 MIN": "DURAÇÃO VARIÁVEL"
// ficava com o dobro da largura e desequilibrava a linha de cards.
export function formatServiceDuration(service) {
  return service?.duration ? service.duration + ' min' : 'A combinar'
}
