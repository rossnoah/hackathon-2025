# API Server Migration to TypeScript + Prisma

## Overview

The API server has been migrated from JavaScript with better-sqlite3 to TypeScript with Prisma ORM. The codebase is now split into multiple well-organized modules.

## What Changed

### Technology Stack

- **Before**: JavaScript, better-sqlite3, single file
- **After**: TypeScript, Prisma ORM, modular architecture

### Project Structure

```
api/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Prisma client
│   │   ├── env.ts        # Environment variables
│   │   ├── expo.ts       # Expo push notifications
│   │   └── openai.ts     # OpenAI client
│   ├── controllers/      # Request handlers
│   │   ├── assignment.controller.ts
│   │   ├── insights.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── screentime.controller.ts
│   │   └── user.controller.ts
│   ├── services/         # Business logic
│   │   ├── ai.service.ts
│   │   ├── assignment.service.ts
│   │   ├── notification.service.ts
│   │   ├── screentime.service.ts
│   │   └── user.service.ts
│   ├── jobs/             # Scheduled tasks
│   │   └── notifications.job.ts
│   ├── routes/           # Express routes
│   │   └── index.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utilities
│   │   └── logger.ts
│   ├── app.ts            # Express app setup
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static files (dashboard)
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies & scripts
```

## Migration Guide

### 1. Install Dependencies

```bash
cd api
npm install
```

This will install all new dependencies including:
- TypeScript and type definitions
- Prisma and @prisma/client
- All existing dependencies

### 2. Set Up Environment Variables

Create a `.env` file in the `api/` directory:

```bash
PORT=4000
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=file:./data/hackathon.db
NODE_ENV=development
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client from the schema.

### 4. Push Database Schema

If starting fresh:

```bash
npm run prisma:push
```

This creates the database tables based on the Prisma schema.

**Note**: If you have an existing `hackathon.db` file, it should work as-is since the schema matches the old table structure.

### 5. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 6. Run the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

## New npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon + ts-node |
| `npm run build` | Build TypeScript and generate Prisma Client |
| `npm start` | Start production server (requires build) |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:migrate` | Create migration files |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |

## Benefits of This Migration

### 1. Type Safety
- All types are checked at compile time
- Autocomplete for database queries
- Fewer runtime errors

### 2. Better Code Organization
- Separation of concerns (controllers, services, routes)
- Easier to test individual components
- More maintainable codebase

### 3. Prisma ORM Advantages
- Type-safe database queries
- Automatic migrations
- Better developer experience
- Prisma Studio for database inspection

### 4. Docker/Production Ready
- Proper build process
- Optimized production builds
- Environment-based configuration
- Graceful shutdown handling

## Docker Changes

The Dockerfile has been updated to:
1. Copy Prisma schema during build
2. Install all dependencies (including dev)
3. Build TypeScript
4. Generate Prisma Client
5. Remove dev dependencies
6. Run compiled JavaScript

**Build command** (unchanged):
```bash
docker build -t hackathon-api .
```

**Run command** (unchanged):
```bash
docker run -p 4000:4000 \
  -e OPENAI_API_KEY=your-key \
  -e DATABASE_URL=file:./data/hackathon.db \
  hackathon-api
```

## API Compatibility

**All existing API endpoints remain the same!** The migration is backward compatible:

- ✅ POST `/api/register`
- ✅ POST `/api/toggle-notifications`
- ✅ GET `/api/users`
- ✅ POST `/api/assignments`
- ✅ GET `/api/assignments`
- ✅ POST `/api/screentime`
- ✅ POST `/api/send-notification`
- ✅ GET `/api/insights/:email`
- ✅ GET `/health`

## Database Migration

The Prisma schema matches the existing SQLite database structure exactly. No data migration is needed!

**Existing tables**:
- `users`
- `assignments`
- `screentime`

**Column mappings** are handled via Prisma's `@map` directive:
```prisma
pushToken String? @map("push_token")
```

This means Prisma uses `pushToken` in code but `push_token` in the database.

## Troubleshooting

### TypeScript errors
Make sure dependencies are installed:
```bash
npm install
```

### Prisma Client not found
Generate the client:
```bash
npm run prisma:generate
```

### Database locked errors
Make sure only one instance is running and accessing the database.

### Build fails in Docker
Ensure `prisma/schema.prisma` exists and is copied correctly.

## Old Server File

The old `server.js` file can be safely deleted once you've verified the new TypeScript server works correctly.

**Recommendation**: Keep it as `server.js.backup` for a few days during testing.

## Next Steps

1. Test all endpoints with the Chrome extension
2. Test with the mobile app
3. Verify push notifications work
4. Check scheduled job is running
5. Deploy to production

## Questions?

Check the main `CLAUDE.md` documentation or inspect the TypeScript files for implementation details.
