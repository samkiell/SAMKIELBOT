# SAMKIEL BOT - Quick Start Guide

## 🚀 Getting Started (Unified Next.js App)

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Pterodactyl panel access
- Paystack account (for payments)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual credentials
# Required variables:
# - MONGO_URI
# - JWT_SECRET
# - PTERODACTYL_URL
# - PTERODACTYL_API_KEY
# - PAYSTACK_SECRET_KEY
# - PAYSTACK_PUBLIC_KEY
```

### Step 3: Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Step 4: Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Admin Panel**: http://localhost:3000/admin

## 📦 Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Deployment Platforms

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### VPS/Docker
```bash
# Clone repository
git clone <your-repo>
cd samkiel-bot-deployment

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "samkiel-bot" -- start
```

### Railway/Render
- Build Command: `npm run build`
- Start Command: `npm start`
- Add environment variables in dashboard

## 🔐 Environment Variables

See `.env.example` for complete list. Key variables:

```env
# Database
MONGO_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your_secret_key

# Pterodactyl
PTERODACTYL_URL=https://panel.example.com
PTERODACTYL_API_KEY=ptlc_...

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Server
PORT=3000
NODE_ENV=production
```

## 🎯 Key Features

- ✅ Single unified Next.js application
- ✅ No separate frontend/backend servers
- ✅ Built-in API routes
- ✅ Real-time updates via Socket.IO
- ✅ Credit-based billing system
- ✅ Paystack payment integration
- ✅ Admin panel
- ✅ Bot deployment & management
- ✅ Referral system

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### MongoDB Connection Issues
- Check MONGO_URI in .env
- Verify network access in MongoDB Atlas
- Check firewall settings

### Socket.IO Not Connecting
- Ensure custom server is running
- Check browser console for errors
- Verify PORT in .env

## 📚 Documentation

- [REFACTOR_COMPLETE.md](./REFACTOR_COMPLETE.md) - Full migration details
- [REFACTOR_PLAN.md](./REFACTOR_PLAN.md) - Original refactoring plan

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the complete documentation
3. Check console logs for errors

---

**Version**: 2.0.0 (Unified Architecture)
**Last Updated**: 2025-12-16
