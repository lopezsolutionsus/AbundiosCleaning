import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import ClientsPage from './pages/ClientsPage';
import Layout from './components/Layout';
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
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="clients" element={<ClientsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
