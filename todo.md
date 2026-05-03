# Shri Algo — SaaS Completion TODO

## Phase 1: Database & Backend Infrastructure
- [x] Implement strategy CRUD queries in db.ts (create, read, update, delete, list by user)
- [x] Implement order queries in db.ts (create, update, list by strategy)
- [x] Implement position queries in db.ts (create, update, close, list open)
- [x] Implement trade queries in db.ts (create, close, list by strategy)
- [x] Implement execution log queries in db.ts
- [x] Implement subscription queries in db.ts (get/create user subscription)
- [x] Implement risk config queries in db.ts

## Phase 2: Execution Engine
- [x] Implement market data service with simulated price feed
- [x] Implement strategy evaluation logic (entry conditions, leg processing)
- [x] Implement order execution and position opening
- [x] Implement risk engine (stoploss, target, trailing SL checks)
- [x] Implement position closing and trade recording
- [x] Implement execution loop that runs every N seconds
- [x] Initialize strategy legs on first run (open positions)
- [ ] Add background job queue for strategy execution (BullMQ/Redis)

## Phase 3: Backend APIs
- [x] Create strategy router: create, read, list, update, delete
- [x] Create strategy start/stop endpoints
- [x] Create strategy detail endpoint with trades and logs
- [x] Create trade router: list trades by strategy
- [x] Create execution log router: list logs by strategy
- [x] Create subscription router: get user subscription, upgrade plan
- [x] Add plan gating logic to strategy APIs (free: 1 active, paid: unlimited)
- [x] Add feature gating for trailing SL and re-entry (paid only)

## Phase 4: Frontend Pages & Components
- [x] Build landing page with hero, features, CTA
- [x] Build dashboard page with strategy list and quick stats
- [x] Build strategy builder page with multi-leg form
- [x] Build strategy detail/monitoring page with live P&L and trade logs
- [ ] Build settings/subscription page for plan management
- [x] Create reusable components: strategy card, trade table, P&L chart
- [x] Add real-time updates or polling for live P&L

## Phase 5: Frontend-Backend Integration
- [x] Wire strategy creation form to backend API
- [x] Wire strategy start/stop buttons to backend
- [x] Wire dashboard to fetch user strategies and display
- [x] Wire strategy detail page to fetch trades and logs
- [x] Add error handling and loading states
- [x] Test end-to-end flow: login → create → start → monitor

## Phase 6: Plan Gating & Feature Flags
- [x] Implement free plan: 1 active strategy, no trailing SL, no re-entry
- [x] Implement paid plan: unlimited strategies, enable all features
- [x] Add plan check to strategy creation API
- [x] Add plan check to strategy start API
- [x] Add subscription info endpoint for feature flags
- [x] Add feature flag checks to strategy builder UI (trailing SL toggle with lock icon)
- [x] Create upgrade prompt for paid features (inline banner + upgrade page)

## Phase 7: Deployment Preparation
- [x] Configure environment variables for production
- [x] Set up database connection for production (TiDB Cloud)
- [ ] Configure Redis for job queue (Upstash) - optional
- [x] Build and test production bundle locally (pnpm build successful)
- [x] Create deployment configs: vercel.json, render.yaml
- [x] Add comprehensive README with setup and deployment instructions
- [x] Add detailed DEPLOYMENT.md guide with step-by-step instructions

## Phase 8: Deployment & Launch
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render
- [ ] Configure custom domain (optional)
- [ ] Test live deployment end-to-end
- [x] Document run/deploy instructions (README.md)
- [ ] Deliver live URLs to user (pending deployment)
