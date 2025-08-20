
// Supabase client setup
const SUPABASE_URL = "https://yzdbovsxujnuwowdfrev.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZGJvdnN4dWpudXdvd2RmcmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzY3MjUsImV4cCI6MjA3MTI1MjcyNX0.DezwiPoz0_te3rKJt4vI1J37m6dFcjar5FOfFAOdm1U";
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
