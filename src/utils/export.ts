import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
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
import { formatDate } from './date';

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
}

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportCompletePackage(store: StoreState): void {
  const workbook = XLSX.utils.book_new();
  const employeeName = store.employees.find(e => e.id === store.resignationForm?.employeeId)?.name || '员工';
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  if (store.resignationForm) {
    const employee = store.employees.find(e => e.id === store.resignationForm!.employeeId);
    const handoverPerson = store.employees.find(e => e.id === store.resignationForm!.handoverPersonId);
    const supervisor = store.employees.find(e => e.id === store.resignationForm!.supervisorId);

    const formData = [{
      '员工姓名': employee?.name || '',
      '员工部门': employee?.department || '',
      '员工职位': employee?.position || '',
      '员工邮箱': employee?.email || '',
      '离职原因': store.resignationForm.reason,
      '最后工作日': formatDate(store.resignationForm.lastWorkingDay, 'yyyy-MM-dd'),
      '交接人': handoverPerson?.name || '',
      '直属上级': supervisor?.name || '',
      '当前状态': getStatusText(store.resignationForm.status),
      '员工待办事项': store.resignationForm.employeeTodos?.join('；') || '',
      '上级备注': store.resignationForm.supervisorNotes || '',
      '创建时间': formatDate(store.resignationForm.createdAt, 'yyyy-MM-dd HH:mm'),
      '更新时间': formatDate(store.resignationForm.updatedAt, 'yyyy-MM-dd HH:mm'),
    }];
    const formSheet = XLSX.utils.json_to_sheet(formData);
    XLSX.utils.book_append_sheet(workbook, formSheet, '离职单');
  }

  if (store.handoverTasks.length > 0) {
    const taskData = store.handoverTasks.map(task => {
      const assignee = store.employees.find(e => e.id === task.assigneeId);
      return {
        '任务标题': task.title,
        '任务描述': task.description,
        '任务分类': getCategoryText(task.category),
        '负责人': assignee?.name || '',
        '优先级': getPriorityText(task.priority),
        '状态': getTaskStatusText(task.status),
        '截止日期': formatDate(task.dueDate, 'yyyy-MM-dd'),
        '完成时间': task.completedAt ? formatDate(task.completedAt, 'yyyy-MM-dd HH:mm') : '',
      };
    });
    const taskSheet = XLSX.utils.json_to_sheet(taskData);
    XLSX.utils.book_append_sheet(workbook, taskSheet, '交接任务');
  }

  if (store.assetItems.length > 0) {
    const assetData = store.assetItems.map(item => {
      const returnedBy = item.returnedBy ? store.employees.find(e => e.id === item.returnedBy) : null;
      return {
        '资产分类': item.category === 'it' ? 'IT资产' : '行政物品',
        '资产名称': item.name,
        '资产编号': item.serialNumber,
        '状态': getAssetStatusText(item.status),
        '归还时间': item.returnedAt ? formatDate(item.returnedAt, 'yyyy-MM-dd HH:mm') : '',
        '确认人': returnedBy?.name || '',
        '备注': item.notes || '',
      };
    });
    const assetSheet = XLSX.utils.json_to_sheet(assetData);
    XLSX.utils.book_append_sheet(workbook, assetSheet, '资产归还');
  }

  if (store.permissionItems.length > 0) {
    const permissionData = store.permissionItems.map(item => {
      const closedBy = item.closedBy ? store.employees.find(e => e.id === item.closedBy) : null;
      return {
        '权限类型': getPermissionTypeText(item.type),
        '权限名称': item.name,
        '状态': item.closed ? '已关闭' : '未关闭',
        '关闭时间': item.closedAt ? formatDate(item.closedAt, 'yyyy-MM-dd HH:mm') : '',
        '操作人': closedBy?.name || '',
        '备注': item.notes || '',
      };
    });
    const permissionSheet = XLSX.utils.json_to_sheet(permissionData);
    XLSX.utils.book_append_sheet(workbook, permissionSheet, '权限关闭');
  }

  if (store.settlementItems.length > 0) {
    const settlementData = store.settlementItems.map(item => {
      const confirmedBy = item.confirmedBy ? store.employees.find(e => e.id === item.confirmedBy) : null;
      return {
        '结算类型': getSettlementTypeText(item.type),
        '描述': item.description,
        '金额': item.amount,
        '状态': getSettlementStatusText(item.status),
        '确认时间': item.confirmedAt ? formatDate(item.confirmedAt, 'yyyy-MM-dd HH:mm') : '',
        '确认人': confirmedBy?.name || '',
      };
    });
    const settlementSheet = XLSX.utils.json_to_sheet(settlementData);
    XLSX.utils.book_append_sheet(workbook, settlementSheet, '财务结算');
  }

  if (store.attachments.length > 0) {
    const attachmentData = store.attachments.map(item => {
      const uploadedBy = store.employees.find(e => e.id === item.uploadedBy);
      return {
        '文件名': item.name,
        '文件类型': item.type,
        '文件大小(KB)': Math.round(item.size / 1024),
        '上传人': uploadedBy?.name || '',
        '上传时间': formatDate(item.uploadedAt, 'yyyy-MM-dd HH:mm'),
      };
    });
    const attachmentSheet = XLSX.utils.json_to_sheet(attachmentData);
    XLSX.utils.book_append_sheet(workbook, attachmentSheet, '附件清单');
  }

  if (store.auditLogs.length > 0) {
    const logData = store.auditLogs.map(log => ({
      '操作时间': formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      '操作人': log.operatorName,
      '操作人角色': getRoleText(log.operatorRole),
      '操作类型': getActionText(log.action),
      '所属模块': getModuleText(log.module),
      '详情': log.details,
      '影响项': log.affectedItems?.join('；') || '',
    }));
    const logSheet = XLSX.utils.json_to_sheet(logData);
    XLSX.utils.book_append_sheet(workbook, logSheet, '流程记录');
  }

  if (store.comments.length > 0) {
    const commentData = store.comments.map(comment => {
      const author = store.employees.find(e => e.id === comment.authorId);
      return {
        '时间': formatDate(comment.createdAt, 'yyyy-MM-dd HH:mm'),
        '发表人': author?.name || '',
        '所属模块': getModuleText(comment.category),
        '内容': comment.content,
      };
    });
    const commentSheet = XLSX.utils.json_to_sheet(commentData);
    XLSX.utils.book_append_sheet(workbook, commentSheet, '意见留痕');
  }

  XLSX.writeFile(workbook, `${employeeName}_离职交接完整档案_${timestamp}.xlsx`);
}

export function exportAllData(store: any): void {
  exportCompletePackage(store);
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    in_progress: '进行中',
    completed: '已完成',
    archived: '已归档',
  };
  return map[status] || status;
}

function getCategoryText(category: string): string {
  const map: Record<string, string> = {
    project: '项目交接',
    document: '文档资料',
    knowledge: '知识经验',
    other: '其他事项',
  };
  return map[category] || category;
}

function getPriorityText(priority: string): string {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return map[priority] || priority;
}

function getTaskStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期',
  };
  return map[status] || status;
}

function getAssetStatusText(status: string): string {
  const map: Record<string, string> = {
    not_returned: '未归还',
    returned: '已归还',
    damaged: '已损坏',
  };
  return map[status] || status;
}

function getPermissionTypeText(type: string): string {
  const map: Record<string, string> = {
    account: '系统账号',
    email: '邮箱',
    vpn: 'VPN/网络',
    system: '业务系统',
    database: '数据库',
  };
  return map[type] || type;
}

function getSettlementTypeText(type: string): string {
  const map: Record<string, string> = {
    loan: '借款',
    reimbursement: '报销',
    salary: '工资',
    annual_leave: '年假折算',
    compensation: '补偿金',
  };
  return map[type] || type;
}

function getSettlementStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    paid: '已支付',
  };
  return map[status] || status;
}

function getRoleText(role: string): string {
  const map: Record<string, string> = {
    employee: '离职员工',
    supervisor: '直属上级',
    it: 'IT管理员',
    admin: '行政人员',
    finance: '财务人员',
    hr: 'HR管理员',
  };
  return map[role] || role;
}

function getActionText(action: string): string {
  const map: Record<string, string> = {
    form_saved: '保存离职单',
    form_submitted: '提交离职申请',
    supervisor_approved: '主管审核通过',
    task_completed: '完成交接任务',
    asset_returned: '归还资产',
    permission_closed: '关闭权限',
    settlement_confirmed: '确认结算',
    hr_archived: 'HR归档',
    comment_added: '添加意见',
    attachment_uploaded: '上传附件',
    batch_operation: '批量操作',
  };
  return map[action] || action;
}

function getModuleText(module: string): string {
  const map: Record<string, string> = {
    general: '通用',
    task: '交接任务',
    asset: '资产归还',
    permission: '权限关闭',
    settlement: '结算确认',
    form: '离职单',
    archive: '归档管理',
  };
  return map[module] || module;
}
