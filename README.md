# NodejsApp

A modern Node.js Express application template built with TypeScript, ESLint, Prettier, and comprehensive tooling for development, testing, and deployment.

## 🚀 Features

- **Express.js 5.x** - Fast, unopinionated, minimalist web framework
- **TypeScript** - Type-safe JavaScript development
- **ESLint** - Code linting with modern configurations
- **Prettier** - Code formatting
- **Vitest** - Fast unit testing with coverage reports
- **Husky** - Git hooks for code quality
- **lint-staged** - Run linters on staged files
- **tsx** - Fast TypeScript execution for development
- **Multiple environments** - Development, staging, and production configurations

## 📋 Prerequisites

- **Node.js** (v22+ recommended)
- **Docker Desktop**
- **npm**
- **Git**

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/PhuNguyenPT/NodejsApp.git
cd NodejsApp
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment files:

```bash
cp .env.example .env.dev
cp .env.example .env.staging
cp .env.example .env.prod
```

4. Configure your environment variables in the respective `.env.*` files.

5. Generate key pairs

```bash
openssl genrsa -out private_key.pem 4096
openssl rsa -in private.pem -pubout -out public.pem
```

## 🚀 Getting Started

### Development

Run Docker Compose script:

```bash
# For Linux environment
chmod +x ./scripts/docker-compose.sh
./scripts/docker-compose.sh
```

Start the development server with hot reloading:

```bash
# Development environment
npm run dev

# Staging environment
npm run dev:staging

# Production environment (for testing)
npm run dev:prod
```

The server will start and watch for changes automatically.

### Building

Build the project for production:

```bash
# Build only
npm run build

# Clean and build
npm run build:clean

# Clean dist folder
npm run clean
```

### Production

Start the production server:

```bash
npm start
```

## 🧪 Testing

Run tests with Vitest:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

## 🔍 Code Quality

### Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking
npm run type-check
```

### Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

## 📁 Project Structure

```
NodejsApp/
├── dist/                     # Compiled JavaScript output
├── src/
│   ├── app/
│   │   └── index.ts          # Application entry point
│   ├── middleware/           # Express middleware
|   ├── tests/                # Test file
│   └── utils/                # Utility functions
├── .env.*                    # Environment configuration files
├── .nvmrc                    # Node environment version
├── .prettierrc               # Prettier configuration
├── .eslintrc.config.js       # ESLint configuration
├── tsconfig.build.json       # Build-specific TypeScript config
├── tsconfig.json             # TypeScript configuration
├── package.json
└── vitest.config.ts          # Vitest configuration
```

## 🔧 Configuration

### Environment Variables

Create the following environment files:

- `.env.dev` - Development environment
- `.env.staging` - Staging environment
- `.env.prod` - Production environment

Example `.env` structure:

```env
PORT=3000
```

### TypeScript Configuration

The project uses two TypeScript configurations:

- `tsconfig.json` - Development and editor support
- `tsconfig.build.json` - Production build configuration

### Path Mapping

The project uses import path mapping with the `#*` prefix:

```typescript
import { something } from "#utils/helper";
```

## 🔄 Git Hooks

Husky is configured to run code quality checks before commits:

- **Pre-commit**: Runs ESLint and Prettier on staged files
- **Pre-push**: Runs type checking and tests

## 📊 Scripts Reference

| Script                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start development server                     |
| `npm run dev:staging`  | Start development server with staging env    |
| `npm run dev:prod`     | Start development server with production env |
| `npm start`            | Start production server                      |
| `npm run build`        | Build for production                         |
| `npm run build:clean`  | Clean and build                              |
| `npm run clean`        | Remove dist folder                           |
| `npm test`             | Run tests in watch mode                      |
| `npm run test:run`     | Run tests once                               |
| `npm run test:ui`      | Run tests with UI                            |
| `npm run coverage`     | Generate test coverage                       |
| `npm run type-check`   | Check TypeScript types                       |
| `npm run lint`         | Check code with ESLint                       |
| `npm run lint:fix`     | Fix ESLint issues                            |
| `npm run format`       | Format code with Prettier                    |
| `npm run format:check` | Check code formatting                        |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

If you encounter any issues, please file them in the [GitHub Issues](https://github.com/PhuNguyenPT/NodejsApp/issues) section.

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vitest Documentation](https://vitest.dev/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)

---

**Happy coding!** 🎉
