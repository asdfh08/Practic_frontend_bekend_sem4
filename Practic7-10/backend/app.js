const cors = require('cors');
const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// JWT настройки
const JWT_SECRET = 'your_secret_key_here_change_this_in_production';
const REFRESH_SECRET = 'your_refresh_secret_key_here_change_this_in_production'; // Добавлено для refresh-токенов
const ACCESS_EXPIRES_IN = '15m';  // увеличено с 7s для удобства
const REFRESH_EXPIRES_IN = '7d'; // Добавлено для refresh-токенов

// Определение ролей
const ROLES = {
    USER: 'user',
    SELLER: 'seller',
    ADMIN: 'admin'
};

let users = [];
let products = [];

// Хранилище активных refresh-токенов (в реальном приложении использовать БД)
let refreshTokens = new Set();

app.use(express.json());

const saltRounds = 10;

app.use(cors({
    origin: 'http://localhost:3001',  // порт фронтенда
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

async function hashPassword(password) {
    return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

// Функции для генерации токенов с включением роли
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            role: user.role  // Добавляем роль в токен
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            role: user.role  // Добавляем роль в refresh-токен
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN
        }
    );
}

// Middleware для проверки JWT токена
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    console.log(' authMiddleware - header:', scheme, 'token exists:', !!token);

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            error: 'Missing or invalid Authorization header. Expected format: Bearer <token>'
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        console.log(' authMiddleware - payload:', { sub: payload.sub, email: payload.email, role: payload.role });
        req.user = payload;
        next();
    } catch (err) {
        console.log(' authMiddleware - invalid token:', err.message);
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}

// Middleware для проверки ролей
function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        console.log('   roleMiddleware - checking roles:', allowedRoles);
        console.log('   req.user:', req.user);
        
        if (!req.user) {
            console.log(' roleMiddleware - no user in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const userRole = req.user.role;
        console.log(`   User role: ${userRole}, Allowed: ${allowedRoles.join(', ')}`);
        
        if (!allowedRoles.includes(userRole)) {
            console.log(` roleMiddleware - access denied for role: ${userRole}`);
            return res.status(403).json({ 
                error: 'Forbidden: Insufficient permissions',
                requiredRoles: allowedRoles,
                yourRole: userRole
            });
        }
        
        console.log(` roleMiddleware - access granted for role: ${userRole}`);
        next();
    };
}

const findUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

const findUserById = (id) => {
    return users.find(user => user.id === id);
};

// Обновленные swaggerOptions
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API для управления товарами (с JWT авторизацией и refresh-токенами)',
            version: '4.0.0',
            description: 'Практическое задание 7-11: регистрация, JWT авторизация, refresh-токены, CRUD для товаров и RBAC',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
    },
    apis: ['./app.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID
 *         email:
 *           type: string
 *           description: Email пользователя (логин)
 *         first_name:
 *           type: string
 *           description: Имя
 *         last_name:
 *           type: string
 *           description: Фамилия
 *         password:
 *           type: string
 *           description: Пароль (не будет возвращаться в ответах)
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *           description: Роль пользователя
 *         isActive:
 *           type: boolean
 *           description: Статус аккаунта (активен/заблокирован)
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID товара
 *         title:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         createdBy:
 *           type: string
 *           description: ID пользователя, создавшего товар
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT токен доступа (истекает через 15 минут)
 *         refreshToken:
 *           type: string
 *           description: JWT токен обновления (истекает через 7 дней)
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             role:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Регистрация и авторизация
 *   - name: Products
 *     description: Управление товарами
 *   - name: Users
 *     description: Управление пользователями (только администратор)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@mail.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 role:
 *                   type: string
 *       400:
 *         description: Неверные данные или email уже существует
 */

app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля (email, first_name, last_name, password) обязательны' });
    }

    if (findUserByEmail(email)) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await hashPassword(password);
    console.log('========== ДЕМОНСТРАЦИЯ ХЕШИРОВАНИЯ ==========');
    console.log('Исходный пароль (что ввел пользователь):', password);
    console.log('Хешированный пароль (что сохраняется в БД):', hashedPassword);
    console.log('==============================================');
    
    const newUser = {
        id: nanoid(8),
        email,
        first_name,
        last_name,
        password: hashedPassword,
        role: ROLES.USER,  // По умолчанию - обычный пользователь
        isActive: true      // Флаг блокировки пользователя
    };

    users.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя в систему (получение access и refresh токенов)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@mail.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает access и refresh токены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Отсутствуют email или пароль
 *       401:
 *         description: Неверный пароль
 *       403:
 *         description: Аккаунт заблокирован
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('\n LOGIN ATTEMPT:', { email });

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = findUserByEmail(email);
    if (!user) {
        console.log(' LOGIN - user not found:', email);
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    console.log(' LOGIN - user found:', { id: user.id, email: user.email, role: user.role, isActive: user.isActive });
    
    // Проверка блокировки пользователя
    if (user.isActive === false) {
        console.log(' LOGIN - account blocked:', email);
        return res.status(403).json({ error: 'Аккаунт заблокирован. Обратитесь к администратору.' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
        console.log(' LOGIN - invalid password for:', email);
        return res.status(401).json({ error: 'Неверный пароль' });
    }

    // Генерируем оба токена
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Сохраняем refresh-токен в хранилище
    refreshTokens.add(refreshToken);

    console.log('   LOGIN SUCCESS - tokens generated for:', email);
    console.log('   Access token payload:', jwt.decode(accessToken));
    console.log('   Refresh token payload:', jwt.decode(refreshToken));

    // Возвращаем оба токена и данные пользователя
    res.status(200).json({ 
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        }
    });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление access-токена с помощью refresh-токена
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh-токен, полученный при входе
 *     responses:
 *       200:
 *         description: Новая пара access и refresh токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: refreshToken отсутствует в запросе
 *       401:
 *         description: Недействительный или истекший refresh-токен
 *       403:
 *         description: Аккаунт заблокирован
 */
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ 
            error: 'refreshToken is required' 
        });
    }

    // Проверяем, существует ли refresh-токен в хранилище
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ 
            error: 'Invalid refresh token' 
        });
    }

    try {
        // Верифицируем refresh-токен
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        
        // Находим пользователя
        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found' 
            });
        }
        
        // Проверка блокировки
        if (user.isActive === false) {
            refreshTokens.delete(refreshToken);
            return res.status(403).json({ error: 'Account is blocked' });
        }

        // Ротация refresh-токена: старый удаляем, новый создаём
        refreshTokens.delete(refreshToken);
        
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        refreshTokens.add(newRefreshToken);
        
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        return res.status(401).json({ 
            error: 'Invalid or expired refresh token' 
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы (удаление refresh-токена)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный выход
 *       400:
 *         description: refreshToken отсутствует
 */
app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ 
            error: 'refreshToken is required' 
        });
    }
    
    refreshTokens.delete(refreshToken);
    res.status(200).json({ 
        message: 'Successfully logged out' 
    });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 role:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *       401:
 *         description: Не авторизован (токен отсутствует или недействителен)
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
});

// ==================== USER MANAGEMENT ENDPOINTS (только для администратора) ====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей (только администратор)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       403:
 *         description: Недостаточно прав
 */
app.get('/api/users', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.status(200).json(usersWithoutPasswords);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (только администратор)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const user = findUserById(req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя (только администратор)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Пользователь не найден
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), async (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const { email, first_name, last_name, role, isActive } = req.body;
    
    // Проверка уникальности email при изменении
    if (email && email !== users[userIndex].email) {
        const existingUser = findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email уже используется другим пользователем' });
        }
        users[userIndex].email = email;
    }
    
    if (first_name !== undefined) users[userIndex].first_name = first_name;
    if (last_name !== undefined) users[userIndex].last_name = last_name;
    if (role !== undefined && Object.values(ROLES).includes(role)) {
        users[userIndex].role = role;
    }
    if (isActive !== undefined) users[userIndex].isActive = isActive;
    
    const { password, ...userWithoutPassword } = users[userIndex];
    res.status(200).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя (только администратор)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь заблокирован
 *       403:
 *         description: Нельзя заблокировать себя
 *       404:
 *         description: Пользователь не найден
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Нельзя заблокировать самого себя
    if (users[userIndex].id === req.user.sub) {
        return res.status(403).json({ error: 'Вы не можете заблокировать свой собственный аккаунт' });
    }
    
    // Блокируем пользователя (soft delete)
    users[userIndex].isActive = false;
    
    // Удаляем все refresh-токены заблокированного пользователя
    // (это нужно будет реализовать при использовании БД)
    
    res.status(200).json({ 
        message: 'Пользователь успешно заблокирован',
        user: { id: users[userIndex].id, email: users[userIndex].email, isActive: false }
    });
});

// ==================== PRODUCTS ENDPOINTS (с проверкой ролей) ====================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав (требуется продавец или администратор)
 */
app.post('/api/products', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'Все поля (title, category, description, price) обязательны' });
    }
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Цена должна быть положительным числом' });
    }

    const newProduct = {
        id: nanoid(8),
        title,
        category,
        description,
        price,
        createdBy: req.user.sub  // Кто создал товар
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
app.get('/api/products', authMiddleware, (req, res) => {
    res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       400:
 *         description: Нет данных для обновления
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав (требуется продавец или администратор)
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    const { title, category, description, price } = req.body;

    if (title !== undefined) products[productIndex].title = title;
    if (category !== undefined) products[productIndex].category = category;
    if (description !== undefined) products[productIndex].description = description;
    if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ error: 'Цена должна быть положительным числом' });
        }
        products[productIndex].price = price;
    }

    res.status(200).json(products[productIndex]);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет содержимого)
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав (только администратор)
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    products.splice(productIndex, 1);
    res.status(204).send();
});

// ==================== DEBUG ENDPOINT ====================

/**
 * @swagger
 * /api/debug/token:
 *   get:
 *     summary: Отладка - получить информацию о текущем токене
 *     tags: [Debug]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о токене и пользователе
 */
app.get('/api/debug/token', authMiddleware, (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    res.json({
        user: req.user,
        decodedToken: token ? jwt.decode(token) : null
    });
});

// ==================== INITIALIZE TEST DATA ====================

// Функция для инициализации тестовых данных
async function initializeTestData() {
    // Создаем тестового администратора, если нет пользователей
    if (users.length === 0) {
        console.log('\nСоздание тестовых данных...');
        
        // Создаем администратора
        const adminHash = await bcrypt.hash('admin123', 10);
        const admin = {
            id: nanoid(8),
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'System',
            password: adminHash,
            role: ROLES.ADMIN,
            isActive: true
        };
        users.push(admin);
        console.log(`Создан администратор: ${admin.email} / admin123 (role: ${admin.role})`);
        
        // Создаем продавца
        const sellerHash = await bcrypt.hash('seller123', 10);
        const seller = {
            id: nanoid(8),
            email: 'seller@example.com',
            first_name: 'Seller',
            last_name: 'User',
            password: sellerHash,
            role: ROLES.SELLER,
            isActive: true
        };
        users.push(seller);
        console.log(`Создан продавец: ${seller.email} / seller123 (role: ${seller.role})`);
        
        // Создаем обычного пользователя
        const userHash = await bcrypt.hash('user123', 10);
        const user = {
            id: nanoid(8),
            email: 'user@example.com',
            first_name: 'Regular',
            last_name: 'User',
            password: userHash,
            role: ROLES.USER,
            isActive: true
        };
        users.push(user);
        console.log(`Создан пользователь: ${user.email} / user123 (role: ${user.role})`);
        
        // Создаем тестовые товары
        products.push(
            {
                id: nanoid(8),
                title: 'Ноутбук Apple MacBook Air',
                category: 'Электроника',
                description: '13.3" Retina, M1, 8GB RAM, 256GB SSD',
                price: 89999,
                createdBy: admin.id
            },
            {
                id: nanoid(8),
                title: 'Смартфон Samsung Galaxy S23',
                category: 'Электроника',
                description: '6.1" Dynamic AMOLED, 8GB RAM, 128GB',
                price: 64999,
                createdBy: seller.id
            },
            {
                id: nanoid(8),
                title: 'Наушники Sony WH-1000XM5',
                category: 'Аудио',
                description: 'Беспроводные, активный шумоподавитель',
                price: 29999,
                createdBy: seller.id
            }
        );
        
        console.log(`Товаров создано: ${products.length}`);
        console.log('\n=== ТЕСТОВЫЕ ДАННЫЕ ===');
        console.log(`Администратор: admin@example.com / admin123`);
        console.log(`Продавец: seller@example.com / seller123`);
        console.log(`Пользователь: user@example.com / user123`);
        console.log('========================\n');
        
        // Выводим текущее состояние users для отладки
        console.log('Текущие пользователи в памяти:');
        users.forEach(u => {
            console.log(`  - ${u.email}: role=${u.role}, isActive=${u.isActive}`);
        });
    } else {
        console.log('\nСуществующие пользователи:');
        users.forEach(u => {
            console.log(`  - ${u.email}: role=${u.role}, isActive=${u.isActive}`);
        });
    }
}

// Запуск сервера
app.listen(port, async () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
    console.log(`Доступные эндпоинты:`);
    console.log(`  POST   /api/auth/register  - регистрация`);
    console.log(`  POST   /api/auth/login     - вход (получение access и refresh токенов)`);
    console.log(`  POST   /api/auth/refresh   - обновление access-токена`);
    console.log(`  POST   /api/auth/logout    - выход (удаление refresh-токена)`);
    console.log(`  GET    /api/auth/me        - данные текущего пользователя (требуется access-токен)`);
    console.log(`  GET    /api/users          - список пользователей (только администратор)`);
    console.log(`  GET    /api/users/:id      - данные пользователя (только администратор)`);
    console.log(`  PUT    /api/users/:id      - обновить пользователя (только администратор)`);
    console.log(`  DELETE /api/users/:id      - заблокировать пользователя (только администратор)`);
    console.log(`  CRUD   /api/products       - управление товарами (с проверкой ролей)`);
    console.log(`\n=== Роли пользователей ===`);
    console.log(`- user: только просмотр товаров`);
    console.log(`- seller: просмотр, создание и редактирование товаров`);
    console.log(`- admin: полный доступ (управление пользователями + все права seller)`);
    
    // Инициализируем тестовые данные
    await initializeTestData();
});