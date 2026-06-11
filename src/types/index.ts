export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  role: 'admin' | 'hr' | 'supervisor' | 'employee' | 'it' | 'finance';
  avatar?: string;
}

export interface ResignationForm {
  id: string;
  employeeId: string;
  reason: string;
  lastWorkingDay: string;
  handoverPersonId: string;
  supervisorId: string;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  employeeTodos: string[];
  supervisorNotes: string;
}

export interface HandoverTask {
  id: string;
  formId: string;
  title: string;
  description: string;
  category: 'project' | 'document' | 'knowledge' | 'other';
  assigneeId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  completedAt?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AssetItem {
  id: string;
  formId: string;
  category: 'it' | 'admin';
  name: string;
  serialNumber: string;
  status: 'not_returned' | 'returned' | 'damaged';
  returnedAt?: string;
  returnedBy?: string;
  notes?: string;
}

export interface PermissionItem {
  id: string;
  formId: string;
  type: 'account' | 'email' | 'vpn' | 'system' | 'database';
  name: string;
  closed: boolean;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export interface SettlementItem {
  id: string;
  formId: string;
  type: 'loan' | 'reimbursement' | 'salary' | 'annual_leave' | 'compensation';
  description: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'paid';
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface Comment {
  id: string;
  formId: string;
  authorId: string;
  content: string;
  createdAt: string;
  category: 'general' | 'task' | 'asset' | 'permission' | 'settlement';
}

export interface Attachment {
  id: string;
  formId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  dataUrl?: string;
}
