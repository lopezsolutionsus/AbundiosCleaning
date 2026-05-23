import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  const firstName = localStorage.getItem('first_name') || 'there';

  function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Abundios Cleaning</div>
        <div className="sidebar-greeting">Hi, {firstName} 👋</div>
        <nav>
          <NavLink to="/dashboard">🏠 My Appointments</NavLink>
          <NavLink to="/properties">🏢 My Properties</NavLink>
          <NavLink to="/quote">✨ Request a Quote</NavLink>
        </nav>
        <button className="sidebar-logout" onClick={logout}>← Log out</button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
