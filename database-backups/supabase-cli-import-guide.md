# ===============================================================
# SUPABASE CLI IMPORT GUIDE
# Alternative method using command line
# ===============================================================

# Step 1: Install Supabase CLI
npm install -g supabase

# Step 2: Login to Supabase
supabase login

# Step 3: Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Step 4: Import the database
psql -h db.YOUR_PROJECT_REF.supabase.co -p 5432 -d postgres -U postgres -f supabase-import.sql

# You'll be prompted for your database password (found in Supabase Settings > Database)
