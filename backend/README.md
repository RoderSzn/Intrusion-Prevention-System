# IPS Backend

## Setup
```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## API Endpoints

### Public API
- GET `/api/users` - List users
- POST `/api/login` - User login
- GET `/api/search` - Search
- POST `/api/comment` - Post comment
- GET `/api/file` - Access file
- POST `/api/exec` - Execute command

### Admin API
- GET `/admin/threats` - Get threats
- GET `/admin/statistics` - Get statistics
- GET `/admin/rules` - Get rules
- PATCH `/admin/rules/:id/toggle` - Toggle rule
- DELETE `/admin/threats` - Clear threats
- GET `/admin/dashboard` - Dashboard data

## Environment Variables

See `.env.example` for all available options.