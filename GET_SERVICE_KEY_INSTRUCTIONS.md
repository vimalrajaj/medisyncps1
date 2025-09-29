🔥 URGENT: HOW TO GET SUPABASE SERVICE ROLE KEY AND LOAD ACTUAL DATA

STEP 1: GET THE REAL SERVICE ROLE KEY
=====================================
1. Open browser and go to: https://supabase.com/dashboard
2. Login with your Supabase account
3. Select your project: krgjbzjpqupgzjmpricw
4. Click on "Settings" in the left sidebar
5. Click on "API" 
6. Look for "Project API keys"
7. Find the key labeled "service_role" 
8. Click "Reveal" to show the full key
9. Copy the entire service_role key (it's very long, starts with eyJ...)

STEP 2: UPDATE THE .ENV FILE
============================
1. Open .env file in VS Code
2. Find this line:
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZ2piempwcXVwZ3pqbXByaWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk1NTQ0MSwiZXhwIjoyMDc0NTMxNDQxfQ.DhvzpKfP-xHOb7LIi8i8-OVvf8HdFNxqmxRH7l_qWxs

3. Replace the dummy key with your REAL service_role key from Step 1

STEP 3: RUN THE DATA LOADING SCRIPT
===================================
After updating .env file, run:
   node scripts\loadActualData.mjs

ALTERNATIVE IF YOU DON'T HAVE SUPABASE DASHBOARD ACCESS:
========================================================
We can use SQL migration approach:
1. Create tables via SQL migration
2. Load data via raw SQL inserts
3. Apply via supabase CLI

THE REASON DATA ISN'T LOADING:
==============================
- We only have anon key (read-only)
- Need service_role key (admin/write access)
- Without it, we get 401 unauthorized errors
- This is normal security - anon users can't write data

ONCE YOU GET THE SERVICE ROLE KEY:
==================================
✅ Tables will be created automatically
✅ All 20 NAMASTE codes will be loaded
✅ All 56 ICD-11 TM2 codes will be loaded  
✅ Intelligent mappings will be created
✅ Real-time mapping will work with DATABASE data (not just local files)

I'M READY TO HELP AS SOON AS YOU GET THE KEY!