import { supabase } from './supabaseClient.js'

document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('product-name').value;
  const description = document.getElementById('product-description').value;
  const price = document.getElementById('product-price').value;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please login first.');
    return;
  }
  const { error } = await supabase.from('products').insert([{ name, description, price, user_id: user.id }]);
  if (error) {
    alert(error.message);
  } else {
    alert('Product uploaded!');
  }
});
