// src/pages/LoginPage.js
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../axios";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user } = response.data;
            
            login(accessToken, refreshToken, user);
            
            navigate('/products');
        } catch (err) {
            console.error('Login error:', err);
            if (err.response?.status === 403) {
                setError(err.response?.data?.error || 'Аккаунт заблокирован');
            } else if (err.response?.status === 401) {
                setError('Неверный пароль');
            } else if (err.response?.status === 404) {
                setError('Пользователь с таким email не найден');
            } else {
                setError(err.response?.data?.error || 'Ошибка при входе. Попробуйте снова.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2 className="auth-title">Вход в систему</h2>
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Вход...' : 'Войти'}
                </button>
                <p className="auth-link">
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
            </form>
        </div>
    );
}