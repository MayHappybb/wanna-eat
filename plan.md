# Wanna Eat - Team Meal Coordination App

## Context

A web application for a student team (≤30 people) to coordinate meal times without the awkwardness of WeChat group messages or the inconvenience of walking to each other's rooms. Team members are distributed across dormitories and offices, making spontaneous meal coordination difficult.

### Problem Solved
- Eliminates awkward silence when asking about meals in group chat
- Avoids unnecessary trips to check if colleagues are in their rooms
- Prevents waiting for everyone to finish work at different times
- Provides privacy controls for location and food preferences

### Intended Outcome
A real-time web app where team members can set their availability, location, food preferences, and chat to coordinate meals efficiently.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14+ (App Router) | Full-stack React, API routes, SSR |
| Database | SQLite (better-sqlite3) | Simple, file-based, no separate server needed |
| Real-time | Socket.io | WebSocket support for chat and live updates |
| Auth | iron-session | Stateless sessions, no Redis/DB session storage needed |
| Styling | Tailwind CSS | Utility-first, rapid UI development |
| Icons | Lucide React | Clean, modern icon set |

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User status (current state)
CREATE TABLE user_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  location TEXT, -- NULL if hidden, otherwise 'dormitory', 'office', 'out', or custom
  location_visible INTEGER NOT NULL DEFAULT 1, -- 0=hidden, 1=visible
  willing_to_eat INTEGER NOT NULL DEFAULT 0, -- 0=no, 1=yes, 2=maybe
  note TEXT, -- optional additional status note
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Food preferences (ordered by priority)
CREATE TABLE food_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  restaurant_name TEXT NOT NULL,
  priority_order INTEGER NOT NULL DEFAULT 0, -- 0=first choice, 1=second, etc.
  is_public INTEGER NOT NULL DEFAULT 1, -- 0=private, 1=public
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Eating records (history)
CREATE TABLE eating_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_name TEXT NOT NULL,
  ate_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Eating record participants (many-to-many)
CREATE TABLE eating_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eating_record_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (eating_record_id) REFERENCES eating_records(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages (persistent history)
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## File Structure

```
/root/coding/wannaEat/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   ├── login/route.ts    # POST login
│   │   │   ├── logout/route.ts   # POST logout
│   │   │   └── register/route.ts # POST register
│   │   ├── status/
│   │   │   └── route.ts          # GET/PUT user status
│   │   ├── preferences/
│   │   │   └── route.ts          # GET/POST/DELETE food preferences
│   │   ├── records/
│   │   │   └── route.ts          # GET/POST eating records
│   │   ├── chat/
│   │   │   └── route.ts          # GET chat history
│   │   └── users/
│   │       └── route.ts          # GET all users with status
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Registration page
│   ├── dashboard/page.tsx        # Main dashboard (protected)
│   ├── history/page.tsx          # Eating history page (protected)
│   ├── layout.tsx                # Root layout with auth context
│   └── page.tsx                  # Redirect to dashboard
├── components/                   # React components
│   ├── AuthProvider.tsx          # Authentication context
│   ├── StatusCard.tsx            # Individual user status display
│   ├── StatusForm.tsx            # Form to update own status
│   ├── PreferenceList.tsx        # Food preferences editor
│   ├── ChatBox.tsx               # Group chat component
│   ├── EatingSummary.tsx         # Aggregation of who's eating where
│   ├── RecordForm.tsx            # Form to record a meal
│   └── Navbar.tsx                # Navigation bar
├── lib/                          # Utilities
│   ├── db.ts                     # Database connection & initialization
│   ├── auth.ts                   # Session management (iron-session)
│   ├── socket.ts                 # Socket.io server setup
│   └── types.ts                  # TypeScript types
├── public/                       # Static assets
├── styles/                       # Global styles (if needed)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.local                    # Environment variables
```

---

## API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/login | Login with credentials |
| POST | /api/auth/logout | Logout and clear session |

### User Status
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/status | Get current user's status |
| PUT | /api/status | Update own status (location, willing_to_eat, note) |

### Users (Dashboard Data)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/users | Get all users with their current status and public preferences |

### Food Preferences
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/preferences | Get own preferences |
| POST | /api/preferences | Add new preference |
| PUT | /api/preferences/:id | Update preference (order or visibility) |
| DELETE | /api/preferences/:id | Remove preference |

### Eating Records
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/records | Get eating history (with pagination) |
| POST | /api/records | Create new eating record |

### Chat
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/chat | Get recent chat messages (last 50) |

---

## WebSocket Events (Socket.io)

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| message | `{ message: string }` | Send chat message |
| status_update | `{ location, willing_to_eat, note }` | Broadcast status change |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| new_message | `{ id, user, message, sent_at }` | New chat message |
| user_status_changed | `{ user_id, status }` | Someone updated status |
| user_online | `{ user_id }` | User connected |
| user_offline | `{ user_id }` | User disconnected |

---

## Key Pages

### 1. Login/Register (`/login`, `/register`)
- Simple forms for authentication
- No styling needed initially, functional first

### 2. Dashboard (`/dashboard`) - MAIN PAGE
**Layout:**
- Top: Summary section showing:
  - Count of people willing to eat
  - Most popular restaurant (based on public preferences of willing people)
  - Quick "I'm hungry" button

- Left column (60%): Team status grid
  - Each user shows: name, location badge (or "hidden" if private), willing status (green/red), public food preferences
  - Real-time updates via WebSocket

- Right column (40%): Group chat
  - Message history
  - Input box
  - Shows who's online

- Bottom: Quick status update form
  - Location dropdown (with "custom" option)
  - Toggle to hide/show location
  - Willing toggle (Yes/No/Maybe)
  - Optional note

### 3. My Preferences (`/preferences` - modal or page)
- Drag-and-drop list of restaurants
- Toggle visibility per item
- Add new restaurant input

### 4. History (`/history`)
- List of past eating records
- Who attended, where, when
- Option to create new record

---

## Core Features Implementation

### Smart Aggregation (EatingSummary component)
```typescript
// Logic to find best restaurant:
// 1. Filter users where willing_to_eat = 1
// 2. Collect all their PUBLIC food preferences
// 3. Score each restaurant: sum of (1 / (priority_order + 1)) for each vote
// 4. Sort by score descending
// 5. Show top 3 recommendations
```

### Privacy Model
- **Willing to eat**: Always visible (this is the key signal for coordination)
- **Location**: Can be hidden/private (user's choice, only matters if they want to eat)
- **Food preferences**: Can be public or private per item
- Private preferences only affect personal view, not aggregation
- When location is hidden, dashboard shows "Location hidden" or similar placeholder

---

## Implementation Phases

### Phase 1: Project Setup & Auth
1. Initialize Next.js project with TypeScript, Tailwind
2. Setup SQLite database with schema
3. Implement session-based auth (iron-session)
4. Create login/register pages

### Phase 2: Status Management
1. Create status API routes
2. Build dashboard with user grid
3. Implement status update form
4. Add location presets + custom option

### Phase 3: Food Preferences
1. Create preferences API
2. Build preference management UI
3. Add public/private toggle
4. Implement drag-and-drop ordering

### Phase 4: Smart Aggregation
1. Build EatingSummary component
2. Calculate popular restaurants algorithm
3. Show "who's eating" list

### Phase 5: Chat System
1. Setup Socket.io server
2. Build ChatBox component
3. Implement message persistence
4. Add online/offline indicators

### Phase 6: History
1. Create eating records API
2. Build history page
3. Add "record meal" functionality

### Phase 7: Polish
1. Add loading states
2. Error handling
3. Responsive design
4. Empty states

---

## Environment Variables (`.env.local`)

```
# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_random_secret_here

# Database path (relative to project root)
DATABASE_PATH=./data/app.db
```

---

## Running the App (Self-Hosted)

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Using PM2 for persistent hosting
pm2 start npm --name "wanna-eat" -- start
```

---

## Verification Steps

1. **Auth Flow**: Register → Login → Logout works correctly
2. **Status Updates**: Update status → appears in dashboard → other users see it (open two browsers)
3. **Preferences**: Add restaurants → set order → toggle privacy → verify visibility
4. **Aggregation**: Set multiple users as "willing" with preferences → verify top restaurant calculation
5. **Chat**: Send message → appears in real-time for other users → persists after refresh
6. **History**: Create eating record → appears in history page with correct participants
7. **Mobile**: Test responsive layout on mobile device/browser

---

## Future Enhancements (Optional)

- Push notifications (when enough people want to eat)
- Recurring scheduled meals (e.g., "lunch at 12:30 daily")
- Restaurant reviews/ratings
- Expense splitting integration
- WeChat/Discord bot integration
