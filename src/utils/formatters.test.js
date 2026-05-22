import { formatDate, formatDateTime, formatNumber } from './formatters';

describe('formatDate', () => {
  test('formatea una fecha ISO a formato español', () => {
    const result = formatDate('2026-05-22T10:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('contiene el año correcto', () => {
    const result = formatDate('2026-01-15T00:00:00Z');
    expect(result).toContain('2026');
  });
});

describe('formatDateTime', () => {
  test('retorna string no vacío', () => {
    const result = formatDateTime('2026-05-22T14:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatNumber', () => {
  test('formatea número entero', () => {
    const result = formatNumber(1000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('formatea cero', () => {
    const result = formatNumber(0);
    expect(result).toBe('0');
  });

  test('formatea número negativo', () => {
    const result = formatNumber(-5);
    expect(typeof result).toBe('string');
  });

  test('formatea string numérico', () => {
    const result = formatNumber('42');
    expect(result).toBe('42');
  });
});
