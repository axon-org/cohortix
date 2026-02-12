import { describe, it, expect } from 'vitest'
import { cn, formatNumber, formatCurrency, formatPercentage } from '../utils'

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('should merge tailwind classes with conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatNumber', () => {
  it('should format numbers under 1000 as-is', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(999)).toBe('999')
  })

  it('should format thousands with "k" suffix', () => {
    expect(formatNumber(1000)).toBe('1.0k')
    expect(formatNumber(1500)).toBe('1.5k')
    expect(formatNumber(42000)).toBe('42.0k')
    expect(formatNumber(999999)).toBe('1000.0k')
  })

  it('should format millions with "M" suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
    expect(formatNumber(1500000)).toBe('1.5M')
    expect(formatNumber(42000000)).toBe('42.0M')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1.0k')
    expect(formatNumber(-1000000)).toBe('-1.0M')
  })
})

describe('formatCurrency', () => {
  it('should format currency with dollar sign', () => {
    expect(formatCurrency(42)).toBe('$42')
    expect(formatCurrency(1000)).toBe('$1,000')
  })

  it('should format with decimals for fractional amounts', () => {
    expect(formatCurrency(42.5)).toBe('$42.5')
    expect(formatCurrency(1234.56)).toBe('$1,234.6')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('should handle negative amounts', () => {
    expect(formatCurrency(-100)).toBe('-$100')
  })

  it('should handle large amounts', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000')
  })
})

describe('formatPercentage', () => {
  it('should format percentage with one decimal', () => {
    expect(formatPercentage(42)).toBe('42.0%')
    expect(formatPercentage(99.5)).toBe('99.5%')
  })

  it('should handle zero', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('should handle negative percentages', () => {
    expect(formatPercentage(-5.5)).toBe('-5.5%')
  })

  it('should round to one decimal place', () => {
    expect(formatPercentage(42.456)).toBe('42.5%')
    expect(formatPercentage(42.444)).toBe('42.4%')
  })

  it('should handle very small percentages', () => {
    expect(formatPercentage(0.1)).toBe('0.1%')
  })
})
