const express = require('express');
const { nanoid } = require('nanoid');//для генерации уникальных ID
const cors = require('cors');//для связи с React
const app = express();
const port = 3000;

//добавили новые поля (category, description, stock)
let products = [
    { id: nanoid(6), name: 'iPhone 17 Pro Max', price: 149999, category: 'Смартфоны', description: 'Флагманский смартфон Apple', stock: 10 },
    { id: nanoid(6), name: 'MacBook Pro 16"', price: 299999, category: 'Ноутбуки', description: 'Профессиональный ноутбук', stock: 5 },
    { id: nanoid(6), name: 'AirPods Pro 3', price: 24999, category: 'Аксессуары', description: 'Беспроводные наушники', stock: 15 },
    { id: nanoid(6), name: 'iPad Pro', price: 89999, category: 'Планшеты', description: 'Мощный планшет', stock: 7 },
    { id: nanoid(6), name: 'Apple Watch Ultra', price: 79999, category: 'Часы', description: 'Умные часы', stock: 4 }
];

app.use(express.json());

//CORS для связи с React
app.use(cors({ 
    origin: "http://localhost:3001", 
    methods: ["GET", "POST", "PATCH", "DELETE"], 
    allowedHeaders: ["Content-Type", "Authorization"] 
}));

//логирование запросов (для отладки)
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

//функция-помощник (чтобы не повторять код)
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

//Routes (маршруты)

app.get('/', (req, res) => {
    res.send('Server is working');
});

//добавили /api/ префикс
app.get('/api/products', (req, res) => {
    res.json(products);
});

//добавили /api/ префикс и используем функцию-помощник
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

//добавили /api/ префикс + новые поля + nanoid
app.post('/api/products', (req, res) => {
    const { name, price, category, description, stock } = req.body;
    
    //ДОБАВЛЕНО: проверка всех полей
    if (!name || !price || !category || !description || stock === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const newProduct = {
        id: nanoid(6),//используем nanoid вместо Date.now()
        name: name.trim(),
        price: Number(price),
        category: category.trim(),//новое поле
        description: description.trim(),//новое поле
        stock: Number(stock)//новое поле
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

//добавили /api/ префикс, новые поля и используем функцию-помощник
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    const { name, price, category, description, stock } = req.body;
    
    //проверка, что есть что обновлять
    if (name === undefined && price === undefined && category === undefined && description === undefined && stock === undefined) {
        return res.status(400).json({ error: "Nothing to update" });
    }
    
    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category.trim();        //новое поле
    if (description !== undefined) product.description = description.trim(); //новое поле
    if (stock !== undefined) product.stock = Number(stock);                 //новое поле
    
    res.json(product);
});

//добавили /api/ префикс и правильный статус 204
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();//204 No Content вместо 200
});

//обработка 404 для неизвестных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

//глобальный обработчик ошибок (чтобы сервер не падал)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});