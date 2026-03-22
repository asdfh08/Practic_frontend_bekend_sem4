import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../axios';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const navigate = useNavigate();
    const { user, logout, hasRole } = useAuth();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/products');
            setProducts(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Не удалось загрузить товары');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreateProduct = async (productData) => {
        try {
            await apiClient.post('/products', productData);
            await fetchProducts();
        } catch (err) {
            console.error('Error creating product:', err);
            if (err.response?.status === 403) {
                alert('У вас недостаточно прав для создания товара');
            } else {
                alert(err.response?.data?.error || 'Ошибка при создании товара');
            }
        }
    };

    const handleUpdateProduct = async (productData) => {
        try {
            await apiClient.put(`/products/${editingProduct.id}`, productData);
            await fetchProducts();
            setEditingProduct(null);
        } catch (err) {
            console.error('Error updating product:', err);
            if (err.response?.status === 403) {
                alert('У вас недостаточно прав для редактирования товара');
            } else {
                alert(err.response?.data?.error || 'Ошибка при обновлении товара');
            }
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
        
        try {
            await apiClient.delete(`/products/${id}`);
            await fetchProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            if (err.response?.status === 403) {
                alert('Удаление товаров доступно только администратору');
            } else {
                alert('Ошибка при удалении товара');
            }
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const handleModalSubmit = (productData) => {
        if (editingProduct) {
            handleUpdateProduct(productData);
        } else {
            handleCreateProduct(productData);
        }
        setModalOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Определяем, может ли пользователь создавать/редактировать товары
    const canManageProducts = hasRole(['seller', 'admin']);
    // Может ли пользователь управлять пользователями (только админ)
    const canManageUsers = hasRole('admin');

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
                <h1 className="products-title">Управление товарами</h1>
                <div className="products-buttons">
                    {canManageProducts && (
                        <button onClick={openCreateModal} className="btn btn-success">
                            + Создать товар
                        </button>
                    )}
                    {canManageUsers && (
                        <button 
                            onClick={() => navigate('/users')} 
                            className="btn btn-warning"
                        >
                            👥 Управление пользователями
                        </button>
                    )}
                    <button onClick={handleLogout} className="btn btn-danger">
                        Выйти
                    </button>
                </div>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            {/* Отображаем информацию о роли пользователя */}
            <div className="user-info" style={{ 
                backgroundColor: '#e9ecef', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <strong>Вы вошли как:</strong> {user?.first_name} {user?.last_name} ({user?.email})
                </div>
                <div>
                    <span className="role-badge" style={{
                        backgroundColor: user?.role === 'admin' ? '#dc3545' : 
                                       user?.role === 'seller' ? '#ffc107' : '#28a745',
                        color: user?.role === 'seller' ? '#333' : 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                    }}>
                        {user?.role === 'admin' ? 'Администратор' : 
                         user?.role === 'seller' ? 'Продавец' : 'Пользователь'}
                    </span>
                </div>
            </div>
            
            <ProductList
                products={products}
                onEdit={openEditModal}
                onDelete={handleDeleteProduct}
                canManage={canManageProducts}
            />
            
            <ProductForm
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                product={editingProduct}
                title={editingProduct ? 'Редактировать товар' : 'Создать новый товар'}
            />
        </div>
    );
}