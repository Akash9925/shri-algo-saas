# Shri Algo — Paper Trading SaaS Platform

A fully functional SaaS platform for algorithmic trading strategy development and paper trading. Build, test, and refine trading strategies in a risk-free environment with real-time execution simulation.

## 🎯 Features

- **Strategy Builder**: Create multi-leg trading strategies with support for options (CE/PE), buy/sell actions
- **Real-Time Execution**: Simulated market data with automatic strategy execution every 5 seconds
- **Risk Management**: Built-in stoploss and target logic for position management
- **Live P&L Tracking**: Real-time profit/loss monitoring and trade logging
- **Plan Gating**: Free plan (1 active strategy) and paid plan (unlimited strategies)
- **Authentication**: Manus OAuth integration for secure user management
- **Responsive UI**: Modern dashboard with dark theme, built with React + Tailwind CSS

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 with Vite
- Tailwind CSS 4 for styling
- tRPC for type-safe API calls
- Wouter for routing

**Backend:**
- Express 4 with Node.js
- tRPC for API layer
- Drizzle ORM with MySQL/TiDB
- TypeScript for type safety

**Database:**
- TiDB Cloud (MySQL-compatible)
- 8 tables: users, strategies, orders, positions, trades, executionLogs, subscriptions, riskConfigs

### Project Structure

```
shri-algo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client setup
│   │   └── App.tsx        # Main app with routing
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── executionEngine.ts # Strategy execution loop
│   ├── marketDataService.ts # Simulated price feed
│   ├── strategyRouter.ts  # Strategy APIs
│   ├── subscriptionRouter.ts # Plan management APIs
│   ├── db.ts              # Database queries
│   └── routers.ts         # Main tRPC router
├── drizzle/               # Database schema & migrations
│   ├── schema.ts          # Table definitions
│   └── migrations/        # SQL migration files
└── package.json           # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x or higher
- pnpm (or npm/yarn)
- MySQL database (or TiDB Cloud account)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   cd shri-algo
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env.local in project root
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your-secret-key
   VITE_APP_ID=your-manus-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
   ```

3. **Apply database migrations:**
   ```bash
   pnpm db:push
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/trpc

5. **Run tests:**
   ```bash
   pnpm test
   ```

## 📊 Database Schema

### Core Tables

**strategies**
- id, userId, name, description, status
- config (JSON: entry, legs, overall, reentry)
- initialCapital, currentCapital, realizedPnl, unrealizedPnl
- createdAt, updatedAt, startedAt, completedAt

**positions**
- id, strategyId, instrument, action, quantity
- entryPrice, currentPrice, unrealizedPnl
- stoploss, target, status
- createdAt, updatedAt, closedAt

**trades**
- id, strategyId, instrument, action, quantity
- entryPrice, exitPrice, pnl, pnlPercent
- exitReason, entryAt, exitAt

**executionLogs**
- id, strategyId, userId, eventType, message
- metadata (JSON), createdAt

**subscriptions**
- id, userId, plan (free/paid), maxActiveStrategies
- createdAt, updatedAt

## 🎮 User Flow

1. **Sign Up/Login**: User authenticates via Manus OAuth
2. **Create Strategy**: User builds multi-leg strategy with entry/exit conditions
3. **Start Strategy**: Execution engine begins running (every 5 seconds)
4. **Monitor**: Real-time P&L updates, trade logs, position tracking
5. **Stop Strategy**: User can stop anytime to lock in P&L

## 🔄 Execution Engine

The execution engine runs every 5 seconds:

1. **Initialize**: On first run, opens positions for each strategy leg at current market price
2. **Update**: Updates all open positions with simulated market prices
3. **Evaluate Risk**: Checks stoploss and target conditions
4. **Exit**: Closes positions that hit stoploss/target, records trades
5. **Update P&L**: Calculates realized and unrealized P&L

### Market Data Simulation

- Prices update randomly within ±2% per cycle
- Instruments: NIFTY, BANKNIFTY (simulated)
- Base prices: NIFTY=20000, BANKNIFTY=45000

## 📱 API Endpoints (tRPC)

### Strategy Management

- `strategy.create` - Create new strategy
- `strategy.list` - Get user's strategies
- `strategy.detail` - Get strategy details with trades
- `strategy.start` - Activate strategy
- `strategy.stop` - Deactivate strategy
- `strategy.logs` - Get execution logs
- `strategy.getSubscription` - Get user's plan info

### Subscriptions

- `subscription.getCurrent` - Get current plan
- `subscription.upgradeToPaid` - Upgrade to paid plan
- `subscription.downgradeToFree` - Downgrade to free plan

### Authentication

- `auth.me` - Get current user
- `auth.logout` - Sign out

## 🎯 Plan Features

### Free Plan
- 1 active strategy maximum
- Basic stoploss and target
- No trailing stoploss
- No re-entry
- Limited execution logs

### Paid Plan
- Unlimited active strategies
- All features enabled
- Trailing stoploss support
- Re-entry support
- Full execution logs

## 📦 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables
4. Configure build command: `pnpm build`
5. Configure start command: `pnpm start`
6. Deploy

### Database (TiDB Cloud)

1. Create TiDB Serverless cluster
2. Get connection string
3. Set `DATABASE_URL` in backend environment

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/auth.logout.test.ts

# Watch mode
pnpm test --watch
```

## 📝 Development Guidelines

### Adding New Features

1. **Update schema** in `drizzle/schema.ts`
2. **Generate migration**: `pnpm drizzle-kit generate`
3. **Add database queries** in `server/db.ts`
4. **Create tRPC procedures** in `server/routers.ts` or new router file
5. **Build UI components** in `client/src/pages/` or `client/src/components/`
6. **Wire frontend to API** using `trpc.*.useQuery/useMutation`
7. **Test thoroughly** before committing

### Code Style

- Use TypeScript for type safety
- Follow existing patterns in codebase
- Use Tailwind CSS for styling (no custom CSS unless necessary)
- Prefer shadcn/ui components
- Add error handling and loading states

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from your network
- Run `pnpm db:push` to apply migrations

### Execution Engine Not Running
- Check server logs: `pnpm dev`
- Verify strategies are in "active" status
- Check database has strategies table

### Frontend Not Connecting to Backend
- Verify backend is running on port 3000
- Check browser console for errors
- Verify CORS is configured correctly

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Create new issue with reproduction steps
3. Include error logs and environment info

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- Manus platform for OAuth and infrastructure
- React and Tailwind CSS communities
- Drizzle ORM for database management
- tRPC for type-safe APIs

---

**Status**: Production Ready ✅
**Last Updated**: May 2026
**Version**: 1.0.0
