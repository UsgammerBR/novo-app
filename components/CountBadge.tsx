import React from 'react';

interface CountBadgeProps {
    count: number;
}

export const CountBadge: React.FC<CountBadgeProps> = ({ count }) => {
    if (count === 0) return null;
    return (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300">
            {count}
        </div>
    );
};
