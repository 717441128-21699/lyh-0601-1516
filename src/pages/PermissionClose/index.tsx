import { useState, useMemo } from 'react';
import {
  Shield,
  UserCircle,
  Mail,
  Wifi,
  Database,
  GitBranch,
  MessageSquare,
  Lock,
  Unlock,
  Share2,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCheck
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

export default function PermissionClose() {
  const {
    permissionItems,
    currentRole,
    currentUser,
    resignationForm,
    employees,
    togglePermissionClosed,
    updatePermissionItem,
  } = useStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    account: true,
    email: true,
    vpn: true,
  });
  const [emailForward, setEmailForward] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [autoReply, setAutoReply] = useState(false);
  const [autoReplyContent, setAutoReplyContent] = useState(
    '您好，我已离职，此邮箱将不再使用。如有工作相关事宜，请联系其他同事。感谢您的理解与支持！'
  );
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  const canEdit = currentRole === 'it' || currentRole === 'admin';

  const systemAccountItems = useMemo(
    () => permissionItems.filter((p) => p.type === 'account' || p.type === 'system' || p.type === 'database'),
    [permissionItems]
  );

  const emailItems = useMemo(
    () => permissionItems.filter((p) => p.type === 'email'),
    [permissionItems]
  );

  const vpnItems = useMemo(
    () => permissionItems.filter((p) => p.type === 'vpn'),
    [permissionItems]
  );

  const allExtraItems = [
    {
      id: 'ext-wechat',
      formId: resignationForm?.id || '',
      type: 'system' as const,
      name: '企业微信/钉钉账号',
      closed: false,
    },
    {
      id: 'ext-wifi',
      formId: resignationForm?.id || '',
      type: 'vpn' as const,
      name: '无线网络权限',
      closed: false,
    },
    {
      id: 'ext-internal',
      formId: resignationForm?.id || '',
      type: 'system' as const,
      name: '内部系统访问权限',
      closed: false,
    },
  ];

  const allPermissionItems = [...permissionItems, ...allExtraItems];

  const totalPermissions = allPermissionItems.length;
  const closedPermissions = allPermissionItems.filter((p) => p.closed).length;
  const progress =
    totalPermissions > 0 ? Math.round((closedPermissions / totalPermissions) * 100) : 0;

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

    if (item.id.startsWith('ext-')) {
      const updates: Partial<PermissionItem> = {
        closed: !item.closed,
      };
      if (!item.closed) {
        updates.closedAt = new Date().toISOString();
        updates.closedBy = currentUser.id;
      }
      (allExtraItems.find((i) => i.id === item.id) as PermissionItem & { closed: boolean }).closed = !item.closed;
      if (!item.closed) {
        (allExtraItems.find((i) => i.id === item.id) as PermissionItem & { closedAt: string }).closedAt =
          new Date().toISOString();
        (allExtraItems.find((i) => i.id === item.id) as PermissionItem & { closedBy: string }).closedBy =
          currentUser.id;
      }
    } else {
      togglePermissionClosed(item.id);
    }
  };

  const handleNoteEdit = (item: PermissionItem) => {
    setEditingNote(item.id);
    setNoteValue(item.notes || '');
  };

  const handleNoteSave = (id: string) => {
    if (!id.startsWith('ext-')) {
      updatePermissionItem(id, { notes: noteValue.trim() });
    }
    setEditingNote(null);
    setNoteValue('');
  };

  const handleNoteCancel = () => {
    setEditingNote(null);
    setNoteValue('');
  };

  const handleBatchClose = () => {
    if (!canEdit) return;
    permissionItems.forEach((item) => {
      if (!item.closed) {
        togglePermissionClosed(item.id);
      }
    });
  };

  const renderPermissionRow = (item: PermissionItem) => {
    const isClosed = item.closed;
    const isExtra = item.id.startsWith('ext-');

    return (
      <div
        key={item.id}
        className={cn(
          'flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 transition-colors',
          'hover:bg-gray-50'
        )}
      >
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
                disabled={isExtra}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={isExtra ? '暂不支持备注' : '添加备注...'}
                autoFocus
              />
              {!isExtra && (
                <>
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
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 flex-1 truncate">
                {item.notes || <span className="text-gray-300">无备注</span>}
              </span>
              {canEdit && !isExtra && (
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
      items: [
        ...systemAccountItems,
        ...allExtraItems.filter((i) => i.type === 'system' && i.name.includes('内部')),
      ],
    },
    {
      id: 'email',
      title: '邮箱与通讯',
      icon: <Mail className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      items: [...emailItems, ...allExtraItems.filter((i) => i.name.includes('微信') || i.name.includes('钉钉'))],
    },
    {
      id: 'vpn',
      title: 'VPN与网络',
      icon: <Wifi className="w-5 h-5" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      items: [...vpnItems, ...allExtraItems.filter((i) => i.name.includes('无线'))],
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
            {canEdit && (
              <button
                onClick={handleBatchClose}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4" />
                一键关闭全部
              </button>
            )}
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
                          onChange={(e) => setAutoReplyContent(e.target.value)}
                          rows={3}
                          disabled={!canEdit}
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
                    包含企业OA、项目管理系统、代码仓库、数据库等核心账号
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
                disabled={closedPermissions < totalPermissions}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm',
                  closedPermissions >= totalPermissions
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                <Lock className="w-4 h-4" />
                {closedPermissions >= totalPermissions
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
    </div>
  );
}
