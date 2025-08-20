import { supabase } from './supabaseClient.js'

async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    document.getElementById('profile-info').innerText = `Logged in as: ${user.email}`;
  } else {
    window.location.href = 'login.html';
  }
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

loadProfile();
