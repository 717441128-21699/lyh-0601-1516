import { cn } from '@/lib/utils';

type StatusBadgeType = 'task' | 'asset' | 'form' | 'settlement' | 'permission';

interface StatusBadgeProps {
  status: string;
  type?: StatusBadgeType;
  closed?: boolean;
}

const taskStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  in_progress: { label: '进行中', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-600 border-green-200' },
  overdue: { label: '已逾期', className: 'bg-red-50 text-red-600 border-red-200' },
};

const assetStatusMap: Record<string, { label: string; className: string }> = {
  not_returned: { label: '未归还', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  returned: { label: '已归还', className: 'bg-green-50 text-green-600 border-green-200' },
  damaged: { label: '已损坏', className: 'bg-orange-50 text-orange-600 border-orange-200' },
};

const formStatusMap: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: '待审核', className: 'bg-orange-50 text-orange-600 border-orange-200' },
  in_progress: { label: '进行中', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-600 border-green-200' },
  archived: { label: '已归档', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const settlementStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  confirmed: { label: '已确认', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  paid: { label: '已支付', className: 'bg-green-50 text-green-600 border-green-200' },
};

export default function StatusBadge({ status, type = 'task', closed }: StatusBadgeProps) {
  if (type === 'permission') {
    const isClosed = closed ?? (status === 'true' || status === 'closed');
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          isClosed
            ? 'bg-green-50 text-green-600 border-green-200'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        )}
      >
        {isClosed ? '已关闭' : '未关闭'}
      </span>
    );
  }

  let config: { label: string; className: string };

  switch (type) {
    case 'task':
      config = taskStatusMap[status] || taskStatusMap.pending;
      break;
    case 'asset':
      config = assetStatusMap[status] || assetStatusMap.not_returned;
      break;
    case 'form':
      config = formStatusMap[status] || formStatusMap.draft;
      break;
    case 'settlement':
      config = settlementStatusMap[status] || settlementStatusMap.pending;
      break;
    default:
      config = { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
