import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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

export function exportAllData(store: any): void {
  const workbook = XLSX.utils.book_new();

  if (store.employees && store.employees.length > 0) {
    const employeeSheet = XLSX.utils.json_to_sheet(store.employees);
    XLSX.utils.book_append_sheet(workbook, employeeSheet, '员工信息');
  }

  if (store.resignationForms && store.resignationForms.length > 0) {
    const formSheet = XLSX.utils.json_to_sheet(store.resignationForms.map((form: any) => ({
      ...form,
      employeeTodos: form.employeeTodos?.join('; ') || '',
    })));
    XLSX.utils.book_append_sheet(workbook, formSheet, '离职申请单');
  }

  if (store.handoverTasks && store.handoverTasks.length > 0) {
    const taskSheet = XLSX.utils.json_to_sheet(store.handoverTasks);
    XLSX.utils.book_append_sheet(workbook, taskSheet, '交接任务');
  }

  if (store.assetItems && store.assetItems.length > 0) {
    const assetSheet = XLSX.utils.json_to_sheet(store.assetItems);
    XLSX.utils.book_append_sheet(workbook, assetSheet, '资产归还');
  }

  if (store.permissionItems && store.permissionItems.length > 0) {
    const permissionSheet = XLSX.utils.json_to_sheet(store.permissionItems);
    XLSX.utils.book_append_sheet(workbook, permissionSheet, '权限关闭');
  }

  if (store.settlementItems && store.settlementItems.length > 0) {
    const settlementSheet = XLSX.utils.json_to_sheet(store.settlementItems);
    XLSX.utils.book_append_sheet(workbook, settlementSheet, '财务结算');
  }

  if (store.comments && store.comments.length > 0) {
    const commentSheet = XLSX.utils.json_to_sheet(store.comments);
    XLSX.utils.book_append_sheet(workbook, commentSheet, '意见备注');
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `离职交接数据_${timestamp}.xlsx`);
}
