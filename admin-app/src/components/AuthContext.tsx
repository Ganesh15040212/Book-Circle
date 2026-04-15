import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    isAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (email: string, password: string, captchaToken: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('admin_accessToken');
        const storedUser = localStorage.getItem('admin_user');
        if (storedToken && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Only restore session if user is actually an admin
            if (parsedUser.isAdmin) {
                setAccessToken(storedToken);
                setUser(parsedUser);
            } else {
                localStorage.removeItem('admin_accessToken');
                localStorage.removeItem('admin_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, captchaToken: string) => {
        const response = await apiFetch('/auth/login.php', {
            method: 'POST',
            body: JSON.stringify({ email, password, captchaToken }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        if (!data.user?.isAdmin) {
            throw new Error('Access denied. Admin credentials required.');
        }

        setAccessToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('admin_accessToken', data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('admin_user');
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
