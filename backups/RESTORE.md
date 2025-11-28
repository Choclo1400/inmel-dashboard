# Database Restoration Guide

This guide explains how to restore your Supabase database from backups.

## Prerequisites

1. **Supabase CLI installed:**
   ```bash
   npm install -g supabase
   ```

2. **PostgreSQL client (psql) installed:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql-client`

3. **Database connection URL:**
   ```
   postgresql://postgres.rurggkctnsrvwodcpuvt:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

## Restoration Order (IMPORTANT!)

Restore files in this exact order to avoid errors:

1. **Roles** (first)
2. **Schema** (second)
3. **Data** (third)

## Step-by-Step Restoration

### Step 1: Prepare Environment

```bash
# Set your database URL as an environment variable
export DB_URL="postgresql://postgres.rurggkctnsrvwodcpuvt:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Navigate to the backup directory
cd backups/YYYY-MM-DD
```

### Step 2: Verify Backup Files

```bash
# List backup files
ls -lh

# Should show:
# - roles.sql
# - schema.sql
# - data.sql
# - backup-info.json
# - README.md
```

### Step 3: Restore Roles

```bash
psql "$DB_URL" -f roles.sql
```

**Expected output:**
```
CREATE ROLE
ALTER ROLE
GRANT
...
```

### Step 4: Restore Schema

```bash
psql "$DB_URL" -f schema.sql
```

**Expected output:**
```
CREATE TABLE
CREATE INDEX
CREATE TRIGGER
CREATE FUNCTION
CREATE POLICY
...
```

### Step 5: Restore Data

```bash
psql "$DB_URL" -f data.sql
```

**Expected output:**
```
INSERT 0 100
INSERT 0 50
...
```

### Step 6: Verify Restoration

```bash
# Connect to database
psql "$DB_URL"

# Run verification queries
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM solicitudes;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM technicians;
SELECT COUNT(*) FROM working_hours;
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM time_off;
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM comentarios;
SELECT COUNT(*) FROM notifications;

# Exit
\q
```

## Troubleshooting

### Error: "role already exists"
This is normal if roles weren't dropped first. Continue with schema restoration.

### Error: "relation already exists"
You need to drop existing tables first:

```sql
-- BE CAREFUL! This drops all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then restart from Step 3.

### Error: "permission denied"
Ensure you're using the correct database password and have sufficient privileges.

## Partial Restoration

### Restore Only Schema (without data)
```bash
psql "$DB_URL" -f schema.sql
```

### Restore Only Data (to existing schema)
```bash
psql "$DB_URL" -f data.sql
```

### Restore Specific Tables

Extract specific INSERT statements from `data.sql`:

```bash
# Extract only profiles table data
grep -A 1000 "COPY public.profiles" data.sql > profiles_only.sql
psql "$DB_URL" -f profiles_only.sql
```

## Emergency Full Restoration

If you need to completely rebuild the database:

```bash
# 1. Drop and recreate schema
psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Restore in order
psql "$DB_URL" -f roles.sql
psql "$DB_URL" -f schema.sql
psql "$DB_URL" -f data.sql

# 3. Verify
psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

## Point-in-Time Recovery

To restore from a specific date:

```bash
cd backups/2025-11-27
# Follow steps above
```

## Backup Testing

It's recommended to test backups monthly:

1. Create a test Supabase project
2. Restore a recent backup
3. Verify data integrity
4. Document any issues

## Support

If restoration fails:
1. Check GitHub Actions logs: https://github.com/Choclo1400/inmel-dashboard/actions
2. Verify backup-info.json for metadata
3. Try a different backup date
4. Contact Supabase support if needed

## Backup Information

### Tables Included in Backups

- **profiles** - User profiles and authentication
- **solicitudes** - Service requests
- **clients** - Client information
- **technicians** - Technician/staff data
- **working_hours** - Technician availability schedules
- **bookings** - Service bookings and scheduling
- **time_off** - Technician time off periods
- **services** - Available services
- **comentarios** - Comments/notes system
- **notifications** - Notification records

### Backup Schedule

- **Automated:** Daily at 3:00 AM Chile Time (6:00 AM UTC)
- **Manual:** Can be triggered from GitHub Actions
- **Retention:** 30 days in repository, 90 days as GitHub artifacts

### Backup Components

Each backup includes three files:

1. **roles.sql** - Database roles and permissions
2. **schema.sql** - Table structures, indexes, constraints, RLS policies, triggers, functions
3. **data.sql** - All table data as INSERT statements

## Quick Reference

```bash
# Quick restore (all steps)
export DB_URL="postgresql://postgres.rurggkctnsrvwodcpuvt:[PASSWORD]@..."
cd backups/YYYY-MM-DD
psql "$DB_URL" -f roles.sql
psql "$DB_URL" -f schema.sql
psql "$DB_URL" -f data.sql
```

## Security Notes

- Keep your database connection string secure
- Never commit the connection string to version control
- Backups are stored in a private GitHub repository
- Access to backups requires repository permissions
- Rotate database passwords quarterly
