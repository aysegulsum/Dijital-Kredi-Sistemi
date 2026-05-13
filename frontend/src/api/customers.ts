import client from './client';
import type { Customer, CreateCustomerRequest } from '../types';

export const getCustomers = () =>
  client.get<Customer[]>('/customers').then(r => r.data);

export const getCustomer = (id: string) =>
  client.get<Customer>(`/customers/${id}`).then(r => r.data);

export const createCustomer = (data: CreateCustomerRequest) =>
  client.post<Customer>('/customers', data).then(r => r.data);

export const deleteCustomer = (id: string) =>
  client.delete(`/customers/${id}`);
