import { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  CheckCircle,
  Building2,
  Briefcase,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  X,
  FileText,
  CreditCard,
  Wallet,
  PiggyBank,
  Receipt,
  HandCoins,
  CalendarCheck,
  type LucideIcon
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import CommentSection from '@/components/CommentSection';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface LoanItem {
  id: string;
  date: string;
  reason: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'paid';
  confirmed: boolean;
  handleMethod: 'deduct' | 'cash';
}

interface ReimbursementItem {
  id: string;
  orderNo: string;
  date: string;
  amount: number;
  status: 'pending_review' | 'reviewed' | 'paid';
  confirmed: boolean;
}

const MONTHLY_WORK_DAYS = 21.75;
const MONTHLY_SALARY = 25000;
const ACTUAL_ATTENDANCE = 18;
const REMAINING_ANNUAL_LEAVE = 5;
const SOCIAL_SECURITY_HOUSING = 3500;
const PERSONAL_INCOME_TAX = 1200;

const mockLoans: LoanItem[] = [
  {
    id: 'loan-001',
    date: '2026-03-15',
    reason: '出差备用金',
    amount: 5000,
    status: 'pending',
    confirmed: false,
    handleMethod: 'deduct'
  },
  {
    id: 'loan-002',
    date: '2026-05-20',
    reason: '紧急借款',
    amount: 2000,
    status: 'pending',
    confirmed: false,
    handleMethod: 'cash'
  }
];

const mockReimbursements: ReimbursementItem[] = [
  {
    id: 'reimb-001',
    orderNo: 'BX-20260512-0089',
    date: '2026-05-12',
    amount: 3200,
    status: 'paid',
    confirmed: true
  },
  {
    id: 'reimb-002',
    orderNo: 'BX-20260601-0015',
    date: '2026-06-01',
    amount: 1580,
    status: 'reviewed',
    confirmed: false
  },
  {
    id: 'reimb-003',
    orderNo: 'BX-20260608-0032',
    date: '2026-06-08',
    amount: 860,
    status: 'pending_review',
    confirmed: false
  }
];

const formatCurrency = (amount: number): string => {
  return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const reimbursementStatusMap: Record<string, { label: string; className: string }> = {
  pending_review: { label: '待审核', className: 'bg-orange-50 text-orange-600 border-orange-200' },
  reviewed: { label: '已审核', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  paid: { label: '已支付', className: 'bg-green-50 text-green-600 border-green-200' }
};

export default function Settlement() {
  const {
    currentUser,
    employees,
    resignationForm,
    settlementItems,
    settlementConfirmed,
    getSettlementProgress,
    updateSettlementItem,
    confirmSettlement,
    addComment
  } = useStore();

  const isFinance = currentUser.role === 'finance';

  const employee = useMemo(() => {
    if (!resignationForm) return null;
    return employees.find(e => e.id === resignationForm.employeeId);
  }, [employees, resignationForm]);

  const [loans, setLoans] = useState<LoanItem[]>(mockLoans);
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>(mockReimbursements);

  const [performanceBonus, setPerformanceBonus] = useState(3000);
  const [overtimePay, setOvertimePay] = useState(800);
  const [allowance, setAllowance] = useState(500);
  const [otherDeduction, setOtherDeduction] = useState(0);
  const [compensation, setCompensation] = useState(75000);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    setLoans(prevLoans => prevLoans.map(loan => {
      const matchingItem = settlementItems.find(
        item => item.type === 'loan' && item.description.includes(loan.reason)
      );
      if (matchingItem) {
        const storeConfirmed = ['confirmed', 'paid'].includes(matchingItem.status);
        if (loan.confirmed !== storeConfirmed) {
          return { ...loan, confirmed: storeConfirmed };
        }
      }
      return loan;
    }));

    setReimbursements(prevReimbs => prevReimbs.map(reimb => {
      const matchingItem = settlementItems.find(
        item => item.type === 'reimbursement' && Math.abs(item.amount - reimb.amount) < 1
      );
      if (matchingItem) {
        const storeConfirmed = ['confirmed', 'paid'].includes(matchingItem.status);
        if (reimb.confirmed !== storeConfirmed) {
          return { ...reimb, confirmed: storeConfirmed };
        }
      }
      return reimb;
    }));
  }, [settlementItems]);

  const basicSalary = useMemo(() => {
    return Math.round((MONTHLY_SALARY / MONTHLY_WORK_DAYS) * ACTUAL_ATTENDANCE * 100) / 100;
  }, []);

  const dailySalary = useMemo(() => {
    return Math.round((MONTHLY_SALARY / MONTHLY_WORK_DAYS) * 100) / 100;
  }, []);

  const annualLeavePay = useMemo(() => {
    return Math.round(dailySalary * REMAINING_ANNUAL_LEAVE * 100) / 100;
  }, [dailySalary]);

  const totalIncome = useMemo(() => {
    const reimbursedAmount = reimbursements
      .filter(r => r.status === 'paid' || r.confirmed)
      .reduce((sum, r) => sum + r.amount, 0);
    return basicSalary + performanceBonus + overtimePay + allowance + annualLeavePay + compensation + reimbursedAmount;
  }, [basicSalary, performanceBonus, overtimePay, allowance, annualLeavePay, compensation, reimbursements]);

  const totalDeduction = useMemo(() => {
    const loanDeductions = loans
      .filter(l => l.confirmed && l.handleMethod === 'deduct')
      .reduce((sum, l) => sum + l.amount, 0);
    return SOCIAL_SECURITY_HOUSING + PERSONAL_INCOME_TAX + otherDeduction + loanDeductions;
  }, [loans, otherDeduction]);

  const netPayable = useMemo(() => {
    return Math.round((totalIncome - totalDeduction) * 100) / 100;
  }, [totalIncome, totalDeduction]);

  const expectedPayDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(10);
    return formatDate(date.toISOString(), 'yyyy-MM-dd');
  }, []);

  const settlementProgress = getSettlementProgress();

  const toggleLoanConfirmed = (id: string) => {
    if (!isFinance) return;
    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    const newConfirmed = !loan.confirmed;
    setLoans(loans.map(l => l.id === id ? { ...l, confirmed: newConfirmed } : l));

    const matchingItem = settlementItems.find(
      item => item.type === 'loan' && item.description.includes(loan.reason)
    );
    if (matchingItem) {
      updateSettlementItem(matchingItem.id, {
        status: newConfirmed ? 'confirmed' as const : 'pending' as const
      });
    }
  };

  const setLoanHandleMethod = (id: string, method: 'deduct' | 'cash') => {
    if (!isFinance) return;
    setLoans(loans.map(l => l.id === id ? { ...l, handleMethod: method } : l));
  };

  const toggleReimbursementConfirmed = (id: string) => {
    if (!isFinance) return;
    const reimb = reimbursements.find(r => r.id === id);
    if (!reimb || reimb.status === 'pending_review') return;

    const newConfirmed = !reimb.confirmed;
    setReimbursements(reimbursements.map(r => r.id === id ? { ...r, confirmed: newConfirmed } : r));

    const matchingItem = settlementItems.find(
      item => item.type === 'reimbursement' && Math.abs(item.amount - reimb.amount) < 1
    );
    if (matchingItem) {
      updateSettlementItem(matchingItem.id, {
        status: newConfirmed ? 'confirmed' as const : 'pending' as const
      });
    }
  };

  const handleConfirmSettlement = () => {
    confirmSettlement();

    const loanDetails = loans
      .filter(l => l.confirmed)
      .map(l => `• ${l.reason}: ${formatCurrency(l.amount)} (${l.handleMethod === 'deduct' ? '从工资扣除' : '现金归还'})`)
      .join('\n');

    const reimbursementDetails = reimbursements
      .filter(r => r.confirmed)
      .map(r => `• ${r.orderNo}: ${formatCurrency(r.amount)}`)
      .join('\n');

    const commentContent = `【结算确认完成】
员工：${employee?.name || '--'}
实发金额：${formatCurrency(netPayable)}
预计发放日期：${expectedPayDate}

薪资明细：
• 基本工资：${formatCurrency(basicSalary)}
• 绩效奖金：${formatCurrency(performanceBonus)}
• 加班费：${formatCurrency(overtimePay)}
• 补贴：${formatCurrency(allowance)}
• 年假折算：${formatCurrency(annualLeavePay)}
• 离职补偿金：${formatCurrency(compensation)}
• 社保公积金：-${formatCurrency(SOCIAL_SECURITY_HOUSING)}
• 个人所得税：-${formatCurrency(PERSONAL_INCOME_TAX)}
${otherDeduction > 0 ? `• 其他扣除：-${formatCurrency(otherDeduction)}\n` : ''}
借款情况：
${loanDetails || '• 无待结清借款'}

报销情况：
${reimbursementDetails || '• 无待确认报销'}

应发合计：${formatCurrency(totalIncome)}
扣除合计：${formatCurrency(totalDeduction)}
实发金额：${formatCurrency(netPayable)}`;

    addComment({
      formId: resignationForm?.id || '',
      authorId: currentUser.id,
      content: commentContent,
      category: 'settlement'
    });

    setShowConfirmModal(false);
  };

  const NumberInput = ({
    value,
    onChange,
    disabled = false
  }: {
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
  }) => (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      disabled={disabled || !isFinance}
      className={cn(
        'w-full px-3 py-1.5 text-sm text-right rounded-md border transition-colors',
        disabled || !isFinance
          ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
          : 'bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
      )}
    />
  );

  const SectionTitle = ({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-green-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
    </div>
  );

  const MoneyDisplay = ({ amount, showSign = false, className }: { amount: number; showSign?: boolean; className?: string }) => {
    const isPositive = amount >= 0;
    return (
      <span className={cn(
        'tabular-nums font-medium',
        isPositive ? 'text-green-600' : 'text-red-500',
        className
      )}>
        {showSign && (isPositive ? '+' : '-')}
        {formatCurrency(Math.abs(amount))}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">结算确认</h1>
                <p className="text-sm text-gray-500 mt-0.5">员工离职薪资与财务结算明细</p>
              </div>
            </div>
          </div>
          <div className="w-64">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 font-medium">结算进度</span>
              <span className="text-xs font-semibold text-green-600">{settlementProgress}%</span>
            </div>
            <ProgressBar value={settlementProgress} color="green" size="sm" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                  {employee?.avatar ? (
                    <img src={employee.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {employee?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900">{employee?.name || '--'}</h2>
                    <StatusBadge status={resignationForm?.status || 'draft'} type="form" />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>{employee?.department || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span>{employee?.position || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      <span>最后工作日：{resignationForm?.lastWorkingDay ? formatDate(resignationForm.lastWorkingDay, 'yyyy-MM-dd') : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>本月出勤：<span className="font-semibold text-gray-900">{ACTUAL_ATTENDANCE}</span> 天 / 月工作日 {MONTHLY_WORK_DAYS} 天</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">月基本工资</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(MONTHLY_SALARY)}</div>
                <div className="text-xs text-gray-400 mt-1">日均 {formatCurrency(dailySalary)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <SectionTitle icon={CreditCard} title="借款核对" desc="请确认员工未结清借款情况" />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">确认</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">借款日期</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">借款事由</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">借款金额</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">处理方式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loans.map((loan) => (
                    <tr key={loan.id} className={cn(loan.confirmed && 'bg-green-50/40')}>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleLoanConfirmed(loan.id)}
                          disabled={!isFinance}
                          className={cn(!isFinance && 'opacity-50 cursor-not-allowed')}
                        >
                          {loan.confirmed ? (
                            <CheckSquare className="w-5 h-5 text-green-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{loan.date}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{loan.reason}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium tabular-nums text-red-500">
                        -{formatCurrency(loan.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={loan.status} type="settlement" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <select
                            value={loan.handleMethod}
                            onChange={(e) => setLoanHandleMethod(loan.id, e.target.value as 'deduct' | 'cash')}
                            disabled={!isFinance || !loan.confirmed}
                            className={cn(
                              'appearance-none pl-3 pr-8 py-1.5 text-sm rounded-md border transition-colors',
                              (!isFinance || !loan.confirmed)
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                            )}
                          >
                            <option value="deduct">从工资扣除</option>
                            <option value="cash">已现金归还</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loans.some(l => l.confirmed && l.handleMethod === 'deduct') && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  已确认将从工资中扣除借款合计：
                  <span className="font-bold tabular-nums ml-1">
                    {formatCurrency(loans.filter(l => l.confirmed && l.handleMethod === 'deduct').reduce((s, l) => s + l.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <SectionTitle icon={Receipt} title="报销处理" desc="员工未结清报销单状态" />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">确认</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">报销单号</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">报销日期</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">报销金额</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reimbursements.map((reimb) => {
                    const statusCfg = reimbursementStatusMap[reimb.status];
                    return (
                      <tr key={reimb.id} className={cn(reimb.confirmed && 'bg-green-50/40')}>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleReimbursementConfirmed(reimb.id)}
                            disabled={!isFinance || reimb.status === 'pending_review'}
                            className={cn((!isFinance || reimb.status === 'pending_review') && 'opacity-50 cursor-not-allowed')}
                          >
                            {reimb.confirmed ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-600">{reimb.orderNo}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{reimb.date}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium tabular-nums text-green-600">
                          +{formatCurrency(reimb.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', statusCfg.className)}>
                            {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <SectionTitle icon={Wallet} title="薪资结算明细" desc="工资、奖金、补贴、扣除项等" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">基本工资</span>
                    <span className="text-xs text-gray-400">
                      ({formatCurrency(MONTHLY_SALARY)} ÷ {MONTHLY_WORK_DAYS}天 × {ACTUAL_ATTENDANCE}天)
                    </span>
                  </div>
                  <MoneyDisplay amount={basicSalary} showSign />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <HandCoins className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">绩效奖金</span>
                  </div>
                  <div className="w-40">
                    <NumberInput value={performanceBonus} onChange={setPerformanceBonus} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">加班费</span>
                  </div>
                  <div className="w-40">
                    <NumberInput value={overtimePay} onChange={setOvertimePay} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">补贴</span>
                  </div>
                  <div className="w-40">
                    <NumberInput value={allowance} onChange={setAllowance} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">社保公积金</span>
                  </div>
                  <MoneyDisplay amount={-SOCIAL_SECURITY_HOUSING} showSign />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">个人所得税</span>
                  </div>
                  <MoneyDisplay amount={-PERSONAL_INCOME_TAX} showSign />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">其他扣除</span>
                  </div>
                  <div className="w-40">
                    <NumberInput value={otherDeduction} onChange={(v) => setOtherDeduction(Math.abs(v))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionTitle icon={CalendarCheck} title="年假结算" desc="未休年假折算金额" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">剩余年假天数</span>
                  <div className="flex items-center gap-1">
                    <span className="text-3xl font-bold text-amber-500 tabular-nums">{REMAINING_ANNUAL_LEAVE}</span>
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-amber-600 mb-1">未休年假折算金额</div>
                      <div className="text-xs text-amber-500/80">
                        日均工资 {formatCurrency(dailySalary)} × {REMAINING_ANNUAL_LEAVE} 天
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600 tabular-nums">
                      +{formatCurrency(annualLeavePay)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <SectionTitle icon={HandCoins} title="离职补偿金" desc="如有，请填写金额" />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">补偿金金额（元）</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
                    <input
                      type="number"
                      value={compensation}
                      onChange={(e) => setCompensation(Number(e.target.value) || 0)}
                      disabled={!isFinance}
                      className={cn(
                        'w-full pl-8 pr-4 py-3 text-lg rounded-lg border transition-colors',
                        !isFinance
                          ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                      )}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    N+1 补偿方案：工龄3年 × 月薪 {formatCurrency(MONTHLY_SALARY)} = {formatCurrency(75000)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-green-400" />
              <h3 className="text-base font-semibold text-white">结算汇总</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="text-xs text-gray-400 mb-2">应发合计</div>
                <div className="text-2xl font-bold tabular-nums text-green-400">
                  +{formatCurrency(totalIncome)}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <div className="text-xs text-gray-400 mb-2">扣除合计</div>
                <div className="text-2xl font-bold tabular-nums text-red-400">
                  -{formatCurrency(totalDeduction)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl p-5 border border-green-400/30">
                <div className="text-xs text-green-300 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  实发金额
                </div>
                <div className="text-3xl md:text-4xl font-bold tabular-nums text-white">
                  {formatCurrency(netPayable)}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CalendarDays className="w-4 h-4" />
                预计发放日期：
                <span className="font-semibold text-white">{expectedPayDate}</span>
              </div>

              {isFinance && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={settlementConfirmed}
                  className={cn(
                    'px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg',
                    settlementConfirmed
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-green-500/30 active:scale-[0.98]'
                  )}
                >
                  {settlementConfirmed ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      结算已确认
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      确认结算
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-[480px]">
          <CommentSection category="settlement" />
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">确认结算</h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">请再次核对以下信息：</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-amber-700">
                    <li>借款核对情况及处理方式</li>
                    <li>报销单审核状态</li>
                    <li>薪资明细（基本工资、奖金、加班费、补贴）</li>
                    <li>扣除项（社保、个税、其他）</li>
                    <li>年假折算与补偿金</li>
                  </ul>
                </div>
              </div>

              <div className="mb-6 p-5 bg-gray-900 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">员工实发金额</div>
                <div className="text-3xl font-bold tabular-nums text-white">
                  {formatCurrency(netPayable)}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSettlement}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认无误
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
