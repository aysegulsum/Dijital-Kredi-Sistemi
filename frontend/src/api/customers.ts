import client from './client';
import type { Customer, CreateCustomerRequest, CustomerSummary, CreditScoreResult } from '../types';

export const getCustomers = () =>
  client.get<Customer[]>('/customers').then(r => r.data);

export const getCustomer = (id: string) =>
  client.get<Customer>(`/customers/${id}`).then(r => r.data);

export const createCustomer = (data: CreateCustomerRequest) =>
  client.post<Customer>('/customers', data).then(r => r.data);

export const updateCustomer = (id: string, data: Omit<CreateCustomerRequest, 'tcNo' | 'birthDate'>) =>
  client.put<Customer>(`/customers/${id}`, data).then(r => r.data);

export const deleteCustomer = (id: string) =>
  client.delete(`/customers/${id}`);

export const getCustomerSummary = (id: string) =>
  client.get<CustomerSummary>(`/customers/${id}/summary`).then(r => r.data);

export const recalculateCreditScore = (id: string) =>
  client.post<CreditScoreResult>(`/customers/${id}/recalculate-credit-score`).then(r => r.data);
