
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-6 right-6 z-50">
      <Button
        onClick={toggleTheme}
        variant="ghost"
        size="sm"
        className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-300 hover:rotate-12" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600 transition-transform duration-300 hover:-rotate-12" />
        )}
      </Button>
    </div>
  );
};

export default ThemeToggle;
