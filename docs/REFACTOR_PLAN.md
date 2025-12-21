# SAMKIEL BOT - UNIFIED NEXT.JS REFACTOR PLAN

## Current Structure (BEFORE)
```
/frontend (Next.js on port 3000)
/backend (Express on port 5000)
```

## Target Structure (AFTER)
```
/pages (or /app)          - UI routes + API routes
/lib                      - Business logic, services
/models                   - Database schemas
/middleware               - Auth, admin guards, rate limiting
/prisma (or /db)          - Database client
/public                   - Static assets
/components               - React components
/context                  - React context providers
```

## Migration Steps

### Phase 1: Setup Base Structure
- [x] Create /lib directory
- [x] Create /models directory  
- [x] Create /middleware directory
- [x] Update package.json with merged dependencies

### Phase 2: Move Backend to Next.js API Routes
- [ ] Move /backend/routes/* to /pages/api/*
- [ ] Move /backend/controllers/* to /lib/controllers/*
- [ ] Move /backend/services/* to /lib/services/*
- [ ] Move /backend/utils/* to /lib/utils/*
- [ ] Move /backend/models/* to /models/*

### Phase 3: WebSocket Integration
- [ ] Create custom Next.js server for Socket.IO
- [ ] Move socket logic from backend/server.js

### Phase 4: Environment & Config
- [ ] Merge .env files
- [ ] Update next.config.js
- [ ] Remove CORS (no longer needed)

### Phase 5: Cleanup
- [ ] Delete /frontend directory
- [ ] Delete /backend directory
- [ ] Update root package.json scripts
- [ ] Test deployment

## Files to Create/Modify

### New Files
- /server.js (custom Next.js server with Socket.IO)
- /lib/db.js (MongoDB connection)
- /lib/socket.js (Socket.IO setup)

### Modified Files
- /package.json (merged dependencies)
- /next.config.js (updated config)
- /.env (merged environment variables)

## Deployment Changes
- Single build: `npm run build`
- Single start: `npm start`
- One deployment target (Vercel/VPS/Docker)
