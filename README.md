# NodejsApp

A modern Node.js Express application template built with TypeScript, TypeORM, tsoa, and comprehensive tooling for development, testing, and deployment.

## 🚀 Features

- **Express.js 5.x** - Fast, unopinionated, minimalist web framework.
- **TypeScript** - Type-safe JavaScript development.
- **TypeORM** - Powerful Object-Relational Mapper (ORM) for database management.
- **tsoa** - Build Node.js & Express apps with OpenAPI and TypeScript. Auto-generates routes and Swagger documentation.
- **InversifyJS** - A lightweight yet powerful inversion of control (IoC) container for TypeScript & JavaScript.
- **Vitest** - Fast unit testing with coverage reports.
- **ESLint & Prettier** - Enforce consistent code style and quality.
- **Husky & lint-staged** - Git hooks to automate code quality checks.
- **tsx** - Fast TypeScript execution for development.
- **Multiple environments** - Pre-configured for development, staging, and production.

---

## 📋 Prerequisites

- **Node.js** (v22+ recommended)
- **Docker Desktop** (for database, etc.)
- **npm**
- **Git**

---

## 🛠️ Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/PhuNguyenPT/NodejsApp_Backend.git
    cd NodejsApp
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment files. These are used for different deployment stages:

    ```bash
    cp .env.example .env.dev
    cp .env.example .env.staging
    cp .env.example .env.prod
    ```

4.  Configure your environment variables (e.g., database credentials, ports) in the respective `.env.*` files.

5.  Generate RSA key pairs for JWT signing:

    ```bash
    openssl genrsa -out private.pem 4096
    openssl rsa -in private.pem -pubout -out public.pem
    ```

---

## 🚀 Getting Started

### Development

First, ensure your database (e.g., PostgreSQL) is running. You can use the provided Docker Compose script:

```bash
# For Linux/macOS environments, make the script executable first
chmod +x ./scripts/docker-compose.sh

# Start the services (database)
./scripts/docker-compose.sh
```

Then, start the development server with hot reloading:

```bash
# Development environment (uses .env.dev)
npm run dev

# Staging environment (uses .env.staging)
npm run dev:staging

# Production environment (for local testing, uses .env.prod)
npm run dev:prod
```

The server will start, automatically regenerate tsoa routes on changes, and reload.

### Production

1.  Build the project for production:

    ```bash
    npm run build:clean
    ```

2.  Run database migrations for the production environment:

    ```bash
    npm run migration:run:prod
    ```

3.  Start the production server:

    ```bash
    npm start
    ```

---

## 🧪 Testing

Run unit and integration tests with Vitest:

```bash
# Run tests in watch mode
npm test

# Run tests once and exit
npm run test:run

# Run tests with the Vitest UI
npm run test:ui

# Generate a test coverage report
npm run coverage
```

---

## 📁 Project Structure

```
NodejsApp/
├── dist/                     # Compiled JavaScript output for production
├── src/
│   ├── app/                  # Application entry point & server setup
│   ├── config/               # Environment variables, database config (datasource.ts)
│   ├── controller/           # tsoa controllers (handles HTTP requests)
│   ├── dto/                  # Data Transfer Objects for requests/responses
│   ├── entity/               # TypeORM database entities
│   ├── generated/            # Auto-generated files by tsoa (routes, swagger.json)
│   ├── middleware/           # Custom Express middleware
│   ├── migration/            # TypeORM database migration files
│   ├── repository/           # Data access layer (interacts with entities)
│   ├── service/              # Business logic layer
│   ├── tests/                # Test files (unit, integration)
│   └── util/                 # Utility functions and helpers
├── .env.* # Environment configuration files
├── .nvmrc                    # Node environment version
├── .eslintrc.config.js       # ESLint configuration
├── tsconfig.build.json       # Build-specific TypeScript config
├── tsconfig.json             # TypeScript configuration for development
├── package.json
└── vitest.config.ts          # Vitest configuration
```

---

## 🔧 Configuration

### Path Mapping

The project uses `tsc-alias` to enable path mapping (e.g., `@/service/userService`) in the final build output. For development, `tsconfig.json` handles this.

Example:

```typescript
// Instead of: import { UserService } from '../../service/userService';
import { UserService } from "@/service/userService";
```

### Git Hooks

Husky is configured to run code quality checks before commits and pushes:

- **Pre-commit**: Runs ESLint and Prettier on staged files using `lint-staged`.
- **Pre-push**: Runs `npm run type-check` and `npm run test:run` to ensure code is valid and tests are passing.

---

## 📊 Scripts Reference

The project includes a comprehensive set of npm scripts to streamline development, testing, and deployment.

### Main Scripts

| Script                | Description                                                         |
| :-------------------- | :------------------------------------------------------------------ |
| `npm run dev`         | Starts the dev server (`.env.dev`) with hot-reloading.              |
| `npm run dev:staging` | Starts the dev server (`.env.staging`) with hot-reloading.          |
| `npm run build`       | Builds the TypeScript source into JavaScript in the `dist/` folder. |
| `npm run build:clean` | Cleans the `dist/` folder and then runs a fresh build.              |
| `npm start`           | Starts the compiled application in production mode (`.env.prod`).   |
| `npm run clean`       | Removes the `dist/` directory.                                      |

### Database Migrations (TypeORM)

These scripts manage the database schema. **Development scripts use `tsx` to run directly from TypeScript source, while production scripts run on the compiled JavaScript output in `dist/`.**

| Script                                             | Description                                                                 |
| :------------------------------------------------- | :-------------------------------------------------------------------------- |
| `npm run migration:generate -- -n MyMigrationName` | Generates a new migration file based on entity changes.                     |
| `npm run migration:create -- -n MyCustomMigration` | Creates a new, empty migration file for custom SQL.                         |
| `npm run migration:run`                            | **(Dev)** Executes all pending migrations using `.env.dev`.                 |
| `npm run migration:run:staging`                    | **(Staging)** Executes pending migrations using `.env.staging`.             |
| `npm run migration:run:prod`                       | **(Prod)** Executes pending migrations on the built code using `.env.prod`. |
| `npm run migration:revert`                         | **(Dev)** Reverts the last executed migration.                              |
| `npm run migration:revert:staging`                 | **(Staging)** Reverts the last executed migration.                          |
| `npm run migration:revert:prod`                    | **(Prod)** Reverts the last executed migration on the built code.           |
| `npm run migration:show`                           | Shows all migrations and their status (executed or pending).                |

### Code Quality & Testing

| Script                 | Description                                                        |
| :--------------------- | :----------------------------------------------------------------- |
| `npm test`             | Runs Vitest in watch mode for interactive testing.                 |
| `npm run test:run`     | Runs all tests once and exits.                                     |
| `npm run coverage`     | Generates a test coverage report.                                  |
| `npm run type-check`   | Checks the entire project for TypeScript errors without compiling. |
| `npm run lint`         | Checks the codebase for linting issues with ESLint.                |
| `npm run lint:fix`     | Automatically fixes fixable linting issues.                        |
| `npm run format`       | Formats all code with Prettier.                                    |
| `npm run format:check` | Checks if code is formatted correctly.                             |

### API Generation (tsoa)

| Script                | Description                                                   |
| :-------------------- | :------------------------------------------------------------ |
| `npm run tsoa:build`  | Generates both the `routes.ts` and `swagger.json` files.      |
| `npm run tsoa:spec`   | Generates only the `swagger.json` OpenAPI specification file. |
| `npm run tsoa:routes` | Generates only the `routes.ts` file for Express.              |

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/your-feature-name`.
3.  Make your changes.
4.  Run tests to ensure nothing broke: `npm run test:run`.
5.  Commit your changes: `git commit -m 'feat: Add some amazing feature'`.
6.  Push to the branch: `git push origin feature/your-feature-name`.
7.  Open a pull request.

---

**Happy coding\!** 🎉
