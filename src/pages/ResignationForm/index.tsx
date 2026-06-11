import { useState, useMemo } from 'react';
import {
  User,
  Building2,
  Briefcase,
  Calendar,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  UserCheck,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import CommentSection from '@/components/CommentSection';
import { cn } from '@/lib/utils';
import { formatDate, isOverdue } from '@/utils/date';
import type { ResignationForm as ResignationFormType, Employee } from '@/types';

const resignationReasons = [
  '个人发展',
  '薪资待遇',
  '工作环境',
  '家庭原因',
  '其他',
];

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export default function ResignationFormPage() {
  const {
    resignationForm,
    employees,
    currentUser,
    updateResignationForm,
  } = useStore();

  const [form, setForm] = useState<Partial<ResignationFormType>>({
    reason: resignationForm?.reason || '',
    lastWorkingDay: resignationForm?.lastWorkingDay || '',
    handoverPersonId: resignationForm?.handoverPersonId || '',
    employeeTodos: resignationForm?.employeeTodos || [],
    supervisorNotes: resignationForm?.supervisorNotes || '',
  });

  const [newTodo, setNewTodo] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    (resignationForm?.employeeTodos || []).map((text, index) => ({
      id: `todo-${index}`,
      text,
      completed: false,
      dueDate: resignationForm?.lastWorkingDay,
    }))
  );
  const [expandedReason, setExpandedReason] = useState(false);
  const [expandedHandover, setExpandedHandover] = useState(false);

  const employee = useMemo<Employee | undefined>(() => {
    return employees.find(e => e.id === resignationForm?.employeeId);
  }, [employees, resignationForm]);

  const supervisor = useMemo<Employee | undefined>(() => {
    return employees.find(e => e.id === resignationForm?.supervisorId);
  }, [employees, resignationForm]);

  const handoverPerson = useMemo<Employee | undefined>(() => {
    return employees.find(e => e.id === form.handoverPersonId);
  }, [employees, form.handoverPersonId]);

  const availableHandoverPersons = useMemo(() => {
    return employees.filter(e => e.id !== resignationForm?.employeeId);
  }, [employees, resignationForm]);

  const isSupervisor = currentUser.role === 'supervisor';

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
      dueDate: form.lastWorkingDay,
    };
    setTodos([...todos, newItem]);
    setNewTodo('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleRemoveTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleSave = () => {
    if (!resignationForm) return;
    updateResignationForm({
      reason: form.reason,
      lastWorkingDay: form.lastWorkingDay,
      handoverPersonId: form.handoverPersonId,
      employeeTodos: todos.map(t => t.text),
      supervisorNotes: form.supervisorNotes,
    });
  };

  const handleSupervisorConfirm = () => {
    if (!resignationForm) return;
    updateResignationForm({
      status: 'in_progress',
      supervisorNotes: form.supervisorNotes,
    });
  };

  if (!resignationForm || !employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">离职申请单</h1>
            <StatusBadge status={resignationForm.status} type="form" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              保存草稿
            </button>
            {isSupervisor && resignationForm.status === 'pending' && (
              <button
                onClick={handleSupervisorConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                确认审核
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              员工信息
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">姓名</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">部门</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{employee.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">职位</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{employee.position}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">入职日期</p>
                  <p className="text-sm font-medium text-gray-900 truncate">2022-03-15</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              离职信息
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  离职原因 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExpandedReason(!expandedReason)}
                    className="w-full px-3 py-2.5 text-sm text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span className={cn(!form.reason && 'text-gray-400')}>
                      {form.reason || '请选择离职原因'}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', expandedReason && 'rotate-180')} />
                  </button>
                  {expandedReason && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {resignationReasons.map(reason => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, reason });
                            setExpandedReason(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg',
                            form.reason === reason && 'bg-blue-50 text-blue-600'
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  最后工作日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.lastWorkingDay}
                  onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  交接人 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExpandedHandover(!expandedHandover)}
                    className="w-full px-3 py-2.5 text-sm text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span className={cn(!form.handoverPersonId && 'text-gray-400')}>
                      {handoverPerson?.name || '请选择交接人'}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', expandedHandover && 'rotate-180')} />
                  </button>
                  {expandedHandover && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableHandoverPersons.map(person => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, handoverPersonId: person.id });
                            setExpandedHandover(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2',
                            form.handoverPersonId === person.id && 'bg-blue-50 text-blue-600'
                          )}
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-600">{person.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{person.name}</p>
                            <p className="text-xs text-gray-500 truncate">{person.department} · {person.position}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  直属上级
                </label>
                <div className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {supervisor ? `${supervisor.name} (${supervisor.position})` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-500" />
                员工待办事项
              </h2>
              <span className="text-xs text-gray-500">
                {todos.filter(t => t.completed).length}/{todos.length} 已完成
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="输入新的待办事项..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddTodo}
                disabled={!newTodo.trim()}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  newTodo.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>

            {todos.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无待办事项</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo, index) => {
                  const isOverdueItem = todo.dueDate && isOverdue(todo.dueDate) && !todo.completed;
                  return (
                    <li
                      key={todo.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        todo.completed
                          ? 'bg-green-50 border-green-100'
                          : isOverdueItem
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTodo(todo.id)}
                        className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                          todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        )}
                      >
                        {todo.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span className={cn(
                        'flex-1 text-sm',
                        todo.completed && 'line-through text-gray-500',
                        isOverdueItem && 'text-red-600 font-medium'
                      )}>
                        {index + 1}. {todo.text}
                      </span>
                      {isOverdueItem && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          逾期
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTodo(todo.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gray-500" />
              上级审核
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                项目交接清单
                {!isSupervisor && <span className="text-xs text-gray-500 ml-2">（仅主管可编辑）</span>}
              </label>
              <textarea
                value={form.supervisorNotes}
                onChange={(e) => isSupervisor && setForm({ ...form, supervisorNotes: e.target.value })}
                readOnly={!isSupervisor}
                rows={5}
                placeholder={isSupervisor ? '请填写项目交接注意事项、待办清单等...' : '暂无主管备注'}
                className={cn(
                  'w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none resize-none',
                  isSupervisor
                    ? 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                )}
              />
            </div>
            {isSupervisor && resignationForm.status === 'pending' && (
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={handleSupervisorConfirm}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  确认审核通过
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <CommentSection category="general" />
        </div>
      </div>
    </div>
  );
}
