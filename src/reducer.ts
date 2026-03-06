import { AppData, EquipmentCategory, EquipmentItem, DailyData } from './types';
import { CATEGORIES } from './constants';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const createEmptyDailyData = (): DailyData => {
  const data = {} as Partial<DailyData>;
  CATEGORIES.forEach(category => {
    data[category] = [{ id: generateId(), contract: '', serial: '', photos: [], createdAt: Date.now() }];
  });
  return data as DailyData;
};

export type Action =
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_ITEM'; payload: { date: string; category: EquipmentCategory } }
  | { type: 'UPDATE_ITEM'; payload: { date: string; category: EquipmentCategory; item: EquipmentItem } }
  | { type: 'DELETE_SINGLE_ITEM'; payload: { date: string; category: EquipmentCategory; itemId: string } }
  | { type: 'DELETE_MULTIPLE_ITEMS'; payload: { date: string; category: EquipmentCategory; itemIds: string[] } };

export const dataReducer = (state: AppData, action: Action): AppData => {
    switch(action.type) {
        case 'SET_DATA': return action.payload;
        
        case 'ADD_ITEM': {
            const { date, category } = action.payload;
            const dayData = state[date] || createEmptyDailyData();
            const categoryItems = [...(dayData[category] || [])];
            
            categoryItems.push({ 
                id: generateId(), 
                contract: '', 
                serial: '', 
                photos: [], 
                createdAt: Date.now() 
            });

            return {
                ...state,
                [date]: {
                    ...dayData,
                    [category]: categoryItems
                }
            };
        }
        
        case 'UPDATE_ITEM': {
            const { date, category, item } = action.payload;
            const dayData = state[date] || createEmptyDailyData();
            const categoryItems = [...(dayData[category] || [])];
            
            const itemIndex = categoryItems.findIndex((i: EquipmentItem) => i.id === item.id);
            if (itemIndex > -1) {
                categoryItems[itemIndex] = item;
            } else {
                categoryItems.push(item);
            }

            return {
                ...state,
                [date]: {
                    ...dayData,
                    [category]: categoryItems
                }
            };
        }
        
        case 'DELETE_SINGLE_ITEM': {
             const { date, category, itemId } = action.payload;
             const dayData = state[date];
             if (!dayData || !dayData[category]) return state;
             
             let categoryItems = dayData[category].filter((item: EquipmentItem) => item.id !== itemId);
             
             if (categoryItems.length === 0) {
                 categoryItems = [{ id: generateId(), contract: '', serial: '', photos: [], createdAt: Date.now() }];
             }
             
             return {
                 ...state,
                 [date]: {
                     ...dayData,
                     [category]: categoryItems
                 }
             };
        }
        
        case 'DELETE_MULTIPLE_ITEMS': {
            const { date, category, itemIds } = action.payload;
            if (!itemIds || itemIds.length === 0) return state;
            
            const dayData = state[date];
            if (!dayData || !dayData[category]) return state;
            
            let categoryItems = dayData[category].filter((item: EquipmentItem) => !itemIds.includes(item.id));
            
            if (categoryItems.length === 0) {
                categoryItems = [{ id: generateId(), contract: '', serial: '', photos: [], createdAt: Date.now() }];
            }
            
            return {
                ...state,
                [date]: {
                    ...dayData,
                    [category]: categoryItems
                }
            };
        }
        
        default: return state;
    }
};
