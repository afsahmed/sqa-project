process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const request = require('supertest');
const { app, sequelize, User } = require('../../backend/index');

describe('Authentication API', () => {
  const credentials = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'supersafe123'
  };

  before(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/register', () => {
    it('registers a user with unique credentials', async () => {
      const res = await request(app)
        .post('/api/register')
        .send(credentials)
        .expect(201);

      expect(res.body.message).to.equal('registered');
      expect(res.body.user).to.include({
        username: credentials.username,
        email: credentials.email
      });
      expect(res.body.user).to.have.property('id');
      expect(res.body).to.have.property('token');
    });

    it('rejects duplicate registrations', async () => {
      await request(app).post('/api/register').send(credentials);

      const duplicate = await request(app)
        .post('/api/register')
        .send(credentials)
        .expect(400);

      expect(duplicate.body.error).to.equal('user already exists');
    });

    it('validates required fields', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({ username: 'missing-fields' })
        .expect(400);

      expect(res.body.error).to.equal('username, email, and password are required');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/register').send(credentials);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: credentials.email, password: credentials.password })
        .expect(200);

      expect(res.body.message).to.equal('logged in');
      expect(res.body.user.email).to.equal(credentials.email);
      expect(res.body).to.have.property('token');
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: credentials.email, password: 'wrong' })
        .expect(401);

      expect(res.body.error).to.equal('invalid credentials');
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: credentials.email })
        .expect(400);

      expect(res.body.error).to.equal('email and password are required');
    });

    /** INTENTIONAL FAILURE to test email workflow */
    it('should intentionally fail to trigger email alert', async () => {
      const fakeValue = 1;
      expect(fakeValue).to.equal(2);
    });
  });
});
