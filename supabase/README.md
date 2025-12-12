# Supabase Database Setup

This directory contains the database schema and migrations for Glitch Markets.

## Running the Initial Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/ifohcggkhqrpodulwthh
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `migrations/001_initial_schema.sql`
5. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ifohcggkhqrpodulwthh

# Run the migration
supabase db push

# Generate TypeScript types (after any schema changes)
supabase gen types typescript --project-id ifohcggkhqrpodulwthh > ../src/lib/supabase/database.types.ts
```

## Database Schema

### Tables

#### `users`

Stores user accounts from Dynamic authentication.

| Column                        | Type      | Description                          |
| ----------------------------- | --------- | ------------------------------------ |
| `id`                          | TEXT      | Dynamic user ID (primary key)        |
| `email`                       | TEXT      | User email address                   |
| `server_wallet_address`       | TEXT      | Server-controlled MPC wallet address |
| `server_wallet_id`            | TEXT      | Dynamic wallet ID                    |
| `encrypted_server_key_shares` | TEXT      | Encrypted key shares (JSON)          |
| `server_wallet_public_key`    | TEXT      | Public key hex                       |
| `created_at`                  | TIMESTAMP | Account creation timestamp           |
| `last_login_at`               | TIMESTAMP | Last login timestamp                 |

#### `polymarket_credentials`

Stores encrypted Polymarket CLOB API credentials for automated trading.

| Column                 | Type      | Description                               |
| ---------------------- | --------- | ----------------------------------------- |
| `id`                   | UUID      | Primary key (auto-generated)              |
| `user_id`              | TEXT      | Foreign key to users.id (unique)          |
| `wallet_address`       | TEXT      | Server wallet address                     |
| `proxy_wallet_address` | TEXT      | Polymarket proxy wallet (CREATE2 derived) |
| `encrypted_api_key`    | TEXT      | AES encrypted API key                     |
| `encrypted_secret`     | TEXT      | AES encrypted secret                      |
| `encrypted_passphrase` | TEXT      | AES encrypted passphrase                  |
| `created_at`           | TIMESTAMP | Creation timestamp                        |
| `last_used_at`         | TIMESTAMP | Last API usage timestamp                  |

## Updating Types After Schema Changes

Whenever you modify the database schema in Supabase:

1. Make your changes in the Supabase dashboard
2. Regenerate the TypeScript types:

```bash
npx supabase gen types typescript --project-id ifohcggkhqrpodulwthh > src/lib/supabase/database.types.ts
```

3. Commit the updated types to version control

## Row Level Security (RLS)

**Important:** After running the initial migration, you should set up Row Level Security policies to protect your data.

### Setting Up RLS

Run the RLS migration in your Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/ifohcggkhqrpodulwthh/sql/new
2. Copy the contents of `migrations/002_rls_policies.sql`
3. Paste and click "Run"

This will:

- Enable RLS on both tables
- Create policies so users can only access their own data
- Allow service role (server-side) to bypass RLS for admin operations

### What the RLS Policies Do

**Users Table:**

- ✅ Users can view their own profile
- ✅ Users can create their own profile during registration
- ✅ Users can update their own profile
- ❌ Users cannot view or modify other users' data
- ✅ Server-side code (using service_role key) can access all data

**Polymarket Credentials Table:**

- ✅ Users can view/insert/update/delete their own credentials
- ❌ Users cannot access other users' credentials
- ✅ Server-side code can access all credentials

### Verifying RLS is Working

Run this query to check that RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'polymarket_credentials');
```

Both tables should show `rowsecurity = true`.

### Testing RLS Policies

You can test the policies in the SQL Editor:

```sql
-- This should only return your own user row (when authenticated)
SELECT * FROM users;

-- This should only return your own credentials (when authenticated)
SELECT * FROM polymarket_credentials;
```

### Important Notes

- **Service Role Key**: Your server-side code using the service role key (not the anon key) automatically bypasses RLS. This is by design so your backend can perform admin operations.
- **Anon Key**: Client-side code using the anon key respects RLS policies.
- **User Deletion**: Currently users cannot delete their own profile. Uncomment the delete policy in the migration if you want to allow this.

## Verification

After running the migration, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check table structure
\d users
\d polymarket_credentials
```

Or use the Supabase dashboard's "Table Editor" to browse the tables visually.
