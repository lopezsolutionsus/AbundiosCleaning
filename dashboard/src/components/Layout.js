import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Abundios Cleaning</div>
        <nav>
          <NavLink to="/calendar">🗓 Calendar</NavLink>
          <NavLink to="/clients">👥 Clients</NavLink>
        </nav>
        <button className="sidebar-logout" onClick={logout}>← Log out</button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
