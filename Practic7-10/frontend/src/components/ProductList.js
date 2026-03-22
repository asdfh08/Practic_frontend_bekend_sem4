import ProductCard from './ProductCard';

export default function ProductList({ products, onEdit, onDelete, canManage }) {
    if (products.length === 0) {
        return (
            <div style={styles.emptyState}>
                <div className="empty-state-icon">📦</div>
                <p>Нет товаров. Создайте первый товар!</p>
            </div>
        );
    }

    return (
        <div style={styles.productGrid}>
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canManage={canManage}
                />
            ))}
        </div>
    );
}

const styles = {
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        color: '#6c757d',
    }
};