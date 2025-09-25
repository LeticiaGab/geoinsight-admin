import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light'; // Default to dark mode (false)
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.remove('dark'); // Remove dark class for light mode
    } else {
      root.classList.add('dark'); // Add dark class for default dark mode
    }
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  const toggleTheme = () => setIsLight(!isLight);

  return { isLight, toggleTheme, isDark: !isLight };
};