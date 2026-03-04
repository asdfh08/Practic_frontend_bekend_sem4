const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

// Подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

// Начальные данные (10 товаров)
let products = [
    { 
        id: nanoid(6), 
        name: 'Смартфон X100', 
        category: 'Электроника',
        description: '6.5 дюймов дисплей, 128GB памяти, камера 48MP',
        price: 24999,
        stock: 15
    },
    { 
        id: nanoid(6), 
        name: 'Ноутбук ProBook 15', 
        category: 'Компьютеры',
        description: 'Intel i5, 16GB RAM, 512GB SSD',
        price: 54999,
        stock: 8
    },
    { 
        id: nanoid(6), 
        name: 'Наушники AirSound', 
        category: 'Аксессуары',
        description: 'Беспроводные, шумоподавление, 20ч работы',
        price: 3999,
        stock: 25
    },
    { 
        id: nanoid(6), 
        name: 'Кофемашина EspressoPro', 
        category: 'Для дома',
        description: 'Автоматическая, 15 бар, капучинатор',
        price: 18999,
        stock: 5
    },
    { 
        id: nanoid(6), 
        name: 'Фитнес-браслет ActiveBand', 
        category: 'Гаджеты',
        description: 'Шагомер, пульсометр, сон, 7 дней работы',
        price: 2499,
        stock: 30
    },
    { 
        id: nanoid(6), 
        name: 'Планшет Tab M10', 
        category: 'Электроника',
        description: '10 дюймов экран, 64GB, 4G LTE',
        price: 15999,
        stock: 12
    },
    { 
        id: nanoid(6), 
        name: 'Умные часы Watch 5', 
        category: 'Гаджеты',
        description: 'GPS, NFC, пульсометр, водозащита',
        price: 12999,
        stock: 7
    },
    { 
        id: nanoid(6), 
        name: 'Игровая мышь X-Treme', 
        category: 'Компьютеры',
        description: 'RGB, 16000 DPI, 6 кнопок',
        price: 2499,
        stock: 20
    },
    { 
        id: nanoid(6), 
        name: 'Внешний диск 1TB', 
        category: 'Комплектующие',
        description: 'USB 3.0, металлический корпус',
        price: 4499,
        stock: 18
    },
    { 
        id: nanoid(6), 
        name: 'Робот-пылесос CleanBot', 
        category: 'Для дома',
        description: 'Автоматическая уборка, управление со смартфона',
        price: 21999,
        stock: 4
    }
];

/**
 * Swagger конфигурация
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина',
            version: '1.0.0',
            description: 'REST API для управления товарами интернет-магазина',
            contact: {
                name: 'Разработчик',
                email: 'developer@example.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер'
            }
        ],
        tags: [
            {
                name: 'Products',
                description: 'Управление товарами'
            }
        ]
    },
    // Путь к файлам с JSDoc-комментариями
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Products API Documentation'
}));

// Корневой маршрут - редирект на документацию
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара (генерируется автоматически)
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "Смартфон X100"
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Электроника"
 *         description:
 *           type: string
 *           description: Описание товара
 *           example: "6.5 дюймов дисплей, 128GB памяти, камера 48MP"
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *           minimum: 0
 *           example: 24999
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *           minimum: 0
 *           example: 15
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 *           example: "Товар не найден"
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API для управления товарами интернет-магазина
 */

// Функция-помощник для поиска товара
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Товар не найден" });
        return null;
    }
    return product;
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название товара
 *                 example: "Игровая консоль PlayBox"
 *               category:
 *                 type: string
 *                 description: Категория товара
 *                 example: "Электроника"
 *               description:
 *                 type: string
 *                 description: Описание товара
 *                 example: "1TB SSD, 2 геймпада, 3 игры в подарок"
 *               price:
 *                 type: number
 *                 description: Цена товара
 *                 example: 45999
 *               stock:
 *                 type: integer
 *                 description: Количество на складе
 *                 example: 10
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Неверные данные запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock } = req.body;
    
    // Валидация
    if (!name || !category || !description || price === undefined || stock === undefined) {
        return res.status(400).json({ error: 'Необходимо заполнить все поля' });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *         example: "abc123"
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *         example: "abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое название товара
 *                 example: "Смартфон X100 Pro"
 *               category:
 *                 type: string
 *                 description: Новая категория
 *                 example: "Электроника"
 *               description:
 *                 type: string
 *                 description: Новое описание
 *                 example: "6.7 дюймов AMOLED, 256GB, камера 108MP"
 *               price:
 *                 type: number
 *                 description: Новая цена
 *                 example: 29999
 *               stock:
 *                 type: integer
 *                 description: Новое количество на складе
 *                 example: 12
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    // Проверяем, есть ли что обновлять
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    const { name, category, description, price, stock } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *         example: "abc123"
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Необработанная ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(` Сервер запущен на http://localhost:${port}`);
    console.log(` Документация Swagger: http://localhost:${port}/api-docs`);
    console.log(` Доступные маршруты:`);
    console.log(`   GET    /api/products - все товары`);
    console.log(`   GET    /api/products/:id - товар по ID`);
    console.log(`   POST   /api/products - создать товар`);
    console.log(`   PATCH  /api/products/:id - обновить товар`);
    console.log(`   DELETE /api/products/:id - удалить товар`);
});