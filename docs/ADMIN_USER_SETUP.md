# Admin User Setup Guide

This guide explains how to create your first admin user for the MySchoolWeb application.

## Problem

When you create a user directly in the Supabase Dashboard, it only creates an entry in the `auth.users` table. However, MySchoolWeb requires:

1. An entry in the `auth.users` table (Supabase Auth)
2. An entry in the custom `users` table (application data)
3. An associated school record
4. The user to be confirmed (`email_confirm: true`)
5. The correct role set to `'admin'`

Without all of these, login will fail.

## Solution: Use the Admin User Creation Script

We've created a script that handles all the requirements automatically.

### Prerequisites

You need:
1. **SUPABASE_URL**: Your Supabase project URL
2. **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (with admin privileges)

#### Getting Your Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Service role key** (under "Project API keys" - this is the `service_role` key, NOT the `anon` key)

### Usage

#### 1. Set Environment Variables

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Note**: These should be your **production** Supabase credentials, not local development ones.

#### 2. Run the Script

```bash
cd myschoolweb
node scripts/create-admin-user.js <email> <password> <school_name>
```

**Example**:
```bash
node scripts/create-admin-user.js admin@myschool.com SecurePass123! "My School Name"
```

**Parameters**:
- `<email>`: Admin user's email address (must be valid format)
- `<password>`: Secure password (minimum 8 characters)
- `<school_name>`: Name of the school (will be created if doesn't exist)

### What the Script Does

1. ✅ Creates or finds the school by name
2. ✅ Creates user in Supabase Auth (`auth.users`)
3. ✅ Sets `email_confirm: true` (user can log in immediately)
4. ✅ Creates user record in `users` table
5. ✅ Sets role to `'admin'`
6. ✅ Links user to school
7. ✅ Verifies everything is set up correctly

### Example Output

```
🚀 Starting admin user creation...

📧 Email: admin@myschool.com
🏫 School: My School Name

Step 1: Creating/getting school...
✅ Created new school: My School Name (a1b2c3d4-...)

Step 2: Checking if user already exists...
   Creating new auth user...
✅ Created auth user (e5f6g7h8-...)

Step 3: Creating/updating user in users table...
   Creating new user record...
✅ Created user in users table

Step 4: Verifying user setup...
✅ User verification successful

╔════════════════════════════════════════════════════════════════════╗
║                    ADMIN USER CREATED SUCCESSFULLY ✅              ║
╚════════════════════════════════════════════════════════════════════╝

📋 User Details:
   User ID:      e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0
   Email:        admin@myschool.com
   Role:         admin
   School:       My School Name
   School ID:    a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
   Display Name: Admin User

🔑 Login Credentials:
   Email:    admin@myschool.com
   Password: SecurePass123!

🌐 You can now log in at: https://myschoolweb.myschools.app/login

✅ Setup complete!
```

## Updating an Existing User

If you run the script with an email that already exists:
- It will **update** the auth user's password
- It will **update** the users table record
- It will **preserve** the school association (unless you want to change it)

This is useful if you need to reset a password or fix a broken user account.

## Troubleshooting

### Error: "Missing environment variables"

**Solution**: Make sure you've exported `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Error: "Invalid email format"

**Solution**: Ensure the email is in valid format: `user@domain.com`

### Error: "Password must be at least 8 characters long"

**Solution**: Use a password with at least 8 characters. Recommended: include uppercase, lowercase, numbers, and special characters.

### Error: "Error creating user: violates row-level security policy"

**Solution**: This means RLS policies are preventing the operation. The service role key should bypass RLS. Make sure you're using the **service_role** key, not the **anon** key.

### Error: "Error creating school: violates row-level security policy"

**Solution**: Check that your RLS policies allow service role to insert schools, or temporarily disable RLS:

```sql
-- In Supabase SQL Editor
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
-- Run the script
-- Then re-enable:
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
```

## Manual Alternative (Not Recommended)

If you need to create a user manually without the script:

### 1. Create School (if needed)

```sql
INSERT INTO schools (name, contact_email)
VALUES ('My School', 'admin@myschool.com');
-- Note the returned UUID
```

### 2. Create Auth User

In Supabase Dashboard:
- Go to **Authentication** → **Users**
- Click **Add user**
- Enter email and password
- Check "Auto Confirm User"
- Click **Create user**
- Note the User UUID

### 3. Create User Record

```sql
INSERT INTO users (id, email, school_id, role, display_name, group_ids)
VALUES (
  'user-uuid-from-step-2',
  'admin@myschool.com',
  'school-uuid-from-step-1',
  'admin',
  'Admin User',
  ARRAY[]::uuid[]
);
```

This is error-prone and not recommended. Use the script instead!

## Security Notes

1. **Never commit credentials**: Don't add your Supabase credentials to Git
2. **Service role key is powerful**: It bypasses RLS. Keep it secure!
3. **Use strong passwords**: Minimum 8 characters, include variety
4. **Change default password**: After first login, change the password in the app

## Next Steps

After creating your admin user:

1. ✅ Log in at https://myschoolweb.myschools.app/login
2. ✅ Create groups/classes in the admin dashboard
3. ✅ Create regular users and assign them to groups
4. ✅ Start posting notices

---

**Questions?** Check the main documentation or contact the development team.
