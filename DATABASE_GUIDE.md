# Database Setup and Management Guide

## 🗄️ Database Connection Overview

The MSK Care app uses **PostgreSQL** with **Prisma ORM** for database management.

### Connection Details
- **ORM**: Prisma Client
- **Database**: PostgreSQL
- **Connection File**: `src/lib/db.ts`
- **Schema**: `prisma/schema.prisma`

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install tsx --save-dev
```

### 2. Set Environment Variables
Create `.env.local` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/msk_care_db"
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Push Schema to Database
```bash
npm run db:push
```

### 5. Seed Sample Data
```bash
npm run db:setup
```

## 🔍 How to Access Database

### Option 1: Prisma Studio (Visual Interface)
```bash
npm run db:studio
```
- Opens at: http://localhost:5555
- Browse and edit all tables visually
- Real-time data viewing and editing

### Option 2: Direct Database Connection
```bash
# Connect to PostgreSQL
psql postgresql://username:password@localhost:5432/msk_care_db

# List all tables
\dt

# View table structure
\d centers
\d patients
\d exercises

# Query data
SELECT * FROM centers;
SELECT * FROM patients;
SELECT * FROM exercises;
```

### Option 3: Database Management Tools
- **pgAdmin**: GUI for PostgreSQL
- **DBeaver**: Universal database tool
- **TablePlus**: Modern database client

## 📊 Database Tables

### Core Tables
1. **centers** - Rehabilitation centers
2. **physios** - Physiotherapists
3. **patients** - Patient profiles
4. **exercises** - Exercise library
5. **prescriptions** - Exercise prescriptions
6. **appointments** - Scheduled appointments
7. **progress_reports** - Patient progress tracking
8. **users** - Authentication users

### Sample Queries

```sql
-- View all centers
SELECT * FROM centers;

-- View patients with their physio
SELECT 
  p.first_name, 
  p.last_name, 
  ph.first_name as physio_first_name,
  ph.last_name as physio_last_name
FROM patients p
JOIN physios ph ON p.physio_id = ph.id;

-- View exercises by category
SELECT name, category, difficulty, duration 
FROM exercises 
ORDER BY category, difficulty;

-- View recent progress reports
SELECT 
  pr.pain_score,
  pr.mobility_score,
  pr.adherence_percentage,
  p.first_name,
  p.last_name
FROM progress_reports pr
JOIN patients p ON pr.patient_id = p.id
ORDER BY pr.reported_at DESC
LIMIT 10;
```

## 🛠️ Database Management Commands

### Prisma Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npx prisma migrate dev --name add_new_field

# Reset database
npx prisma migrate reset

# View database in browser
npm run db:studio
```

### Setup Commands
```bash
# Initial setup
npm run db:generate
npm run db:push
npm run db:setup

# Reset and reseed
npx prisma migrate reset
npm run db:setup
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   brew services list | grep postgresql
   
   # Start PostgreSQL
   brew services start postgresql
   ```

2. **Schema Out of Sync**
   ```bash
   # Reset database
   npx prisma migrate reset
   
   # Push schema
   npm run db:push
   ```

3. **Permission Denied**
   ```bash
   # Create database user
   createuser -s username
   
   # Create database
   createdb msk_care_db
   ```

### Environment Variables
Make sure your `.env.local` has:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/msk_care_db"
```

## 📈 Monitoring and Logging

### Query Logging
Database queries are logged in development:
- Check terminal output for SQL queries
- Query duration and parameters are displayed

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public';
```

## 🚀 Production Database Setup

### AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Update `DATABASE_URL` in environment
4. Run migrations: `npx prisma migrate deploy`

### Connection Pooling
For production, use connection pooling:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=30"
```

## 📝 Sample Data

After running `npm run db:setup`, you'll have:

- **1 Center**: MSK Rehabilitation Center
- **1 Physio**: Dr. Sarah Johnson
- **1 Patient**: John Doe
- **1 Exercise**: Knee Extension
- **1 Prescription**: Initial rehab program
- **1 Appointment**: Follow-up consultation
- **1 Progress Report**: Recent progress data

## 🔐 Security Best Practices

1. **Use Environment Variables**: Never hardcode database credentials
2. **Connection Pooling**: Limit concurrent connections
3. **Regular Backups**: Set up automated database backups
4. **Access Control**: Use least privilege principle
5. **SSL Connection**: Enable SSL for production databases

## 📞 Support

For database issues:
1. Check Prisma documentation: https://www.prisma.io/docs
2. Review PostgreSQL logs
3. Test connection with `psql` command
4. Verify environment variables

