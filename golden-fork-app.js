//navbar toggle function
function toggleMenu() {
  const nav = document.getElementById('nav');
  nav.classList.toggle('active');
}

// Cart functionality

// Add item to cart and save in localStorage
function addToCart(name, price, imagePath) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // check if product already exists
  let existing = cart.find(item => item.name === name);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: price,
      quantity: 1,
      image: imagePath // save image path
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  const messageSpan = document.getElementById("cartMessage");
  if (messageSpan) {
    messageSpan.style.color = "green";
    messageSpan.textContent = `${name} added to your cart!`;
    setTimeout(() => { messageSpan.textContent = ""; }, 3000);
  }

  loadCart();
}

// Load and display cart
function loadCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let cartItemsContainer = document.getElementById("cart-items");
  let cartTotal = 0;

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("cart-total").innerText = "0";
    return;
  }

  cart.forEach((item, index) => {
    let itemTotal = item.price * item.quantity;
    cartTotal += itemTotal;

    let cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");

   cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">₹${item.price}</span>
      <div class="quantity-controls">
        <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
      </div>
      <span class="cart-item-total">₹${itemTotal}</span>
      <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  document.getElementById("cart-total").innerText = cartTotal;
}

// Quantity +/- 
function increaseQuantity(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart[index].quantity += 1;
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

function decreaseQuantity(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

// Remove item
function removeItem(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

// Checkout / Place Order
function checkoutCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const messageSpan = document.getElementById("cartMessage");

  if (cart.length === 0) {
    messageSpan.style.color = "red";
    messageSpan.textContent = "Your cart is empty!";
    return;
  }

  messageSpan.style.color = "green";
  messageSpan.textContent = "Thank you for your order! 🎉";
  
  // Clear cart
  localStorage.removeItem("cart");
  loadCart();

  // Clear message after 5 seconds
  setTimeout(() => { messageSpan.textContent = ""; }, 5000);
}

// Toggle mobile menu
function toggleMenu() {
  const nav = document.getElementById('nav');
  nav.classList.toggle('show');
}

// Load cart on page ready
if (document.getElementById("cart-items")) {
  window.onload = loadCart;
}




//footer email validation and subscription
const emailInput = document.getElementById('emailInput');
const subscribeBtn = document.getElementById('subscribeBtn');
const emailError = document.getElementById('emailError');
const emailSuccess = document.getElementById('emailSuccess');

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

subscribeBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();

  if (!email) {
    emailError.textContent = 'Email is required.';
    emailError.style.display = 'block';
    emailSuccess.style.display = 'none';
    return;
  }

  if (!isValidEmail(email)) {
    emailError.textContent = 'Please enter a valid email.';
    emailError.style.display = 'block';
    emailSuccess.style.display = 'none';
    return;
  }

  // Success
  emailSuccess.textContent = 'Thank you for subscribing!';
  emailSuccess.style.display = 'block';
  emailError.style.display = 'none';
  emailInput.value = '';
});


//footer email validation and subscription ends

// login form validation

const LS_KEYS = { USER: 'GF_USER', USERS: 'GF_USERS' };
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); }
};
const auth = {
  users() { return storage.get(LS_KEYS.USERS, {}); },
  saveUsers(users) { storage.set(LS_KEYS.USERS, users); },
  signup({ name, email, password }) {
    email = email.trim().toLowerCase();
    const users = this.users();
    if (users[email]) throw new Error('Email already registered. Please log in.');
    users[email] = { name, email, password };
    this.saveUsers(users);
    storage.set(LS_KEYS.USER, { name, email });
  },
  login({ email, password }) {
    email = email.trim().toLowerCase();
    const users = this.users();
    const u = users[email];
    if (!u) throw new Error('No account found. Please sign up.');
    if (u.password !== password) throw new Error('Invalid password.');
    storage.set(LS_KEYS.USER, { name: u.name, email: u.email });
  }
};
function isValidEmailInput(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function initAuthForm() {
  const form = document.querySelector('#auth-form');
  if (!form) return;

  const nameWrap = document.querySelector('.auth-name-wrap');
  const nameInput = document.querySelector('#auth-name');
  const emailInput = document.querySelector('#auth-email');
  const passwordInput = document.querySelector('#auth-password');
  const toggleLink = document.querySelector('#toggle-auth-mode');
  const title = document.querySelector('.auth-title');
  const nameError = document.querySelector('#nameError');
  const emailError = document.querySelector('#emailError');
  const passwordError = document.querySelector('#passwordError');
  const formMessage = document.querySelector('#formMessage');

  let mode = 'login'; // login or signup

  function render() {
    title.textContent = mode === 'login' ? 'Login' : 'Create Account';
    nameWrap.style.display = mode === 'signup' ? 'block' : 'none';
    form.querySelector('button[type="submit"]').textContent = mode === 'login' ? 'Login' : 'Sign Up';
    toggleLink.textContent = mode === 'login' ? 'New here? Sign up' : 'Have an account? Login';
    nameError.style.display = 'none';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    formMessage.style.display = 'none';
  }

  render();

  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'login' ? 'signup' : 'login';
    render();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let hasError = false;
    if (mode === 'signup' && (!name || name.length < 2)) { nameError.textContent = 'Enter your full name.'; nameError.style.display = 'block'; hasError = true; } else nameError.style.display = 'none';
    if (!email || !isValidEmailInput(email)) { emailError.textContent = 'Enter a valid email.'; emailError.style.display = 'block'; hasError = true; } else emailError.style.display = 'none';
    if (!password || password.length < 6) { passwordError.textContent = 'Password must be at least 6 characters.'; passwordError.style.display = 'block'; hasError = true; } else passwordError.style.display = 'none';
    if (hasError) return;

    try {
      if (mode === 'signup') auth.signup({ name, email, password });
      else auth.login({ email, password });

      formMessage.textContent = mode === 'signup' ? 'Account created successfully!' : 'Login successful!';
      formMessage.style.color = 'green';
      formMessage.style.display = 'block';

      updateNavbarAuth(); // update navbar immediately
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (err) {
      formMessage.textContent = err.message;
      formMessage.style.color = 'red';
      formMessage.style.display = 'block';
    }
  });
}
document.addEventListener('DOMContentLoaded', initAuthForm);

// ====================== NAVBAR LOGIN/LOGOUT ======================
function updateNavbarAuth() {
  const navLogin = document.querySelector('#nav a[href="login.html"]');
  const currentUser = JSON.parse(localStorage.getItem('GF_USER'));
  if (!navLogin) return;

  navLogin.replaceWith(navLogin.cloneNode(true)); // Remove old event listeners
  const newNavLogin = document.querySelector('#nav a[href="login.html"]');

  if (currentUser) {
    newNavLogin.textContent = `Logout (${currentUser.name})`;
    newNavLogin.href = '#';
    newNavLogin.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('GF_USER');
      updateNavbarAuth();
      alert('You have been logged out.');
      window.location.reload();
    });
  } else {
    newNavLogin.textContent = 'Login';
    newNavLogin.href = 'login.html';
  }
}
document.addEventListener('DOMContentLoaded', updateNavbarAuth);

// login form validation ends


// go to top button
// Show button when user scrolls down
window.onscroll = function() { scrollFunction() };

function scrollFunction() {
  const goTopBtn = document.getElementById("goTopBtn");
  if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    goTopBtn.style.display = "block";
  } else {
    goTopBtn.style.display = "none";
  }
}

// Scroll to top smoothly
function goToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
