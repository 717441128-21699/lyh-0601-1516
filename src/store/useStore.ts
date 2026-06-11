import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Employee,
  ResignationForm,
  HandoverTask,
  AssetItem,
  PermissionItem,
  SettlementItem,
  Comment,
  Attachment,
  AuditLog
} from '../types';
import {
  generateMockEmployees,
  generateMockResignationForm,
  generateMockHandoverTasks,
  generateMockAssetItems,
  generateMockPermissionItems,
  generateMockSettlementItems,
  generateMockComments,
  generateMockAttachments
} from '../utils/mock';
import { formatISO } from 'date-fns';

type Role = 'employee' | 'supervisor' | 'it' | 'admin' | 'finance' | 'hr';
type AuditAction = 'form_saved' | 'form_submitted' | 'supervisor_approved' | 'task_completed' | 'asset_returned' | 'permission_closed' | 'settlement_confirmed' | 'hr_archived' | 'comment_added' | 'attachment_uploaded' | 'batch_operation';
type AuditModule = 'general' | 'task' | 'asset' | 'permission' | 'settlement' | 'form' | 'archive';

interface StoreState {
  currentUser: Employee;
  employees: Employee[];
  resignationForm: ResignationForm | null;
  handoverTasks: HandoverTask[];
  assetItems: AssetItem[];
  permissionItems: PermissionItem[];
  settlementItems: SettlementItem[];
  comments: Comment[];
  attachments: Attachment[];
  auditLogs: AuditLog[];
  currentRole: Role;
  settlementConfirmed: boolean;

  initializeData: () => void;
  switchRole: (role: string) => void;
  updateResignationForm: (data: Partial<ResignationForm>) => void;
  addHandoverTask: (task: Omit<HandoverTask, 'id'>) => void;
  updateHandoverTask: (id: string, data: Partial<HandoverTask>) => void;
  toggleHandoverTaskComplete: (id: string) => void;
  updateAssetItem: (id: string, data: Partial<AssetItem>) => void;
  batchUpdateAssetItems: (ids: string[], data: Partial<AssetItem>) => void;
  updatePermissionItem: (id: string, data: Partial<PermissionItem>) => void;
  togglePermissionClosed: (id: string) => void;
  batchClosePermissions: (ids: string[]) => void;
  updateSettlementItem: (id: string, data: Partial<SettlementItem>) => void;
  confirmSettlement: () => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => void;
  removeAttachment: (id: string) => void;
  addAuditLog: (action: AuditAction, module: AuditModule, details: string, affectedItems?: string[]) => void;
  archiveResignation: () => void;
  getOverallProgress: () => number;
  getPendingCountByRole: () => Record<string, number>;
  isAllCompleted: () => boolean;
  getSettlementProgress: () => number;
  getUncompletedModules: () => string[];
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: {
        id: '',
        name: '',
        department: '',
        position: '',
        email: '',
        role: 'employee'
      },
      employees: [],
      resignationForm: null,
      handoverTasks: [],
      assetItems: [],
      permissionItems: [],
      settlementItems: [],
      comments: [],
      attachments: [],
      auditLogs: [],
      currentRole: 'employee',
      settlementConfirmed: false,

      addAuditLog: (action: AuditAction, module: AuditModule, details: string, affectedItems?: string[]) => {
        const { currentUser } = get();
        const newLog: AuditLog = {
          id: 'log-' + generateId(),
          formId: get().resignationForm?.id || '',
          action,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          timestamp: formatISO(new Date()),
          details,
          module,
          affectedItems
        };

        set(state => ({
          auditLogs: [newLog, ...state.auditLogs]
        }));
      },

      initializeData: () => {
        const employees = generateMockEmployees();
        const form = generateMockResignationForm();
        const currentUser = employees[0];

        set({
          employees,
          currentUser,
          currentRole: currentUser.role as Role,
          resignationForm: form,
          handoverTasks: generateMockHandoverTasks(form.id),
          assetItems: generateMockAssetItems(form.id),
          permissionItems: generateMockPermissionItems(form.id),
          settlementItems: generateMockSettlementItems(form.id),
          comments: generateMockComments(form.id),
          attachments: generateMockAttachments(form.id),
          auditLogs: [],
          settlementConfirmed: false
        });
      },

      switchRole: (role: string) => {
        const validRoles: Role[] = ['employee', 'supervisor', 'it', 'admin', 'finance', 'hr'];
        if (!validRoles.includes(role as Role)) return;

        const { employees } = get();
        const targetRole = role as Role;
        const user = employees.find(emp => emp.role === targetRole);

        set({
          currentRole: targetRole,
          currentUser: user || get().currentUser
        });
      },

      updateResignationForm: (data: Partial<ResignationForm>) => {
        const { resignationForm, addAuditLog } = get();
        if (!resignationForm) return;

        set({
          resignationForm: {
            ...resignationForm,
            ...data,
            updatedAt: formatISO(new Date())
          }
        });

        if (data.status === 'pending') {
          addAuditLog('form_submitted', 'form', '离职申请已提交，等待主管审核');
        }
        if (data.status === 'in_progress') {
          addAuditLog('supervisor_approved', 'form', '主管已审核通过，交接流程开始');
        }
      },

      addHandoverTask: (task: Omit<HandoverTask, 'id'>) => {
        const newTask: HandoverTask = {
          ...task,
          id: 'task-' + generateId()
        };

        set(state => ({
          handoverTasks: [...state.handoverTasks, newTask]
        }));
      },

      updateHandoverTask: (id: string, data: Partial<HandoverTask>) => {
        set(state => ({
          handoverTasks: state.handoverTasks.map(task =>
            task.id === id ? { ...task, ...data } : task
          )
        }));
      },

      toggleHandoverTaskComplete: (id: string) => {
        const { handoverTasks, addAuditLog } = get();
        const task = handoverTasks.find(t => t.id === id);
        if (!task) return;

        const isCompleted = task.status === 'completed';
        const updates: Partial<HandoverTask> = {
          status: isCompleted ? 'pending' : 'completed'
        };

        if (!isCompleted) {
          updates.completedAt = formatISO(new Date());
          addAuditLog('task_completed', 'task', `交接任务"${task.title}"已完成`, [id]);
        } else {
          updates.completedAt = undefined;
        }

        set({
          handoverTasks: handoverTasks.map(t =>
            t.id === id ? { ...t, ...updates } : t
          )
        });
      },

      updateAssetItem: (id: string, data: Partial<AssetItem>) => {
        const { addAuditLog, assetItems, currentUser } = get();
        const item = assetItems.find(a => a.id === id);

        set(state => ({
          assetItems: state.assetItems.map(item =>
            item.id === id ? { 
              ...item, 
              ...data,
              ...(data.status === 'returned' && !item?.returnedAt ? { 
                returnedAt: formatISO(new Date()), 
                returnedBy: currentUser.id 
              } : {})
            } : item
          )
        }));

        if (data.status === 'returned' && item?.status !== 'returned') {
          addAuditLog('asset_returned', 'asset', `资产"${item?.name}"已归还`, [id]);
        }
      },

      batchUpdateAssetItems: (ids: string[], data: Partial<AssetItem>) => {
        const { addAuditLog, assetItems, currentUser } = get();
        const now = formatISO(new Date());
        const updatedItems = assetItems.map(item => {
          if (ids.includes(item.id)) {
            const updates = { ...item, ...data };
            if (data.status === 'returned' && !item.returnedAt) {
              updates.returnedAt = now;
              updates.returnedBy = currentUser.id;
            }
            return updates;
          }
          return item;
        });

        set({ assetItems: updatedItems });

        const affectedNames = updatedItems
          .filter(i => ids.includes(i.id))
          .map(i => i.name)
          .join('、');
        
        if (data.status === 'returned') {
          addAuditLog('batch_operation', 'asset', `批量确认归还资产：${affectedNames}`, ids);
        }
      },

      updatePermissionItem: (id: string, data: Partial<PermissionItem>) => {
        set(state => ({
          permissionItems: state.permissionItems.map(item =>
            item.id === id ? { ...item, ...data } : item
          )
        }));
      },

      togglePermissionClosed: (id: string) => {
        const { permissionItems, currentUser, addAuditLog } = get();
        const item = permissionItems.find(p => p.id === id);
        if (!item) return;

        const updates: Partial<PermissionItem> = {
          closed: !item.closed
        };

        if (!item.closed) {
          updates.closedAt = formatISO(new Date());
          updates.closedBy = currentUser.id;
          addAuditLog('permission_closed', 'permission', `权限"${item.name}"已关闭`, [id]);
        } else {
          updates.closedAt = undefined;
          updates.closedBy = undefined;
        }

        set({
          permissionItems: permissionItems.map(p =>
            p.id === id ? { ...p, ...updates } : p
          )
        });
      },

      batchClosePermissions: (ids: string[]) => {
        const { addAuditLog, permissionItems, currentUser } = get();
        const now = formatISO(new Date());
        const updatedItems = permissionItems.map(item => {
          if (ids.includes(item.id) && !item.closed) {
            return {
              ...item,
              closed: true,
              closedAt: now,
              closedBy: currentUser.id
            };
          }
          return item;
        });

        set({ permissionItems: updatedItems });

        const affectedNames = updatedItems
          .filter(i => ids.includes(i.id))
          .map(i => i.name)
          .join('、');

        addAuditLog('batch_operation', 'permission', `批量关闭权限：${affectedNames}`, ids);
      },

      updateSettlementItem: (id: string, data: Partial<SettlementItem>) => {
        const { settlementItems, currentUser, addAuditLog } = get();
        const item = settlementItems.find(s => s.id === id);

        set(state => ({
          settlementItems: state.settlementItems.map(item =>
            item.id === id ? { 
              ...item, 
              ...data,
              ...(data.status && data.status !== 'pending' && !item?.confirmedAt ? {
                confirmedAt: formatISO(new Date()),
                confirmedBy: currentUser.id
              } : {})
            } : item
          )
        }));

        if (data.status && data.status !== 'pending' && item?.status === 'pending') {
          addAuditLog('settlement_confirmed', 'settlement', `结算项"${item.description}"已确认`, [id]);
        }
      },

      confirmSettlement: () => {
        const { settlementItems, currentUser, addAuditLog } = get();
        const now = formatISO(new Date());

        const updatedItems = settlementItems.map(item => {
          if (item.status === 'pending') {
            return {
              ...item,
              status: 'confirmed' as const,
              confirmedAt: now,
              confirmedBy: currentUser.id
            };
          }
          return item;
        });

        set({ 
          settlementItems: updatedItems,
          settlementConfirmed: true,
          resignationForm: get().resignationForm ? {
            ...get().resignationForm!,
            status: 'completed',
            updatedAt: now
          } : null
        });

        addAuditLog('settlement_confirmed', 'settlement', '财务已完成全部结算确认，包括薪资、借款、报销、年假折算及补偿金');
      },

      addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => {
        const { addAuditLog } = get();
        const newComment: Comment = {
          ...comment,
          id: 'comment-' + generateId(),
          createdAt: formatISO(new Date())
        };

        set(state => ({
          comments: [...state.comments, newComment]
        }));

        addAuditLog('comment_added', comment.category, `添加了新的意见备注`);
      },

      addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => {
        const { addAuditLog } = get();
        const newAttachment: Attachment = {
          ...attachment,
          id: 'attach-' + generateId(),
          uploadedAt: formatISO(new Date())
        };

        set(state => ({
          attachments: [...state.attachments, newAttachment]
        }));

        addAuditLog('attachment_uploaded', 'general', `上传了附件：${attachment.name}`);
      },

      removeAttachment: (id: string) => {
        set(state => ({
          attachments: state.attachments.filter(a => a.id !== id)
        }));
      },

      archiveResignation: () => {
        const { addAuditLog } = get();
        const now = formatISO(new Date());

        set({
          resignationForm: get().resignationForm ? {
            ...get().resignationForm!,
            status: 'archived',
            updatedAt: now
          } : null
        });

        addAuditLog('hr_archived', 'archive', 'HR已完成最终归档，离职交接流程结束');
      },

      getOverallProgress: () => {
        const state = get();
        const totalItems: number[] = [];
        const completedItems: number[] = [];

        if (state.resignationForm) {
          totalItems.push(1);
          const formStatuses = ['completed', 'archived'];
          completedItems.push(formStatuses.includes(state.resignationForm.status) ? 1 : 0);
        }

        if (state.handoverTasks.length > 0) {
          totalItems.push(state.handoverTasks.length);
          completedItems.push(
            state.handoverTasks.filter(t => t.status === 'completed').length
          );
        }

        if (state.assetItems.length > 0) {
          totalItems.push(state.assetItems.length);
          completedItems.push(
            state.assetItems.filter(a => a.status === 'returned').length
          );
        }

        if (state.permissionItems.length > 0) {
          totalItems.push(state.permissionItems.length);
          completedItems.push(
            state.permissionItems.filter(p => p.closed).length
          );
        }

        if (state.settlementItems.length > 0) {
          totalItems.push(state.settlementItems.length);
          completedItems.push(
            state.settlementItems.filter(s => ['confirmed', 'paid'].includes(s.status)).length
          );
        }

        const total = totalItems.reduce((sum, count) => sum + count, 0);
        const completed = completedItems.reduce((sum, count) => sum + count, 0);

        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
      },

      getSettlementProgress: () => {
        const state = get();
        if (state.settlementItems.length === 0) return 0;
        const completed = state.settlementItems.filter(s => 
          ['confirmed', 'paid'].includes(s.status)
        ).length;
        return Math.round((completed / state.settlementItems.length) * 100);
      },

      getUncompletedModules: () => {
        const state = get();
        const modules: string[] = [];

        if (state.resignationForm && !['completed', 'archived'].includes(state.resignationForm.status)) {
          modules.push('离职单');
        }
        if (state.handoverTasks.some(t => t.status !== 'completed')) {
          modules.push('交接任务');
        }
        if (state.assetItems.some(a => a.status !== 'returned')) {
          modules.push('资产归还');
        }
        if (state.permissionItems.some(p => !p.closed)) {
          modules.push('权限关闭');
        }
        if (state.settlementItems.some(s => !['confirmed', 'paid'].includes(s.status))) {
          modules.push('结算确认');
        }

        return modules;
      },

      getPendingCountByRole: () => {
        const state = get();
        const counts: Record<string, number> = {
          employee: 0,
          supervisor: 0,
          it: 0,
          admin: 0,
          finance: 0,
          hr: 0
        };

        if (state.resignationForm && state.resignationForm.status === 'draft') {
          counts.employee += 1;
        }
        if (state.resignationForm && state.resignationForm.status === 'pending') {
          counts.supervisor += 1;
        }

        state.handoverTasks.forEach(task => {
          if (task.status !== 'completed') {
            const assignee = state.employees.find(e => e.id === task.assigneeId);
            if (assignee) {
              counts[assignee.role] = (counts[assignee.role] || 0) + 1;
            }
          }
        });

        state.assetItems.forEach(item => {
          if (item.status !== 'returned') {
            if (item.category === 'it') {
              counts.it += 1;
            } else if (item.category === 'admin') {
              counts.admin += 1;
            }
          }
        });

        state.permissionItems.forEach(item => {
          if (!item.closed) {
            counts.it += 1;
          }
        });

        state.settlementItems.forEach(item => {
          if (!['confirmed', 'paid'].includes(item.status)) {
            counts.finance += 1;
          }
        });

        if (state.resignationForm && state.resignationForm.status !== 'archived') {
          const allTasksDone = state.handoverTasks.every(t => t.status === 'completed');
          const allAssetsReturned = state.assetItems.every(a => a.status === 'returned');
          const allPermissionsClosed = state.permissionItems.every(p => p.closed);
          const allSettlementsDone = state.settlementItems.every(s => ['confirmed', 'paid'].includes(s.status));

          if (allTasksDone && allAssetsReturned && allPermissionsClosed && allSettlementsDone) {
            counts.hr += 1;
          }
        }

        return counts;
      },

      isAllCompleted: () => {
        const state = get();

        if (!state.resignationForm) return false;
        if (!['completed', 'archived'].includes(state.resignationForm.status)) return false;

        if (state.handoverTasks.some(t => t.status !== 'completed')) return false;
        if (state.assetItems.some(a => a.status !== 'returned')) return false;
        if (state.permissionItems.some(p => !p.closed)) return false;
        if (state.settlementItems.some(s => !['confirmed', 'paid'].includes(s.status))) return false;

        return true;
      }
    }),
    {
      name: 'hr-resignation-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        employees: state.employees,
        resignationForm: state.resignationForm,
        handoverTasks: state.handoverTasks,
        assetItems: state.assetItems,
        permissionItems: state.permissionItems,
        settlementItems: state.settlementItems,
        comments: state.comments,
        attachments: state.attachments,
        auditLogs: state.auditLogs,
        currentRole: state.currentRole,
        settlementConfirmed: state.settlementConfirmed
      })
    }
  )
);
