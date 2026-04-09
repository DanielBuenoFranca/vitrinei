/**
 * Input mask utilities for Brazilian formats
 */

/** Format CPF: 000.000.000-00 */
export const maskCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/** Format CNPJ: 00.000.000/0000-00 */
export const maskCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/** Auto-detect and format CPF or CNPJ */
export const maskCPFCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) return maskCPF(value);
  return maskCNPJ(value);
};

/** Format phone: (00) 00000-0000 or (00) 0000-0000 */
export const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

/** Format currency: R$ 1.234,56 */
export const maskCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/** Parse currency string back to number */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/** Format date: DD/MM/AAAA */
export const maskDate = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
};

/** Unmask - remove all formatting */
export const unmask = (value: string): string => value.replace(/\D/g, '');
