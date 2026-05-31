import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  const firstName = localStorage.getItem('first_name') || 'User';
  const role      = localStorage.getItem('role') || '';

  function logout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Abundios Cleaning</div>
        <NavLink to="/profile" style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 1rem', borderRadius:'0.5rem', textDecoration:'none', color:'#555', fontSize:'0.88rem', marginBottom:'0.5rem' }}>
          <span style={{ width:30, height:30, borderRadius:'50%', background:'#fde8ee', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#E90A46', fontSize:'0.9rem', flexShrink:0 }}>
            {firstName.charAt(0).toUpperCase()}
          </span>
          <div style={{ lineHeight:1.2 }}>
            <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#333' }}>{firstName}</div>
            <div style={{ fontSize:'0.72rem', color:'#aaa', textTransform:'capitalize' }}>{role}</div>
          </div>
        </NavLink>
        <nav>
          <NavLink to="/calendar">🗓 Calendar</NavLink>
          <NavLink to="/clients">👥 Clients</NavLink>
          {role === 'admin' && <NavLink to="/users">🔑 Users</NavLink>}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button className="sidebar-logout" onClick={logout}>← Log out</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
