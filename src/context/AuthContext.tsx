import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoer: boolean;
  isLoading: boolean;
  login: (loginId: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  changePassword: (newPassword: string) => { success: boolean; message?: string };
  quickSwitchUser: (userId: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'yfl_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = () => {
    try {
      const storedId = localStorage.getItem(CURRENT_USER_KEY);
      const users = storage.getUsers();
      if (storedId) {
        const found = users.find((u) => u.id === storedId);
        if (found && found.status !== 'suspended') {
          setCurrentUser(found);
        } else {
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }
      } else {
        // Default to admin for seamless initial inspection
        const defaultAdmin = users.find((u) => u.role === 'admin' && u.status === 'active') || users[0];
        if (defaultAdmin) {
          setCurrentUser(defaultAdmin);
          localStorage.setItem(CURRENT_USER_KEY, defaultAdmin.id);
        }
      }
    } catch (e) {
      console.error('Error loading current user:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (loginId: string, password: string): { success: boolean; message?: string } => {
    const users = storage.getUsers();
    const user = users.find(
      (u) => u.loginId.toLowerCase() === loginId.trim().toLowerCase() || u.email.toLowerCase() === loginId.trim().toLowerCase()
    );

    if (!user) {
      return { success: false, message: 'Invalid Login ID or Username. Please check your credentials.' };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        message: 'Your account has been suspended by management. Please contact Yajur Fibres plant administration.',
      };
    }

    // Password validation (fallback to default if not yet stored)
    const expectedPassword = user.password || (user.role === 'admin' ? 'Admin@1234' : 'User@1234');
    if (password !== expectedPassword) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Update last login
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    storage.saveUsers(updatedUsers);

    // Save current session
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    setCurrentUser(user);

    storage.addAuditLog({
      action: 'USER_LOGIN',
      userId: user.id,
      userName: user.name,
      role: user.role,
      recordType: 'Session',
      recordId: user.loginId,
      reason: `Successful authentication from web portal.`,
    });

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      storage.addAuditLog({
        action: 'USER_LOGOUT',
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        recordType: 'Session',
        recordId: currentUser.loginId,
        reason: 'User signed out from web portal.',
      });
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
  };

  const changePassword = (newPassword: string): { success: boolean; message?: string } => {
    if (!currentUser) return { success: false, message: 'Not authenticated.' };
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const users = storage.getUsers();
    const updated = users.map((u) =>
      u.id === currentUser.id ? { ...u, password: newPassword, mustChangePassword: false, updatedAt: new Date().toISOString() } : u
    );
    storage.saveUsers(updated);

    const updatedUser = { ...currentUser, password: newPassword, mustChangePassword: false };
    setCurrentUser(updatedUser);

    storage.addAuditLog({
      action: 'PASSWORD_CHANGE',
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      recordType: 'Security',
      recordId: currentUser.loginId,
      reason: 'User successfully updated their account password.',
    });

    return { success: true, message: 'Password changed successfully.' };
  };

  const quickSwitchUser = (userId: string) => {
    const users = storage.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target && target.status !== 'suspended') {
      localStorage.setItem(CURRENT_USER_KEY, target.id);
      setCurrentUser(target);
    }
  };

  const refreshUser = () => {
    loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isDoer: currentUser?.role === 'doer',
        isLoading,
        login,
        logout,
        changePassword,
        quickSwitchUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
