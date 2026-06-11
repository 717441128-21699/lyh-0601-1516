import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Mail,
  Briefcase,
  FileText,
  ListTodo,
  Package,
  Shield,
  Calculator,
  MessageSquare,
  Paperclip,
  Download,
  FileDown,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Calendar,
  Check,
  XCircle,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/utils/date';
import { exportToPDF, exportAllData } from '@/utils/export';
import type { HandoverTask, AssetItem, PermissionItem, SettlementItem, Comment, Attachment } from '@/types';

type TabType = 'overview' | 'form' | 'tasks' | 'assets' | 'permissions' | 'settlement' | 'comments' | 'attachments';

const tabList: { key: TabType; label: string; icon: typeof FileText }[] = [
  { key: 'overview', label: '概览摘要', icon: FileText },
  { key: 'form', label: '离职单详情', icon: FileText },
  { key: 'tasks', label: '交接任务清单', icon: ListTodo },
  { key: 'assets', label: '资产归还清单', icon: Package },
  { key: 'permissions', label: '权限关闭清单', icon: Shield },
  { key: 'settlement', label: '结算明细', icon: Calculator },
  { key: 'comments', label: '意见记录', icon: MessageSquare },
  { key: 'attachments', label: '附件列表', icon: Paperclip }
];

const taskCategoryLabels: Record<string, string> = {
  project: '项目',
  document: '文档',
  knowledge: '知识',
  other: '其他'
};

const taskPriorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低'
};

const taskPriorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200'
};

const assetCategoryLabels: Record<string, string> = {
  it: 'IT设备',
  admin: '行政物品'
};

const permissionTypeLabels: Record<string, string> = {
  account: '账号',
  email: '邮箱',
  vpn: 'VPN',
  system: '系统',
  database: '数据库'
};

const settlementTypeLabels: Record<string, string> = {
  loan: '借款',
  reimbursement: '报销',
  salary: '工资',
  annual_leave: '年假折算',
  compensation: '离职补偿'
};

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

const roleLabels: Record<string, string> = {
  admin: '管理员',
  hr: 'HR',
  supervisor: '主管',
  employee: '员工',
  it: 'IT',
  finance: '财务'
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
  return Paperclip;
}

export default function ArchivePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const {
    resignationForm,
    handoverTasks,
    assetItems,
    permissionItems,
    settlementItems,
    comments,
    attachments,
    employees,
    currentRole,
    updateResignationForm,
    getOverallProgress,
    isAllCompleted
  } = useStore();

  const overallProgress = getOverallProgress();
  const allCompleted = isAllCompleted();
  const isArchived = resignationForm?.status === 'archived';
  const isHR = currentRole === 'hr';

  const employee = useMemo(() => {
    return employees.find(e => e.id === resignationForm?.employeeId);
  }, [employees, resignationForm]);

  const handoverPerson = useMemo(() => {
    return employees.find(e => e.id === resignationForm?.handoverPersonId);
  }, [employees, resignationForm]);

  const supervisor = useMemo(() => {
    return employees.find(e => e.id === resignationForm?.supervisorId);
  }, [employees, resignationForm]);

  const incompleteItems = useMemo(() => {
    const items: { type: string; name: string }[] = [];

    if (resignationForm && !['completed', 'archived'].includes(resignationForm.status)) {
      items.push({ type: '离职单', name: '离职单未完成' });
    }

    handoverTasks.forEach((task: HandoverTask) => {
      if (task.status !== 'completed') {
        items.push({ type: '交接任务', name: task.title });
      }
    });

    assetItems.forEach((asset: AssetItem) => {
      if (asset.status !== 'returned') {
        items.push({ type: '资产归还', name: asset.name });
      }
    });

    permissionItems.forEach((perm: PermissionItem) => {
      if (!perm.closed) {
        items.push({ type: '权限关闭', name: perm.name });
      }
    });

    settlementItems.forEach((settle: SettlementItem) => {
      if (!['confirmed', 'paid'].includes(settle.status)) {
        items.push({ type: '结算确认', name: settle.description });
      }
    });

    return items;
  }, [resignationForm, handoverTasks, assetItems, permissionItems, settlementItems]);

  const moduleSummary = useMemo(() => {
    const taskCompleted = handoverTasks.filter(t => t.status === 'completed').length;
    const assetReturned = assetItems.filter(a => a.status === 'returned').length;
    const permClosed = permissionItems.filter(p => p.closed).length;
    const settleDone = settlementItems.filter(s => ['confirmed', 'paid'].includes(s.status)).length;

    return [
      {
        name: '离职单',
        completed: ['completed', 'archived'].includes(resignationForm?.status || '') ? 1 : 0,
        total: 1,
        path: '/resignation-form'
      },
      {
        name: '交接任务',
        completed: taskCompleted,
        total: handoverTasks.length,
        path: '/handover-tasks'
      },
      {
        name: '资产归还',
        completed: assetReturned,
        total: assetItems.length,
        path: '/asset-return'
      },
      {
        name: '权限关闭',
        completed: permClosed,
        total: permissionItems.length,
        path: '/permission-close'
      },
      {
        name: '结算确认',
        completed: settleDone,
        total: settlementItems.length,
        path: '/settlement'
      }
    ];
  }, [resignationForm, handoverTasks, assetItems, permissionItems, settlementItems]);

  const totalSettlementAmount = useMemo(() => {
    return settlementItems.reduce((sum, item) => sum + item.amount, 0);
  }, [settlementItems]);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const handleArchiveConfirm = () => {
    if (resignationForm) {
      updateResignationForm({ status: 'archived' });
    }
    setConfirmDialogOpen(false);
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('archive-preview', `离职档案_${employee?.name || '员工'}_${formatDate(new Date(), 'yyyyMMdd')}`);
    } catch (error) {
      console.error('导出PDF失败:', error);
    }
  };

  const handleExportExcel = () => {
    const storeState = {
      employees,
      resignationForms: resignationForm ? [resignationForm] : [],
      handoverTasks,
      assetItems,
      permissionItems,
      settlementItems,
      comments
    };
    exportAllData(storeState);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Archive className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">离职归档</h1>
          {isArchived && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 gap-1">
              <Check className="w-3 h-3" />
              已归档
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                {employee?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{employee?.name || '未知员工'}</h2>
                <p className="text-sm text-gray-500">{employee?.department} · {employee?.position}</p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 md:ml-8 md:pl-8 md:border-l md:border-gray-200">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{employee?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">交接人: {handoverPerson?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">主管: {supervisor?.name || '-'}</span>
              </div>
            </div>
          </div>
          {resignationForm && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">离职原因</p>
                <p className="text-sm text-gray-900 line-clamp-2">{resignationForm.reason}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">最后工作日</p>
                <p className="text-sm text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(resignationForm.lastWorkingDay, 'yyyy-MM-dd')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">离职单状态</p>
                <StatusBadge status={resignationForm.status} type="form" />
              </div>
            </div>
          )}
        </div>

        <div className={cn(
          'rounded-xl border shadow-sm p-5',
          allCompleted
            ? 'bg-green-50 border-green-200'
            : 'bg-orange-50 border-orange-200'
        )}>
          <div className="flex items-start gap-3">
            {allCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={cn(
                'text-sm font-semibold mb-1',
                allCompleted ? 'text-green-800' : 'text-orange-800'
              )}>
                {allCompleted ? '全部流程已完成' : `还有 ${incompleteItems.length} 项未完成`}
              </h3>
              {allCompleted ? (
                <p className="text-sm text-green-700">
                  所有交接流程已完成，HR可以进行最终归档操作。
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {incompleteItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <XCircle className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-orange-700">
                        <span className="font-medium">[{item.type}]</span> {item.name}
                      </span>
                    </div>
                  ))}
                  {incompleteItems.length > 5 && (
                    <p className="text-xs text-orange-600">还有 {incompleteItems.length - 5} 项未列出...</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <ProgressBar value={overallProgress} showLabel size="md" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              {tabList.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2',
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div id="archive-preview" className="p-5">
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-gray-900">模块完成情况汇总</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moduleSummary.map((module) => (
                    <div
                      key={module.name}
                      className="p-4 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{module.name}</span>
                        <button
                          onClick={() => navigate(module.path)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          查看
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <ProgressBar
                        value={module.total > 0 ? Math.round((module.completed / module.total) * 100) : 0}
                        showLabel
                        size="sm"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        {module.completed}/{module.total} 项已完成
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">交接任务总数</p>
                    <p className="text-2xl font-bold text-blue-700">{handoverTasks.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                    <p className="text-xs text-orange-600 mb-1">资产总数</p>
                    <p className="text-2xl font-bold text-orange-700">{assetItems.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-xs text-green-600 mb-1">结算总金额</p>
                    <p className="text-2xl font-bold text-green-700">¥{totalSettlementAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'form' && resignationForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">员工姓名</p>
                    <p className="text-sm font-medium text-gray-900">{employee?.name || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">所属部门/职位</p>
                    <p className="text-sm font-medium text-gray-900">{employee?.department} / {employee?.position}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">离职原因</p>
                    <p className="text-sm font-medium text-gray-900">{resignationForm.reason}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">最后工作日</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(resignationForm.lastWorkingDay, 'yyyy-MM-dd')}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">交接人</p>
                    <p className="text-sm font-medium text-gray-900">{handoverPerson?.name || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">部门主管</p>
                    <p className="text-sm font-medium text-gray-900">{supervisor?.name || '-'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">员工待办清单</p>
                  <ul className="space-y-1">
                    {resignationForm.employeeTodos.map((todo, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        {todo}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">主管备注</p>
                  <p className="text-sm text-gray-900">{resignationForm.supervisorNotes || '-'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">当前状态:</span>
                  <StatusBadge status={resignationForm.status} type="form" />
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">任务名称</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">分类</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">优先级</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">负责人</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">截止日期</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handoverTasks.map((task: HandoverTask) => {
                      const assignee = getEmployee(task.assigneeId);
                      const taskOverdue = task.status !== 'completed' && isOverdue(task.dueDate);
                      return (
                        <tr key={task.id} className={cn(
                          'border-b border-gray-100 hover:bg-gray-50',
                          taskOverdue && 'bg-red-50/50'
                        )}>
                          <td className="py-3 px-3">
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-gray-600">{taskCategoryLabels[task.category]}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                              taskPriorityColors[task.priority]
                            )}>
                              {taskPriorityLabels[task.priority]}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-700">{assignee?.name || '-'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={cn(
                              'text-sm',
                              taskOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                            )}>
                              {formatDate(task.dueDate, 'yyyy-MM-dd')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={taskOverdue ? 'overdue' : task.status} type="task" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">资产名称</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">分类</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">编号</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">归还时间</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">接收人</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetItems.map((asset: AssetItem) => {
                      const receiver = asset.returnedBy ? getEmployee(asset.returnedBy) : null;
                      return (
                        <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                            {asset.notes && (
                              <p className="text-xs text-orange-600">{asset.notes}</p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-gray-600">{assetCategoryLabels[asset.category]}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-600 font-mono text-xs">{asset.serialNumber}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-600">
                              {asset.returnedAt ? formatDate(asset.returnedAt, 'yyyy-MM-dd') : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-700">{receiver?.name || '-'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={asset.status} type="asset" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">权限名称</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">类型</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">关闭时间</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">操作人</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">备注</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionItems.map((perm: PermissionItem) => {
                      const closer = perm.closedBy ? getEmployee(perm.closedBy) : null;
                      return (
                        <tr key={perm.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <span className="text-sm font-medium text-gray-900">{perm.name}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-gray-600">{permissionTypeLabels[perm.type]}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-600">
                              {perm.closedAt ? formatDate(perm.closedAt, 'yyyy-MM-dd') : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm text-gray-700">{closer?.name || '-'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-gray-500">{perm.notes || '-'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={perm.closed ? 'closed' : 'open'} type="permission" closed={perm.closed} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'settlement' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">项目</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">类型</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">金额</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">确认时间</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">确认人</th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlementItems.map((item: SettlementItem) => {
                        const confirmer = item.confirmedBy ? getEmployee(item.confirmedBy) : null;
                        return (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-3">
                              <span className="text-sm font-medium text-gray-900">{item.description}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-xs text-gray-600">{settlementTypeLabels[item.type]}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm font-semibold text-gray-900">¥{item.amount.toLocaleString()}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-gray-600">
                                {item.confirmedAt ? formatDate(item.confirmedAt, 'yyyy-MM-dd') : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-sm text-gray-700">{confirmer?.name || '-'}</span>
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={item.status} type="settlement" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">合计金额:</span>
                    <span className="text-xl font-bold text-gray-900">¥{totalSettlementAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无评论记录</p>
                  </div>
                ) : (
                  comments.map((comment: Comment) => {
                    const author = getEmployee(comment.authorId);
                    return (
                      <div key={comment.id} className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          {author?.avatar ? (
                            <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                              {author?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{author?.name || '未知用户'}</span>
                          <span className="text-xs text-gray-400">({roleLabels[author?.role || 'employee']})</span>
                          {comment.category !== 'general' && (
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded',
                              commentCategoryColors[comment.category] || commentCategoryColors.general
                            )}>
                              {commentCategoryLabels[comment.category]}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {formatDate(comment.createdAt, 'yyyy-MM-dd HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 pl-8">{comment.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="py-8 text-center">
                    <Paperclip className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无附件</p>
                  </div>
                ) : (
                  attachments.map((attach: Attachment) => {
                    const uploader = getEmployee(attach.uploadedBy);
                    const FileIcon = getFileIcon(attach.type);
                    return (
                      <div key={attach.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attach.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attach.size)} · {uploader?.name || '未知'} · {formatDate(attach.uploadedAt, 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          下载
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-gray-500" />
            导出档案
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">导出PDF</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">导出当前预览内容为PDF格式档案</p>
              <button
                onClick={handleExportPDF}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                导出PDF
              </button>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">导出Excel</span>
              </div>
              <p className="text-xs text-green-700 mb-3">导出全部数据为Excel表格（多Sheet）</p>
              <button
                onClick={handleExportExcel}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                导出Excel
              </button>
            </div>
            <div className="sm:col-span-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">导出格式说明</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>PDF格式</strong>: 包含当前选中选项卡的内容，适合打印存档</li>
                <li>• <strong>Excel格式</strong>: 包含所有模块数据（员工、离职单、任务、资产、权限、结算、评论），每个模块一个Sheet</li>
                <li>• 文件名自动包含员工姓名和导出日期</li>
              </ul>
            </div>
          </div>
        </div>

        {isHR && (
          <div className={cn(
            'rounded-xl border shadow-sm p-5',
            allCompleted && !isArchived
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-gray-500" />
                  HR最终确认
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isArchived
                    ? '该离职流程已完成归档。'
                    : allCompleted
                      ? '所有流程已完成，确认后将标记为已归档状态。'
                      : `还有 ${incompleteItems.length} 项未完成，暂无法归档。`}
                </p>
              </div>
              <button
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!allCompleted || isArchived}
                className={cn(
                  'px-6 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                  allCompleted && !isArchived
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Archive className="w-4 h-4" />
                {isArchived ? '已归档' : '确认归档'}
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDialogOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">确认归档</h2>
              <button
                onClick={() => setConfirmDialogOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Archive className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    确定要归档 {employee?.name || '该员工'} 的离职档案吗？
                  </p>
                  <p className="text-sm text-gray-600">
                    归档后，所有相关数据将被标记为已完成状态，此操作不可撤销。
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">离职单</span>
                  <StatusBadge status={resignationForm?.status || ''} type="form" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">交接任务</span>
                  <span className="text-gray-900 font-medium">
                    {handoverTasks.filter(t => t.status === 'completed').length}/{handoverTasks.length} 完成
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">资产归还</span>
                  <span className="text-gray-900 font-medium">
                    {assetItems.filter(a => a.status === 'returned').length}/{assetItems.length} 完成
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">权限关闭</span>
                  <span className="text-gray-900 font-medium">
                    {permissionItems.filter(p => p.closed).length}/{permissionItems.length} 完成
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">结算确认</span>
                  <span className="text-gray-900 font-medium">
                    {settlementItems.filter(s => ['confirmed', 'paid'].includes(s.status)).length}/{settlementItems.length} 完成
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setConfirmDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleArchiveConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
