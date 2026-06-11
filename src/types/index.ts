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

export interface AuditLog {
  id: string;
  formId: string;
  action: 'form_saved' | 'form_submitted' | 'supervisor_approved' | 'supervisor_notes_updated' | 'task_completed' | 'asset_returned' | 'permission_closed' | 'settlement_confirmed' | 'hr_archived' | 'comment_added' | 'attachment_uploaded' | 'batch_operation' | 'signoff_completed' | 'checklist_updated' | 'exception_noted' | 'rectification_created' | 'rectification_completed' | 'rectification_updated';
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  timestamp: string;
  details: string;
  module: 'general' | 'task' | 'asset' | 'permission' | 'settlement' | 'form' | 'archive' | 'signoff' | 'checklist' | 'rectification';
  affectedItems?: string[];
}

export type SignOffRole = 'employee' | 'supervisor' | 'it' | 'admin' | 'finance' | 'hr';

export interface SignOffNode {
  id: string;
  formId: string;
  role: SignOffRole;
  title: string;
  description: string;
  signedOff: boolean;
  signedOffBy?: string;
  signedOffAt?: string;
  notes?: string;
}

export interface ArchiveChecklistItem {
  id: string;
  formId: string;
  category: 'document' | 'asset' | 'finance' | 'system' | 'hr';
  title: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  notes?: string;
}

export type RectificationStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RectificationPriority = 'high' | 'medium' | 'low';
export type RectificationSource = 'precheck_unsigned' | 'precheck_unchecked' | 'precheck_missing' | 'quality_deduction' | 'manual';

export interface RectificationTask {
  id: string;
  formId: string;
  source: RectificationSource;
  sourceDescription: string;
  category: 'signoff' | 'checklist' | 'attachment' | 'field' | 'quality';
  assigneeRole: SignOffRole;
  assigneeId?: string;
  title: string;
  description: string;
  status: RectificationStatus;
  priority: RectificationPriority;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  qualityScoreImpact?: number;
  createdAt: string;
  createdBy: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  relatedModule?: string;
  relatedItemId?: string;
  hasException: boolean;
  exceptionNotes?: string;
}

export interface AuditSummaryFilter {
  riskLevel?: string;
  module?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}
