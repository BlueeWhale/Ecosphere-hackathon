import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Users,
  Building2,
  MessageSquare,
  BrainCircuit,
  Package,
  BookOpen,
  BarChart3,
  Calendar as CalendarIcon,
  Clock,
  Blocks,
  Settings as SettingsIcon,
  Sparkles,
  ChevronRight,
  User,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

const baseNavigationGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'AI Sales Agent', path: '/sales-agent', icon: Bot, badge: 'Live Voice' },
      { name: 'Leads', path: '/leads', icon: Users },
      { name: 'Customers', path: '/customers', icon: Building2 },
      { name: 'Conversations', path: '/conversations', icon: MessageSquare },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { name: 'Deal State', path: '/deal-state', icon: BrainCircuit },
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
      { name: 'Follow Ups', path: '/follow-ups', icon: Clock },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Integrations', path: '/integrations', icon: Blocks },
      { name: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
  },
];

const adminGroup = {
  title: 'Administration',
  items: [
    { name: 'Admin Console', path: '/admin/dashboard', icon: Shield, badge: 'Admin' },
  ],
};

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, isAdmin, logout } = useAuth();

  const navigationGroups = isAdmin
    ? [adminGroup, ...baseNavigationGroups]
    : baseNavigationGroups;

  const displayName = user?.name || 'Sales Operator';
  const displayEmail = user?.email || 'Not signed in';
  const displayRole = user?.role === 'admin' ? 'Admin' : 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0b0f17] border-r border-[#1f293d] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#1f293d]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5">
                  DEALPILOT
                </h1>
                <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                  AI Sales Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-slate-800">
            {navigationGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5">
                <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:bg-[#131b2e] hover:text-slate-200 border border-transparent'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1f293d] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 border border-indigo-400/40 flex items-center justify-center text-white font-semibold text-sm">
              {displayInitial || <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                <Badge variant={isAdmin ? 'warning' : 'secondary'}>{displayRole}</Badge>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{displayEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
