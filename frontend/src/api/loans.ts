import client from './client';
import type { Loan, CreateLoanRequest } from '../types';

export const getLoans = () =>
  client.get<Loan[]>('/loans').then(r => r.data);

export const getLoansByCustomer = (customerId: string) =>
  client.get<Loan[]>(`/loans/by-customer/${customerId}`).then(r => r.data);

export const getLoan = (id: string) =>
  client.get<Loan>(`/loans/${id}`).then(r => r.data);

export const createLoan = (data: CreateLoanRequest) =>
  client.post<Loan>('/loans', data).then(r => r.data);

export const updateLoan = (id: string, loanType: string) =>
  client.put<Loan>(`/loans/${id}`, { loanType }).then(r => r.data);
