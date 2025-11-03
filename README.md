# NoSQL CRUD App – Balance Manager (MongoDB + MERN)

A simple Balance Management System built using **MongoDB, Express, React, and Node.js**.  
It demonstrates **NoSQL advantages** — flexible schema, embedded docs, and aggregation queries.

## Tech Stack
- Frontend: React.js  
- Backend: Node.js + Express  
- Database: MongoDB Atlas  
- Auth: PIN-based (Admin/Home roles)

## Features
- Admin: Add, Edit, Delete transactions  
- Home: Read-only access  
- Live closing balance updates  
- Token-based session management  

## CRUD API Routes
| Action | Method | Endpoint |
|--------|---------|----------|
| Get All | GET | `/api/transactions` |
| Create | POST | `/api/transactions` |
| Update | PUT | `/api/transactions/:id` |
| Delete | DELETE | `/api/transactions/:id` |

## MongoDB Schema
```js
{
  date: String,
  description: String,
  amount: Number,
  type: "CR" | "DR",
  createdAt: Date
}
```
## Setup:
git clone https://github.com/saiyeshwin/balance-management-system
cd NoSQL

### Backend
cd backend
npm install
node server.js

### Frontend
cd ../frontend
npm install
npm start

## .env in backend
ATLAS_PWD=<your_mongo_pwd>
ADMIN_PIN=1234
HOME_PIN=5678



