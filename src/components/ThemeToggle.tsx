
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  // Verificar se há um tema salvo no localStorage
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = window.localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    }
    // Se preferir modo escuro do sistema ou não houver tema salvo
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // Padrão é light
    return 'light';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  // Atualiza o atributo data-theme no HTML e salva no localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme} 
      className="rounded-full w-10 h-10 p-0 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-[#2E3A59]" />
      ) : (
        <Sun className="h-5 w-5 text-white" />
      )}
      <span className="sr-only">{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
    </Button>
  );
};

export default ThemeToggle;
