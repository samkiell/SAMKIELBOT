# 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 - Unified Next.js Application

> **WhatsApp Bot Deployment Platform** - Deploy, manage, and monetize WhatsApp bots with ease.

## 🌟 Overview

SAMKIEL BOT is a comprehensive platform for deploying and managing WhatsApp bots. Built with Next.js, it provides a unified frontend and backend experience with real-time updates, credit-based billing, and powerful admin controls.

### Key Features

- 🤖 **Bot Deployment** - Deploy WhatsApp bots to Pterodactyl panel
- 💳 **Credit System** - Pay-as-you-go billing with Paystack integration
- 🔄 **Real-time Updates** - Live bot status via Socket.IO
- 👥 **Referral System** - Earn credits by referring users
- 🛡️ **Admin Panel** - Comprehensive management dashboard
- 📊 **Analytics** - Track bot performance and usage
- 🔐 **Secure** - JWT authentication and role-based access

## 🏗️ Architecture

This is a **unified Next.js application** that combines frontend and backend in a single deployable unit:

```
┌─────────────────────────────────────┐
│      Next.js Application            │
│  ┌───────────────────────────────┐  │
│  │   Frontend (React Pages)      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   API Routes (Backend)        │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Socket.IO (Real-time)       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           │
           ├─── MongoDB (Database)
           ├─── Pterodactyl (Bot Hosting)
           └─── Paystack (Payments)
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

## 📁 Project Structure

```
samkiel-bot-deployment/
├── pages/              # Next.js pages & API routes
│   ├── api/            # Backend API endpoints
│   ├── admin/          # Admin panel pages
│   └── ...             # Public pages
├── lib/                # Business logic
│   ├── controllers/    # API controllers
│   ├── services/       # Business services
│   └── utils/          # Utilities
├── models/             # Database schemas
├── components/         # React components
├── public/             # Static assets
├── server.js           # Custom Next.js server
└── package.json        # Dependencies
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time updates

### Backend
- **Next.js API Routes** - REST API
- **Socket.IO** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Integrations
- **Pterodactyl** - Bot hosting panel
- **Paystack** - Payment processing
- **GitHub** - Bot updates

## 🔧 Configuration

### Environment Variables

Required variables (see `.env.example`):

```env
# Database
MONGO_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your_secret_key

# Pterodactyl Panel
PTERODACTYL_URL=https://panel.example.com
PTERODACTYL_API_KEY=ptlc_...

# Paystack
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...

# Server
PORT=3000
NODE_ENV=production
```

## 📚 Documentation

- [Quick Start Guide](./QUICK_START.md) - Get up and running
- [Refactoring Complete](./REFACTOR_COMPLETE.md) - Migration details
- [Billing Architecture](./BILLING_ARCHITECTURE.md) - Credit system
- [Paystack Integration](./PAYSTACK_IMPLEMENTATION.md) - Payment setup

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### VPS/Docker
```bash
npm run build
pm2 start npm --name "samkiel-bot" -- start
```

### Railway/Render
- Build: `npm run build`
- Start: `npm start`

## 🔐 Security

- JWT-based authentication
- Role-based access control (User/Admin)
- Secure password hashing with bcrypt
- Environment variable protection
- Paystack webhook signature validation
- Rate limiting on sensitive endpoints

## 🎯 Features

### User Features
- ✅ Register/Login with JWT
- ✅ Deploy WhatsApp bots
- ✅ Manage bot power (start/stop/restart)
- ✅ Purchase credits via Paystack
- ✅ Referral system with rewards
- ✅ Real-time bot status updates
- ✅ Credit balance tracking
- ✅ Payment history

### Admin Features
- ✅ User management
- ✅ Bot management (all users)
- ✅ Credit management (add/remove)
- ✅ System statistics
- ✅ Audit logs
- ✅ Node management
- ✅ Feature flags
- ✅ Webhook logs

## 🧪 Testing

```bash
# Run linter
npm run lint

# Test API endpoints
curl http://localhost:3000/api/auth/verify

# Test Socket.IO
# Open browser console and check for Socket.IO connection
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
npx kill-port 3000
```

**MongoDB connection failed**
- Check MONGO_URI in .env
- Verify network access in MongoDB Atlas

**Socket.IO not connecting**
- Ensure custom server is running
- Check browser console for errors

See [QUICK_START.md](./QUICK_START.md) for more troubleshooting tips.

## 📈 Performance

- **Single server** - Reduced latency
- **No CORS** - Same-origin requests
- **Next.js optimization** - Automatic code splitting
- **Socket.IO** - Efficient real-time updates
- **MongoDB indexes** - Fast queries

## 🤝 Contributing

This is a private project. For issues or suggestions, contact the maintainer.

## 📄 License

ISC License - See LICENSE file for details

## 👤 Author

**SAMKIEL**

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Pterodactyl for the hosting panel
- Paystack for payment processing
- MongoDB for the database

---

**Version**: 2.0.0 (Unified Architecture)  
**Status**: ✅ Production Ready  
**Last Updated**: December 16, 2025
