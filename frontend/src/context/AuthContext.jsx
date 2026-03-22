import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user,  setUser]  = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', next);
    document.body.style.background = next ? '#111827' : '#F9FAFB';
    document.body.style.color      = next ? '#F9FAFB' : '#111827';
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, darkMode, toggleDark, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}