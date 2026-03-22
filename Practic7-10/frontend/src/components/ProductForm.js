import { useState, useEffect } from 'react';

export default function ProductForm({ isOpen, onClose, onSubmit, product, title }) {
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        price: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || '',
                category: product.category || '',
                description: product.description || '',
                price: product.price || ''
            });
        } else {
            setFormData({ title: '', category: '', description: '', price: '' });
        }
        setErrors({});
    }, [product]);

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Название обязательно';
        if (!formData.category.trim()) newErrors.category = 'Категория обязательна';
        if (!formData.description.trim()) newErrors.description = 'Описание обязательно';
        if (!formData.price) {
            newErrors.price = 'Цена обязательна';
        } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Цена должна быть положительным числом';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Очищаем ошибку поля при вводе
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        onSubmit({ 
            ...formData, 
            price: parseFloat(formData.price) 
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.modalTitle}>{title}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Название *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            style={{...styles.input, ...(errors.title && styles.inputError)}}
                        />
                        {errors.title && <span style={styles.errorText}>{errors.title}</span>}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Категория *</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            style={{...styles.input, ...(errors.category && styles.inputError)}}
                        />
                        {errors.category && <span style={styles.errorText}>{errors.category}</span>}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Описание *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            style={{...styles.textarea, ...(errors.description && styles.inputError)}}
                            rows="4"
                        />
                        {errors.description && <span style={styles.errorText}>{errors.description}</span>}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Цена *</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            step="0.01"
                            style={{...styles.input, ...(errors.price && styles.inputError)}}
                        />
                        {errors.price && <span style={styles.errorText}>{errors.price}</span>}
                    </div>
                    
                    <div style={styles.modalButtons}>
                        <button type="button" onClick={onClose} style={styles.cancelButton}>
                            Отмена
                        </button>
                        <button type="submit" style={styles.submitButton}>
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
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
        animation: 'fadeIn 0.2s ease-out',
    },
    modal: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
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
        padding: '0.6rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '1rem',
        transition: 'border-color 0.2s',
    },
    textarea: {
        width: '100%',
        padding: '0.6rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '1rem',
        fontFamily: 'inherit',
        resize: 'vertical',
        transition: 'border-color 0.2s',
    },
    inputError: {
        borderColor: '#dc3545',
    },
    errorText: {
        color: '#dc3545',
        fontSize: '0.85rem',
        marginTop: '0.25rem',
        display: 'block',
    },
    modalButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        marginTop: '1.5rem',
    },
    cancelButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'background-color 0.2s',
    },
    submitButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'background-color 0.2s',
    }
};