export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tcNo: string;
  birthDate: string;
  address?: string;
  createdAt: string;
  isDeleted: boolean;
  creditScore?: number;
  creditScoreUpdatedAt?: string;
}

export interface CreditScoreResult {
  score: number;
  riskLevel: string;
  calculatedAt: string;
  breakdown: string[];
}

export interface Loan {
  id: string;
  customerId: string;
  loanType: 'Ihtiyac' | 'Egitim' | 'Tasit';
  principal: number;
  interestRate: number;
  termMonths: number;
  totalAmount: number;
  monthlyPayment: number;
  startDate: string;
  status: 'Active' | 'Closed';
  creditScore?: number;
  createdAt: string;
  installments: Installment[];
}

export interface Installment {
  id: string;
  loanId: string;
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  payment?: PaymentInfo;
}

export interface PaymentInfo {
  id: string;
  amountPaid: number;
  paidAt: string;
  paymentRef?: string;
}

export interface Payment {
  id: string;
  installmentId: string;
  amountPaid: number;
  paidAt: string;
  paymentRef?: string;
  gatewayStatus: 'Success' | 'Failed';
}

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  totalDebt: number;
  remainingPrincipal: number;
  overdueInstallmentCount: number;
  paidInstallmentCount: number;
  unpaidInstallmentCount: number;
  activeLoanCount: number;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  tcNo: string;
  birthDate: string;
  phone?: string;
  address?: string;
}

export interface CreateLoanRequest {
  customerId: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  loanType: 'Ihtiyac' | 'Egitim' | 'Tasit';
  startDate: string;
}
