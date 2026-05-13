import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import NewLoanPage from './pages/NewLoanPage';
import InstallmentsPage from './pages/InstallmentsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:customerId/loans/new" element={<NewLoanPage />} />
          <Route path="/loans/:loanId/installments" element={<InstallmentsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
