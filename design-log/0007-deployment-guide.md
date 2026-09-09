# Design Log #0007: Production Deployment Strategy & Multi-Target Architecture

## Background
In design logs [#0001](file:///E:/DailyTracker/design-log/0001-daily-tracker-architecture.md) through [#0006](file:///E:/DailyTracker/design-log/0006-glassmorphism-ui-transformation.md), the Daily Tracker MEVN application was developed, tested, and styled with Glassmorphism.
The user requested instructions and infrastructure configurations to deploy the full stack application to production.

## Problem
1. Developing locally on `localhost:3000` (Backend) and `localhost:5173` (Frontend) uses local MongoDB and hardcoded origins. In production:
   - The database must connect to a persistent cloud instance (e.g. MongoDB Atlas) or managed Docker container.
   - The API base URL must adapt dynamically across different hosting domains.
   - Static assets from Vite (`frontend/dist`) need a reliable hosting mechanism (either served via CDN/Vercel or embedded in Express).
2. Users have different deployment preferences:
   - **Strategy 1 (Free Cloud PaaS):** Render / Railway (Backend + DB) + Vercel / Netlify (Frontend) — zero infrastructure maintenance.
   - **Strategy 2 (Single-Container / Monolith):** Express serving built Vite static assets on a single service — simplest single URL, eliminates CORS issues.
   - **Strategy 3 (Docker Compose):** Multi-container orchestration (`mongo`, `backend`, `frontend`) for self-hosted VPS (DigitalOcean, AWS, Hetzner).

## Questions and Answers

### Q1: How should database connectivity be configured in production?
**Answer:** Through `MONGO_URI` environment variable. In development it points to `mongodb://127.0.0.1:27017/dailytracker`, while in production it uses MongoDB Atlas connection string (`mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/dailytracker?retryWrites=true&w=majority`).

### Q2: How should Frontend handle API endpoints across deployment models?
**Answer:** The Axios client in [`frontend/src/services/api.js`](file:///E:/DailyTracker/frontend/src/services/api.js) should resolve:
```javascript
baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')
```
- When deployed separately (e.g., Vercel), set `VITE_API_BASE_URL=https://api.yourdomain.com`.
- When deployed together (Monolith/Docker), it defaults to `''` (relative path `/api/...`), avoiding cross-origin requests entirely.

### Q3: What environment variables are required?
**Answer:**
- Backend:
  - `PORT`: (default 3000 or provided by host like Render/Heroku).
  - `MONGO_URI`: MongoDB connection string.
  - `NODE_ENV`: `production` or `development`.
- Frontend:
  - `VITE_API_BASE_URL`: Backend URL (optional if hosted monolithically).

## Design

### Deployment Architectures

```mermaid
graph TD
    subgraph Option A [Decoupled Cloud PaaS - Recommended]
        Vercel[Vercel / Netlify: Vue 3 Frontend] -->|HTTPS REST| Render[Render / Railway: Express API]
        Render -->|Mongoose connection| Atlas[(MongoDB Atlas Cloud Database)]
    end

    subgraph Option B [Single Full-Stack Container / Monolith]
        User[Client Browser] -->|Single Domain| ExpressServer[Express Server on Render / Railway / VPS]
        ExpressServer -->|Serves Static Files| DistFolder[frontend/dist/]
        ExpressServer -->|Internal Routes /api| APIRouter[API Router /api/days]
        APIRouter --> Atlas2[(MongoDB Atlas)]
    end

    subgraph Option C [Self-Hosted Docker Compose]
        DockerProxy[Nginx / Port 80] --> FrontendContainer[Frontend Vite / Nginx]
        DockerProxy --> BackendContainer[Node.js Backend]
        BackendContainer --> MongoContainer[(MongoDB Container)]
    end
```

### Type Signatures and Contracts

#### File: `backend/config/db.js`
```typescript
interface DBConfig {
  mongoUri: string;
  isProduction: boolean;
  ssl?: boolean;
}
```

#### Production Configuration Contract:
```typescript
interface DeploymentContract {
  backend: {
    port: number | string;
    mongoUri: string;
    nodeEnv: 'production' | 'development';
    corsOrigin?: string;
  };
  frontend: {
    apiBaseUrl: string;
    buildOutput: 'dist';
  };
}
```

## Implementation Plan

### Step 1: Code Enhancements for Production Readiness
1. Update `frontend/src/services/api.js` to intelligently fall back to relative path `''` in production when `VITE_API_BASE_URL` is omitted.
2. Update `backend/app.js` to optionally serve `frontend/dist` when in production mode, supporting Single-Service Monolith deployment.
3. Verify test suite passes without regressions.

### Step 2: Create Docker & Container Configurations
1. Create `backend/Dockerfile` (lightweight Node.js Alpine image).
2. Create `frontend/Dockerfile` (multi-stage build with Nginx or static server).
3. Create root `docker-compose.yml` defining `mongo`, `backend`, and `frontend` services with network isolation.
4. Create `.dockerignore` files.

### Step 3: Deployment Documentation & Runbooks
1. Step-by-step MongoDB Atlas setup guide.
2. Step-by-step Vercel + Render free deployment guide.
3. Step-by-step Docker Compose self-hosted runbook.

## Examples

### Production Environment Variables
- ✅ Valid Cloud MongoDB URI: `mongodb+srv://admin:pass@cluster.mongodb.net/dailytracker?retryWrites=true&w=majority`
- ❌ Invalid Localhost URI on Cloud: `mongodb://localhost:27017/dailytracker` (will fail to connect on Render/Vercel)
- ✅ Valid Vercel API Base URL: `https://daily-tracker-api.onrender.com`
- ❌ Invalid API Base URL with trailing slash: `https://daily-tracker-api.onrender.com/` (creates duplicate `//api/days`)

## Trade-offs
1. **Decoupled (Vercel + Render) vs Monolith:**
   - *Decoupled:* Independent scaling, fast edge CDN for frontend, but requires CORS configuration and 2 services.
   - *Monolith:* Simplest configuration (single URL, zero CORS), but frontend assets are served by Node.js rather than global CDN.
2. **MongoDB Atlas vs Self-Hosted MongoDB Container:**
   - *MongoDB Atlas:* Free automated backups, high availability, zero server maintenance.
   - *Self-Hosted Container:* Fully autonomous and private, but requires managing disk persistence and backups manually.

## Implementation Results

- **Adaptive Production Base URL:** Updated [`frontend/src/services/api.js`](file:///E:/DailyTracker/frontend/src/services/api.js) to trim trailing slashes and dynamically switch between `http://localhost:3000` (Dev), relative `''` (Monolith/Docker), or cloud backend URLs (Decoupled Vercel/Netlify).
- **Monolith SPA Serving:** Enhanced [`backend/app.js`](file:///E:/DailyTracker/backend/app.js) to serve `frontend/dist` when present, enabling single-container and single-service deployments without CORS overhead.
- **Docker Containerization:**
  - [`backend/Dockerfile`](file:///E:/DailyTracker/backend/Dockerfile) & [`backend/.dockerignore`](file:///E:/DailyTracker/backend/.dockerignore): Lightweight Node.js 20 Alpine image.
  - [`frontend/Dockerfile`](file:///E:/DailyTracker/frontend/Dockerfile), [`frontend/nginx.conf`](file:///E:/DailyTracker/frontend/nginx.conf), & [`frontend/.dockerignore`](file:///E:/DailyTracker/frontend/.dockerignore): Multi-stage Vite build + Nginx Alpine reverse proxy.
  - [`docker-compose.yml`](file:///E:/DailyTracker/docker-compose.yml): Root multi-service orchestrator for `mongo`, `backend`, and `frontend` with dedicated volumes and networks.
- **Test Integrity:** All 32 unit and integration tests (16 backend Jest tests + 16 frontend Vitest tests) passed with 100% success rate.
- **Production Bundle:** Vite production build (`vite build`) successfully generated optimized assets in 1.46s.

### Deviations
- **Single-Service Hybrid Mode:** In addition to supporting decoupled hosting (Vercel + Render), the backend was equipped with an automatic static file server fallback for `frontend/dist`, giving users the option to deploy the entire application to a single Render or Railway free-tier service with 0 CORS setup.

