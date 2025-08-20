import { supabase } from './supabaseClient.js'

document.getElementById('place-order-btn')?.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please login first.');
    return;
  }
  const { error } = await supabase.from('orders').insert([{ user_id: user.id, status: 'Placed' }]);
  if (error) {
    alert(error.message);
  } else {
    alert('Order placed!');
  }
});
