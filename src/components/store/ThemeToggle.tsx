'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center w-14 h-7 bg-gray-100 dark:bg-gray-700 rounded-full p-1 transition-all duration-300 shadow-inner group"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
            {/* Sliding Indicator */}
            <div
                className={`absolute w-5 h-5 bg-white dark:bg-blue-500 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${theme === 'light' ? 'left-1' : 'left-8'
                    }`}
            >
                {theme === 'light' ? (
                    <Sun size={12} className="text-orange-500" />
                ) : (
                    <Moon size={12} className="text-white" />
                )}
            </div>

            {/* Background Icons (Peek-through) */}
            <div className="flex justify-between w-full px-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <Sun size={10} className="text-gray-400 dark:text-gray-500" />
                <Moon size={10} className="text-gray-400 dark:text-gray-500" />
            </div>
        </button>
    );
}
