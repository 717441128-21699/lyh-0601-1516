import { useState, useMemo } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/utils/date';
import type { Comment } from '@/types';

type CommentCategory = 'general' | 'task' | 'asset' | 'permission' | 'settlement';

interface CommentSectionProps {
  category?: CommentCategory;
}

const categoryLabels: Record<CommentCategory, string> = {
  general: '全部',
  task: '任务',
  asset: '资产',
  permission: '权限',
  settlement: '结算',
};

const categoryColors: Record<CommentCategory, string> = {
  general: 'bg-gray-100 text-gray-600',
  task: 'bg-blue-100 text-blue-600',
  asset: 'bg-orange-100 text-orange-600',
  permission: 'bg-purple-100 text-purple-600',
  settlement: 'bg-green-100 text-green-600',
};

const roleLabels: Record<string, string> = {
  admin: '管理员',
  hr: 'HR',
  supervisor: '主管',
  employee: '员工',
  it: 'IT',
  finance: '财务',
};

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function CommentSection({ category }: CommentSectionProps) {
  const { comments, employees, currentUser, resignationForm, addComment } = useStore();
  const [content, setContent] = useState('');
  const [filterCategory, setFilterCategory] = useState<CommentCategory | 'all'>(category || 'all');

  const filteredComments = useMemo(() => {
    let result = [...comments];
    if (resignationForm) {
      result = result.filter(c => c.formId === resignationForm.id);
    }
    if (filterCategory !== 'all') {
      result = result.filter(c => c.category === filterCategory);
    }
    return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments, resignationForm, filterCategory]);

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !resignationForm) return;

    addComment({
      formId: resignationForm.id,
      authorId: currentUser.id,
      content: content.trim(),
      category: category || 'general',
    });
    setContent('');
  };

  const categories: (CommentCategory | 'all')[] = ['all', 'general', 'task', 'asset', 'permission', 'settlement'];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">评论交流</h3>
          <span className="text-sm text-gray-500">({filteredComments.length})</span>
        </div>
        {!category && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                  filterCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat === 'all' ? '全部' : categoryLabels[cat]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">暂无评论</p>
          </div>
        ) : (
          filteredComments.map((comment: Comment) => {
            const author = getEmployee(comment.authorId);
            const isCurrentUser = author?.id === currentUser.id;

            return (
              <div
                key={comment.id}
                className={cn(
                  'flex gap-3',
                  isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className="flex-shrink-0">
                  {author?.avatar ? (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
                        author ? getAvatarColor(author.name) : 'bg-gray-400'
                      )}
                    >
                      {author ? author.name.charAt(0) : <User className="w-4 h-4" />}
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'flex-1 max-w-[80%]',
                    isCurrentUser ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2 mb-1',
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {author?.name || '未知用户'}
                    </span>
                    {author && (
                      <span className="text-xs text-gray-400">
                        {roleLabels[author.role] || author.role}
                      </span>
                    )}
                    {comment.category !== 'general' && (
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          categoryColors[comment.category] || categoryColors.general
                        )}
                      >
                        {categoryLabels[comment.category] || comment.category}
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      isCurrentUser
                        ? 'bg-blue-500 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    )}
                  >
                    {comment.content}
                  </div>

                  <div
                    className={cn(
                      'text-xs text-gray-400 mt-1',
                      isCurrentUser ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatDate(comment.createdAt, 'MM-dd HH:mm')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入评论..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              content.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </div>
      </form>
    </div>
  );
}
