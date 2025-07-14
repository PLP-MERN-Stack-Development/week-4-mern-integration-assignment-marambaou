# MERN Blog Application

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) blog application demonstrating seamless integration between front-end and back-end, including database operations, API communication, authentication, image uploads, and state management.

---

## 🚀 Project Overview
- RESTful API with Express.js and MongoDB
- React front-end (Vite) with component architecture
- Full CRUD for blog posts and categories
- User authentication (JWT)
- Image uploads for post featured images
- Pagination, search, and filtering
- Comments (anonymous or authenticated)

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- pnpm (recommended) or npm

### 1. Clone the repository
```
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Set up environment variables
- Copy `.env.example` to `.env` in both `server/` and `client/` and fill in the required values.

### 3. Install dependencies
```
cd server
pnpm install
cd ../client
pnpm install
```

### 4. Start the development servers
```
# In the server directory
pnpm run dev

# In the client directory
pnpm run dev
```

---

## 🌐 API Documentation

### Main Endpoints
- `POST   /api/auth/register` — Register a new user
- `POST   /api/auth/login` — Login and receive JWT
- `GET    /api/posts` — Get all blog posts (supports pagination, search, filter)
- `GET    /api/posts/:id` — Get a specific blog post
- `POST   /api/posts` — Create a new blog post (auth required)
- `PUT    /api/posts/:id` — Update a blog post (auth required)
- `DELETE /api/posts/:id` — Delete a blog post (auth required)
- `POST   /api/posts/upload` — Upload a featured image (auth required)
- `GET    /api/categories` — Get all categories
- `POST   /api/categories` — Create a new category (auth required)
- `GET    /api/posts/:id/comments` — Get comments for a post
- `POST   /api/posts/:id/comments` — Add a comment (anonymous allowed)

### Authentication
- JWT token is required for creating, editing, or deleting posts and categories.
- Send token as `Authorization: Bearer <token>` header.

---

## ✨ Features Implemented
- User registration and login (JWT auth)
- CRUD for posts and categories
- Image upload for post featured images
- Pagination, search, and filter for posts
- Comments (anonymous or authenticated)
- Responsive UI with React Router navigation
- Error handling and loading states

---

## 📸 Screenshots

> _Add screenshots of your application here (post list, single post, create/edit form, auth, etc.)_

---

## 📁 Files Included
- `Week4-Assignment.md`: Assignment instructions
- `.env.example` files for both client and server
- Complete client and server code

---

## 📚 Resources
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Mongoose Documentation](https://mongoosejs.com/docs/) 