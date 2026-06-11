import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  FileText,
  Package,
  Shield,
  Calculator,
  ChevronRight,
  User,
  Calendar,
  Flag,
  MessageSquare,
  History,
  UserCheck
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProgressBar from '@/components/ProgressBar';
import Timeline from '@/components/Timeline';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/utils/date';
import type { HandoverTask, AssetItem, PermissionItem, SettlementItem, SignOffNode } from '@/types';

interface TodoItem {
  id: string;
  type: 'task' | 'asset' | 'permission' | 'settlement';
  title: string;
  content: string;
  assigneeId: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  path: string;
  isOverdue: boolean;
}

const typeLabels: Record<string, string> = {
  task: '交接任务',
  asset: '资产归还',
  permission: '权限关闭',
  settlement: '结算确认'
};

const typeColors: Record<string, string> = {
  task: 'bg-blue-100 text-blue-700',
  asset: 'bg-orange-100 text-orange-700',
  permission: 'bg-purple-100 text-purple-700',
  settlement: 'bg-green-100 text-green-700'
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

const signOffRoleLabels: Record<string, string> = {
  employee: '离职员工',
  supervisor: '部门主管',
  it: 'IT管理员',
  admin: '行政人员',
  finance: '财务专员',
  hr: 'HR管理员'
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    resignationForm,
    handoverTasks,
    assetItems,
    permissionItems,
    settlementItems,
    comments,
    employees,
    auditLogs,
    getOverallProgress,
    isAllCompleted,
    signOffNodes,
    getUnsignedOffRoles,
    isAllSignedOff
  } = useStore();

  const overallProgress = getOverallProgress();
  const allCompleted = isAllCompleted();
  const unsignedOffRoles = getUnsignedOffRoles();
  const allSignedOff = isAllSignedOff();

  const stats = useMemo(() => {
    const pendingTasks = handoverTasks.filter(t => t.status !== 'completed').length;
    const overdueTasks = handoverTasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && isOverdue(t.dueDate))).length;
    const overdueAssets = assetItems.filter(a => a.status !== 'returned').length;
    const pendingPermissions = permissionItems.filter(p => !p.closed).length;
    const pendingSettlements = settlementItems.filter(s => !['confirmed', 'paid'].includes(s.status)).length;

    const pendingCount = pendingTasks + overdueAssets + pendingPermissions + pendingSettlements;
    const overdueCount = overdueTasks;

    const completedTasks = handoverTasks.filter(t => t.status === 'completed').length;
    const returnedAssets = assetItems.filter(a => a.status === 'returned').length;
    const closedPermissions = permissionItems.filter(p => p.closed).length;
    const confirmedSettlements = settlementItems.filter(s => ['confirmed', 'paid'].includes(s.status)).length;
    const completedCount = completedTasks + returnedAssets + closedPermissions + confirmedSettlements +
      (['completed', 'archived'].includes(resignationForm?.status || '') ? 1 : 0);

    return {
      pending: pendingCount,
      overdue: overdueCount,
      completed: completedCount
    };
  }, [handoverTasks, assetItems, permissionItems, settlementItems, resignationForm]);

  const timelineItems = useMemo(() => {
    const items = [];

    const formCompleted = ['completed', 'archived'].includes(resignationForm?.status || '');
    items.push({
      title: '离职申请',
      description: resignationForm?.reason || '提交离职申请',
      status: formCompleted ? 'completed' as const : (resignationForm?.status === 'in_progress' ? 'current' as const : 'pending' as const),
      role: '离职员工',
      date: resignationForm?.createdAt ? formatDate(resignationForm.createdAt, 'yyyy-MM-dd') : undefined
    });

    const tasksCompleted = handoverTasks.length > 0 && handoverTasks.every(t => t.status === 'completed');
    const tasksInProgress = handoverTasks.some(t => ['in_progress', 'completed'].includes(t.status));
    items.push({
      title: '交接任务',
      description: `${handoverTasks.filter(t => t.status === 'completed').length}/${handoverTasks.length} 项已完成`,
      status: tasksCompleted ? 'completed' as const : (tasksInProgress ? 'current' as const : 'pending' as const),
      role: '部门主管'
    });

    const assetsCompleted = assetItems.length > 0 && assetItems.every(a => a.status === 'returned');
    const assetsInProgress = assetItems.some(a => a.status === 'returned');
    items.push({
      title: '资产归还',
      description: `${assetItems.filter(a => a.status === 'returned').length}/${assetItems.length} 项已归还`,
      status: assetsCompleted ? 'completed' as const : (assetsInProgress ? 'current' as const : 'pending' as const),
      role: 'IT/行政'
    });

    const permissionsCompleted = permissionItems.length > 0 && permissionItems.every(p => p.closed);
    const permissionsInProgress = permissionItems.some(p => p.closed);
    items.push({
      title: '权限关闭',
      description: `${permissionItems.filter(p => p.closed).length}/${permissionItems.length} 项已关闭`,
      status: permissionsCompleted ? 'completed' as const : (permissionsInProgress ? 'current' as const : 'pending' as const),
      role: 'IT管理员'
    });

    const settlementsCompleted = settlementItems.length > 0 && settlementItems.every(s => ['confirmed', 'paid'].includes(s.status));
    const settlementsInProgress = settlementItems.some(s => ['confirmed', 'paid'].includes(s.status));
    items.push({
      title: '结算确认',
      description: `${settlementItems.filter(s => ['confirmed', 'paid'].includes(s.status)).length}/${settlementItems.length} 项已确认`,
      status: settlementsCompleted ? 'completed' as const : (settlementsInProgress ? 'current' as const : 'pending' as const),
      role: '财务专员'
    });

    items.push({
      title: '归档完成',
      description: 'HR最终确认并归档',
      status: allCompleted ? 'completed' as const : 'pending' as const,
      role: 'HR专员'
    });

    return items;
  }, [resignationForm, handoverTasks, assetItems, permissionItems, settlementItems, allCompleted]);

  const moduleProgress = useMemo(() => {
    const formProgress = ['completed', 'archived'].includes(resignationForm?.status || '') ? 100 : (resignationForm?.status === 'in_progress' ? 50 : 0);

    const taskCompleted = handoverTasks.filter(t => t.status === 'completed').length;
    const taskProgress = handoverTasks.length > 0 ? Math.round((taskCompleted / handoverTasks.length) * 100) : 0;

    const assetReturned = assetItems.filter(a => a.status === 'returned').length;
    const assetProgress = assetItems.length > 0 ? Math.round((assetReturned / assetItems.length) * 100) : 0;

    const permClosed = permissionItems.filter(p => p.closed).length;
    const permProgress = permissionItems.length > 0 ? Math.round((permClosed / permissionItems.length) * 100) : 0;

    const settleDone = settlementItems.filter(s => ['confirmed', 'paid'].includes(s.status)).length;
    const settleProgress = settlementItems.length > 0 ? Math.round((settleDone / settlementItems.length) * 100) : 0;

    return [
      {
        id: 'form',
        title: '离职单进度',
        icon: FileText,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        progress: formProgress,
        completed: formProgress === 100 ? 1 : 0,
        total: 1,
        path: '/resignation-form'
      },
      {
        id: 'tasks',
        title: '交接任务进度',
        icon: ListTodo,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
        progress: taskProgress,
        completed: taskCompleted,
        total: handoverTasks.length,
        path: '/handover-tasks'
      },
      {
        id: 'assets',
        title: '资产归还进度',
        icon: Package,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-50',
        progress: assetProgress,
        completed: assetReturned,
        total: assetItems.length,
        path: '/asset-return'
      },
      {
        id: 'permissions',
        title: '权限关闭进度',
        icon: Shield,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-50',
        progress: permProgress,
        completed: permClosed,
        total: permissionItems.length,
        path: '/permission-close'
      },
      {
        id: 'settlement',
        title: '结算确认进度',
        icon: Calculator,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-50',
        progress: settleProgress,
        completed: settleDone,
        total: settlementItems.length,
        path: '/settlement'
      }
    ];
  }, [resignationForm, handoverTasks, assetItems, permissionItems, settlementItems]);

  const todoItems = useMemo((): TodoItem[] => {
    const todos: TodoItem[] = [];

    handoverTasks.forEach((task: HandoverTask) => {
      if (task.status !== 'completed') {
        const taskOverdue = task.status === 'overdue' || isOverdue(task.dueDate);
        todos.push({
          id: task.id,
          type: 'task',
          title: task.title,
          content: task.description,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate,
          priority: task.priority,
          path: '/handover-tasks',
          isOverdue: taskOverdue
        });
      }
    });

    assetItems.forEach((asset: AssetItem) => {
      if (asset.status !== 'returned') {
        todos.push({
          id: asset.id,
          type: 'asset',
          title: asset.name,
          content: `资产编号: ${asset.serialNumber}`,
          assigneeId: asset.category === 'it' ? 'emp-004' : 'emp-006',
          dueDate: resignationForm?.lastWorkingDay || new Date().toISOString(),
          priority: 'medium',
          path: '/asset-return',
          isOverdue: false
        });
      }
    });

    permissionItems.forEach((perm: PermissionItem) => {
      if (!perm.closed) {
        todos.push({
          id: perm.id,
          type: 'permission',
          title: perm.name,
          content: `权限类型: ${perm.type}`,
          assigneeId: 'emp-004',
          dueDate: resignationForm?.lastWorkingDay || new Date().toISOString(),
          priority: 'high',
          path: '/permission-close',
          isOverdue: false
        });
      }
    });

    settlementItems.forEach((settle: SettlementItem) => {
      if (!['confirmed', 'paid'].includes(settle.status)) {
        todos.push({
          id: settle.id,
          type: 'settlement',
          title: settle.description,
          content: `金额: ¥${settle.amount.toLocaleString()}`,
          assigneeId: 'emp-005',
          dueDate: resignationForm?.lastWorkingDay || new Date().toISOString(),
          priority: 'medium',
          path: '/settlement',
          isOverdue: false
        });
      }
    });

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return todos.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [handoverTasks, assetItems, permissionItems, settlementItems, resignationForm]);

  const recentComments = useMemo(() => {
    return [...comments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [comments]);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const getSignOffNode = (role: string) => signOffNodes.find(n => n.role === role);

  const commentCategoryLabels: Record<string, string> = {
    general: '综合',
    task: '任务',
    asset: '资产',
    permission: '权限',
    settlement: '结算'
  };

  const commentCategoryColors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-600',
    task: 'bg-blue-100 text-blue-600',
    asset: 'bg-orange-100 text-orange-600',
    permission: 'bg-purple-100 text-purple-600',
    settlement: 'bg-green-100 text-green-600'
  };

  const actionLabels: Record<string, string> = {
    form_saved: '保存离职单',
    form_submitted: '提交离职申请',
    supervisor_approved: '主管审核通过',
    task_completed: '完成交接任务',
    asset_returned: '归还资产',
    permission_closed: '关闭权限',
    settlement_confirmed: '确认结算',
    hr_archived: 'HR归档',
    comment_added: '添加意见',
    attachment_uploaded: '上传附件',
    batch_operation: '批量操作'
  };

  const actionColors: Record<string, string> = {
    form_saved: 'bg-gray-100 text-gray-700',
    form_submitted: 'bg-blue-100 text-blue-700',
    supervisor_approved: 'bg-indigo-100 text-indigo-700',
    task_completed: 'bg-blue-100 text-blue-700',
    asset_returned: 'bg-orange-100 text-orange-700',
    permission_closed: 'bg-purple-100 text-purple-700',
    settlement_confirmed: 'bg-green-100 text-green-700',
    hr_archived: 'bg-teal-100 text-teal-700',
    comment_added: 'bg-yellow-100 text-yellow-700',
    attachment_uploaded: 'bg-pink-100 text-pink-700',
    batch_operation: 'bg-cyan-100 text-cyan-700'
  };

  const moduleLabels: Record<string, string> = {
    general: '综合',
    task: '交接任务',
    asset: '资产归还',
    permission: '权限关闭',
    settlement: '结算确认',
    form: '离职单',
    archive: '归档管理'
  };

  const roleLabels: Record<string, string> = {
    employee: '离职员工',
    supervisor: '直属上级',
    it: 'IT管理员',
    admin: '行政人员',
    finance: '财务人员',
    hr: 'HR管理员'
  };

  const signOffRoles: Array<'employee' | 'supervisor' | 'it' | 'admin' | 'finance' | 'hr'> = ['employee', 'supervisor', 'it', 'admin', 'finance', 'hr'];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">交接进度总览</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">整体进度</p>
                <p className="text-3xl font-bold text-gray-900">{overallProgress}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Flag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <ProgressBar value={overallProgress} size="lg" color="blue" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">待办事项</p>
                <p className="text-3xl font-bold text-red-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500">需要处理的事项总数</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">逾期项</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <p className="text-xs text-red-500 font-medium">已超过截止日期的项</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">已完成</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500">已成功完成的事项</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gray-500" />
              多角色签收状态
            </h3>
            {!allSignedOff && unsignedOffRoles.length > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                还剩 {unsignedOffRoles.length} 人未签收
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {signOffRoles.map((role) => {
              const node = getSignOffNode(role);
              const signer = node?.signedOffBy ? getEmployee(node.signedOffBy) : null;
              const isSigned = node?.signedOff;

              return (
                <div
                  key={role}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    isSigned
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isSigned ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      isSigned ? 'text-green-700' : 'text-gray-600'
                    )}>
                      {signOffRoleLabels[role]}
                    </span>
                  </div>
                  <div className="text-xs mb-1">
                    {isSigned && signer ? (
                      <span className="text-gray-700">{signer.name}</span>
                    ) : (
                      <span className="text-gray-400">待签收</span>
                    )}
                  </div>
                  <div className={cn(
                    'text-xs font-medium',
                    isSigned ? 'text-green-600' : 'text-gray-400'
                  )}>
                    {isSigned ? '已签收' : '待签收'}
                  </div>
                  {isSigned && node?.signedOffAt && (
                    <div className="text-[10px] text-gray-500 mt-1">
                      {formatDate(node.signedOffAt, 'MM-dd HH:mm')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              交接流程时间线
            </h3>
            <Timeline items={timelineItems} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {moduleProgress.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', module.iconBg)}>
                          <Icon className={cn('w-5 h-5', module.iconColor)} />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">{module.title}</h4>
                      </div>
                      <button
                        onClick={() => navigate(module.path)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
                      >
                        跳转
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ProgressBar value={module.progress} showLabel size="md" />
                    <p className="text-xs text-gray-500 mt-2">
                      已完成 {module.completed}/{module.total} 项
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                  待办提醒列表
                </h3>
                <span className="text-xs text-gray-500">共 {todoItems.length} 项待处理</span>
              </div>
              {!allSignedOff && unsignedOffRoles.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      以下角色尚未完成签收：{unsignedOffRoles.map(r => signOffRoleLabels[r]).join('、')}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todoItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无待办事项</p>
                  </div>
                ) : (
                  todoItems.slice(0, 10).map((todo) => {
                    const assignee = getEmployee(todo.assigneeId);
                    return (
                      <div
                        key={todo.id}
                        onClick={() => navigate(todo.path)}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm',
                          todo.isOverdue
                            ? 'bg-red-50 border-red-200 hover:bg-red-100/50'
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                              typeColors[todo.type]
                            )}>
                              {typeLabels[todo.type]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                'text-sm font-medium truncate',
                                todo.isOverdue ? 'text-red-700' : 'text-gray-900'
                              )}>
                                {todo.title}
                              </h4>
                              <span className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                                priorityColors[todo.priority]
                              )}>
                                {priorityLabels[todo.priority]}
                              </span>
                              {todo.isOverdue && (
                                <span className="inline-flex items-center text-[10px] font-medium text-red-600 gap-0.5">
                                  <AlertCircle className="w-3 h-3" />
                                  已逾期
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1.5">{todo.content}</p>
                            <div className="flex items-center gap-3 text-xs">
                              {assignee && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <User className="w-3 h-3" />
                                  {assignee.name}
                                </span>
                              )}
                              <span className={cn(
                                'flex items-center gap-1',
                                todo.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                              )}>
                                <Calendar className="w-3 h-3" />
                                {formatDate(todo.dueDate, 'yyyy-MM-dd')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              最新动态
            </h3>
            <button
              onClick={() => navigate('/archive')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
            >
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {recentComments.length === 0 ? (
              <div className="py-6 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无动态</p>
              </div>
            ) : (
              recentComments.map((comment) => {
                const author = getEmployee(comment.authorId);
                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {author?.avatar ? (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {author?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {author?.name || '未知用户'}
                        </span>
                        {comment.category !== 'general' && (
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            commentCategoryColors[comment.category] || commentCategoryColors.general
                          )}>
                            {commentCategoryLabels[comment.category] || comment.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDate(comment.createdAt, 'MM-dd HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              节点流转记录
            </h3>
            <button
              onClick={() => navigate('/archive')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
            >
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无操作记录</p>
              </div>
            ) : (
              auditLogs.slice(0, 20).map((log) => {
                const operator = getEmployee(log.operatorId);
                return (
                  <div
                    key={log.id}
                    className="flex gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {operator?.name?.charAt(0) || log.operatorName?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {operator?.name || log.operatorName || '未知用户'}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({roleLabels[log.operatorRole] || log.operatorRole})
                        </span>
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                          actionColors[log.action] || 'bg-gray-100 text-gray-600'
                        )}>
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {moduleLabels[log.module] || log.module}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDate(log.timestamp, 'MM-dd HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{log.details}</p>
                      {log.affectedItems && log.affectedItems.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          影响项: {log.affectedItems.length} 个
                        </p>
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
