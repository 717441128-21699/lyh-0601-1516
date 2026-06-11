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
  AuditLog,
  SignOffNode,
  ArchiveChecklistItem,
  RectificationTask
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
  signOffNodes: SignOffNode[];
  archiveChecklist: ArchiveChecklistItem[];
  archiveExceptionNotes?: string;
  qualityScore?: { score: number; riskLevel: string; deductions: { module: string; reason: string; points: number }[] };
  precheckIssues?: { unsignedRoles: string[]; uncheckedItems: string[]; missingAttachments: string[]; emptyKeyFields: string[] };
  rectificationTasks?: RectificationTask[];
  auditFilter?: {
    riskLevel?: string;
    module?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  };
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

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName: string = 'Sheet1'): void {
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

  const rectificationTasks = store.rectificationTasks || [];
  const totalDeductions = store.qualityScore?.deductions?.reduce((sum, d) => sum + d.points, 0) || 0;
  const qualityScore = store.qualityScore?.score ?? 100 - totalDeductions;
  const totalTasks = rectificationTasks.length;
  const completedTasks = rectificationTasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hasException = rectificationTasks.some(t => t.hasException) || !!store.archiveExceptionNotes;

  const summaryData: Record<string, unknown>[] = [];

  if (store.auditFilter) {
    const { riskLevel, module, role, startDate, endDate, keyword } = store.auditFilter;
    summaryData.push({ '项目': '当前筛选条件', '内容': '' });
    if (riskLevel) summaryData.push({ '项目': '风险等级', '内容': getRiskLevelText(riskLevel) });
    if (module) summaryData.push({ '项目': '模块', '内容': getModuleText(module) });
    if (role) summaryData.push({ '项目': '角色', '内容': getRoleText(role) });
    if (startDate || endDate) {
      const dateRange = [startDate, endDate].filter(Boolean).join(' 至 ');
      summaryData.push({ '项目': '时间范围', '内容': dateRange });
    }
    if (keyword) summaryData.push({ '项目': '关键字', '内容': keyword });
    summaryData.push({ '项目': '', '内容': '' });
  }

  summaryData.push({ '项目': '归档质量分', '内容': `${qualityScore}分` });
  summaryData.push({ '项目': '风险等级', '内容': getRiskLevelText(store.qualityScore?.riskLevel || 'low') });
  summaryData.push({ '项目': '总扣分数', '内容': `${totalDeductions}分` });
  summaryData.push({ '项目': '扣分项数量', '内容': `${store.qualityScore?.deductions?.length || 0}项` });
  summaryData.push({ '项目': '例外归档', '内容': hasException ? '是' : '否' });
  summaryData.push({ '项目': '例外说明', '内容': store.archiveExceptionNotes || (rectificationTasks.find(t => t.hasException)?.exceptionNotes) || '' });
  summaryData.push({ '项目': '待整改任务数', '内容': `${totalTasks - completedTasks}项` });
  summaryData.push({ '项目': '已完成整改数', '内容': `${completedTasks}项` });
  summaryData.push({ '项目': '整改完成率', '内容': `${completionRate}%` });
  summaryData.push({ '项目': '导出时间', '内容': formatDate(now.toISOString(), 'yyyy-MM-dd HH:mm:ss') });
  summaryData.push({ '项目': '导出人', '内容': store.currentUser?.name || '' });
  summaryData.push({ '项目': '', '内容': '' });
  summaryData.push({ '项目': '整改任务统计', '内容': '' });
  summaryData.push({ '项目': '风险等级', '内容': '数量', '占比': '占比' });

  const riskStats = { critical: 0, high: 0, medium: 0, low: 0 };
  rectificationTasks.forEach(t => {
    const level = t.riskLevel || 'low';
    if (riskStats[level as keyof typeof riskStats] !== undefined) {
      riskStats[level as keyof typeof riskStats]++;
    }
  });

  const riskOrder = ['critical', 'high', 'medium', 'low'] as const;
  riskOrder.forEach(level => {
    const count = riskStats[level];
    const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
    summaryData.push({ '项目': getRiskLevelText(level), '内容': count, '占比': `${percentage}%` });
  });

  summaryData.push({ '项目': '', '内容': '' });
  summaryData.push({ '项目': '整改任务列表摘要', '内容': '' });
  summaryData.push({
    '项目': '任务标题',
    '内容': '责任角色',
    '整改分类': '整改分类',
    '来源': '来源',
    '状态': '状态',
    '优先级': '优先级',
    '风险等级': '风险等级',
    '创建时间': '创建时间',
    '完成时间': '完成时间',
    '质量影响': '质量影响'
  });

  if (rectificationTasks.length > 0) {
    rectificationTasks.forEach(task => {
      summaryData.push({
        '项目': task.title,
        '内容': getRoleText(task.assigneeRole),
        '整改分类': getRectificationCategoryText(task.category),
        '来源': getRectificationSourceText(task.source),
        '状态': getRectificationStatusText(task.status),
        '优先级': getRectificationPriorityText(task.priority),
        '风险等级': getRiskLevelText(task.riskLevel || 'low'),
        '创建时间': formatDate(task.createdAt, 'yyyy-MM-dd HH:mm'),
        '完成时间': task.completedAt ? formatDate(task.completedAt, 'yyyy-MM-dd HH:mm') : '',
        '质量影响': task.qualityScoreImpact !== undefined ? `${task.qualityScoreImpact}分` : ''
      });
    });
  } else {
    summaryData.push({
      '项目': '',
      '内容': '',
      '整改分类': '',
      '来源': '',
      '状态': '',
      '优先级': '',
      '风险等级': '',
      '创建时间': '',
      '完成时间': '',
      '质量影响': ''
    });
  }

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '归档审计摘要');

  const rectificationHistoryData: Record<string, unknown>[] = [{
    '任务ID': '任务ID',
    '任务标题': '任务标题',
    '创建前质量分': '创建前质量分',
    '创建后质量分': '创建后质量分',
    '整改完成后质量分': '整改完成后质量分',
    '整改说明': '整改说明',
    '创建人': '创建人',
    '创建时间': '创建时间',
    '完成人': '完成人',
    '完成时间': '完成时间'
  }];

  if (rectificationTasks.length > 0) {
    const initialScore = 100;
    let runningScore = initialScore;

    const sortedTasks = [...rectificationTasks].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedTasks.forEach(task => {
      const scoreBefore = runningScore;
      const scoreImpact = task.qualityScoreImpact || 0;
      const scoreAfterCreation = scoreBefore - scoreImpact;
      runningScore = scoreAfterCreation;

      const creator = store.employees.find(e => e.id === task.createdBy);
      const completer = task.completedBy ? store.employees.find(e => e.id === task.completedBy) : null;

      rectificationHistoryData.push({
        '任务ID': task.id,
        '任务标题': task.title,
        '创建前质量分': scoreBefore,
        '创建后质量分': scoreAfterCreation,
        '整改完成后质量分': task.status === 'completed' ? qualityScore : '',
        '整改说明': task.completionNotes || '',
        '创建人': creator?.name || task.createdBy,
        '创建时间': formatDate(task.createdAt, 'yyyy-MM-dd HH:mm'),
        '完成人': completer?.name || (task.completedBy || ''),
        '完成时间': task.completedAt ? formatDate(task.completedAt, 'yyyy-MM-dd HH:mm') : ''
      });
    });
  }

  const historySheet = XLSX.utils.json_to_sheet(rectificationHistoryData);
  XLSX.utils.book_append_sheet(workbook, historySheet, '整改前后记录');

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
  } else {
    const emptyHeaders = [{
      '员工姓名': '',
      '员工部门': '',
      '员工职位': '',
      '员工邮箱': '',
      '离职原因': '',
      '最后工作日': '',
      '交接人': '',
      '直属上级': '',
      '当前状态': '',
      '员工待办事项': '',
      '上级备注': '',
      '创建时间': '',
      '更新时间': '',
    }];
    const formSheet = XLSX.utils.json_to_sheet(emptyHeaders);
    XLSX.utils.book_append_sheet(workbook, formSheet, '离职单');
  }

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
  const taskSheet = XLSX.utils.json_to_sheet(taskData.length > 0 ? taskData : [{
    '任务标题': '',
    '任务描述': '',
    '任务分类': '',
    '负责人': '',
    '优先级': '',
    '状态': '',
    '截止日期': '',
    '完成时间': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, taskSheet, '交接任务');

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
  const assetSheet = XLSX.utils.json_to_sheet(assetData.length > 0 ? assetData : [{
    '资产分类': '',
    '资产名称': '',
    '资产编号': '',
    '状态': '',
    '归还时间': '',
    '确认人': '',
    '备注': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, assetSheet, '资产归还');

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
  const permissionSheet = XLSX.utils.json_to_sheet(permissionData.length > 0 ? permissionData : [{
    '权限类型': '',
    '权限名称': '',
    '状态': '',
    '关闭时间': '',
    '操作人': '',
    '备注': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, permissionSheet, '权限关闭');

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
  const settlementSheet = XLSX.utils.json_to_sheet(settlementData.length > 0 ? settlementData : [{
    '结算类型': '',
    '描述': '',
    '金额': '',
    '状态': '',
    '确认时间': '',
    '确认人': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, settlementSheet, '财务结算');

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
  const attachmentSheet = XLSX.utils.json_to_sheet(attachmentData.length > 0 ? attachmentData : [{
    '文件名': '',
    '文件类型': '',
    '文件大小(KB)': '',
    '上传人': '',
    '上传时间': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, attachmentSheet, '附件清单');

  const logData = store.auditLogs.map(log => ({
    '操作时间': formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    '操作人': log.operatorName,
    '操作人角色': getRoleText(log.operatorRole),
    '操作类型': getActionText(log.action),
    '所属模块': getModuleText(log.module),
    '详情': log.details,
    '影响项': log.affectedItems?.join('；') || '',
  }));
  const logSheet = XLSX.utils.json_to_sheet(logData.length > 0 ? logData : [{
    '操作时间': '',
    '操作人': '',
    '操作人角色': '',
    '操作类型': '',
    '所属模块': '',
    '详情': '',
    '影响项': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, logSheet, '流程记录');

  const commentData = store.comments.map(comment => {
    const author = store.employees.find(e => e.id === comment.authorId);
    return {
      '时间': formatDate(comment.createdAt, 'yyyy-MM-dd HH:mm'),
      '发表人': author?.name || '',
      '所属模块': getModuleText(comment.category),
      '内容': comment.content,
    };
  });
  const commentSheet = XLSX.utils.json_to_sheet(commentData.length > 0 ? commentData : [{
    '时间': '',
    '发表人': '',
    '所属模块': '',
    '内容': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, commentSheet, '意见留痕');

  const signOffData = store.signOffNodes.map(node => {
    const signedOffBy = node.signedOffBy ? store.employees.find(e => e.id === node.signedOffBy) : null;
    return {
      '角色': getSignOffRoleText(node.role),
      '节点名称': node.title,
      '是否签收': node.signedOff ? '是' : '否',
      '签收人': signedOffBy?.name || '',
      '签收时间': node.signedOffAt ? formatDate(node.signedOffAt, 'yyyy-MM-dd HH:mm') : '',
      '备注': node.notes || '',
    };
  });
  const signOffSheet = XLSX.utils.json_to_sheet(signOffData.length > 0 ? signOffData : [{
    '角色': '',
    '节点名称': '',
    '是否签收': '',
    '签收人': '',
    '签收时间': '',
    '备注': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, signOffSheet, '多角色签收');

  const checklistData = store.archiveChecklist.map(item => {
    const checkedBy = item.checked && item.checkedBy ? store.employees.find(e => e.id === item.checkedBy) : null;
    return {
      '分类': getChecklistCategoryText(item.category),
      '核验项': item.title,
      '是否核验': item.checked ? '是' : '否',
      '核验人': item.checked ? (checkedBy?.name || '') : '',
      '核验时间': item.checked ? (item.checkedAt ? formatDate(item.checkedAt, 'yyyy-MM-dd HH:mm') : '') : '',
      '备注': item.checked ? (item.notes || '') : '',
    };
  });
  const checklistSheet = XLSX.utils.json_to_sheet(checklistData.length > 0 ? checklistData : [{
    '分类': '',
    '核验项': '',
    '是否核验': '',
    '核验人': '',
    '核验时间': '',
    '备注': '',
  }]);
  XLSX.utils.book_append_sheet(workbook, checklistSheet, '归档核验清单');

  if (store.qualityScore) {
    const { score, riskLevel, deductions } = store.qualityScore;
    const qualityData: Record<string, unknown>[] = [
      { '指标': '质量分数', '内容': score },
      { '指标': '风险等级', '内容': riskLevel }
    ];
    if (deductions && deductions.length > 0) {
      qualityData.push({ '指标': '', '内容': '' });
      qualityData.push({ '指标': '扣分项明细', '内容': '' });
      qualityData.push({ '指标': '模块', '内容': '原因' });
      deductions.forEach(d => {
        qualityData.push({ '指标': d.module, '内容': `${d.reason}（扣${d.points}分）` });
      });
    }
    const qualitySheet = XLSX.utils.json_to_sheet(qualityData);
    XLSX.utils.book_append_sheet(workbook, qualitySheet, '归档质量评估');
  }

  if (store.archiveExceptionNotes) {
    const exceptionData = [
      { '项目': '例外说明', '内容': store.archiveExceptionNotes },
      { '项目': '备注', '内容': 'HR确认以上例外后归档' }
    ];
    const exceptionSheet = XLSX.utils.json_to_sheet(exceptionData);
    XLSX.utils.book_append_sheet(workbook, exceptionSheet, '归档例外说明');
  }

  XLSX.writeFile(workbook, `${employeeName}_离职交接完整档案_${timestamp}.xlsx`);
}

export function exportAllData(store: StoreState): void {
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

function getSignOffRoleText(role: string): string {
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

function getChecklistCategoryText(category: string): string {
  const map: Record<string, string> = {
    document: '文档资料',
    asset: '资产物资',
    finance: '财务结算',
    system: '系统权限',
    hr: '人事手续',
  };
  return map[category] || category;
}

function getRectificationStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
}

function getRectificationPriorityText(priority: string): string {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return map[priority] || priority;
}

function getRiskLevelText(level: string): string {
  const map: Record<string, string> = {
    critical: '严重风险',
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };
  return map[level] || level;
}

function getRectificationCategoryText(category: string): string {
  const map: Record<string, string> = {
    signoff: '签收',
    checklist: '核验清单',
    attachment: '附件',
    field: '字段',
    quality: '质量',
  };
  return map[category] || category;
}

function getRectificationSourceText(source: string): string {
  const map: Record<string, string> = {
    precheck_unsigned: '预检查-未签收',
    precheck_unchecked: '预检查-未核验',
    precheck_missing: '预检查-缺失',
    quality_deduction: '质量扣分',
    manual: '手动创建',
  };
  return map[source] || source;
}
