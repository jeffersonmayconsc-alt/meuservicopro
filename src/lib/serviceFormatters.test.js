import { describe, expect, it } from 'vitest'
import { formatServiceDuration, formatServicePrice } from './serviceFormatters'

describe('service formatters', () => {
  it('formats hidden and consultation prices', () => {
    expect(formatServicePrice({ price: 120, priceMode: 'fixo' }, false)).toBe('Sob consulta')
    expect(formatServicePrice({ price: 0, priceMode: 'sob_consulta' })).toBe('Sob consulta')
  })

  it('formats fixed and starting prices', () => {
    expect(formatServicePrice({ price: 120, priceMode: 'fixo' })).toContain('120')
    expect(formatServicePrice({ price: 80, priceMode: 'a_partir_de' })).toContain('A partir de')
  })

  it('formats variable duration', () => {
    expect(formatServiceDuration({ duration: null })).toBe('Duração variável')
    expect(formatServiceDuration({ duration: 50 })).toBe('50 min')
  })
})
