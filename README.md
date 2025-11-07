# SQA Project

## Structure

```
backend/
  index.js
  package.json

test/
  auth/
    login.test.js
```

Create a `.env` file in the project root with your PostgreSQL credentials and JWT secret.

## Commands

```
cd backend
npm install
npm run dev
npm test
```

## Sample env

```
 DB_NAME=SQA-Project-Dev
 DB_USER=postgres
 DB_PASS=admin
 DB_HOST=localhost

 DB_NAME_TEST=SQA-Project-Test
 DB_USER=postgres
 DB_PASS=admin
 DB_HOST=localhost

 NODE_ENV=development
 API_BASE=/api
 PORT=4040
 JWT_SECRET=sqa-node-backend
 DEFAULT_ENCRYPTION_KEY=sqa-default-encryption-key
 SALT_ROUNDS=10
 ENV_DECRYPTION_KEY=sqa-env-encryption-key
```
