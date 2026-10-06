'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Profile, Role } from '@/types';
import { DataStore, subscribe } from '@/services/store';

interface AuthContextType {
  currentUser: Profile | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);

    const unsubscribe = subscribe(() => {
      const updatedUser = DataStore.getCurrentUser();
      setCurrentUser(updatedUser);
    });

    return () => unsubscribe();
  }, []);

  // Strict route security enforcement (Section 5 & 22)
  useEffect(() => {
    if (isLoading) return;

    const isAdminRoute = pathname?.startsWith('/admin');
    const isMemberRoute = pathname?.startsWith('/member');
    const isLoginRoute = pathname === '/login' || pathname === '/admin/login' || pathname === '/member/login';

    if (!currentUser) {
      if (isAdminRoute || isMemberRoute) {
        router.replace('/login');
      }
      return;
    }

    // Role boundary checks
    if (currentUser.role === 'member' && isAdminRoute) {
      router.replace('/member/dashboard');
      return;
    }

    if (currentUser.role === 'admin' && isMemberRoute) {
      router.replace('/admin/dashboard');
      return;
    }

    if (isLoginRoute && currentUser) {
      if (currentUser.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/member/dashboard');
      }
    }
  }, [currentUser, isLoading, pathname, router]);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = DataStore.authenticate(identifier, pass);
      if (!res.success || !res.user) {
        setIsLoading(false);
        return { success: false, error: res.error || 'Authentication failed' };
      }

      setCurrentUser(res.user);
      setIsLoading(false);

      if (res.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/member/dashboard');
      }

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const logout = () => {
    DataStore.setSession(null);
    setCurrentUser(null);
    router.push('/login');
  };

  const updatePassword = async (newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      DataStore.changePassword(currentUser.id, newPass);
      const refreshed = DataStore.getProfile(currentUser.id);
      if (refreshed) {
        setCurrentUser(refreshed);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
