import client from './client';
import type { Installment } from '../types';

export const getInstallmentsByLoan = (loanId: string) =>
  client.get<Installment[]>(`/installments/by-loan/${loanId}`).then(r => r.data);
