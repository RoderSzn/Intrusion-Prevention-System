# 🛡️ Intrusion Prevention System (IPS) - project by Jnanaskanda K

A full-stack, real-time Intrusion Prevention System built with Node.js, Express, React, and Socket.IO.

![IPS Dashboard](https://img.shields.io/badge/Status-Active-success)
![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)

## ✨ Features

- ✅ Real-time threat detection and blocking
- ✅ 8 pre-configured detection rules (SQL Injection, XSS, Path Traversal, etc.)
- ✅ WebSocket-based live updates
- ✅ Interactive dashboard with statistics
- ✅ Rule management (enable/disable/edit/create)
- ✅ Threat logging and analysis
- ✅ Live system logs
- ✅ Comprehensive analytics with charts
- ✅ Rate limiting and IP tracking
- ✅ Export capabilities (CSV, TXT)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/intrusion-prevention-system.git
cd intrusion-prevention-system
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend** (in a new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

4. **Open your browser**
```
http://localhost:5173
```

## 🐳 Docker Deployment
```bash
docker-compose up -d
```

Access at: `http://localhost`

## 📊 Tech Stack

**Backend:**
- Node.js & Express
- SQLite database
- Socket.IO for real-time communication
- Winston for logging
- Helmet for security

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- Recharts for visualizations
- Socket.IO client
- Axios for API calls

## 🧪 Testing

Use the test buttons in the Dashboard or run:
```bash
# SQL Injection test
curl "http://localhost:5000/api/search?q=' OR '1'='1"

# XSS test
curl -X POST http://localhost:5000/api/comment \
  -H "Content-Type: application/json" \
  -d '{"comment": "<script>alert(\"xss\")</script>"}'
```

## 📁 Project Structure
```
ips-system/
├── backend/          # Node.js/Express backend
│   ├── database/     # SQLite database
│   ├── middleware/   # IPS middleware & rate limiting
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── server.js     # Entry point
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API services
│   └── index.html
└── docker-compose.yml
```

## 🔒 Security Features

- Pattern-based threat detection
- Real-time blocking
- Rate limiting
- IP tracking and monitoring
- Comprehensive logging
- WebSocket security

## 📝 License

MIT License - feel free to use this project!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!


Project Link: [https://github.com/YOUR-USERNAME/intrusion-prevention-system](https://github.com/YOUR-USERNAME/intrusion-prevention-system)

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by enterprise-grade security systems
