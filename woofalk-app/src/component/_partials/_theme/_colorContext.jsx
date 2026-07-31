import React from "react";

export const ColorContext = React.createContext({ ColorContextSchema: () => {} });

export function setThemeToStorage(){
  localStorage.getItem('isDarkMode') ? localStorage.removeItem('isDarkMode') : localStorage.setItem('isDarkMode', 'darkTheme');
}