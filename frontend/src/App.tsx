import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import NewLoanPage from './pages/NewLoanPage';
import InstallmentsPage from './pages/InstallmentsPage';
import PaymentPage from './pages/PaymentPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/:customerId/loans/new" element={<NewLoanPage />} />
            <Route path="/loans/:loanId/installments" element={<InstallmentsPage />} />
            <Route path="/payments" element={<PaymentPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
