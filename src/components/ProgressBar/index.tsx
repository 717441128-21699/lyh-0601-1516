import { cn } from '@/lib/utils';

type ProgressBarSize = 'sm' | 'md' | 'lg';
type ProgressBarColor = 'blue' | 'green' | 'orange' | 'red';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  color?: ProgressBarColor;
  size?: ProgressBarSize;
}

const sizeMap: Record<ProgressBarSize, { height: string; text: string }> = {
  sm: { height: 'h-1.5', text: 'text-xs' },
  md: { height: 'h-2.5', text: 'text-sm' },
  lg: { height: 'h-4', text: 'text-sm' },
};

const colorMap: Record<ProgressBarColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

export default function ProgressBar({
  value,
  showLabel = false,
  color = 'blue',
  size = 'md',
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  const sizeConfig = sizeMap[size];
  const colorClass = colorMap[color];

  let autoColor = colorClass;
  if (color === 'blue') {
    if (safeValue >= 100) autoColor = colorMap.green;
    else if (safeValue < 30) autoColor = colorMap.orange;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className={cn('text-gray-600 font-medium', sizeConfig.text)}>
            {Math.round(safeValue)}%
          </span>
        )}
      </div>
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeConfig.height)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            autoColor
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
