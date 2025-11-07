/** STEP 01: Load Environment Variables */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/** STEP 02: Import Dependencies */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes, Op } = require('sequelize');

/** STEP 03: Determine Environment (dev vs test) */
const isTestEnv = process.env.NODE_ENV === 'test';

/** STEP 04: Database Configuration */
const config = {
  DB_NAME: (isTestEnv ? process.env.DB_NAME_TEST : process.env.DB_NAME) || 'auth_service',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASS: process.env.DB_PASS || 'postgres',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_DIALECT: process.env.DB_DIALECT || 'postgres',
};

/** STEP 05: Initialize Sequelize */
const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  {
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: config.DB_DIALECT,
    logging: false,
    define: { underscored: true, timestamps: true },
  }
);

/** STEP 06: Define Models */
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [3, 30] } },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'users' }
);

/** STEP 07: Express Setup */
const app = express();
app.use(express.json());

const respondWithUser = user => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

/** STEP 08: Routes */
app.get('/', (req, res) => res.json({ status: 'ok' }));

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, and password are required' });

    const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (existingUser) return res.status(400).json({ error: 'user already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({ message: 'registered', token, user: respondWithUser(user) });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ error: 'registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );

    res.json({ message: 'logged in', token, user: respondWithUser(user) });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ error: 'login failed' });
  }
});

/** STEP 09: DB Initialization */
const initializeDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: !isTestEnv });
  console.log(`✅ Database connected → ${config.DB_NAME}`);
};

/** STEP 10: Start Server */
if (require.main === module) {
  const port = process.env.PORT || 3000;
  initializeDatabase()
    .then(() => app.listen(port, () => console.log(`🚀 Server running on port ${port}`)))
    .catch(err => {
      console.error('startup failure:', err);
      process.exit(1);
    });
}

/** STEP 11: Exports for testing */
module.exports = { app, sequelize, User, initializeDatabase };
