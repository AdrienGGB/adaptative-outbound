## Quick Fix: Apply Email to Profiles Migration

**Issue**: Members page shows UUID instead of email, and "N/A" for names
**Fix**: Add email column to profiles table
**Time**: ~2 minutes

### Apply the Migration

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Click "SQL Editor" → "New query"

2. **Run the Migration**
   - Copy contents of [supabase/migrations/20250114000002_add_email_to_profiles.sql](../../supabase/migrations/20250114000002_add_email_to_profiles.sql)
   - Paste into SQL Editor
   - Click "Run" (Cmd/Ctrl + Enter)

3. **Expected Output**
   ```
   Success: All profiles have email addresses
   ```

### What This Does

1. **Adds email column** to profiles table
2. **Updates trigger** to copy email from auth.users on signup
3. **Backfills** existing profiles with email from auth.users
4. **Verifies** all profiles now have emails

### Test on Vercel

After deployment completes (~2-3 minutes):

**Before:**
- Name: "N/A"
- Email: "ee980ec2-55dc-4ee3-9dc0-8f9dfb2a02a4"

**After:**
- Name: "Your Name" (or your email if name is empty)
- Email: "your@email.com"

### If You Don't See Changes

1. **Hard refresh** the page (Cmd/Shift+R or Ctrl+Shift+R)
2. **Clear browser cache**
3. **Check migration applied**:
   ```sql
   SELECT email FROM profiles LIMIT 1;
   ```
   Should return email addresses, not null

### Check Your Data

Run this in SQL Editor to see your profile:
```sql
SELECT id, first_name, last_name, email
FROM profiles
WHERE id = auth.uid();
```

If first_name/last_name are empty, you can update them:
```sql
UPDATE profiles
SET first_name = 'Your',
    last_name = 'Name'
WHERE id = auth.uid();
```

Then the members page will show your full name instead of email!
