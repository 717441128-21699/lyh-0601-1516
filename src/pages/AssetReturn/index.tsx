import { useState, useMemo } from 'react';
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
  Lock
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
    employees,
  } = useStore();

  const [itExpanded, setItExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');

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
    } else {
      updates.returnedAt = undefined;
      updates.returnedBy = undefined;
    }

    updateAssetItem(asset.id, updates);
  };

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

  const renderAssetRow = (asset: AssetItem) => {
    const canEdit = asset.category === 'it' ? canEditIt : canEditAdmin;
    const deviceType = getDeviceType(asset.name, asset.category);
    const iconMap = asset.category === 'it' ? itDeviceIconMap : adminItemIconMap;
    const overdue = isAssetOverdue(asset, resignationForm?.lastWorkingDay);

    return (
      <tr
        key={asset.id}
        className={cn(
          'border-b border-gray-100 last:border-b-0 transition-colors',
          overdue && asset.status !== 'returned' ? 'bg-red-50' : 'hover:bg-gray-50'
        )}
      >
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left w-12"></th>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left w-12"></th>
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
    </div>
  );
}
