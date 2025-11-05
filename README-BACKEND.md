# SIP-KPBJ Backend Setup

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for local database)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name postgres-sipkp -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=sipkpdb -e POSTGRES_USER=sipkpuser -p 5432:5432 -d postgres:15

# Check if container is running
docker ps
```

#### Option B: Local PostgreSQL Installation

Install PostgreSQL and create database:

```sql
CREATE DATABASE sipkpdb;
CREATE USER sipkpuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE sipkpdb TO sipkpuser;
```

#### Option C: Manual Setup with Existing PostgreSQL Installation

If PostgreSQL is already installed but not accessible via command line:

```bash
# Navigate to PostgreSQL bin directory (adjust path based on your PostgreSQL version)
cd "C:\Program Files\PostgreSQL\15\bin"  # For PostgreSQL 15 on Windows

# Create database (run as postgres user)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE spkmb;"

# Create user with password
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE USER spkmb_admin WITH PASSWORD 'admin123';"

# Grant privileges
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE spkmb TO spkmb_admin;"

# Change database owner
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -h localhost -p 5432 -c "ALTER DATABASE spkmb OWNER TO spkmb_admin;"

# Verify connection
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U spkmb_admin -d spkmb -h localhost -p 5432 -c "SELECT version();"

# List tables after migration
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U spkmb_admin -d spkmb -h localhost -p 5432 -c "\dt"
```

### 3. Environment Configuration

Copy `.env` file and update database URL:

```env
DATABASE_URL="postgresql://sipkpuser:mypassword@localhost:5432/sipkpdb?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
PORT=3001
```

### 4. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Start Development Server

```bash
# Start backend server
npm run dev:server

# Server will run on http://localhost:3001
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Paket (Packages)
- `GET /api/paket` - Get all packages
- `POST /api/paket` - Create new package

### Itwasda Reports
- `GET /api/itwasda` - Get all Itwasda reports
- `POST /api/itwasda` - Create new Itwasda report

### Vendors
- `GET /api/vendor` - Get all vendors
- `POST /api/vendor` - Create new vendor

### PPK (Competence)
- `GET /api/ppk` - Get all PPK data

### Monitoring
- `GET /api/monitoring` - Get all monitoring data

## Production Deployment

### Hostinger VPS Setup

1. **SSH to your VPS**
```bash
ssh username@your-vps-ip
```

2. **Install Node.js and PostgreSQL**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
```

3. **Setup PostgreSQL Database**
```bash
sudo -u postgres psql
CREATE DATABASE sipkpdb;
CREATE USER sipkpuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sipkpdb TO sipkpuser;
\q
```

4. **Clone and Setup Application**
```bash
git clone https://github.com/yourusername/sipkp.git
cd sipkp
npm install
```

5. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

6. **Build and Run**
```bash
# Build application
npm run build

# Start production server
npm run start
```

7. **Setup PM2 for Process Management**
```bash
npm install -g pm2
pm2 start dist/server.js --name sipkp-api
pm2 startup
pm2 save
```

## Database Schema

The application uses the following main entities:

- **Users**: User management with roles
- **Paket**: Procurement packages
- **Dokumen**: Documents and archives
- **LaporanItwasda**: Itwasda audit reports
- **Vendor**: Vendors and suppliers
- **PPK**: PPK competence data
- **Monitoring**: Monitoring and evaluation
- **AuditLog**: System audit logs

## Security Features

- Helmet.js for security headers
- CORS configuration
- Input validation
- JWT authentication (to be implemented)
- Rate limiting (to be implemented)

## Monitoring

- Morgan for HTTP request logging
- Prisma query logging
- Error handling middleware

## Development Scripts

```bash
# Development
npm run dev:server    # Start backend server with nodemon
npm run build         # Build for production
npm run start         # Start production server

# Database
npx prisma studio     # Open Prisma Studio
npx prisma db push    # Push schema changes
npx prisma generate   # Generate Prisma client
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Port Already in Use**
   - Change PORT in .env
   - Kill process using the port: `lsof -ti:3001 | xargs kill`

3. **Prisma Client Error**
   - Run `npx prisma generate`
   - Check schema.prisma for errors

### Logs

Check application logs:
```bash
pm2 logs sipkp-api
```

Or for development:
```bash
npm run dev:server
