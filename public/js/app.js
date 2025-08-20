
let s = null;
let sessionUser = null;
const ADMINS = []; // add admin emails here

window.addEventListener('DOMContentLoaded', async () => {
  s = window.supabase;
  const { data: { session } } = await s.auth.getSession();
  sessionUser = session?.user || null;
  updateLoginLink();
  s.auth.onAuthStateChange((_event, sess) => {
    sessionUser = sess?.user || null;
    updateLoginLink();
  });
  routeInit();
});

function updateLoginLink(){
  const loginLink = document.querySelector('#loginLink');
  if (loginLink && sessionUser) loginLink.textContent = 'Dashboard';
  if (loginLink) loginLink.addEventListener('click', (e)=>{
    if (sessionUser) { e.preventDefault(); window.location.href = './profile.html'; }
  });
}

function showMsg(id, text, error=false){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('error', !!error);
  el.style.display = 'block';
  setTimeout(()=>{ el.style.display='none'; }, 3500);
}

// AUTH
async function handleSignup(){
  const name = document.getElementById('signupName').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPassword').value;
  const pass2 = document.getElementById('signupPassword2').value;
  if (pass !== pass2) return showMsg('signupMsg','Passwords do not match',true);
  const { data, error } = await s.auth.signUp({ email, password: pass, options: { data: { name, phone } } });
  if (error) return showMsg('signupMsg', error.message, true);
  const uid = data.user.id;
  await s.from('profiles').upsert({ id: uid, name, phone, email }).select();
  showMsg('signupMsg','Account created! Redirecting...');
  setTimeout(()=>location.href='./profile.html', 800);
}
async function handleLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const { error } = await s.auth.signInWithPassword({ email, password: pass });
  if (error) return showMsg('loginMsg', error.message, true);
  showMsg('loginMsg','Logged in! Redirecting...');
  setTimeout(()=>location.href='./profile.html', 600);
}
async function logout(){
  await s.auth.signOut();
  location.href = '../index.html';
}

// PRODUCTS
async function addProduct(){
  const name = document.getElementById('pName').value.trim();
  const price = Number(document.getElementById('pPrice').value);
  const cat = document.getElementById('pCat').value.trim();
  if (!name || !price) return showMsg('prodMsg','Please fill product fields', true);
  const { error } = await s.from('products').insert({ name, price, cat });
  if (error) return showMsg('prodMsg', error.message, true);
  showMsg('prodMsg','Product added');
  document.getElementById('pName').value='';
  document.getElementById('pPrice').value='';
  document.getElementById('pCat').value='';
  loadProducts();
}
async function uploadProduct(){
  const name = document.getElementById('uName').value.trim();
  const price = Number(document.getElementById('uPrice').value);
  const cat = document.getElementById('uCat').value.trim();
  if (!name || !price) return showMsg('uploadMsg','Please fill fields', true);
  const { error } = await s.from('products').insert({ name, price, cat });
  if (error) return showMsg('uploadMsg', error.message, true);
  showMsg('uploadMsg','Your product was submitted!');
  document.getElementById('uName').value='';
  document.getElementById('uPrice').value='';
  document.getElementById('uCat').value='';
  loadProducts();
}
async function loadProducts(){
  const table = document.querySelector('#productsTable tbody');
  if (!table) return;
  table.innerHTML = '';
  const { data, error } = await s.from('products').select('*').order('created_at', { ascending: false });
  if (error) { table.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`; return; }
  data.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>₹${p.price}</td>
      <td><button class="btn" onclick="addToCart('${p.id}','${p.name}',${p.price})">Add</button></td>`;
    table.appendChild(tr);
  });
}

// CART
function currentCartKey(){ const uid = sessionUser?.id || 'guest'; return 'cart_'+uid; }
function getCart(){ try{ return JSON.parse(localStorage.getItem(currentCartKey())) || []; }catch{ return []; } }
function setCart(items){ localStorage.setItem(currentCartKey(), JSON.stringify(items)); }
function addToCart(id, name, price){
  const cart = getCart();
  const idx = cart.findIndex(i=>i.id===id);
  if (idx>-1) cart[idx].qty += 1; else cart.push({ id, name, price, qty:1 });
  setCart(cart);
  alert('Added to cart');
}
function removeFromCart(index){
  const cart = getCart();
  cart.splice(index,1);
  setCart(cart);
  loadCart();
}
function loadCart(){
  const tbody = document.querySelector('#cartTable tbody');
  const totalEl = document.getElementById('cartTotal');
  if (!tbody) return;
  tbody.innerHTML = '';
  const items = getCart();
  let total = 0;
  items.forEach((it, i)=>{
    total += it.price * it.qty;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.name}</td><td>${it.qty}</td><td>₹${it.price*it.qty}</td>
      <td><button class="btn secondary" onclick="removeFromCart(${i})">Remove</button></td>`;
    tbody.appendChild(tr);
  });
  if (totalEl) totalEl.textContent = `Total: ₹${total}`;
}

// ORDERS
async function placeOrder(){
  if (!sessionUser) return showMsg('cartMsg','Please log in first', true);
  const items = getCart();
  if (!items.length) return showMsg('cartMsg','Cart is empty', true);
  const total = items.reduce((s,i)=>s + i.price*i.qty, 0);
  const { error } = await s.from('orders').insert({ uid: sessionUser.id, items, total, status: 'pending' });
  if (error) return showMsg('cartMsg', error.message, true);
  setCart([]);
  showMsg('cartMsg','Order placed!');
  loadCart();
}
async function loadOrders(){
  if (!sessionUser) return;
  const tbody = document.querySelector('#myOrdersTable tbody');
  if (!tbody) return;
  tbody.innerHTML='';
  const { data, error } = await s.from('orders').select('*').eq('uid', sessionUser.id).order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`; return; }
  data.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${o.id}</td><td>₹${o.total}</td><td>${o.status}</td>`;
    tbody.appendChild(tr);
  });
}
async function loadIncomingOrders(){
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;
  tbody.innerHTML='';
  const isAdmin = sessionUser && ADMINS.includes(sessionUser.email);
  if (!isAdmin){ tbody.innerHTML = `<tr><td colspan="4">Admin access only. Whitelist your email in app.js and set RLS policy.</td></tr>`; return; }
  const { data, error } = await s.from('orders').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`; return; }
  data.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${o.id}</td><td>₹${o.total}</td><td>${o.status}</td>
      <td><button class="btn" onclick="markOrderComplete(${o.id})">Mark complete</button></td>`;
    tbody.appendChild(tr);
  });
}
async function markOrderComplete(id){
  const { error } = await s.from('orders').update({ status: 'completed' }).eq('id', id);
  if (!error) loadIncomingOrders();
}

// PROFILE
async function saveProfile(){
  if (!sessionUser) return showMsg('profMsg','Not signed in', true);
  const name = document.getElementById('profName').value.trim();
  const phone = document.getElementById('profPhone').value.trim();
  const address = document.getElementById('profAddr').value.trim();
  const { error } = await s.from('profiles').upsert({ id: sessionUser.id, name, phone, address, email: sessionUser.email });
  if (error) return showMsg('profMsg', error.message, true);
  showMsg('profMsg','Saved');
}

// ROUTING
async function routeInit(){
  const path = location.pathname;
  if (path.endsWith('/user.html')) { loadProducts(); }
  if (path.endsWith('/admin.html')) { loadProducts(); loadIncomingOrders(); }
  if (path.endsWith('/cart.html')) { loadCart(); }
  if (path.endsWith('/orders.html')) {
    if (sessionUser) loadOrders(); else { setTimeout(loadOrders, 600); }
  }
  if (path.endsWith('/profile.html')) {
    const em = document.getElementById('sessionEmail');
    if (em && sessionUser) em.textContent = 'Signed in as — ' + sessionUser.email;
  }
}

// Shortcuts
document.addEventListener('keydown', (e)=>{
  if (e.key === '/') { e.preventDefault(); window.location.href = '../pages/user.html'; }
  if (e.key.toLowerCase() === 'g') {
    const handler = (k)=>{
      if (k.key.toLowerCase()==='h'){ window.location.href='../index.html'; document.removeEventListener('keydown', handler); }
    };
    document.addEventListener('keydown', handler, { once:true });
  }
});
