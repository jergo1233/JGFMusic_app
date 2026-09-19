import React, { createContext, useState, useContext, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { fileService } from '../services/fileService';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [bgUrl, setBgUrl] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [splashStyle, setSplashStyleState] = useState('neon');

  useEffect(() => {
    storageService.get('darkMode', false).then(isDark => {
      setDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
    });
    storageService.get('splashStyle', 'neon').then(savedStyle => {
      if (savedStyle) setSplashStyleState(savedStyle);
    });
    loadBg();
    loadLogo();
  }, []);

  const setSplashStyle = async (newStyle) => {
    setSplashStyleState(newStyle);
    await storageService.set('splashStyle', newStyle);
  };

  const loadBg = async () => {
    const uri = await storageService.get('bgUri', null);
    if (uri) {
      const url = await fileService.getFileUrl(uri);
      setBgUrl(url);
    }
  };

  const loadLogo = async () => {
    const uri = await storageService.get('customLogoUri', null);
    if (uri) {
      const url = await fileService.getFileUrl(uri);
      setLogoUrl(url);
    } else {
      setLogoUrl(null);
    }
  };

  const setLogoImage = async (fileObj) => {
    if (!fileObj) {
      setLogoUrl(null);
      await storageService.remove('customLogoUri');
      return;
    }
    const uri = await fileService.saveFileToPrivateStorage(fileObj, fileObj.name || `logo_${Date.now()}.jpg`);
    await storageService.set('customLogoUri', uri);
    await loadLogo();
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await storageService.set('darkMode', newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const setBackgroundImage = async (fileObj) => {
    if (!fileObj) {
      setBgUrl(null);
      await storageService.remove('bgUri');
      return;
    }
    const uri = await fileService.saveFileToPrivateStorage(fileObj, fileObj.name || `bg_${Date.now()}.jpg`);
    await storageService.set('bgUri', uri);
    await loadBg();
  };

  return (
    <ThemeContext.Provider value={{
      darkMode,
      toggleDarkMode,
      bgUrl,
      setBackgroundImage,
      splashStyle,
      setSplashStyle,
      logoUrl,
      setLogoImage
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
