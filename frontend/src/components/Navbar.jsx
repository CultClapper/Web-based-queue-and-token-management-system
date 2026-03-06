import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ role = 'User', tabs = [], activeTab, onTabChange }) {
  const navigate = useNavigate();
  const [localActive, setLocalActive] = React.useState(activeTab || (tabs[0] && tabs[0].id) || 'home');

  React.useEffect(() => {
    if (activeTab) setLocalActive(activeTab);
  }, [activeTab]);

  const handleClick = (id) => {
    if (onTabChange) onTabChange(id);
    else setLocalActive(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('servsync_token');
    localStorage.removeItem('servsync_role');
    localStorage.removeItem('servsync_user');
    navigate('/login');
  };

  const current = activeTab || localActive;

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-slate-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500 text-sm font-bold shadow-lg">
            SS
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-50">ServSync</p>
            <p className="text-[11px] text-slate-400">{role === 'Admin' ? 'Operations Suite' : `${role} Portal`}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleClick(t.id)}
              className={`relative transition hover:text-slate-50 ${current === t.id ? 'text-slate-50' : 'text-slate-300'}`}>
              {t.label}
              {current === t.id && <span className="absolute -bottom-1 left-0 h-[2px] w-6 rounded-full bg-slate-50" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 md:inline-flex items-center gap-2">
            <span className="text-xs">🛡</span>
            {role}
          </span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
