import client from './client';
import type { PaymentResponse, CardInfo } from '../types';

export const createPayment = (loanId: string, amount: number, card: CardInfo) =>
  client.post<PaymentResponse>('/payments', { loanId, amount, ...card }).then(r => r.data);

export const getPaymentsByLoan = (loanId: string) =>
  client.get<PaymentResponse[]>(`/payments/by-loan/${loanId}`).then(r => r.data);
