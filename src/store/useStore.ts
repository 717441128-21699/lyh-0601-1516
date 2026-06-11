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
  Attachment
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
  currentRole: Role;

  initializeData: () => void;
  switchRole: (role: string) => void;
  updateResignationForm: (data: Partial<ResignationForm>) => void;
  addHandoverTask: (task: Omit<HandoverTask, 'id'>) => void;
  updateHandoverTask: (id: string, data: Partial<HandoverTask>) => void;
  toggleHandoverTaskComplete: (id: string) => void;
  updateAssetItem: (id: string, data: Partial<AssetItem>) => void;
  updatePermissionItem: (id: string, data: Partial<PermissionItem>) => void;
  togglePermissionClosed: (id: string) => void;
  updateSettlementItem: (id: string, data: Partial<SettlementItem>) => void;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => void;
  removeAttachment: (id: string) => void;
  getOverallProgress: () => number;
  getPendingCountByRole: () => Record<string, number>;
  isAllCompleted: () => boolean;
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
      currentRole: 'employee',

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
          attachments: generateMockAttachments(form.id)
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
        const { resignationForm } = get();
        if (!resignationForm) return;

        set({
          resignationForm: {
            ...resignationForm,
            ...data,
            updatedAt: formatISO(new Date())
          }
        });
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
        const { handoverTasks } = get();
        const task = handoverTasks.find(t => t.id === id);
        if (!task) return;

        const isCompleted = task.status === 'completed';
        const updates: Partial<HandoverTask> = {
          status: isCompleted ? 'pending' : 'completed'
        };

        if (!isCompleted) {
          updates.completedAt = formatISO(new Date());
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
        set(state => ({
          assetItems: state.assetItems.map(item =>
            item.id === id ? { ...item, ...data } : item
          )
        }));
      },

      updatePermissionItem: (id: string, data: Partial<PermissionItem>) => {
        set(state => ({
          permissionItems: state.permissionItems.map(item =>
            item.id === id ? { ...item, ...data } : item
          )
        }));
      },

      togglePermissionClosed: (id: string) => {
        const { permissionItems, currentUser } = get();
        const item = permissionItems.find(p => p.id === id);
        if (!item) return;

        const updates: Partial<PermissionItem> = {
          closed: !item.closed
        };

        if (!item.closed) {
          updates.closedAt = formatISO(new Date());
          updates.closedBy = currentUser.id;
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

      updateSettlementItem: (id: string, data: Partial<SettlementItem>) => {
        set(state => ({
          settlementItems: state.settlementItems.map(item =>
            item.id === id ? { ...item, ...data } : item
          )
        }));
      },

      addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => {
        const newComment: Comment = {
          ...comment,
          id: 'comment-' + generateId(),
          createdAt: formatISO(new Date())
        };

        set(state => ({
          comments: [...state.comments, newComment]
        }));
      },

      addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => {
        const newAttachment: Attachment = {
          ...attachment,
          id: 'attach-' + generateId(),
          uploadedAt: formatISO(new Date())
        };

        set(state => ({
          attachments: [...state.attachments, newAttachment]
        }));
      },

      removeAttachment: (id: string) => {
        set(state => ({
          attachments: state.attachments.filter(a => a.id !== id)
        }));
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
        currentRole: state.currentRole
      })
    }
  )
);
