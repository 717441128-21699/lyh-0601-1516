import { useLocation, Link } from 'react-router-dom';
import { Bell, ChevronRight, Home } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '/': '进度总览',
  '/resignation-form': '离职单',
  '/handover-tasks': '交接任务',
  '/asset-return': '资产归还',
  '/permission-close': '权限关闭',
  '/settlement': '结算确认',
  '/archive': '离职归档'
};

const roleLabels: Record<string, string> = {
  employee: '离职员工',
  supervisor: '部门主管',
  it: 'IT管理员',
  admin: '行政管理员',
  finance: '财务专员',
  hr: 'HR专员'
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { currentUser, currentRole, getOverallProgress } = useStore();
  const progress = getOverallProgress();

  const getBreadcrumbs = () => {
    const crumbs = [{ path: '/', label: '首页' }];
    if (location.pathname !== '/') {
      crumbs.push({
        path: location.pathname,
        label: routeLabels[location.pathname] || location.pathname
      });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <nav className="flex items-center text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  {index === 0 && <Home className="h-4 w-4" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className={cn(
                    'flex items-center gap-1.5 text-gray-500 transition hover:text-gray-700',
                    index === 0 && 'hover:text-[#1e3a5f]'
                  )}
                >
                  {index === 0 && <Home className="h-4 w-4" />}
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2">
          <div className="flex h-10 w-32 items-center">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #3b82f6, #1e3a5f)'
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={cn(
                'text-base font-bold',
                progress === 100 ? 'text-emerald-600' : 'text-[#1e3a5f]'
              )}
            >
              {progress}%
            </span>
            <span className="text-[10px] text-gray-500">整体进度</span>
          </div>
        </div>

        <button className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800">{currentUser.name || '用户'}</span>
            <span className="text-[11px] text-gray-500">
              {roleLabels[currentRole] || currentRole}
            </span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] text-sm font-semibold text-white shadow-sm">
            {currentUser.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
