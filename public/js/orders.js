import { supabase } from './supabaseClient.js'

async function loadOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id);
  if (error) {
    alert(error.message);
  } else {
    document.getElementById('orders-list').innerText = JSON.stringify(data, null, 2);
  }
}

loadOrders();
