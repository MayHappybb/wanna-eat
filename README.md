# 🍽️ Wanna Eat

A real-time team meal coordination app built with Next.js, TypeScript, and SQLite.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

- **👥 Team Management** - See who's online and their eating preferences
- **📍 Location Tracking** - Share your location (Dormitory/Office/Out) with privacy controls
- **🍔 Food Preferences** - Set your restaurant preferences with priority ordering
- **💬 Real-time Chat** - Built-in team chat with Socket.io
- **📊 Eating Summary** - Visual summary showing who's hungry and popular restaurant choices
- **📜 History** - Track past team meals

## 🚀 Tech Stack

- **Frontend**: Next.js 16 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Socket.io
- **Database**: SQLite (better-sqlite3)
- **Authentication**: iron-session (cookie-based)
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone the repository
git clone git@github.com:MayHappybb/wanna-eat.git
cd wanna-eat

# Install dependencies
npm install

# Set up environment variables (optional)
cp .env.local.example .env.local
# Edit .env.local and set SESSION_SECRET

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Building for Production

```bash
npm run build
npm run start
```

## 🗂️ Project Structure

```
wanna-eat/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Login/register/logout
│   │   ├── chat/         # Chat messages API
│   │   ├── preferences/  # Food preferences API
│   │   ├── records/      # Eating history API
│   │   ├── status/       # User status API
│   │   └── users/        # Users list API
│   ├── dashboard/        # Main dashboard page
│   ├── history/          # Eating history page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── page.tsx          # Home (redirects to dashboard)
├── components/           # React components
│   ├── ChatBox.tsx      # Real-time chat
│   ├── EatingSummary.tsx # Team eating summary
│   ├── Navbar.tsx       # Navigation bar
│   ├── PreferenceList.tsx # Food preferences UI
│   ├── StatusCard.tsx   # User status display
│   └── StatusForm.tsx   # Status update form
├── lib/                 # Utilities
│   ├── auth.ts         # Authentication helpers
│   ├── db.ts           # Database setup
│   ├── socket.ts       # Socket.io server
│   └── types.ts        # TypeScript types
├── data/               # SQLite database (auto-created)
└── server.ts           # Custom server with Socket.io
```

## 🔐 Environment Variables

Create a `.env.local` file:

```env
# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_random_secret_here

# Database path (optional, default: ./data/app.db)
DATABASE_PATH=./data/app.db
```

## 🎯 Usage

1. **Register** - Create an account with username, display name, and password
2. **Update Status** - Set your location and whether you want to eat
3. **Add Preferences** - Add your favorite restaurants (can be public or private)
4. **Chat** - Message your team in real-time
5. **Check Summary** - See who's hungry and popular restaurant choices

## 📝 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | User logout |
| `/api/users` | GET | Get all users with status |
| `/api/status` | GET/PUT | Get/update user status |
| `/api/preferences` | GET/POST | Get/add food preferences |
| `/api/preferences/[id]` | PUT/DELETE | Update/delete preference |
| `/api/chat` | GET/POST | Get/send chat messages |
| `/api/records` | GET/POST | Get/add eating records |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ for teams who love to eat together!
