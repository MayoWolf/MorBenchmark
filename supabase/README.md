# Supabase setup

FRCBench uses Supabase only for the optional public leaderboard. The app and benchmark runner still work without Supabase.

## Create the leaderboard table

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste and run the SQL in `supabase/migrations/001_leaderboard.sql`.
4. Confirm `public.leaderboard_runs` appears in the Table Editor.
5. In Netlify, set `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

Do not use `VITE_` Supabase variables. The browser should call the Netlify Function, and the function should read Supabase credentials from server-side Netlify environment variables.

## Schema cache errors

If you see:

```text
Could not find the table 'public.leaderboard_runs' in the schema cache
```

the table is missing from the Supabase project configured in Netlify, or the Supabase API schema cache has not refreshed yet. Re-run the migration in the correct project, verify the table exists under the `public` schema, and retry after a short refresh.
