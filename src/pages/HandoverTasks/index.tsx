import { useState, useMemo } from 'react';
import {
  ListTodo,
  Search,
  Plus,
  ChevronDown,
  Edit2,
  CheckCircle2,
  Circle,
  ChevronRight,
  Calendar,
  User,
  Folder,
  FileText,
  Lightbulb,
  MoreHorizontal,
  X,
  Filter,
  Flag,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import CommentSection from '@/components/CommentSection';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/utils/date';
import type { HandoverTask } from '@/types';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
type CategoryFilter = 'all' | 'project' | 'document' | 'knowledge' | 'other';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

interface TaskFormData {
  title: string;
  description: string;
  category: 'project' | 'document' | 'knowledge' | 'other';
  assigneeId: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '已逾期' },
];

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'project', label: '项目' },
  { value: 'document', label: '文档' },
  { value: 'knowledge', label: '知识' },
  { value: 'other', label: '其他' },
];

const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const categoryIcons: Record<string, typeof Folder> = {
  project: Folder,
  document: FileText,
  knowledge: Lightbulb,
  other: MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  project: 'text-blue-600 bg-blue-50',
  document: 'text-green-600 bg-green-50',
  knowledge: 'text-purple-600 bg-purple-50',
  other: 'text-gray-600 bg-gray-50',
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const categoryLabels: Record<string, string> = {
  project: '项目',
  document: '文档',
  knowledge: '知识',
  other: '其他',
};

export default function HandoverTasksPage() {
  const {
    handoverTasks,
    employees,
    resignationForm,
    currentUser,
    addHandoverTask,
    updateHandoverTask,
    toggleHandoverTaskComplete,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HandoverTask | null>(null);

  const emptyForm: TaskFormData = {
    title: '',
    description: '',
    category: 'project',
    assigneeId: '',
    dueDate: '',
    priority: 'medium',
  };

  const [formData, setFormData] = useState<TaskFormData>(emptyForm);

  const filteredTasks = useMemo(() => {
    let result = [...handoverTasks];

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [handoverTasks, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const progress = useMemo(() => {
    if (handoverTasks.length === 0) return 0;
    const completed = handoverTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / handoverTasks.length) * 100);
  }, [handoverTasks]);

  const completedCount = handoverTasks.filter(t => t.status === 'completed').length;

  const getAssignee = (id: string) => employees.find(e => e.id === id);

  const handleOpenModal = (task?: HandoverTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        category: task.category,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        priority: task.priority,
      });
    } else {
      setEditingTask(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assigneeId || !formData.dueDate || !resignationForm) return;

    if (editingTask) {
      updateHandoverTask(editingTask.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        assigneeId: formData.assigneeId,
        dueDate: formData.dueDate,
        priority: formData.priority,
      });
    } else {
      addHandoverTask({
        formId: resignationForm.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        assigneeId: formData.assigneeId,
        status: 'pending',
        dueDate: formData.dueDate,
        priority: formData.priority,
      });
    }

    handleCloseModal();
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ListTodo className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">交接任务</h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            添加任务
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Flag className="w-4 h-4 text-gray-500" />
              整体进度
            </h3>
            <span className="text-sm font-medium text-gray-900">
              {completedCount}/{handoverTasks.length} 已完成
            </span>
          </div>
          <ProgressBar value={progress} showLabel size="lg" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务标题或描述..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown
                label="状态"
                value={statusFilter}
                options={statusOptions}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
              />
              <FilterDropdown
                label="分类"
                value={categoryFilter}
                options={categoryOptions}
                onChange={(v) => setCategoryFilter(v as CategoryFilter)}
              />
              <FilterDropdown
                label="优先级"
                value={priorityFilter}
                options={priorityOptions}
                onChange={(v) => setPriorityFilter(v as PriorityFilter)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">暂无符合条件的任务</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isTaskOverdue = task.status !== 'completed' && isOverdue(task.dueDate);
              const assignee = getAssignee(task.assigneeId);
              const CategoryIcon = categoryIcons[task.category] || MoreHorizontal;
              const isExpanded = expandedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'bg-white rounded-xl border shadow-sm overflow-hidden transition-all',
                    isTaskOverdue
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200 hover:shadow-md'
                  )}
                >
                  <div
                    className={cn(
                      'p-4 md:p-5 cursor-pointer',
                      isExpanded && !isTaskOverdue && 'bg-gray-50'
                    )}
                    onClick={() => toggleTaskExpand(task.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHandoverTaskComplete(task.id);
                          }}
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                            task.status === 'completed'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          )}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                                priorityColors[task.priority]
                              )}
                            >
                              {priorityLabels[task.priority]}优先级
                            </span>
                            {isTaskOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 gap-1">
                                <AlertCircle className="w-3 h-3" />
                                已逾期
                              </span>
                            )}
                            <StatusBadge status={isTaskOverdue ? 'overdue' : task.status} type="task" />
                          </div>
                          <h3 className={cn(
                            'text-base font-semibold mb-1',
                            task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                          )}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <div className="flex items-center gap-1.5 sm:justify-end">
                          <div className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center',
                            categoryColors[task.category]
                          )}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-gray-600">{categoryLabels[task.category]}</span>
                        </div>
                        {assignee && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                            <span className="text-xs text-gray-600">{assignee.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className={cn(
                            'text-xs',
                            isTaskOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                          )}>
                            {formatDate(task.dueDate, 'yyyy-MM-dd')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(task);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          编辑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHandoverTaskComplete(task.id);
                          }}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1',
                            task.status === 'completed'
                              ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                              : 'text-green-700 bg-green-100 hover:bg-green-200'
                          )}
                        >
                          {task.status === 'completed' ? (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              标记待处理
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              标记完成
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {isExpanded ? '收起详情' : '查看详情'}
                        <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200" style={{ height: '400px' }}>
                      <CommentSection category="task" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTask ? '编辑任务' : '添加任务'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  任务标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入任务标题"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  任务描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入任务描述"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskFormData['category'] })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="project">项目</option>
                    <option value="document">文档</option>
                    <option value="knowledge">知识</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    优先级 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskFormData['priority'] })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  负责人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">请选择负责人</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  截止日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!formData.title.trim() || !formData.assigneeId || !formData.dueDate}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    formData.title.trim() && formData.assigneeId && formData.dueDate
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {editingTask ? '保存修改' : '创建任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
      >
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        {label}: {selectedLabel}
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full min-w-[140px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                  value === option.value ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
