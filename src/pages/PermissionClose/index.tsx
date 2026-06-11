import { useState, useMemo } from 'react';
import {
  Shield,
  UserCircle,
  Mail,
  Wifi,
  Database,
  GitBranch,
  Lock,
  Unlock,
  Share2,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCheck,
  CheckSquare,
  Square,
  X,
  Info
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import CommentSection from '@/components/CommentSection';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import type { PermissionItem } from '@/types';

interface PermissionGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  items: PermissionItem[];
}

function CustomToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked ? 'bg-green-500' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  items,
  confirmText = '确认',
  cancelText = '取消',
  confirmColor = 'blue'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  items?: string[];
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'blue' | 'green' | 'red';
}) {
  if (!isOpen) return null;

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[50vh]">
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          {items && items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Info className="w-4 h-4" />
                选中的项 ({items.length})：
              </div>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm',
              colorClasses[confirmColor]
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PermissionClose() {
  const {
    permissionItems,
    currentRole,
    currentUser,
    resignationForm,
    employees,
    togglePermissionClosed,
    updatePermissionItem,
    batchClosePermissions,
    addComment,
  } = useStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    account: true,
    email: true,
    vpn: true,
    system: true,
  });
  const [emailForward, setEmailForward] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [autoReply, setAutoReply] = useState(false);
  const [autoReplyContent] = useState(
    '您好，我已离职，此邮箱将不再使用。如有工作相关事宜，请联系其他同事。感谢您的理解与支持！'
  );
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [batchConfirmDialog, setBatchConfirmDialog] = useState(false);
  const [confirmCompleteDialog, setConfirmCompleteDialog] = useState(false);

  const canEdit = currentRole === 'it' || currentRole === 'admin';

  const groupedItems = useMemo(() => {
    const assignedIds = new Set<string>();

    const accountItems = permissionItems.filter((p) => p.type === 'account');
    accountItems.forEach((i) => assignedIds.add(i.id));

    const emailItems = permissionItems.filter(
      (p) => p.type === 'email' || p.name.includes('微信') || p.name.includes('钉钉')
    );
    emailItems.forEach((i) => assignedIds.add(i.id));

    const vpnItems = permissionItems.filter(
      (p) => p.type === 'vpn' || (p.type === 'system' && p.name.includes('内部系统'))
    );
    vpnItems.forEach((i) => assignedIds.add(i.id));

    const systemItems = permissionItems.filter(
      (p) => !assignedIds.has(p.id) && (p.type === 'system' || p.type === 'database')
    );

    return {
      account: accountItems,
      email: emailItems,
      vpn: vpnItems,
      system: systemItems,
    };
  }, [permissionItems]);

  const totalPermissions = permissionItems.length;
  const closedPermissions = permissionItems.filter((p) => p.closed).length;
  const progress =
    totalPermissions > 0 ? Math.round((closedPermissions / totalPermissions) * 100) : 0;
  const allClosed = closedPermissions === totalPermissions && totalPermissions > 0;

  const unselectedItems = permissionItems.filter((p) => !p.closed && !selectedItems.has(p.id));
  const isAllSelected = unselectedItems.length === 0 && selectedItems.size > 0;

  const getEmployeeName = (id?: string) => {
    if (!id) return '-';
    const emp = employees.find((e) => e.id === id);
    return emp?.name || '-';
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleToggle = (item: PermissionItem) => {
    if (!canEdit) return;
    togglePermissionClosed(item.id);
  };

  const handleNoteEdit = (item: PermissionItem) => {
    setEditingNote(item.id);
    setNoteValue(item.notes || '');
  };

  const handleNoteSave = (id: string) => {
    updatePermissionItem(id, { notes: noteValue.trim() });
    setEditingNote(null);
    setNoteValue('');
  };

  const handleNoteCancel = () => {
    setEditingNote(null);
    setNoteValue('');
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems(new Set());
    } else {
      const unclosedIds = permissionItems.filter((p) => !p.closed).map((p) => p.id);
      setSelectedItems(new Set(unclosedIds));
    }
  };

  const handleBatchClose = () => {
    if (!canEdit || selectedItems.size === 0) return;
    setBatchConfirmDialog(true);
  };

  const confirmBatchClose = () => {
    if (selectedItems.size === 0) return;

    const ids = Array.from(selectedItems);
    const closedItems = permissionItems.filter((p) => ids.includes(p.id));
    const itemNames = closedItems.map((p) => p.name);

    batchClosePermissions(ids);

    addComment({
      formId: resignationForm?.id || '',
      authorId: currentUser.id,
      content: `批量关闭了以下权限：${itemNames.join('、')}`,
      category: 'permission',
    });

    setSelectedItems(new Set());
    setBatchConfirmDialog(false);
  };

  const handleConfirmComplete = () => {
    if (!canEdit || !allClosed) return;
    setConfirmCompleteDialog(true);
  };

  const confirmComplete = () => {
    addComment({
      formId: resignationForm?.id || '',
      authorId: currentUser.id,
      content: '已确认所有权限均已关闭，权限关闭流程完成。',
      category: 'permission',
    });
    setConfirmCompleteDialog(false);
  };

  const selectedItemNames = permissionItems
    .filter((p) => selectedItems.has(p.id))
    .map((p) => p.name);

  const renderPermissionRow = (item: PermissionItem) => {
    const isClosed = item.closed;
    const isSelected = selectedItems.has(item.id);
    const canSelect = !isClosed && canEdit;

    return (
      <div
        key={item.id}
        className={cn(
          'flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 transition-colors',
          'hover:bg-gray-50',
          isSelected && 'bg-blue-50'
        )}
      >
        <div className="flex-shrink-0">
          {canSelect ? (
            <button
              onClick={() => handleSelectItem(item.id)}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 fill-current" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
        </div>

        <div className="flex-shrink-0">
          <CustomToggle
            checked={isClosed}
            onChange={() => handleToggle(item)}
            disabled={!canEdit}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
            {item.type === 'database' && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded font-medium">
                敏感权限
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={String(isClosed)} type="permission" closed={isClosed} />
            {item.closedAt && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDate(item.closedAt, 'yyyy-MM-dd HH:mm')}
              </span>
            )}
            {item.closedBy && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <User className="w-3 h-3" />
                {getEmployeeName(item.closedBy)}
              </span>
            )}
          </div>
        </div>

        <div className="w-64 flex-shrink-0">
          {editingNote === item.id ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="添加备注..."
                autoFocus
              />
              <button
                onClick={() => handleNoteSave(item.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={handleNoteCancel}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 flex-1 truncate">
                {item.notes || <span className="text-gray-300">无备注</span>}
              </span>
              {canEdit && (
                <button
                  onClick={() => handleNoteEdit(item)}
                  className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const groups: PermissionGroup[] = [
    {
      id: 'account',
      title: '系统账号',
      icon: <UserCircle className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      items: groupedItems.account,
    },
    {
      id: 'email',
      title: '邮箱与通讯',
      icon: <Mail className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      items: groupedItems.email,
    },
    {
      id: 'vpn',
      title: 'VPN与网络',
      icon: <Wifi className="w-5 h-5" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      items: groupedItems.vpn,
    },
    {
      id: 'system',
      title: '系统与数据库',
      icon: <Database className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      items: groupedItems.system,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">权限关闭</h1>
              <p className="text-sm text-gray-500">管理并关闭离职员工的所有系统访问权限</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              已关闭 <span className="font-semibold text-green-600">{closedPermissions}</span> /{' '}
              {totalPermissions}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">整体进度</span>
            <span className="text-sm text-gray-500">
              {progress < 100 ? (
                <span className="inline-flex items-center gap-1">
                  <Unlock className="w-4 h-4 text-orange-500" />
                  还有 {totalPermissions - closedPermissions} 项待关闭
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <Lock className="w-4 h-4" />
                  全部权限已关闭
                </span>
              )}
            </span>
          </div>
          <ProgressBar value={progress} showLabel color="blue" size="lg" />
        </div>

        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">只读模式</p>
              <p className="text-xs text-amber-600 mt-0.5">
                当前角色为 <span className="font-medium">{currentRole}</span>
                ，仅IT管理员可操作权限关闭。请切换角色后进行编辑。
              </p>
            </div>
          </div>
        )}

        {canEdit && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 fill-current text-blue-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {isAllSelected ? '取消全选' : '全选未关闭项'}
                </button>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-gray-500">
                    已选择 <span className="font-semibold text-blue-600">{selectedItems.size}</span> 项
                  </span>
                )}
              </div>
              <button
                onClick={handleBatchClose}
                disabled={selectedItems.size === 0}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm',
                  selectedItems.size > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                <Lock className="w-4 h-4" />
                批量关闭选中项
              </button>
            </div>
          </div>
        )}

        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', group.bgColor, group.color)}>
                  {group.icon}
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-gray-900">{group.title}</h2>
                  <p className="text-xs text-gray-500">
                    共 {group.items.length} 项，已关闭{' '}
                    {group.items.filter((i) => i.closed).length} 项
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!canEdit && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                    <Lock className="w-3 h-3" />
                    仅IT角色可操作
                  </span>
                )}
                {expandedGroups[group.id] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedGroups[group.id] && (
              <div className="divide-y divide-gray-100">
                {group.id === 'email' && (
                  <div className="px-5 py-4 bg-purple-50/50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <CustomToggle
                          checked={emailForward}
                          onChange={setEmailForward}
                          disabled={!canEdit}
                        />
                        <div className="flex items-center gap-1.5">
                          <Share2 className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700">邮箱自动转交</span>
                        </div>
                      </div>
                      {emailForward && (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <input
                            type="email"
                            value={forwardRecipient}
                            onChange={(e) => setForwardRecipient(e.target.value)}
                            placeholder="输入转交收件人邮箱..."
                            disabled={!canEdit}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 pt-1">
                        <CustomToggle
                          checked={autoReply}
                          onChange={setAutoReply}
                          disabled={!canEdit}
                        />
                        <span className="text-sm font-medium text-gray-700">邮箱自动回复</span>
                      </div>
                      {autoReply && (
                        <textarea
                          value={autoReplyContent}
                          rows={3}
                          disabled
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 resize-none"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <CustomToggle
                          checked={backupConfirmed}
                          onChange={setBackupConfirmed}
                          disabled={!canEdit}
                        />
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-purple-500" />
                          邮件备份已确认
                        </span>
                      </div>
                      {backupConfirmed && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" />
                          已完成邮件备份归档
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {group.id === 'account' && (
                  <div className="px-5 py-2 bg-blue-50/30 flex items-center gap-2 text-xs text-blue-600">
                    <GitBranch className="w-3.5 h-3.5" />
                    包含企业域账号等核心系统账号
                  </div>
                )}

                {group.id === 'system' && (
                  <div className="px-5 py-2 bg-orange-50/30 flex items-center gap-2 text-xs text-orange-600">
                    <Database className="w-3.5 h-3.5" />
                    包含业务系统、代码仓库、数据库等敏感权限
                  </div>
                )}

                {group.items.map(renderPermissionRow)}
              </div>
            )}
          </div>
        ))}

        {canEdit && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  确认完成
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  确认所有权限已关闭，操作后将记录时间戳和操作人信息
                </p>
              </div>
              <button
                onClick={handleConfirmComplete}
                disabled={!allClosed}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm',
                  allClosed
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                <Lock className="w-4 h-4" />
                {allClosed
                  ? '确认全部权限已关闭'
                  : `还有 ${totalPermissions - closedPermissions} 项未关闭`}
              </button>
            </div>
          </div>
        )}

        <div className="h-[500px]">
          <CommentSection category="permission" />
        </div>
      </div>

      <ConfirmDialog
        isOpen={batchConfirmDialog}
        onClose={() => setBatchConfirmDialog(false)}
        onConfirm={confirmBatchClose}
        title="批量关闭权限"
        message="确定要关闭以下选中的权限吗？此操作将记录操作日志。"
        items={selectedItemNames}
        confirmText="确认关闭"
        confirmColor="blue"
      />

      <ConfirmDialog
        isOpen={confirmCompleteDialog}
        onClose={() => setConfirmCompleteDialog(false)}
        onConfirm={confirmComplete}
        title="确认权限关闭完成"
        message="所有权限均已关闭，确认后将添加一条完成记录到意见留痕。"
        confirmText="确认完成"
        confirmColor="green"
      />
    </div>
  );
}
