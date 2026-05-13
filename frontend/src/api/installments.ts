import client from './client';
import type { Installment } from '../types';

export const getInstallmentsByLoan = (loanId: string) =>
  client.get<Installment[]>(`/installments/by-loan/${loanId}`).then(r => r.data);

export const checkOverdue = () =>
  client.post<{ markedOverdue: number }>('/installments/check-overdue').then(r => r.data);
