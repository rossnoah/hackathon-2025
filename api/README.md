# Clocked API Server

TypeScript + Prisma Express server for the Clocked assignment tracking system.

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Push database schema (first time only)
npm run prisma:push

# Start development server
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Project Structure

```
api/
├── src/
│   ├── config/           # Configuration & clients
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── jobs/             # Scheduled tasks
│   ├── routes/           # Express routes
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   ├── app.ts            # Express app
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
└── dist/                 # Build output
```

See full documentation in this file or MIGRATION.md for migration guide.
