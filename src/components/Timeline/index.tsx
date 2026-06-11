import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type TimelineStatus = 'completed' | 'current' | 'pending';

interface TimelineItem {
  title: string;
  description?: string;
  status: TimelineStatus;
  date?: string;
  role?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

const statusConfig: Record<TimelineStatus, {
  dotClass: string;
  lineClass: string;
  textClass: string;
  titleClass: string;
}> = {
  completed: {
    dotClass: 'bg-green-500 border-green-500 text-white',
    lineClass: 'bg-green-500',
    textClass: 'text-gray-500',
    titleClass: 'text-gray-900',
  },
  current: {
    dotClass: 'bg-blue-500 border-blue-500 text-white',
    lineClass: 'bg-gray-200',
    textClass: 'text-gray-600',
    titleClass: 'text-blue-600 font-semibold',
  },
  pending: {
    dotClass: 'bg-white border-gray-300 text-gray-400',
    lineClass: 'bg-gray-200 border-dashed border-t-2',
    textClass: 'text-gray-400',
    titleClass: 'text-gray-400',
  },
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const config = statusConfig[item.status];
        const isCurrent = item.status === 'current';

        return (
          <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[11px] top-6 w-0.5 -translate-x-1/2',
                  item.status === 'pending' ? 'border-dashed border-t-2 border-gray-200' : config.lineClass
                )}
                style={{ height: 'calc(100% - 24px)' }}
              />
            )}

            <div className="relative z-10 flex-shrink-0">
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                  config.dotClass,
                  isCurrent && 'animate-pulse shadow-lg shadow-blue-500/30'
                )}
              >
                {item.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className={cn('text-sm', config.titleClass)}>{item.title}</h4>
                {item.role && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {item.role}
                  </span>
                )}
              </div>
              {item.description && (
                <p className={cn('text-sm mb-1', config.textClass)}>{item.description}</p>
              )}
              {item.date && (
                <p className="text-xs text-gray-400">{item.date}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
