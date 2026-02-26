import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'highContrast' | 'sepia';

export interface ThemeConfig {
  name: string;
  isDefault: boolean;
  description?: string;
  icon?: string;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  
  const themes: Record<Theme, ThemeConfig> = {
    light: {
      name: '浅色模式',
      isDefault: true,
      description: '明亮清晰，适合日间使用',
      icon: 'sun'
    },
    dark: {
      name: '深色模式',
      isDefault: true,
      description: '护眼舒适，适合夜间使用',
      icon: 'moon'
    },
    system: {
      name: '跟随系统',
      isDefault: true,
      description: '自动跟随系统主题设置',
      icon: 'monitor'
    },
    highContrast: {
      name: '高对比度',
      isDefault: false,
      description: '增强可读性，适合视力障碍用户',
      icon: 'zap'
    },
    sepia: {
      name: '护眼模式',
      isDefault: false,
      description: '温暖色调，减少眼部疲劳',
      icon: 'coffee'
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = 'system';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (themeName: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    root.classList.remove('dark', 'high-contrast', 'sepia');
    
    if (themeName === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else if (themeName === 'light') {
    } else if (themeName === 'dark') {
      root.classList.add('dark');
    } else if (themeName === 'highContrast') {
      root.classList.add('dark', 'high-contrast');
    } else if (themeName === 'sepia') {
      root.classList.add('sepia');
    }
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const newTheme = themeOrder[nextIndex];
    setTheme(newTheme);
    applyTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  const switchTheme = (themeName: Theme) => {
    setTheme(themeName);
    applyTheme(themeName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', themeName);
    }
  };

  return { theme, themes, toggleTheme, switchTheme };
}
