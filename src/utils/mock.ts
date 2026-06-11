import {
  Employee,
  ResignationForm,
  HandoverTask,
  AssetItem,
  PermissionItem,
  SettlementItem,
  Comment,
  Attachment,
} from '../types';
import { getCurrentTime } from './date';
import { addDays, formatISO } from 'date-fns';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateMockEmployees(): Employee[] {
  return [
    {
      id: 'emp-001',
      name: '张小明',
      department: '技术部',
      position: '高级前端工程师',
      email: 'zhangxiaoming@company.com',
      role: 'employee',
    },
    {
      id: 'emp-002',
      name: '李经理',
      department: '技术部',
      position: '技术经理',
      email: 'lijingli@company.com',
      role: 'supervisor',
    },
    {
      id: 'emp-003',
      name: '王HR',
      department: '人力资源部',
      position: 'HR专员',
      email: 'wanghr@company.com',
      role: 'hr',
    },
    {
      id: 'emp-004',
      name: '赵工程师',
      department: 'IT运维部',
      position: '系统管理员',
      email: 'zhaoit@company.com',
      role: 'it',
    },
    {
      id: 'emp-005',
      name: '孙财务',
      department: '财务部',
      position: '财务专员',
      email: 'sunfinance@company.com',
      role: 'finance',
    },
    {
      id: 'emp-006',
      name: '陈总',
      department: '管理层',
      position: '系统管理员',
      email: 'chenadmin@company.com',
      role: 'admin',
    },
  ];
}

export function generateMockResignationForm(): ResignationForm {
  const now = new Date();
  return {
    id: 'form-' + generateId(),
    employeeId: 'emp-001',
    reason: '个人职业发展规划调整，寻求更好的发展机会',
    lastWorkingDay: formatISO(addDays(now, 30)).split('T')[0],
    handoverPersonId: 'emp-002',
    supervisorId: 'emp-002',
    status: 'in_progress',
    createdAt: getCurrentTime(),
    updatedAt: getCurrentTime(),
    employeeTodos: [
      '整理项目文档',
      '交接核心代码',
      '完成当前迭代任务',
      '归还公司资产',
    ],
    supervisorNotes: '请确保所有项目交接完整，代码已提交至仓库。',
  };
}

export function generateMockHandoverTasks(formId: string): HandoverTask[] {
  const now = new Date();
  const tasks: HandoverTask[] = [
    {
      id: 'task-' + generateId(),
      formId,
      title: '用户管理系统代码交接',
      description: '完成用户管理模块的代码交接，包括核心业务逻辑、数据库设计文档等',
      category: 'project',
      assigneeId: 'emp-002',
      status: 'in_progress',
      dueDate: formatISO(addDays(now, 5)).split('T')[0],
      priority: 'high',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '项目架构文档整理',
      description: '整理现有项目的架构设计文档、技术选型说明',
      category: 'document',
      assigneeId: 'emp-002',
      status: 'pending',
      dueDate: formatISO(addDays(now, 10)).split('T')[0],
      priority: 'medium',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '前端组件库知识分享',
      description: '分享自研前端组件库的使用方法和设计理念',
      category: 'knowledge',
      assigneeId: 'emp-002',
      status: 'completed',
      dueDate: formatISO(addDays(now, -2)).split('T')[0],
      completedAt: formatISO(addDays(now, -1)).split('T')[0],
      priority: 'high',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '权限系统交接',
      description: '完成RBAC权限系统的交接，包括配置说明和运维手册',
      category: 'project',
      assigneeId: 'emp-002',
      status: 'pending',
      dueDate: formatISO(addDays(now, 15)).split('T')[0],
      priority: 'high',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: 'API接口文档更新',
      description: '更新并完善所有对外API接口文档',
      category: 'document',
      assigneeId: 'emp-002',
      status: 'in_progress',
      dueDate: formatISO(addDays(now, 7)).split('T')[0],
      priority: 'medium',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '数据库运维知识',
      description: '分享数据库优化经验和日常运维注意事项',
      category: 'knowledge',
      assigneeId: 'emp-002',
      status: 'pending',
      dueDate: formatISO(addDays(now, 12)).split('T')[0],
      priority: 'low',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '线上问题处理经验',
      description: '整理常见线上问题的排查方法和解决方案',
      category: 'knowledge',
      assigneeId: 'emp-002',
      status: 'pending',
      dueDate: formatISO(addDays(now, 20)).split('T')[0],
      priority: 'medium',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '其他待办事项',
      description: '完成其他未尽事宜的交接工作',
      category: 'other',
      assigneeId: 'emp-002',
      status: 'pending',
      dueDate: formatISO(addDays(now, 25)).split('T')[0],
      priority: 'low',
    },
    {
      id: 'task-' + generateId(),
      formId,
      title: '部署脚本和环境配置',
      description: '交接CI/CD部署脚本和各环境配置说明',
      category: 'document',
      assigneeId: 'emp-002',
      status: 'overdue',
      dueDate: formatISO(addDays(now, -3)).split('T')[0],
      priority: 'high',
    },
  ];
  return tasks;
}

export function generateMockAssetItems(formId: string): AssetItem[] {
  const now = new Date();
  return [
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'it',
      name: 'MacBook Pro 16寸',
      serialNumber: 'SN-MBP-2023-00123',
      status: 'not_returned',
    },
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'it',
      name: '戴尔显示器 27寸',
      serialNumber: 'SN-DELL-U2723-887',
      status: 'not_returned',
    },
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'it',
      name: '机械键盘',
      serialNumber: 'SN-KEY-00156',
      status: 'returned',
      returnedAt: formatISO(addDays(now, -1)).split('T')[0],
      returnedBy: 'emp-004',
    },
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'it',
      name: '鼠标及电脑包',
      serialNumber: 'SN-ACC-SET-089',
      status: 'not_returned',
    },
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'admin',
      name: '工牌',
      serialNumber: 'BADGE-0815',
      status: 'not_returned',
    },
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'admin',
      name: '办公室门卡',
      serialNumber: 'CARD-ADMIN-F2',
      status: 'not_returned',
    },
    {
      id: 'asset-' + generateId(),
      formId,
      category: 'admin',
      name: '公司图书馆借书',
      serialNumber: 'LIB-BOOK-00345',
      status: 'damaged',
      notes: '书籍封面有轻微破损，已登记',
    },
  ];
}

export function generateMockPermissionItems(formId: string): PermissionItem[] {
  const now = new Date();
  return [
    {
      id: 'perm-' + generateId(),
      formId,
      type: 'account',
      name: '企业域账号 (AD)',
      closed: false,
    },
    {
      id: 'perm-' + generateId(),
      formId,
      type: 'email',
      name: '企业邮箱 (zhangxiaoming@company.com)',
      closed: false,
    },
    {
      id: 'perm-' + generateId(),
      formId,
      type: 'vpn',
      name: '远程办公VPN',
      closed: true,
      closedAt: formatISO(addDays(now, -2)).split('T')[0],
      closedBy: 'emp-004',
    },
    {
      id: 'perm-' + generateId(),
      formId,
      type: 'system',
      name: 'Jira项目管理系统',
      closed: false,
    },
    {
      id: 'perm-' + generateId(),
      formId,
      type: 'system',
      name: 'GitLab代码仓库',
      closed: true,
      closedAt: formatISO(addDays(now, -1)).split('T')[0],
      closedBy: 'emp-004',
      notes: '已将项目权限转移给李经理',
    },
    {
      id: 'perm-' + generateId(),
      formId,
      type: 'database',
      name: '生产数据库读写权限',
      closed: false,
    },
  ];
}

export function generateMockSettlementItems(formId: string): SettlementItem[] {
  const now = new Date();
  return [
    {
      id: 'settle-' + generateId(),
      formId,
      type: 'salary',
      description: '本月正常工资结算',
      amount: 25000,
      status: 'pending',
    },
    {
      id: 'settle-' + generateId(),
      formId,
      type: 'annual_leave',
      description: '未休年假5天折算',
      amount: 5747,
      status: 'confirmed',
      confirmedAt: formatISO(addDays(now, -1)).split('T')[0],
      confirmedBy: 'emp-005',
    },
    {
      id: 'settle-' + generateId(),
      formId,
      type: 'reimbursement',
      description: '上月出差报销费用',
      amount: 3200,
      status: 'paid',
      confirmedAt: formatISO(addDays(now, -5)).split('T')[0],
      confirmedBy: 'emp-005',
    },
    {
      id: 'settle-' + generateId(),
      formId,
      type: 'loan',
      description: '公司借款（已从工资中扣除）',
      amount: 0,
      status: 'paid',
      confirmedAt: formatISO(addDays(now, -3)).split('T')[0],
      confirmedBy: 'emp-005',
    },
    {
      id: 'settle-' + generateId(),
      formId,
      type: 'compensation',
      description: 'N+1离职补偿',
      amount: 75000,
      status: 'pending',
    },
  ];
}

export function generateMockComments(formId: string): Comment[] {
  const now = new Date();
  return [
    {
      id: 'comment-' + generateId(),
      formId,
      authorId: 'emp-002',
      content: '已收到离职申请，请尽快开始准备交接文档和项目资料。',
      createdAt: formatISO(addDays(now, -5)),
      category: 'general',
    },
    {
      id: 'comment-' + generateId(),
      formId,
      authorId: 'emp-001',
      content: '好的，我会在本周内完成用户管理系统的交接工作。',
      createdAt: formatISO(addDays(now, -4)),
      category: 'general',
    },
    {
      id: 'comment-' + generateId(),
      formId,
      authorId: 'emp-004',
      content: 'VPN权限已关闭，GitLab权限已转移，请确认。',
      createdAt: formatISO(addDays(now, -2)),
      category: 'permission',
    },
    {
      id: 'comment-' + generateId(),
      formId,
      authorId: 'emp-005',
      content: '年假折算已核算完毕，请查收附件中的明细。',
      createdAt: formatISO(addDays(now, -1)),
      category: 'settlement',
    },
    {
      id: 'comment-' + generateId(),
      formId,
      authorId: 'emp-003',
      content: '请记得在最后工作日之前归还所有公司资产并完成签字确认。',
      createdAt: formatISO(addDays(now, 0)),
      category: 'asset',
    },
  ];
}

export function generateMockAttachments(formId: string): Attachment[] {
  const now = new Date();
  return [
    {
      id: 'attach-' + generateId(),
      formId,
      name: '离职申请书.pdf',
      type: 'application/pdf',
      size: 245760,
      uploadedAt: formatISO(addDays(now, -7)),
      uploadedBy: 'emp-001',
    },
    {
      id: 'attach-' + generateId(),
      formId,
      name: '项目交接清单.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 102400,
      uploadedAt: formatISO(addDays(now, -3)),
      uploadedBy: 'emp-001',
    },
    {
      id: 'attach-' + generateId(),
      formId,
      name: '年假折算明细.pdf',
      type: 'application/pdf',
      size: 153600,
      uploadedAt: formatISO(addDays(now, -1)),
      uploadedBy: 'emp-005',
    },
  ];
}
