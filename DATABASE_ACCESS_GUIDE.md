# Database Access Guide

## Your Supabase Database Connection Details

**Project ID**: `iivykijeibyhzhzciifw`  
**Project URL**: `https://iivykijeibyhzhzciifw.supabase.co`

---

## Method 1: Supabase Web Dashboard (Recommended)

### Access URL
```
https://supabase.com/dashboard/project/iivykijeibyhzhzciifw
```

### What You Can Do:
- ✅ View and edit tables directly (Table Editor)
- ✅ Run SQL queries (SQL Editor)
- ✅ View database schema and relationships
- ✅ Manage users and authentication
- ✅ Monitor logs and performance
- ✅ Set up database backups

### Steps:
1. Go to https://supabase.com
2. Log in with your Supabase account
3. Navigate to your project: `iivykijeibyhzhzciifw`
4. Use the left sidebar to access different features

---

## Method 2: Direct PostgreSQL Connection

### Get Connection String:
1. Go to Supabase Dashboard → Settings → Database
2. Find "Connection string" section
3. Copy the connection string (it looks like this):

```
postgresql://postgres:[YOUR-PASSWORD]@db.iivykijeibyhzhzciifw.supabase.co:5432/postgres
```

### Using psql (Command Line):
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.iivykijeibyhzhzciifw.supabase.co:5432/postgres"
```

### Using pgAdmin or DBeaver:
- **Host**: `db.iivykijeibyhzhzciifw.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: [Get from Supabase Dashboard → Settings → Database]

---

## Method 3: From Your React Application (Already Working)

Your app uses the Supabase JavaScript client:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Example queries:

// 1. Fetch all complaints
const { data: complaints } = await supabase
  .from('complaints')
  .select('*');

// 2. Fetch complaints with department info
const { data } = await supabase
  .from('complaints')
  .select(`
    *,
    departments (name, description)
  `);

// 3. Insert a new complaint
const { error } = await supabase
  .from('complaints')
  .insert({
    citizen_id: user.id,
    description: "Issue description",
    severity: "medium",
    department_id: "dept-uuid"
  });

// 4. Update complaint status
const { error } = await supabase
  .from('complaints')
  .update({ status: 'resolved' })
  .eq('id', complaintId);

// 5. Real-time subscriptions
const channel = supabase
  .channel('complaints-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'complaints' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```

---

## Method 4: Supabase CLI

### Install Supabase CLI:
```bash
npm install -g supabase
```

### Link to your project:
```bash
cd /Users/tanishqnabar/Downloads/Milberg_CAP/flexi-portal-hub
supabase link --project-ref iivykijeibyhzhzciifw
```

### Useful CLI commands:
```bash
# Pull remote schema
supabase db pull

# Generate TypeScript types
supabase gen types typescript --project-id iivykijeibyhzhzciifw > src/integrations/supabase/types.ts

# Run migrations
supabase db push

# Reset database (careful!)
supabase db reset
```

---

## Method 5: API Access (REST/GraphQL)

### REST API:
```bash
# Example: Get all departments
curl 'https://iivykijeibyhzhzciifw.supabase.co/rest/v1/departments?select=*' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Your anon key is in `.env`:
```
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Quick Reference: Your Database Tables

| Table | Purpose |
|-------|---------|
| `departments` | Municipal departments (roads, water, waste, etc.) |
| `user_roles` | User role assignments (citizen, admin, superadmin) |
| `profiles` | User profile information |
| `complaints` | Main grievance/complaint records |
| `status_history` | Audit trail for complaint status changes |

---

## Security Notes

⚠️ **Important**:
- Never commit your database password to Git
- The `.env` file contains your publishable (anon) key - safe for client-side
- Service role key (if you have one) should NEVER be exposed to the client
- Row Level Security (RLS) is enabled on all tables for protection

---

## Troubleshooting

### Can't connect?
1. Check if your IP is allowed (Supabase Dashboard → Settings → Database → Connection Pooling)
2. Verify your password is correct
3. Ensure you're using the correct connection string

### Need to reset password?
Go to: Supabase Dashboard → Settings → Database → Reset Database Password

### Want to see logs?
Go to: Supabase Dashboard → Logs → Select log type (API, Database, Auth, etc.)

---

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript
- **SQL Editor Guide**: https://supabase.com/docs/guides/database/overview
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
