import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://szoonvaygghbrewddton.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b29udmF5Z2doYnJld2RkdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDg1NjgsImV4cCI6MjA5ODUyNDU2OH0.A9nw2QpWdoO_Rc1GI7ocgdWWUHhi7rNYalb18sphK7I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
