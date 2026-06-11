import { useState, useMemo, useEffect } from 'react';
import {
  Laptop,
  Monitor,
  Keyboard,
  Smartphone,
  HardDrive,
  CreditCard,
  User,
  Briefcase,
  Key,
  Package,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Lock,
  CheckSquare,
  Square,
  Archive
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import FileUpload from '@/components/FileUpload';
import CommentSection from '@/components/CommentSection';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import type { AssetItem } from '@/types';
import { formatISO } from 'date-fns';

const itDeviceIconMap: Record<string, React.ReactNode> = {
  '笔记本电脑': <Laptop className="w-4 h-4" />,
  '显示器': <Monitor className="w-4 h-4" />,
  '键盘鼠标': <Keyboard className="w-4 h-4" />,
  '手机': <Smartphone className="w-4 h-4" />,
  '其他IT设备': <HardDrive className="w-4 h-4" />,
};

const adminItemIconMap: Record<string, React.ReactNode> = {
  '门禁卡': <CreditCard className="w-4 h-4" />,
  '工牌': <User className="w-4 h-4" />,
  '办公用品': <Briefcase className="w-4 h-4" />,
  '钥匙': <Key className="w-4 h-4" />,
  '其他': <Package className="w-4 h-4" />,
};

const assetStatusFlow: Record<string, string> = {
  not_returned: 'returned',
  returned: 'damaged',
  damaged: 'not_returned',
};

function getDeviceType(name: string, category: 'it' | 'admin'): string {
  if (category === 'it') {
    if (name.includes('笔记本') || name.includes('MacBook') || name.includes('电脑')) return '笔记本电脑';
    if (name.includes('显示器') || name.includes('戴尔') || name.includes('屏幕')) return '显示器';
    if (name.includes('键盘') || name.includes('鼠标')) return '键盘鼠标';
    if (name.includes('手机') || name.includes('Phone')) return '手机';
    return '其他IT设备';
  } else {
    if (name.includes('门卡') || name.includes('门禁')) return '门禁卡';
    if (name.includes('工牌') || name.includes('Badge')) return '工牌';
    if (name.includes('办公') || name.includes('文具')) return '办公用品';
    if (name.includes('钥匙') || name.includes('Key')) return '钥匙';
    return '其他';
  }
}

function isAssetOverdue(asset: AssetItem, lastWorkingDay?: string): boolean {
  if (asset.status === 'returned' || !lastWorkingDay) return false;
  const now = new Date();
  const dueDate = new Date(lastWorkingDay);
  return now > dueDate;
}

export default function AssetReturn() {
  const {
    assetItems,
    currentRole,
    currentUser,
    resignationForm,
    updateAssetItem,
    batchUpdateAssetItems,
    addComment,
    employees,
  } = useStore();

  const [itExpanded, setItExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [itSelectedIds, setItSelectedIds] = useState<string[]>([]);
  const [adminSelectedIds, setAdminSelectedIds] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    category: 'it' | 'admin' | null;
    selectedAssets: AssetItem[];
  }>({ open: false, category: null, selectedAssets: [] });

  const canEditIt = currentRole === 'it' || currentRole === 'admin';
  const canEditAdmin = currentRole === 'admin';

  const itAssets = useMemo(
    () => assetItems.filter((a) => a.category === 'it'),
    [assetItems]
  );
  const adminAssets = useMemo(
    () => assetItems.filter((a) => a.category === 'admin'),
    [assetItems]
  );

  const totalAssets = assetItems.length;
  const returnedAssets = assetItems.filter((a) => a.status === 'returned').length;
  const progress = totalAssets > 0 ? Math.round((returnedAssets / totalAssets) * 100) : 0;

  const getEmployeeName = (id?: string) => {
    if (!id) return '-';
    const emp = employees.find((e) => e.id === id);
    return emp?.name || '-';
  };

  const handleStatusClick = (asset: AssetItem) => {
    const canEdit = asset.category === 'it' ? canEditIt : canEditAdmin;
    if (!canEdit) return;

    const nextStatus = assetStatusFlow[asset.status] as AssetItem['status'];
    const updates: Partial<AssetItem> = { status: nextStatus };

    if (nextStatus === 'returned') {
      updates.returnedAt = formatISO(new Date()).split('T')[0];
      updates.returnedBy = currentUser.id;
      
      if (asset.category === 'it') {
        setItSelectedIds(ids => ids.filter(id => id !== asset.id));
      } else {
        setAdminSelectedIds(ids => ids.filter(id => id !== asset.id));
      }
    } else {
      updates.returnedAt = undefined;
      updates.returnedBy = undefined;
    }

    updateAssetItem(asset.id, updates);
  };

  useEffect(() => {
    const returnedItIds = itAssets.filter(a => a.status === 'returned').map(a => a.id);
    const returnedAdminIds = adminAssets.filter(a => a.status === 'returned').map(a => a.id);
    
    setItSelectedIds(ids => ids.filter(id => !returnedItIds.includes(id)));
    setAdminSelectedIds(ids => ids.filter(id => !returnedAdminIds.includes(id)));
  }, [assetItems, itAssets, adminAssets]);

  const handleNoteEdit = (asset: AssetItem) => {
    setEditingNote(asset.id);
    setNoteValue(asset.notes || '');
  };

  const handleNoteSave = (id: string) => {
    updateAssetItem(id, { notes: noteValue.trim() });
    setEditingNote(null);
    setNoteValue('');
  };

  const handleNoteCancel = () => {
    setEditingNote(null);
    setNoteValue('');
  };

  const handleSelectItem = (asset: AssetItem) => {
    const canEdit = asset.category === 'it' ? canEditIt : canEditAdmin;
    if (!canEdit || asset.status === 'returned') return;

    const setSelected = asset.category === 'it' ? setItSelectedIds : setAdminSelectedIds;
    const selectedIds = asset.category === 'it' ? itSelectedIds : adminSelectedIds;

    if (selectedIds.includes(asset.id)) {
      setSelected(selectedIds.filter(id => id !== asset.id));
    } else {
      setSelected([...selectedIds, asset.id]);
    }
  };

  const handleSelectAll = (category: 'it' | 'admin') => {
    const assets = category === 'it' ? itAssets : adminAssets;
    const canEdit = category === 'it' ? canEditIt : canEditAdmin;
    if (!canEdit) return;

    const selectableIds = assets.filter(a => a.status !== 'returned').map(a => a.id);
    const setSelected = category === 'it' ? setItSelectedIds : setAdminSelectedIds;
    const selectedIds = category === 'it' ? itSelectedIds : adminSelectedIds;

    if (selectedIds.length === selectableIds.length) {
      setSelected([]);
    } else {
      setSelected(selectableIds);
    }
  };

  const handleBatchReturn = (category: 'it' | 'admin') => {
    const selectedIds = category === 'it' ? itSelectedIds : adminSelectedIds;
    const assets = category === 'it' ? itAssets : adminAssets;
    const selectedAssets = assets.filter(a => selectedIds.includes(a.id));

    setConfirmDialog({
      open: true,
      category,
      selectedAssets
    });
  };

  const handleConfirmBatchReturn = () => {
    const { category, selectedAssets } = confirmDialog;
    if (!category || selectedAssets.length === 0) return;

    const ids = selectedAssets.map(a => a.id);
    batchUpdateAssetItems(ids, { status: 'returned' });

    const assetNames = selectedAssets.map(a => a.name).join('、');
    const commentContent = `批量确认归还 ${selectedAssets.length} 项资产：${assetNames}`;
    addComment({
      formId: resignationForm?.id || '',
      authorId: currentUser.id,
      content: commentContent,
      category: 'asset'
    });

    if (category === 'it') {
      setItSelectedIds([]);
    } else {
      setAdminSelectedIds([]);
    }

    setConfirmDialog({ open: false, category: null, selectedAssets: [] });
  };

  const handleCancelBatchReturn = () => {
    setConfirmDialog({ open: false, category: null, selectedAssets: [] });
  };

  const renderAssetRow = (asset: AssetItem) => {
    const canEdit = asset.category === 'it' ? canEditIt : canEditAdmin;
    const deviceType = getDeviceType(asset.name, asset.category);
    const iconMap = asset.category === 'it' ? itDeviceIconMap : adminItemIconMap;
    const overdue = isAssetOverdue(asset, resignationForm?.lastWorkingDay);
    const selectedIds = asset.category === 'it' ? itSelectedIds : adminSelectedIds;
    const isSelected = selectedIds.includes(asset.id);
    const canSelect = canEdit && asset.status !== 'returned';

    return (
      <tr
        key={asset.id}
        className={cn(
          'border-b border-gray-100 last:border-b-0 transition-colors',
          overdue && asset.status !== 'returned' ? 'bg-red-50' : 'hover:bg-gray-50',
          isSelected && 'bg-blue-50/50'
        )}
      >
        <td className="px-4 py-3 w-12">
          <button
            onClick={() => handleSelectItem(asset)}
            disabled={!canSelect}
            className={cn(
              'focus:outline-none transition-colors',
              canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
            )}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </td>
        <td className="px-4 py-3 w-12">
          <input
            type="checkbox"
            checked={asset.status === 'returned'}
            readOnly
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{iconMap[deviceType] || <Package className="w-4 h-4" />}</span>
            <span className="text-sm font-medium text-gray-900">{asset.name}</span>
            {overdue && asset.status !== 'returned' && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{asset.serialNumber}</td>
        <td className="px-4 py-3">
          <button
            onClick={() => handleStatusClick(asset)}
            disabled={!canEdit}
            className={cn(
              'focus:outline-none transition-transform',
              canEdit ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'
            )}
            title={canEdit ? '点击切换状态' : '无权限编辑'}
          >
            <StatusBadge status={asset.status} type="asset" />
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {asset.returnedAt ? formatDate(asset.returnedAt, 'yyyy-MM-dd') : '-'}
          {asset.returnedBy && (
            <span className="text-xs text-gray-400 ml-1">({getEmployeeName(asset.returnedBy)})</span>
          )}
        </td>
        <td className="px-4 py-3">
          {editingNote === asset.id ? (
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
                onClick={() => handleNoteSave(asset.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleNoteCancel}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 flex-1">
                {asset.notes || <span className="text-gray-400">-</span>}
              </span>
              {canEdit && (
                <button
                  onClick={() => handleNoteEdit(asset)}
                  className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">资产归还</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              已归还 <span className="font-semibold text-green-600">{returnedAssets}</span> / {totalAssets}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <ProgressBar value={progress} showLabel color="blue" size="lg" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setItExpanded(!itExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-gray-900">IT资产</h2>
                <p className="text-xs text-gray-500">
                  共 {itAssets.length} 项，已归还 {itAssets.filter((a) => a.status === 'returned').length} 项
                </p>
              </div>
              {!canEditIt && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                  <Lock className="w-3 h-3" />
                  仅IT角色可编辑
                </span>
              )}
            </div>
            {itExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {itExpanded && (
            <>
              {canEditIt && (
                <div className="px-5 py-3 bg-gray-50/30 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => handleSelectAll('it')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {itSelectedIds.length === itAssets.filter(a => a.status !== 'returned').length && itAssets.filter(a => a.status !== 'returned').length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    {itSelectedIds.length === itAssets.filter(a => a.status !== 'returned').length && itAssets.filter(a => a.status !== 'returned').length > 0 ? '取消全选' : '全选'}
                  </button>
                  <button
                    onClick={() => handleBatchReturn('it')}
                    disabled={itSelectedIds.length === 0}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                      itSelectedIds.length > 0
                        ? 'text-white bg-green-600 hover:bg-green-700'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    )}
                  >
                    <Archive className="w-4 h-4" />
                    批量确认归还
                    {itSelectedIds.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                        {itSelectedIds.length}
                      </span>
                    )}
                  </button>
                  {itSelectedIds.length > 0 && (
                    <span className="text-sm text-gray-500">
                      已选择 {itSelectedIds.length} 项
                    </span>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left w-12">
                      <span className="text-xs font-semibold text-gray-500">选择</span>
                    </th>
                    <th className="px-4 py-3 text-left w-12">
                      <span className="text-xs font-semibold text-gray-500">状态</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      设备名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      编号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      归还日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itAssets.map(renderAssetRow)}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-gray-900">行政物品</h2>
                <p className="text-xs text-gray-500">
                  共 {adminAssets.length} 项，已归还 {adminAssets.filter((a) => a.status === 'returned').length} 项
                </p>
              </div>
              {!canEditAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                  <Lock className="w-3 h-3" />
                  仅管理员可编辑
                </span>
              )}
            </div>
            {adminExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {adminExpanded && (
            <>
              {canEditAdmin && (
                <div className="px-5 py-3 bg-gray-50/30 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => handleSelectAll('admin')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {adminSelectedIds.length === adminAssets.filter(a => a.status !== 'returned').length && adminAssets.filter(a => a.status !== 'returned').length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    {adminSelectedIds.length === adminAssets.filter(a => a.status !== 'returned').length && adminAssets.filter(a => a.status !== 'returned').length > 0 ? '取消全选' : '全选'}
                  </button>
                  <button
                    onClick={() => handleBatchReturn('admin')}
                    disabled={adminSelectedIds.length === 0}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                      adminSelectedIds.length > 0
                        ? 'text-white bg-green-600 hover:bg-green-700'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    )}
                  >
                    <Archive className="w-4 h-4" />
                    批量确认归还
                    {adminSelectedIds.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                        {adminSelectedIds.length}
                      </span>
                    )}
                  </button>
                  {adminSelectedIds.length > 0 && (
                    <span className="text-sm text-gray-500">
                      已选择 {adminSelectedIds.length} 项
                    </span>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left w-12">
                      <span className="text-xs font-semibold text-gray-500">选择</span>
                    </th>
                    <th className="px-4 py-3 text-left w-12">
                      <span className="text-xs font-semibold text-gray-500">状态</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      物品名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      编号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      归还日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminAssets.map(renderAssetRow)}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            交接凭证上传
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            上传资产交接凭证、签字扫描件等相关文件
          </p>
          <FileUpload category="asset" />
        </div>

        <div className="h-[500px]">
          <CommentSection category="asset" />
        </div>
      </div>

      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                确认批量归还
              </h3>
            </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                您即将确认归还以下 <span className="font-semibold text-gray-900">{confirmDialog.selectedAssets.length}</span> 项资产：
              </p>
              <div className="space-y-2">
                {confirmDialog.selectedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      {asset.category === 'it'
                        ? itDeviceIconMap[getDeviceType(asset.name, 'it')] || <Package className="w-4 h-4" />
                        : adminItemIconMap[getDeviceType(asset.name, 'admin')] || <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{asset.serialNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>注意：</strong>此操作将把选中的资产状态更新为"已归还"，并自动记录操作人和时间。
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelBatchReturn}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmBatchReturn}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认归还
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
