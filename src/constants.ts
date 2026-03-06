import { EquipmentCategory } from './types';

export const CATEGORIES: EquipmentCategory[] = [
  EquipmentCategory.BOX, 
  EquipmentCategory.BOX_SOUND, 
  EquipmentCategory.CONTROLE, 
  EquipmentCategory.CAMERA, 
  EquipmentCategory.CHIP
];

export const HOLIDAYS_SP: Record<string, { name: string; icon: string; color: string; type: 'holiday' | 'event' }> = {
    '01-01': { name: 'Confraternização Universal', icon: '🥂', color: 'bg-blue-600', type: 'holiday' },
    '25-01': { name: 'Aniversário de São Paulo', icon: '🏙️', color: 'bg-slate-700', type: 'holiday' },
    '01-05': { name: 'Dia do Trabalho', icon: '🛠️', color: 'bg-orange-600', type: 'holiday' },
    '09-07': { name: 'Revolução Constitucionalista', icon: '⚔️', color: 'bg-slate-900', type: 'holiday' },
    '07-09': { name: 'Independência do Brasil', icon: '🇧🇷', color: 'bg-green-600', type: 'holiday' },
    '12-10': { name: 'Nossa Senhora Aparecida', icon: '🙏', color: 'bg-blue-800', type: 'holiday' },
    '02-11': { name: 'Finados', icon: '🕯️', color: 'bg-slate-500', type: 'holiday' },
    '15-11': { name: 'Proclamação da República', icon: '🏛️', color: 'bg-emerald-700', type: 'holiday' },
    '20-11': { name: 'Consciência Negra', icon: '✊🏾', color: 'bg-stone-800', type: 'holiday' },
    '25-12': { name: 'Natal', icon: '🎄', color: 'bg-red-600', type: 'holiday' },
    // Eventos
    '12-06': { name: 'Dia dos Namorados', icon: '❤️', color: 'bg-pink-500', type: 'event' },
    '31-10': { name: 'Halloween', icon: '🎃', color: 'bg-orange-500', type: 'event' },
};
