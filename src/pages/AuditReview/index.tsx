import { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  User,
  Users,
  Cpu,
  Building2,
  Banknote,
  Shield as ShieldIcon,
  FileText,
  ListTodo,
  Package,
  Shield,
  Calculator,
  UserCheck,
  XCircle,
  AlertCircle,
  Zap,
  Star
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/utils/date';
import type { RectificationTask } from '@/types';

const riskLevelFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
  { value: 'critical', label: '严重风险' }
];

const moduleFilterOptions = [
  { value: 'all', label: '全部' },
  { value: '离职单', label: '离职单' },
  { value: '交接任务', label: '交接任务' },
  { value: '资产归还', label: '资产归还' },
  { value: '权限关闭', label: '权限关闭' },
  { value: '结算确认', label: '结算确认' },
  { value: '签收', label: '签收' },
  { value: '核验', label: '核验' }
];

const roleFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'employee', label: '员工' },
  { value: 'supervisor', label: '主管' },
  { value: 'it', label: 'IT' },
  { value: 'admin', label: '行政' },
  { value: 'finance', label: '财务' },
  { value: 'hr', label: 'HR' }
];

const riskLevelLabels: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险'
};

const riskLevelColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200'
};

const riskLevelBarColors: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低'
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200'
};

const roleLabels: Record<string, string> = {
  employee: '员工',
  supervisor: '主管',
  it: 'IT',
  admin: '行政',
  finance: '财务',
  hr: 'HR'
};

const roleIcons: Record<string, typeof User> = {
  employee: User,
  supervisor: Users,
  it: Cpu,
  admin: Building2,
  finance: Banknote,
  hr: ShieldIcon
};

const moduleLabels: Record<string, string> = {
  '离职单': '离职单',
  '交接任务': '交接任务',
  '资产归还': '资产归还',
  '权限关闭': '权限关闭',
  '结算确认': '结算确认',
  '签收': '签收',
  '核验': '核验'
};

const moduleIcons: Record<string, typeof FileText> = {
  '离职单': FileText,
  '交接任务': ListTodo,
  '资产归还': Package,
  '权限关闭': Shield,
  '结算确认': Calculator,
  '签收': UserCheck,
  '核验': ClipboardCheck
};

export default function AuditReviewPage() {
  const [riskLevelFilter, setRiskLevelFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const {
    auditLogs,
    rectificationTasks,
    archiveChecklist,
    signOffNodes,
    currentRole,
    getAuditSummary,
    getRectificationSummary,
    getArchiveQualityScore,
    getArchivePrecheckIssues,
    completeRectificationTask
  } = useStore();

  const auditSummary = useMemo(() => {
    return getAuditSummary();
  }, [getAuditSummary]);

  const rectificationSummary = useMemo(() => {
    return getRectificationSummary();
  }, [getRectificationSummary]);

  const qualityScore = useMemo(() => {
    return getArchiveQualityScore();
  }, [getArchiveQualityScore]);

  const precheckIssues = useMemo(() => {
    return getArchivePrecheckIssues();
  }, [getArchivePrecheckIssues]);

  const totalDeductionPoints = useMemo(() => {
    return auditSummary.totalDeductionPoints || 0;
  }, [auditSummary]);

  const exceptionCount = useMemo(() => {
    return rectificationTasks.filter(t => t.hasException).length;
  }, [rectificationTasks]);

  const pendingCount = useMemo(() => {
    return rectificationTasks.filter(t => t.status === 'pending').length;
  }, [rectificationTasks]);

  const completedCount = useMemo(() => {
    return rectificationTasks.filter(t => t.status === 'completed').length;
  }, [rectificationTasks]);

  const completionRate = useMemo(() => {
    const total = pendingCount + completedCount;
    if (total === 0) return 0;
    return Math.round((completedCount / total) * 100);
  }, [pendingCount, completedCount]);

  const averageQualityScore = useMemo(() => {
    return qualityScore.score || 0;
  }, [qualityScore]);

  const riskLevelSummary = useMemo(() => {
    const levels = ['critical', 'high', 'medium', 'low'];
    const total = rectificationTasks.length;
    return levels.map(level => ({
      level,
      count: rectificationTasks.filter(t => t.riskLevel === level).length,
      percentage: total > 0 ? Math.round((rectificationTasks.filter(t => t.riskLevel === level).length / total) * 100) : 0
    }));
  }, [rectificationTasks]);

  const moduleSummary = useMemo(() => {
    const modules = ['离职单', '交接任务', '资产归还', '权限关闭', '结算确认', '签收', '核验'];
    return modules.map(module => {
      const moduleTasks = rectificationTasks.filter(t =>
        t.relatedModule === module ||
        (t.category === 'signoff' && module === '签收') ||
        (t.category === 'checklist' && module === '核验') ||
        (t.category === 'quality' && t.relatedModule === module)
      );
      const deductionPoints = qualityScore.deductions
        .filter(d => d.module === module)
        .reduce((sum, d) => sum + d.points, 0);
      return {
        module,
        deductionPoints,
        pending: moduleTasks.filter(t => t.status === 'pending').length,
        completed: moduleTasks.filter(t => t.status === 'completed').length
      };
    });
  }, [rectificationTasks, qualityScore]);

  const roleSummary = useMemo(() => {
    const roles = ['employee', 'supervisor', 'it', 'admin', 'finance', 'hr'];
    return roles.map(role => ({
      role,
      pending: rectificationTasks.filter(t => t.assigneeRole === role && t.status === 'pending').length,
      completed: rectificationTasks.filter(t => t.assigneeRole === role && t.status === 'completed').length
    }));
  }, [rectificationTasks]);

  const filteredTasks = useMemo(() => {
    return rectificationTasks
      .filter((task: RectificationTask) => {
        if (riskLevelFilter !== 'all' && task.riskLevel !== riskLevelFilter) {
          return false;
        }
        if (moduleFilter !== 'all') {
          const taskModule = task.relatedModule ||
            (task.category === 'signoff' ? '签收' :
              task.category === 'checklist' ? '核验' : 'other');
          if (taskModule !== moduleFilter) {
            return false;
          }
        }
        if (roleFilter !== 'all' && task.assigneeRole !== roleFilter) {
          return false;
        }
        if (startDate) {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          if (taskDate < startDate) {
            return false;
          }
        }
        if (endDate) {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          if (taskDate > endDate) {
            return false;
          }
        }
        if (keyword) {
          const kw = keyword.toLowerCase();
          const titleMatch = task.title?.toLowerCase().includes(kw);
          const descMatch = task.description?.toLowerCase().includes(kw);
          if (!titleMatch && !descMatch) {
            return false;
          }
        }
        return true;
      })
      .sort((a: RectificationTask, b: RectificationTask) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [rectificationTasks, riskLevelFilter, moduleFilter, roleFilter, startDate, endDate, keyword, sortOrder]);

  const handleRiskLevelClick = (level: string) => {
    setRiskLevelFilter(riskLevelFilter === level ? 'all' : level);
  };

  const handleModuleClick = (module: string) => {
    setModuleFilter(moduleFilter === module ? 'all' : module);
  };

  const handleRoleClick = (role: string) => {
    setRoleFilter(roleFilter === role ? 'all' : role);
  };

  const handleCompleteTask = (id: string) => {
    completeRectificationTask(id);
  };

  const isCurrentUserTask = (task: RectificationTask) => {
    return task.assigneeRole === currentRole && task.status !== 'completed';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">审计复盘</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索整改任务..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">风险等级</label>
              <div className="relative">
                <select
                  value={riskLevelFilter}
                  onChange={(e) => setRiskLevelFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  {riskLevelFilterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">模块</label>
              <div className="relative">
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  {moduleFilterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">责任角色</label>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  {roleFilterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-500">总扣分数</span>
            </div>
            <p className="text-2xl font-bold text-red-600">-{totalDeductionPoints}</p>
            <p className="text-xs text-gray-400 mt-1">累计质量扣分</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs text-gray-500">例外归档数</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{exceptionCount}</p>
            <p className="text-xs text-gray-400 mt-1">带例外说明</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-xs text-gray-500">待整改数</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-400 mt-1">pending状态</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">已完成整改</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-1">completed状态</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">整改完成率</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
            <div className="mt-1">
              <ProgressBar value={completionRate} size="sm" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">平均质量分</span>
            </div>
            <p className={cn(
              'text-2xl font-bold',
              averageQualityScore >= 90 ? 'text-green-600' :
              averageQualityScore >= 70 ? 'text-yellow-600' :
              averageQualityScore >= 50 ? 'text-orange-600' : 'text-red-600'
            )}>
              {averageQualityScore}
            </p>
            <p className="text-xs text-gray-400 mt-1">最近归档质量</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">按风险等级汇总</h3>
            </div>
            <div className="space-y-3">
              {riskLevelSummary.map(({ level, count, percentage }) => (
                <div
                  key={level}
                  onClick={() => handleRiskLevelClick(level)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    riskLevelFilter === level
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        riskLevelColors[level]
                      )}>
                        {riskLevelLabels[level]}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{count} 项</span>
                    </div>
                    <span className="text-xs text-gray-500">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={cn('h-full rounded-full transition-all', riskLevelBarColors[level])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">按模块汇总</h3>
            </div>
            <div className="space-y-2">
              {moduleSummary.map(({ module, deductionPoints, pending, completed }) => {
                const ModuleIcon = moduleIcons[module] || FileText;
                return (
                  <div
                    key={module}
                    onClick={() => handleModuleClick(module)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      moduleFilter === module
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                        <ModuleIcon className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{moduleLabels[module]}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">扣分</p>
                        <p className="text-sm font-semibold text-red-600">-{deductionPoints}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">待整改</p>
                        <p className="text-sm font-semibold text-yellow-600">{pending}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">已完成</p>
                        <p className="text-sm font-semibold text-green-600">{completed}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">按责任角色汇总</h3>
            </div>
            <div className="space-y-2">
              {roleSummary.map(({ role, pending, completed }) => {
                const RoleIcon = roleIcons[role] || User;
                return (
                  <div
                    key={role}
                    onClick={() => handleRoleClick(role)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      roleFilter === role
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                          <RoleIcon className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{roleLabels[role]}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">待办</p>
                          <p className="text-sm font-semibold text-yellow-600">{pending}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">已完成</p>
                          <p className="text-sm font-semibold text-green-600">{completed}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">整改任务列表</h3>
              <span className="text-xs text-gray-500">({filteredTasks.length} 项)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>{sortOrder === 'desc' ? '最新优先' : '最早优先'}</span>
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">暂无符合条件的整改任务</p>
              </div>
            ) : (
              filteredTasks.map((task: RectificationTask) => {
                const taskOverdue = task.dueDate && task.status !== 'completed' && isOverdue(task.dueDate);
                const isCurrentTask = isCurrentUserTask(task);
                return (
                  <div key={task.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                          {task.hasException && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              例外
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={task.status} type="task" />
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            priorityColors[task.priority]
                          )}>
                            <Zap className="w-3 h-3 mr-1" />
                            {priorityLabels[task.priority]}优先级
                          </span>
                          {task.riskLevel && (
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                              riskLevelColors[task.riskLevel]
                            )}>
                              {riskLevelLabels[task.riskLevel]}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                            {roleLabels[task.assigneeRole]}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
                            {task.relatedModule || (task.category === 'signoff' ? '签收' : task.category === 'checklist' ? '核验' : '其他')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            创建: {formatDate(task.createdAt, 'yyyy-MM-dd')}
                          </span>
                          {task.dueDate && (
                            <span className={cn(
                              'flex items-center gap-1',
                              taskOverdue ? 'text-red-600 font-medium' : ''
                            )}>
                              <Clock className="w-3.5 h-3.5" />
                              截止: {formatDate(task.dueDate, 'yyyy-MM-dd')}
                              {taskOverdue && ' (已过期)'}
                            </span>
                          )}
                          {task.qualityScoreImpact !== undefined && (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              质量影响: -{task.qualityScoreImpact}分
                            </span>
                          )}
                        </div>
                        {task.exceptionNotes && (
                          <p className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            例外说明: {task.exceptionNotes}
                          </p>
                        )}
                      </div>
                      {isCurrentTask && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="flex-shrink-0 px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          完成
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
