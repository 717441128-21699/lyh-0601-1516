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
  UserCheck,
  History,
  FolderOpen,
  AlertTriangle,
  ClipboardCheck,
  User,
  Shield as ShieldIcon,
  Cpu,
  Building2,
  Banknote,
  Users,
  Filter,
  FileOutput,
  ChevronDown,
  Search
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/utils/date';
import { exportToPDF, exportCompletePackage } from '@/utils/export';
import type { HandoverTask, AssetItem, PermissionItem, SettlementItem, Comment, Attachment, AuditLog, SignOffNode, ArchiveChecklistItem } from '@/types';
import * as XLSX from 'xlsx';

type TabType = 'overview' | 'form' | 'tasks' | 'assets' | 'permissions' | 'settlement' | 'comments' | 'attachments' | 'auditLogs' | 'signoff' | 'checklist';

const tabList: { key: TabType; label: string; icon: typeof FileText }[] = [
  { key: 'overview', label: '概览摘要', icon: FileText },
  { key: 'form', label: '离职单详情', icon: FileText },
  { key: 'tasks', label: '交接任务清单', icon: ListTodo },
  { key: 'assets', label: '资产归还清单', icon: Package },
  { key: 'permissions', label: '权限关闭清单', icon: Shield },
  { key: 'settlement', label: '结算明细', icon: Calculator },
  { key: 'signoff', label: '签收看板', icon: UserCheck },
  { key: 'checklist', label: '核验清单', icon: ClipboardCheck },
  { key: 'comments', label: '意见记录', icon: MessageSquare },
  { key: 'attachments', label: '附件列表', icon: Paperclip },
  { key: 'auditLogs', label: '流程记录', icon: History }
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

const roleIcons: Record<string, typeof User> = {
  employee: User,
  supervisor: Users,
  it: Cpu,
  admin: ShieldIcon,
  finance: Banknote,
  hr: Building2
};

const checklistCategoryLabels: Record<string, string> = {
  document: '文档',
  asset: '资产',
  finance: '财务',
  system: '系统',
  hr: '人事'
};

const auditModuleFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'form', label: '离职单' },
  { value: 'task', label: '交接任务' },
  { value: 'asset', label: '资产归还' },
  { value: 'permission', label: '权限关闭' },
  { value: 'settlement', label: '结算确认' },
  { value: 'archive', label: '归档管理' },
  { value: 'signoff', label: '签收' },
  { value: 'checklist', label: '核验' }
];

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
  const [signOffDialogOpen, setSignOffDialogOpen] = useState(false);
  const [selectedSignOffRole, setSelectedSignOffRole] = useState<string | null>(null);
  const [signOffNotes, setSignOffNotes] = useState('');

  const [auditModuleFilter, setAuditModuleFilter] = useState('all');
  const [auditOperatorFilter, setAuditOperatorFilter] = useState('all');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditKeywordFilter, setAuditKeywordFilter] = useState('');
  const [exceptionNotesInput, setExceptionNotesInput] = useState('');

  const {
    resignationForm,
    handoverTasks,
    assetItems,
    permissionItems,
    settlementItems,
    comments,
    attachments,
    employees,
    auditLogs,
    signOffNodes,
    archiveChecklist,
    currentRole,
    updateResignationForm,
    getOverallProgress,
    isAllCompleted,
    getUncompletedModules,
    archiveResignation,
    signOffNode,
    updateChecklistItem,
    getUnsignedOffRoles,
    isAllSignedOff,
    getChecklistProgress,
    getArchiveQualityScore,
    archiveExceptionNotes,
    setArchiveExceptionNotes,
    getArchivePrecheckIssues
  } = useStore();

  const overallProgress = getOverallProgress();
  const allCompleted = isAllCompleted();
  const isArchived = resignationForm?.status === 'archived';
  const isHR = currentRole === 'hr';
  const checklistProgress = getChecklistProgress();
  const unsignedOffRoles = getUnsignedOffRoles();
  const allSignedOff = isAllSignedOff();

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

  const uncompletedModules = useMemo(() => {
    const modules = getUncompletedModules();
    if (!allSignedOff && !modules.includes('多角色签收')) {
      modules.push('多角色签收');
    }
    if (checklistProgress.completed < checklistProgress.total && !modules.includes('归档核验')) {
      modules.push('归档核验');
    }
    return modules;
  }, [getUncompletedModules, allSignedOff, checklistProgress]);

  const qualityScore = useMemo(() => {
    return getArchiveQualityScore();
  }, [getArchiveQualityScore]);

  const precheckIssues = useMemo(() => {
    return getArchivePrecheckIssues();
  }, [getArchivePrecheckIssues]);

  const riskLevel = useMemo(() => {
    return qualityScore.riskLevel;
  }, [qualityScore]);

  const riskLevelLabels: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '严重风险'
  };

  const riskLevelColors: Record<string, string> = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-orange-50 border-orange-200',
    critical: 'bg-red-50 border-red-200'
  };

  const riskLabelColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const scoreNumberColors: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log: AuditLog) => {
      if (auditModuleFilter !== 'all' && log.module !== auditModuleFilter) {
        return false;
      }
      if (auditOperatorFilter !== 'all' && log.operatorId !== auditOperatorFilter) {
        return false;
      }
      if (auditStartDate) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        if (logDate < auditStartDate) {
          return false;
        }
      }
      if (auditEndDate) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        if (logDate > auditEndDate) {
          return false;
        }
      }
      if (auditKeywordFilter) {
        const keyword = auditKeywordFilter.toLowerCase();
        const detailsMatch = log.details?.toLowerCase().includes(keyword);
        const commentsMatch = comments.some((c: Comment) => 
          c.content?.toLowerCase().includes(keyword)
        );
        if (!detailsMatch && !commentsMatch) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, auditModuleFilter, auditOperatorFilter, auditStartDate, auditEndDate, auditKeywordFilter, comments]);

  const groupedChecklist = useMemo(() => {
    const groups: Record<string, ArchiveChecklistItem[]> = {};
    archiveChecklist.forEach((item: ArchiveChecklistItem) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [archiveChecklist]);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

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
    batch_operation: '批量操作',
    signoff_completed: '完成签收',
    checklist_updated: '更新核验项',
    supervisor_notes_updated: '更新主管意见'
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
    batch_operation: 'bg-cyan-100 text-cyan-700',
    signoff_completed: 'bg-emerald-100 text-emerald-700',
    checklist_updated: 'bg-amber-100 text-amber-700',
    supervisor_notes_updated: 'bg-slate-100 text-slate-700'
  };

  const moduleLabels: Record<string, string> = {
    general: '综合',
    task: '交接任务',
    asset: '资产归还',
    permission: '权限关闭',
    settlement: '结算确认',
    form: '离职单',
    archive: '归档管理',
    signoff: '签收',
    checklist: '核验'
  };

  const handleArchiveConfirm = () => {
    if (precheckIssues.hasIssues) {
      if (exceptionNotesInput.trim()) {
        setArchiveExceptionNotes(exceptionNotesInput.trim());
      }
    }
    archiveResignation();
    setConfirmDialogOpen(false);
    setExceptionNotesInput('');
  };

  const handleOpenPrecheckDialog = () => {
    setExceptionNotesInput(archiveExceptionNotes || '');
    setConfirmDialogOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('archive-preview', `离职档案_${employee?.name || '员工'}_${formatDate(new Date(), 'yyyyMMdd')}`);
    } catch (error) {
      console.error('导出PDF失败:', error);
    }
  };

  const handleExportCompletePackage = () => {
    const storeState = {
      currentUser: useStore.getState().currentUser,
      employees,
      resignationForm,
      handoverTasks,
      assetItems,
      permissionItems,
      settlementItems,
      comments,
      attachments,
      auditLogs,
      signOffNodes: useStore.getState().signOffNodes,
      archiveChecklist: useStore.getState().archiveChecklist,
      archiveExceptionNotes,
      qualityScore,
      precheckIssues
    };
    exportCompletePackage(storeState);
  };

  const handleOpenSignOffDialog = (role: string) => {
    setSelectedSignOffRole(role);
    setSignOffNotes('');
    setSignOffDialogOpen(true);
  };

  const handleSignOffConfirm = () => {
    if (selectedSignOffRole) {
      signOffNode(selectedSignOffRole as any, signOffNotes || undefined);
    }
    setSignOffDialogOpen(false);
    setSelectedSignOffRole(null);
    setSignOffNotes('');
  };

  const handleChecklistItemToggle = (id: string, currentChecked: boolean) => {
    if (!isHR) return;
    updateChecklistItem(id, { checked: !currentChecked });
  };

  const handleChecklistNotesChange = (id: string, notes: string) => {
    if (!isHR) return;
    updateChecklistItem(id, { notes });
  };

  const handleExportAuditLogs = () => {
    const data = filteredAuditLogs.map((log: AuditLog) => {
      const operator = getEmployee(log.operatorId);
      return {
        '操作时间': formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        '操作人': operator?.name || log.operatorName || '未知用户',
        '操作人角色': roleLabels[log.operatorRole] || log.operatorRole,
        '操作类型': actionLabels[log.action] || log.action,
        '所属模块': moduleLabels[log.module] || log.module,
        '详情': log.details
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '审计明细');

    const fileName = `审计明细_${formatDate(new Date(), 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-emerald-600">多角色签收进度</p>
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {signOffNodes.filter((n: SignOffNode) => n.signedOff).length}/{signOffNodes.length}
                    </p>
                    <div className="mt-2">
                      <ProgressBar
                        value={signOffNodes.length > 0 ? Math.round((signOffNodes.filter((n: SignOffNode) => n.signedOff).length / signOffNodes.length) * 100) : 0}
                        showLabel
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-amber-600">核验清单进度</p>
                      <ClipboardCheck className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      {checklistProgress.completed}/{checklistProgress.total}
                    </p>
                    <div className="mt-2">
                      <ProgressBar
                        value={checklistProgress.total > 0 ? Math.round((checklistProgress.completed / checklistProgress.total) * 100) : 0}
                        showLabel
                        size="sm"
                      />
                    </div>
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

            {activeTab === 'signoff' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">多角色签收看板</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      已签收 {signOffNodes.filter((n: SignOffNode) => n.signedOff).length} / 共 {signOffNodes.length} 个角色
                    </p>
                  </div>
                  {allSignedOff ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200 gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      全部已签收
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200 gap-1">
                      <AlertCircle className="w-4 h-4" />
                      还有 {unsignedOffRoles.length} 个角色待签收
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {signOffNodes.map((node: SignOffNode) => {
                    const RoleIcon = roleIcons[node.role] || User;
                    const signer = node.signedOffBy ? getEmployee(node.signedOffBy) : null;
                    const canSign = currentRole === node.role && !node.signedOff;

                    return (
                      <div
                        key={node.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all',
                          node.signedOff
                            ? 'bg-green-50/50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            node.signedOff
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          )}>
                            <RoleIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900">{node.title}</h4>
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                node.signedOff
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              )}>
                                {node.signedOff ? '已签收' : '待签收'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{node.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">角色: {roleLabels[node.role]}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">签收人</span>
                            <span className="text-gray-900 font-medium">
                              {signer?.name || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">签收时间</span>
                            <span className="text-gray-600">
                              {node.signedOffAt ? formatDate(node.signedOffAt, 'yyyy-MM-dd') : '-'}
                            </span>
                          </div>
                          {node.notes && (
                            <div className="pt-2 mt-2 border-t border-gray-100">
                              <span className="text-gray-500 text-xs">备注</span>
                              <p className="text-gray-700 mt-1">{node.notes}</p>
                            </div>
                          )}
                        </div>

                        {canSign && (
                          <button
                            onClick={() => handleOpenSignOffDialog(node.role)}
                            className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" />
                            确认签收
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">归档核验清单</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      核验进度: 已核验 {checklistProgress.completed} / 共 {checklistProgress.total} 项
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar
                      value={checklistProgress.total > 0 ? Math.round((checklistProgress.completed / checklistProgress.total) * 100) : 0}
                      showLabel
                      size="sm"
                    />
                    {!isHR && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">仅HR可操作</span>
                    )}
                  </div>
                </div>

                {Object.keys(groupedChecklist).map((category) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full" />
                      {checklistCategoryLabels[category]}
                    </h4>
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {groupedChecklist[category].map((item: ArchiveChecklistItem) => {
                        const checker = item.checkedBy ? getEmployee(item.checkedBy) : null;
                        return (
                          <div key={item.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 pt-0.5">
                                <button
                                  onClick={() => handleChecklistItemToggle(item.id, item.checked)}
                                  disabled={!isHR}
                                  className={cn(
                                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                                    item.checked
                                      ? 'bg-green-600 border-green-600'
                                      : 'border-gray-300 hover:border-gray-400',
                                    !isHR && 'cursor-not-allowed opacity-60'
                                  )}
                                >
                                  {item.checked && <Check className="w-3 h-3 text-white" />}
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <p className={cn(
                                    'text-sm font-medium',
                                    item.checked ? 'text-gray-500 line-through' : 'text-gray-900'
                                  )}>
                                    {item.title}
                                  </p>
                                  {item.checked && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                                      已核验
                                    </span>
                                  )}
                                </div>
                                {item.checked && (
                                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                    {checker && (
                                      <span>核验人: {checker.name}</span>
                                    )}
                                    {item.checkedAt && (
                                      <span>核验时间: {formatDate(item.checkedAt, 'yyyy-MM-dd')}</span>
                                    )}
                                  </div>
                                )}
                                <div className="mt-3">
                                  <input
                                    type="text"
                                    value={item.notes || ''}
                                    onChange={(e) => handleChecklistNotesChange(item.id, e.target.value)}
                                    disabled={!isHR}
                                    placeholder={isHR ? '添加备注（可选）' : '仅HR可填写备注'}
                                    className={cn(
                                      'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
                                      isHR
                                        ? 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

            {activeTab === 'auditLogs' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">筛选条件</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">所属模块</label>
                      <div className="relative">
                        <select
                          value={auditModuleFilter}
                          onChange={(e) => setAuditModuleFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                        >
                          {auditModuleFilterOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">操作者</label>
                      <div className="relative">
                        <select
                          value={auditOperatorFilter}
                          onChange={(e) => setAuditOperatorFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                        >
                          <option value="all">全部</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({roleLabels[emp.role]})</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={auditStartDate}
                        onChange={(e) => setAuditStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={auditEndDate}
                        onChange={(e) => setAuditEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">关键字搜索</label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={auditKeywordFilter}
                          onChange={(e) => setAuditKeywordFilter(e.target.value)}
                          placeholder="搜索操作详情或意见内容..."
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      筛选结果: 共 {filteredAuditLogs.length} 条记录
                    </span>
                    <button
                      onClick={handleExportAuditLogs}
                      disabled={filteredAuditLogs.length === 0}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                        filteredAuditLogs.length > 0
                          ? 'text-white bg-green-600 hover:bg-green-700'
                          : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      )}
                    >
                      <FileOutput className="w-4 h-4" />
                      导出筛选结果
                    </button>
                  </div>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="py-8 text-center">
                    <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无符合条件的流程记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        共找到 {filteredAuditLogs.length} 条记录
                      </span>
                    </div>
                    {filteredAuditLogs.map((log: AuditLog) => {
                      const operator = getEmployee(log.operatorId);
                      return (
                        <div key={log.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                              {operator?.name?.charAt(0) || log.operatorName?.charAt(0) || 'U'}
                            </div>
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
                              {formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 pl-8">{log.details}</p>
                          {log.affectedItems && log.affectedItems.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1 pl-8">
                              影响项: {log.affectedItems.length} 个
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          'rounded-xl border shadow-sm p-5',
          uncompletedModules.length === 0
            ? 'bg-green-50 border-green-200'
            : 'bg-orange-50 border-orange-200'
        )}>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-500" />
            导出前预览
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {uncompletedModules.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              )}
              <span className={cn(
                'text-sm font-medium',
                uncompletedModules.length === 0 ? 'text-green-800' : 'text-orange-800'
              )}>
                {uncompletedModules.length === 0
                  ? '所有模块已完成，可以导出完整交接包'
                  : `还有 ${uncompletedModules.length} 个模块未完成`}
              </span>
            </div>
            {uncompletedModules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uncompletedModules.map((module) => (
                  <span
                    key={module}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    {module}
                  </span>
                ))}
              </div>
            )}
            {uncompletedModules.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {['离职单', '交接任务', '资产归还', '权限关闭', '结算确认', '多角色签收', '归档核验'].map((module) => (
                  <span
                    key={module}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {module}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              完整交接包包含：离职单、交接任务、资产归还、权限关闭、财务结算、附件清单、流程记录、意见留痕、多角色签收、归档核验清单，共10个Sheet
            </p>
            {qualityScore.score < 80 && (
              <div className={cn(
                'mt-3 p-3 rounded-lg border',
                riskLevelColors[riskLevel]
              )}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn('w-4 h-4', scoreNumberColors[riskLevel])} />
                  <span className={cn('text-sm font-medium', scoreNumberColors[riskLevel])}>
                    归档质量评分: {qualityScore.score} 分（{riskLevelLabels[riskLevel]}），建议检查扣分项后再导出
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          'rounded-xl border shadow-sm p-5',
          riskLevelColors[riskLevel]
        )}>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            归档质量评分
          </h3>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center justify-center lg:w-48 p-4 rounded-xl bg-white/60 border border-white/80">
              <div className={cn(
                'text-6xl font-bold mb-2',
                scoreNumberColors[riskLevel]
              )}>
                {qualityScore.score}
              </div>
              <span className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                riskLabelColors[riskLevel]
              )}>
                {riskLevelLabels[riskLevel]}
              </span>
              <p className="text-xs text-gray-500 mt-3 text-center">
                满分100分
              </p>
            </div>
            <div className="flex-1 space-y-4">
              {(qualityScore.deductions.length > 0 || qualityScore.missingFields.length > 0) ? (
                <>
                  {qualityScore.deductions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        扣分项明细
                      </h4>
                      <div className="space-y-2">
                        {qualityScore.deductions.map((deduction, index) => (
                          <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-white/70 border border-white">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                  {deduction.module}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">
                                {deduction.reason}
                              </p>
                            </div>
                            <span className="flex-shrink-0 ml-3 text-sm font-bold text-red-600">
                              -{deduction.points}分
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {qualityScore.missingFields.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-500" />
                        缺失关键字段
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {qualityScore.missingFields.map((field, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-base font-semibold text-green-700">无扣分项，归档质量优秀</p>
                    <p className="text-sm text-gray-500 mt-1">所有检查项均已达标，可以放心归档</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-gray-500" />
            导出档案
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">完整交接包</span>
              </div>
              <p className="text-xs text-purple-700 mb-3">导出完整交接包（10个Sheet，含签收记录和核验清单）</p>
              <button
                onClick={handleExportCompletePackage}
                className={cn(
                  'w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-1.5',
                  uncompletedModules.length === 0
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-400 cursor-not-allowed'
                )}
                disabled={uncompletedModules.length > 0}
              >
                <Download className="w-4 h-4" />
                {uncompletedModules.length === 0 ? '一键导出' : '暂不可用'}
              </button>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">导出说明</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>PDF格式</strong>: 包含当前选中选项卡的内容，适合打印存档</li>
                <li>• <strong>完整交接包</strong>: 包含所有模块数据、签收记录和核验清单，共10个Sheet</li>
                <li>• 文件名自动包含员工姓名和导出日期</li>
                <li>• 交接包导出需所有模块完成后可用</li>
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
                onClick={handleOpenPrecheckDialog}
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
            onClick={() => {
              setConfirmDialogOpen(false);
              setExceptionNotesInput('');
            }}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">归档前预检</h2>
              <button
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setExceptionNotesInput('');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {precheckIssues.hasIssues ? (
                <>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800 mb-1">
                        预检发现 {
                          (precheckIssues.unsignedRoles?.length || 0) +
                          (precheckIssues.uncheckedItems?.length || 0) +
                          (precheckIssues.missingAttachments?.length || 0) +
                          (precheckIssues.emptyKeyFields?.length || 0)
                        } 项问题
                      </p>
                      <p className="text-sm text-orange-700">
                        建议先处理以下问题后再进行归档操作。如确需继续归档，请填写例外说明。
                      </p>
                    </div>
                  </div>

                  {precheckIssues.unsignedRoles && precheckIssues.unsignedRoles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-gray-500" />
                        未签收角色（{precheckIssues.unsignedRoles.length}）
                      </h4>
                      <div className="space-y-2">
                        {precheckIssues.unsignedRoles.map((role: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-700 font-medium">
                              {roleLabels[role] || role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {precheckIssues.uncheckedItems && precheckIssues.uncheckedItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4 text-gray-500" />
                        未核验风险项（{precheckIssues.uncheckedItems.length}）
                      </h4>
                      <div className="space-y-2">
                        {precheckIssues.uncheckedItems.map((item: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-700">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {precheckIssues.missingAttachments && precheckIssues.missingAttachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        缺失附件提醒（{precheckIssues.missingAttachments.length}）
                      </h4>
                      <div className="space-y-2">
                        {precheckIssues.missingAttachments.map((attach: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <span className="text-sm text-yellow-700">
                              建议上传：{attach}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {precheckIssues.emptyKeyFields && precheckIssues.emptyKeyFields.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-500" />
                        关键字段为空提醒（{precheckIssues.emptyKeyFields.length}）
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {precheckIssues.emptyKeyFields.map((field: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      例外说明（必填，如果仍要继续归档）
                    </label>
                    <textarea
                      value={exceptionNotesInput}
                      onChange={(e) => setExceptionNotesInput(e.target.value)}
                      rows={4}
                      placeholder="请说明跳过上述预检问题的原因..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">预检通过</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    所有检查项均已通过，确认归档 {employee?.name || '该员工'} 的离职档案？
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    归档后，所有相关数据将被标记为已完成状态，此操作不可撤销。
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setExceptionNotesInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleArchiveConfirm}
                disabled={precheckIssues.hasIssues && !exceptionNotesInput.trim()}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  (!precheckIssues.hasIssues || exceptionNotesInput.trim())
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                )}
              >
                <Check className="w-4 h-4" />
                {precheckIssues.hasIssues ? '仍要继续归档' : '确认归档'}
              </button>
            </div>
          </div>
        </div>
      )}

      {signOffDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSignOffDialogOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">确认签收</h2>
              <button
                onClick={() => setSignOffDialogOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    确认以 {roleLabels[selectedSignOffRole || '']} 角色签收？
                  </p>
                  <p className="text-sm text-gray-600">
                    签收后将记录您的姓名和签收时间，此操作不可撤销。
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={signOffNotes}
                  onChange={(e) => setSignOffNotes(e.target.value)}
                  rows={3}
                  placeholder="请输入签收备注..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSignOffDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSignOffConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                确认签收
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}