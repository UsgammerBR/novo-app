import { AppData, EquipmentItem } from './types';
import { CATEGORIES } from './constants';

export const getFormattedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isChristmasPeriod = (): boolean => {
  const now = new Date();
  const month = now.getMonth(); 
  const day = now.getDate();
  return month === 11 && day >= 20 && day <= 25;
};

export const isItemActive = (item: EquipmentItem): boolean => 
    (item.contract && item.contract.trim() !== '') || 
    (item.serial && item.serial.trim() !== '') || 
    item.photos.length > 0;

export const generateMonthlyReport = (data: AppData, date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    let report = `Relatório Mensal - ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\n\n`;
    const totals: Record<string, number> = {};
    
    CATEGORIES.forEach(cat => {
        report += `--- ${cat.toUpperCase()} ---\n`;
        let catEntries = 0;
        
        const sortedDates = Object.keys(data).sort();
        
        sortedDates.forEach(dateStr => {
            const d = new Date(dateStr + 'T12:00:00');
            if (d.getMonth() === month && d.getFullYear() === year) {
                const dayData = data[dateStr]?.[cat] || [];
                dayData.filter(isItemActive).forEach(item => {
                    const time = new Date(item.createdAt || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    report += `Data: ${d.toLocaleDateString('pt-BR')} | Hora: ${time}\n`;
                    report += `Contrato: ${item.contract || '-'} | Serial: ${item.serial || '-'}\n`;
                    report += `----------------------------\n`;
                    catEntries++;
                });
            }
        });
        
        totals[cat] = catEntries;
        if (catEntries === 0) report += `Nenhum registro.\n`;
        report += `\n`;
    });

    report += `\n============================\n`;
    report += `RESUMO DE TOTAIS DO MÊS\n`;
    report += `============================\n`;
    CATEGORIES.forEach(cat => {
        report += `TOTAL ${cat.toUpperCase()}: ${totals[cat]}\n`;
    });
    report += `============================\n`;
    
    return report;
};
