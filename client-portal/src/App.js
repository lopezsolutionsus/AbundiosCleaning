import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import QuotePage from './pages/QuotePage';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter basename={process.env.NODE_ENV === 'production' ? '/client' : '/'}>
      <Routes>
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="quote" element={<QuotePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
