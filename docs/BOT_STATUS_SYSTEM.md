# Bot Status State Machine & Health Monitoring System

## Overview

This document describes the comprehensive bot lifecycle management system implemented for the SAMKIEL BOT platform. The system provides a **single source of truth** for bot status based on real-time console log parsing and server state monitoring.

## Bot Lifecycle States

### State Definitions

| State | Description | Triggers |
|-------|-------------|----------|
| `pending` | Initial state when deployment is created | User creates deployment |
| `creating` | Server is being created in Pterodactyl | Deployment process starts |
| `installing` | Dependencies are being installed | Server created, installing packages |
| `starting` | Bot is starting up | Server started, initializing WhatsApp connection |
| `awaiting_pairing` | Waiting for WhatsApp pairing | Pairing code detected in logs |
| `paired` | WhatsApp pairing completed | "successfully logged in" detected |
| `connected` | Connected to WhatsApp | "connected to whatsapp" / "client ready" detected |
| `active` | Bot is actively processing messages | Message activity detected |
| `stopped` | Bot manually stopped | User/admin stop action |
| `offline` | Bot crashed or disconnected | Error/crash detected in logs |
| `failed` | Deployment failed | Critical error during deployment |
| `suspended` | Bot suspended by admin | Admin suspension action |

### State Transitions

```
pending → creating → installing → starting → awaiting_pairing → paired → connected → active
                                                                                      ↓
                                                                                   offline
                                                                                      ↓
                                                                                   stopped
```

## Health Tracking Fields

### Database Schema

```javascript
{
  status: String,           // Current lifecycle state
  isActive: Boolean,        // Is bot currently active?
  lastActiveAt: Date,       // Last activity timestamp
  pairedAt: Date,          // When WhatsApp pairing completed
  connectedAt: Date,       // When connection established
  uptimeStart: Date,       // When current uptime period started
  pairingCode: String,     // Current pairing code (if awaiting)
  errorMessage: String     // Last error message
}
```

## Bot Health Service

### Core Functionality

The `botHealthService` is a singleton EventEmitter that:

1. **Monitors Console Logs** via WebSocket connection to Pterodactyl
2. **Parses Log Patterns** to detect lifecycle events
3. **Updates Bot Status** in real-time
4. **Emits Events** for frontend consumption
5. **Performs Health Checks** every 30 seconds

### Log Pattern Detection

#### Pairing Code
```javascript
/Your Pairing Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i
```

#### Pairing Complete
- "successfully logged in"
- "session restored"
- "pairing complete"
- "login successful"

#### Connection Established
- "connected to whatsapp"
- "client ready"
- "bot connected successfully"
- "connection opened"
- "websocket connected"

#### Bot Active
- "message received"
- "command executed"
- "processing message"
- "handling command"

#### Error/Crash
- "process exited"
- "server stopped"
- "fatal error"
- "uncaught exception"
- "connection closed"
- "disconnected from whatsapp"

### Events Emitted

```javascript
botHealthService.on('bot.status_change', (data) => {
  // { deploymentId, oldStatus, newStatus }
});

botHealthService.on('bot.pairing_code', (data) => {
  // { deploymentId, code }
});

botHealthService.on('bot.paired', (data) => {
  // { deploymentId }
});

botHealthService.on('bot.connected', (data) => {
  // { deploymentId }
});

botHealthService.on('bot.active', (data) => {
  // { deploymentId }
});

botHealthService.on('bot.offline', (data) => {
  // { deploymentId }
});
```

## Real-Time Communication

### Backend (Socket.IO Server)

```javascript
// server.js
io.on('connection', (socket) => {
  console.log('Client connected');
});

// Forward bot health events to all connected clients
botHealthService.on('bot.status_change', (data) => {
  io.emit('bot:status_change', data);
});
```

### Frontend (Socket.IO Client)

```javascript
// useBotStatus.js
const socket = io(API_URL);

socket.on('bot:status_change', (data) => {
  if (data.deploymentId === myDeploymentId) {
    // Update UI
  }
});
```

## API Endpoints

### Deployment Status
```
GET /api/deploy/:id/status
```

Returns:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "connected",
    "isActive": true,
    "pairingCode": null,
    "lastActiveAt": "2025-12-16T02:00:00Z",
    "pairedAt": "2025-12-16T01:55:00Z",
    "connectedAt": "2025-12-16T01:56:00Z",
    "uptimeStart": "2025-12-16T01:56:00Z",
    "resources": { ... },
    "errorMessage": null
  }
}
```

### Active Bots
```
GET /api/deploy/active
```

Returns all bots where `isActive === true` and `status` is `active` or `connected`.

## Deployment Page Flow

### User Experience

1. **User submits deployment form** → Redirected to `/deploy/[id]`
2. **Page shows "Creating..."** → Status: `creating`/`installing`
3. **Page shows "Starting..."** → Status: `starting`
4. **Pairing code appears** → Status: `awaiting_pairing`
   - Large, visible pairing code display
   - Instructions for WhatsApp linking
5. **User links WhatsApp** → Backend detects "successfully logged in"
6. **Status updates to "Connected"** → Status: `connected`
   - ✅ Success message
   - "Your bot is now live"
   - Buttons to view bots or go to dashboard
7. **No redirect** → User stays on page to see success

### State-Driven UI

```javascript
switch (status) {
  case 'creating':
  case 'installing':
    return <Spinner text="Setting up your bot..." />;
  
  case 'starting':
    return <Spinner text="Starting bot..." />;
  
  case 'awaiting_pairing':
    return <PairingCodeDisplay code={pairingCode} />;
  
  case 'paired':
    return <Spinner text="Establishing connection..." />;
  
  case 'connected':
  case 'active':
    return <SuccessMessage />;
  
  case 'failed':
    return <ErrorMessage error={errorMessage} />;
}
```

## Notifications

### Automatic Notifications

1. **Bot Connected** (first time)
   ```
   Title: "Bot Deployed Successfully 🚀"
   Message: "Your bot '[name]' is now live and connected to WhatsApp!"
   ```

2. **Bot Offline** (unexpected)
   ```
   Title: "Bot Offline"
   Message: "Your bot '[name]' has gone offline."
   ```

## Active Bots Definition

A bot is considered "active" when:
- `isActive === true`
- `status === 'active' || status === 'connected'`
- Server is running (from Pterodactyl)
- Recent log activity (< 2 minutes)

## Integration Points

### Deployment Controller
- Calls `botHealthService.startMonitoring(deploymentId)` after starting server
- No manual log parsing

### Admin Controller
- Calls `botHealthService.startMonitoring()` when starting bots
- Calls `botHealthService.stopMonitoring()` when stopping bots
- Uses `isActive` field for statistics

### Frontend Pages
- `/deploy/[id]` - Real-time deployment status
- `/dashboard` - Shows active bot count
- `/bots` - Filters by `isActive`
- `/admin` - Admin panel uses health data

## Monitoring Initialization

On server startup:
```javascript
botHealthService.initializeAllMonitors().then(() => {
  console.log('[BotHealth] All monitors initialized');
});
```

This automatically starts monitoring all bots in states:
- `starting`
- `awaiting_pairing`
- `paired`
- `connected`
- `active`

## Health Check Cycle

Every 30 seconds:
1. Query Pterodactyl for server power state
2. Update resource usage (RAM, CPU, disk)
3. Check for stale log activity
4. Update `isActive` based on activity

## Error Handling

### WebSocket Reconnection
- Automatic reconnection after 5 seconds
- Maintains monitor state across reconnects

### Missing Data
- If `pterodactylUuid` missing, monitoring skipped
- If server not found, status set to `offline`

### Log Parsing Errors
- Ignored silently to prevent crashes
- Logged to `logs/bot-health.log`

## Testing

### Manual Testing
1. Deploy a new bot
2. Observe status transitions in real-time
3. Link WhatsApp and verify "connected" status
4. Check notifications

### Log Files
- `logs/bot-health.log` - All log lines and matches
- `logs/ptero-console.log` - Raw Pterodactyl console output

## Performance Considerations

- WebSocket connections are lightweight
- Health checks run in parallel
- Database updates are batched
- Socket.IO broadcasts are efficient

## Future Enhancements

1. **Metrics Collection** - Track uptime, message count, etc.
2. **Alerting** - Email/SMS when bot goes offline
3. **Auto-Restart** - Automatically restart crashed bots
4. **Resource Limits** - Enforce CPU/RAM limits
5. **Scaling** - Horizontal scaling for high bot counts

## Troubleshooting

### Bot stuck in "awaiting_pairing"
- Check `logs/bot-health.log` for pairing code detection
- Verify WebSocket connection is active
- Check Pterodactyl console manually

### Status not updating
- Verify Socket.IO connection in browser console
- Check backend logs for health service errors
- Ensure bot is being monitored (`activeMonitors` Map)

### "isActive" always false
- Check log pattern matching
- Verify bot is actually processing messages
- Review `lastActiveAt` timestamp

## Architecture Diagram

```
┌─────────────────┐
│  Pterodactyl    │
│  WebSocket      │
└────────┬────────┘
         │ Console Logs
         ↓
┌─────────────────┐
│ Bot Health      │
│ Service         │
│ (Singleton)     │
└────────┬────────┘
         │ Events
         ↓
┌─────────────────┐
│ Socket.IO       │
│ Server          │
└────────┬────────┘
         │ Real-time
         ↓
┌─────────────────┐
│ Frontend        │
│ (React/Next.js) │
└─────────────────┘
```

## Conclusion

This system provides:
- ✅ Single source of truth for bot status
- ✅ Real-time updates across all pages
- ✅ Automatic state transitions
- ✅ Reliable pairing code detection
- ✅ Comprehensive health monitoring
- ✅ No frontend guessing or timeouts
- ✅ Persistent status across refreshes
