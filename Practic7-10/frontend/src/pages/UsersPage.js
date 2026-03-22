import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../axios';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/users');
            setUsers(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response?.status === 403) {
                setError('У вас недостаточно прав для просмотра списка пользователей');
                setTimeout(() => navigate('/products'), 2000);
            } else {
                setError('Не удалось загрузить список пользователей');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateUser = async (userId, userData) => {
        try {
            await apiClient.put(`/users/${userId}`, userData);
            await fetchUsers();
            setShowEditModal(false);
            setEditingUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            alert(err.response?.data?.error || 'Ошибка при обновлении пользователя');
        }
    };

    const handleBlockUser = async (userId) => {
        const user = users.find(u => u.id === userId);
        if (user.id === currentUser?.id) {
            alert('Вы не можете заблокировать свой собственный аккаунт');
            return;
        }
        
        if (!window.confirm(`Вы уверены, что хотите заблокировать пользователя ${user.email}?`)) return;
        
        try {
            await apiClient.delete(`/users/${userId}`);
            await fetchUsers();
        } catch (err) {
            console.error('Error blocking user:', err);
            alert(err.response?.data?.error || 'Ошибка при блокировке пользователя');
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setShowEditModal(true);
    };

    const getRoleBadgeStyle = (role) => {
        switch(role) {
            case 'admin':
                return { backgroundColor: '#dc3545', color: 'white' };
            case 'seller':
                return { backgroundColor: '#ffc107', color: '#333' };
            default:
                return { backgroundColor: '#28a745', color: 'white' };
        }
    };

    const getRoleName = (role) => {
        switch(role) {
            case 'admin': return 'Администратор';
            case 'seller': return 'Продавец';
            default: return 'Пользователь';
        }
    };

    if (loading) {
        return (
            <div className="products-container">
                <div className="loader">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="products-container">
            <div className="products-header">
                <h1 className="products-title">👥 Управление пользователями</h1>
                <div className="products-buttons">
                    <button onClick={() => navigate('/products')} className="btn btn-secondary">
                        ← Назад к товарам
                    </button>
                </div>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            <div className="users-table-container" style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Имя</th>
                            <th style={styles.th}>Фамилия</th>
                            <th style={styles.th}>Роль</th>
                            <th style={styles.th}>Статус</th>
                            <th style={styles.th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={styles.tableRow}>
                                <td style={styles.td}>{user.id}</td>
                                <td style={styles.td}>{user.email}</td>
                                <td style={styles.td}>{user.first_name}</td>
                                <td style={styles.td}>{user.last_name}</td>
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.roleBadge,
                                        ...getRoleBadgeStyle(user.role)
                                    }}>
                                        {getRoleName(user.role)}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: user.isActive !== false ? '#d4edda' : '#f8d7da',
                                        color: user.isActive !== false ? '#155724' : '#721c24'
                                    }}>
                                        {user.isActive !== false ? 'Активен' : 'Заблокирован'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            style={styles.editButton}
                                            className="btn-edit"
                                        >
                                            ✏️ Редактировать
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleBlockUser(user.id)}
                                                style={styles.deleteButton}
                                                className="btn-delete"
                                                disabled={user.isActive === false}
                                            >
                                                🔒 Блокировать
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Модальное окно редактирования пользователя */}
            {showEditModal && editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                    }}
                    onSave={handleUpdateUser}
                />
            )}
        </div>
    );
}

// Компонент модального окна редактирования пользователя
function EditUserModal({ user, onClose, onSave }) {
    const [formData, setFormData] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(user.id, formData);
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.modalTitle}>Редактирование пользователя</h2>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Имя</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Фамилия</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Роль</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={styles.select}
                        >
                            <option value="user">Пользователь</option>
                            <option value="seller">Продавец</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div style={styles.modalButtons}>
                        <button type="button" onClick={onClose} style={styles.cancelButton}>
                            Отмена
                        </button>
                        <button type="submit" style={styles.submitButton} disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    tableHeader: {
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #e9ecef',
    },
    th: {
        padding: '1rem',
        textAlign: 'left',
        fontWeight: '600',
        color: '#495057',
    },
    td: {
        padding: '1rem',
        borderBottom: '1px solid #e9ecef',
        verticalAlign: 'middle',
    },
    tableRow: {
        transition: 'background-color 0.2s',
    },
    roleBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        display: 'inline-block',
    },
    statusBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        display: 'inline-block',
    },
    editButton: {
        padding: '0.4rem 0.8rem',
        backgroundColor: '#ffc107',
        color: '#333',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
    },
    deleteButton: {
        padding: '0.4rem 0.8rem',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
    },
    modalTitle: {
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        color: '#333',
    },
    inputGroup: {
        marginBottom: '1rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '1rem',
    },
    select: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '1rem',
        backgroundColor: 'white',
    },
    modalButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '1.5rem',
    },
    cancelButton: {
        padding: '0.6rem 1.2rem',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    },
    submitButton: {
        padding: '0.6rem 1.2rem',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    }
};