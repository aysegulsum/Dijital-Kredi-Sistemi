import client from './client';
import type { Payment } from '../types';

export const createPayment = (installmentId: string, amount: number) =>
  client.post<Payment>('/payments', { installmentId, amount }).then(r => r.data);
