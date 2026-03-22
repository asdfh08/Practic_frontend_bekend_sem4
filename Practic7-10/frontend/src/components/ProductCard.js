export default function ProductCard({ product, onEdit, onDelete, canManage }) {
    return (
        <div style={styles.productCard}>
            <h3 style={styles.productTitle}>{product.title}</h3>
            <p style={styles.productCategory}>
                <span style={{ color: '#667eea' }}>Категория:</span> {product.category}
            </p>
            <p style={styles.productDescription}>{product.description}</p>
            <p style={styles.productPrice}>
                <span style={{ color: '#28a745' }}>Цена:</span> {product.price} ₽
            </p>
            {canManage && (
                <div style={styles.productButtons}>
                    <button 
                        onClick={() => onEdit(product)} 
                        style={styles.editButton}
                        className="btn-edit"
                    >
                        ✏️ Редактировать
                    </button>
                    <button 
                        onClick={() => onDelete(product.id)} 
                        style={styles.deleteButton}
                        className="btn-delete"
                    >
                        🗑️ Удалить
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    productCard: {
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '1.25rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
    },
    productTitle: {
        margin: '0 0 0.75rem 0',
        color: '#333',
        fontSize: '1.25rem',
        fontWeight: '600',
    },
    productCategory: {
        color: '#666',
        fontSize: '0.85rem',
        margin: '0 0 0.5rem 0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    productDescription: {
        color: '#555',
        margin: '0 0 0.75rem 0',
        lineHeight: '1.5',
        fontSize: '0.9rem',
    },
    productPrice: {
        fontWeight: 'bold',
        color: '#28a745',
        margin: '0 0 1rem 0',
        fontSize: '1.2rem',
    },
    productButtons: {
        display: 'flex',
        gap: '0.75rem',
    },
    editButton: {
        flex: 1,
        padding: '0.6rem',
        backgroundColor: '#ffc107',
        color: '#333',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    },
    deleteButton: {
        flex: 1,
        padding: '0.6rem',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    }
};