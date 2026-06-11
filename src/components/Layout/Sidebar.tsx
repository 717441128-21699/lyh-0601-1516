import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ListTodo,
  Package,
  Shield,
  Calculator,
  Archive,
  ChevronDown,
  UserCircle2,
  Briefcase
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  employee: '离职员工',
  supervisor: '部门主管',
  it: 'IT管理员',
  admin: '行政管理员',
  finance: '财务专员',
  hr: 'HR专员'
};

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  countKey?: string;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '进度总览', icon: LayoutDashboard },
  { path: '/resignation-form', label: '离职单', icon: FileText, countKey: 'employee' },
  { path: '/handover-tasks', label: '交接任务', icon: ListTodo, countKey: 'supervisor' },
  { path: '/asset-return', label: '资产归还', icon: Package, countKey: 'it' },
  { path: '/permission-close', label: '权限关闭', icon: Shield, countKey: 'it' },
  { path: '/settlement', label: '结算确认', icon: Calculator, countKey: 'finance' },
  { path: '/archive', label: '离职归档', icon: Archive, countKey: 'hr' }
];

export default function Sidebar() {
  const { currentRole, currentUser, switchRole, getPendingCountByRole } = useStore();
  const pendingCounts = getPendingCountByRole();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleRoleSwitch = (role: string) => {
    switchRole(role);
    setRoleDropdownOpen(false);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">HR离职交接系统</span>
          <span className="text-[11px] text-white/50">Resignation Handover</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const count = item.countKey ? pendingCounts[item.countKey] || 0 : 0;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/8 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="relative mb-3">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg bg-white/8 px-3 py-2 text-sm text-white transition hover:bg-white/12"
          >
            <span className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-white/60" />
              <span className="text-white/80">当前角色：</span>
              <span className="font-medium text-white">{roleLabels[currentRole]}</span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-white/50 transition-transform',
                roleDropdownOpen && 'rotate-180'
              )}
            />
          </button>
          {roleDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-lg border border-white/10 bg-[#152a47] shadow-xl">
              <ul className="py-1">
                {Object.entries(roleLabels).map(([key, label]) => (
                  <li key={key}>
                    <button
                      onClick={() => handleRoleSwitch(key)}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-white/10',
                        currentRole === key ? 'text-white' : 'text-white/60'
                      )}
                    >
                      <span>{label}</span>
                      {(pendingCounts[key] || 0) > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                          {pendingCounts[key]}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white">
            {currentUser.name?.charAt(0) || 'U'}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-white">{currentUser.name || '未登录'}</span>
            <span className="truncate text-[11px] text-white/50">
              {currentUser.department && currentUser.position
                ? `${currentUser.department} · ${currentUser.position}`
                : '用户信息'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
