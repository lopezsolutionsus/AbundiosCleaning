import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return;
  localStorage.setItem('token', token);
  const role = params.get('role');
  if (role) localStorage.setItem('role', role);
  const firstName = params.get('first_name');
  if (firstName) localStorage.setItem('first_name', firstName);
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, document.title, url.toString());
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
