# SpendWise — Personal Finance Management Platform

**Take control of your money. Build better financial habits.**

SpendWise is a full-stack personal finance management platform designed to help users organize their finances, track income and expenses, manage budgets, monitor financial goals, and gain meaningful insights into their spending habits.

Built with React, Node.js, Express, and MongoDB, SpendWise provides a centralized platform for managing personal finances through a clean and intuitive interface.

<p align="center">
  <a href="https://spend-wise-snowy-one.vercel.app/"><strong>Live Demo</strong></a> ·
  <a href="https://github.com/Priyanshu231104/SpendWise"><strong>GitHub Repository</strong></a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Security](#security)
- [Deployment](#deployment)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Managing personal finances can become difficult when income, expenses, budgets, and financial goals are tracked across different places.

SpendWise aims to simplify this process by bringing essential financial management tools together in one application.

Users can:

- Record and monitor income and expenses.
- Organize transactions using categories.
- Create and manage budgets.
- Track financial goals.
- Monitor recurring transactions.
- Review financial summaries and analytics.
- Generate financial reports.

The application uses a RESTful backend architecture, JWT-based authentication, and MongoDB for data persistence.

## Key Features

### 1. Authentication and User Management
- User registration and login.
- JWT-based authentication.
- Access and refresh token handling.
- Protected application routes.
- User profile management.

### 2. Expense Management
- Record daily expenses.
- Organize expenses into categories.
- View and manage expense transactions.
- Monitor spending activity.

### 3. Income Management
- Record income transactions.
- Organize and track income sources.
- Review income history.

### 4. Budget Management
- Create and manage budgets.
- Monitor spending against budgets.
- Review budget information.

### 5. Category Management
- Organize financial transactions using categories.
- Manage transaction categories.

### 6. Financial Goals
- Create financial goals.
- Track goal progress.
- Monitor savings targets.

### 7. Recurring Transactions
- Manage recurring transaction schedules.
- Organize recurring financial commitments.

### 8. Dashboard
- View financial summaries.
- Monitor income and expenses.
- Review transaction statistics.
- Access important financial information from one place.

### 9. Analytics and Insights
- Analyze financial activity.
- Review spending patterns.
- Access financial insights.

### 10. Financial Reports
- Access financial reporting functionality.
- Review financial information through the reports section.

---

## Screenshots

Screenshots of the application will be added here.

Suggested screenshots:

| Screen | Description |
|---|---|
| Landing Page | Public SpendWise homepage |
| Dashboard | Financial overview and summary |
| Expenses | Expense management interface |
| Income | Income management interface |
| Budgets | Budget tracking interface |
| Reports | Financial reporting interface |

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | User interface |
| Vite | Development server and build tool |
| Tailwind CSS | Styling |
| JavaScript | Application logic |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Helmet | HTTP security headers |
| CORS | Cross-origin resource sharing |
| express-rate-limit | API rate limiting |
| dotenv | Environment configuration |

### Database and Deployment

| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Git and GitHub | Version control |

---

## Application Architecture

SpendWise follows a client-server architecture.

```text
             USER
               |
               v
        React Frontend
          (Vercel)
               |
               | HTTPS / REST API
               v
        Express Backend
           (Render)
               |
       +-------+-------+
       |               |
       v               v
 Authentication    API Routes
       |               |
       +-------+-------+
               |
               v
          Controllers
               |
               v
          Mongoose
               |
               v
          MongoDB Atlas
```

### Request Flow

1. The user interacts with the React frontend.
2. The frontend sends an HTTP request to the backend API.
3. Express processes the request through middleware and routes.
4. Controllers execute the application logic.
5. Mongoose communicates with MongoDB.
6. The backend returns a JSON response.
7. React updates the user interface.

---

## Project Structure

```text
SpendWise/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── scripts/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env.example
│
├── docs/
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

Follow these instructions to run SpendWise locally.

### Prerequisites

Make sure you have installed:

- Node.js (LTS recommended).
- npm.
- Git.
- MongoDB Atlas account or a MongoDB instance.

### 1. Clone the Repository

```bash
git clone https://github.com/Priyanshu231104/SpendWise.git
```

```bash
cd SpendWise
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure the required environment variables as described below.

Start the backend development server:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as a reference.

Start the frontend development server:

```bash
npm run dev
```

Vite will display the local frontend URL in your terminal, typically:

```text
http://localhost:5173
```

### 4. Verify Backend

Open the following endpoint:

```text
http://localhost:5000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "SpendWise API is running"
}
```

---

## Environment Variables

Never commit real environment variables, database credentials, or JWT secrets to GitHub.

### Backend — `backend/.env`

```env
NODE_ENV=development
PORT=5000

FRONTEND_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_strong_access_token_secret
REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

Use separate, strong, randomly generated JWT secrets. Do not reuse the same secret for both tokens.

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

**Important:** The `VITE_` prefix makes frontend environment variables accessible to client-side code. Never place private credentials or secrets in frontend environment variables.

---

## API Overview

The backend exposes REST API endpoints under:

```text
/api/v1
```

| Resource | Base Route | Purpose |
|---|---|---|
| Authentication | `/api/v1/auth` | Registration, login and token operations |
| Users | `/api/v1/users` | User management |
| Expenses | `/api/v1/expenses` | Expense operations |
| Income | `/api/v1/income` | Income operations |
| Categories | `/api/v1/categories` | Category operations |
| Budgets | `/api/v1/budgets` | Budget operations |
| Dashboard | `/api/v1/dashboard` | Dashboard information |
| Financial Goals | `/api/v1/goals` | Goal management |
| Recurring Transactions | `/api/v1/recurring-transactions` | Recurring transaction management |
| Reports | `/api/v1/reports` | Financial reports |
| Analytics | `/api/v1/analytics` | Financial analytics |
| Insights | `/api/v1/insights` | Financial insights |

Additional endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | API health check |
| GET | `/api/v1/ready` | Database readiness check |

For request bodies, authentication requirements, and individual HTTP methods, refer to the corresponding route files in `backend/src/routes/`.

---

## Security

SpendWise implements several backend security measures:

- JWT-based authentication.
- Separate access and refresh token secrets.
- Password hashing using bcryptjs.
- Protected API routes.
- Helmet security headers.
- CORS configuration.
- API rate limiting.
- Request body size restrictions.
- Environment variable validation.
- Centralized error handling.
- Graceful server shutdown.

Security configuration should be maintained carefully when deploying the application.

---

## Deployment

SpendWise is deployed using the following services:

| Component | Hosting Provider |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

### Production Links

- **Live Application:** https://spend-wise-snowy-one.vercel.app/
- **Backend API:** https://spendwise-backend-4v0b.onrender.com
- **Repository:** https://github.com/Priyanshu231104/SpendWise

**Hosting note:** The backend currently uses Render's free instance. Free instances may spin down after inactivity, resulting in slower initial requests. Subsequent requests are generally faster once the service is running.

---

## Testing

The application has been manually tested for its primary user workflows, including:

- User registration.
- User login.
- Dashboard loading.
- Financial transaction operations.
- Budget and category operations.
- Financial goal and reporting workflows.

Automated test coverage is not yet configured. Manual testing should not be interpreted as exhaustive security or performance testing.

---

## Roadmap

Potential future improvements:

- [ ] Automated backend unit and integration tests.
- [ ] Frontend component testing.
- [ ] Advanced financial analytics.
- [ ] Improved dashboard performance and caching.
- [ ] Automated recurring transaction processing.
- [ ] Enhanced reporting and data visualization.
- [ ] Improved monitoring and observability.
- [ ] Additional financial planning tools.

---

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Commit your changes.

```bash
git commit -m "feat: add your feature"
```

5. Push your branch.

```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request describing your changes.

---

## License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.

---

## Author

**SpendWise** — A full-stack personal finance management project.

GitHub: [@Priyanshu231104](https://github.com/Priyanshu231104)

---

<p align="center">
  <strong>SpendWise — Your Money, More Mindfully.</strong>
</p>

## License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Priyanshu Banerjee.
