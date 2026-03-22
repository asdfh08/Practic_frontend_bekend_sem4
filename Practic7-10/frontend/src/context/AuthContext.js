// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../axios';

const AuthContext = createContext(null);

// Хук для использования контекста аутентификации
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Провайдер аутентификации, оборачивает приложение
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('accessToken'));

    // Загрузка данных текущего пользователя с сервера
    const fetchUser = async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // Если токен недействителен, выходим из системы
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Загружаем пользователя при монтировании компонента
    useEffect(() => {
        fetchUser();
    }, []);

    // Вход в систему: сохраняем токены и данные пользователя
    const login = (accessToken, refreshToken, userData) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setToken(accessToken);
        setUser(userData);
    };

    // Выход из системы: удаляем токены и данные пользователя
    const logout = () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            // Отправляем запрос на сервер для удаления refresh-токена
            apiClient.post('/auth/logout', { refreshToken }).catch(console.error);
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
    };

    // Проверка наличия у пользователя необходимой роли
    // Принимает строку с одной ролью или массив ролей
    const hasRole = (roles) => {
        if (!user) return false;
        if (typeof roles === 'string') return user.role === roles;
        return roles.includes(user.role);
    };

    // Значения, которые будут доступны через хук useAuth()
    const value = {
        user,           
        loading,        
        token,          
        login,          
        logout,         
        hasRole,        
        isAuthenticated: !!user  
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};