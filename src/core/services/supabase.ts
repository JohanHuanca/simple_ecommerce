import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://osuqhitqxznddqwbvyda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXFoaXRxeHpuZGRxd2J2eWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDAxOTAsImV4cCI6MjA1NjQxNjE5MH0.pCz9MxNcy_eua0C445Iiev26oR1G9TtcSqeVkrdVFRI';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
}

export async function signOut() {
  await supabase.auth.signOut();
} 