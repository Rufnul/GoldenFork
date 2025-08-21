function toggleMenu() {
  const nav = document.getElementById('nav');
  nav.classList.toggle('active');
}

(function () {
  const LS_KEYS = {
    USER: 'GF_USER', // currently logged-in user
    USERS: 'GF_USERS', // registered users by email
    RESERVATIONS: 'GF_RESERVATIONS',
    CONTACTS: 'GF_CONTACTS',
    SUBSCRIBERS: 'GF_SUBSCRIBERS'
  };

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const storage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    },
    remove(key) { localStorage.removeItem(key); }
  };

  const auth = {
    current() {
      return storage.get(LS_KEYS.USER, null);
    },
    isLoggedIn() { return !!this.current(); },
    users() { return storage.get(LS_KEYS.USERS, {}); },
    saveUsers(map) { storage.set(LS_KEYS.USERS, map); },

    signup({ name, email, password }) {
      email = email.trim().toLowerCase();
      const users = this.users();
      if (users[email]) throw new Error('Email already registered. Please log in.');
      users[email] = { name, email, password }; // NOTE: demo only; plaintext
      this.saveUsers(users);
      storage.set(LS_KEYS.USER, { name, email });
      return { name, email };
    },

    login({ email, password }) {
      email = email.trim().toLowerCase();
      const users = this.users();
      const u = users[email];
      if (!u) throw new Error('No account found for this email. Please sign up.');
      if (u.password !== password) throw new Error('Invalid password.');
      storage.set(LS_KEYS.USER, { name: u.name, email: u.email });
      return { name: u.name, email: u.email };
    },

    logout() { storage.remove(LS_KEYS.USER); }
  };

  const utils = {
    todayStr() {
      const dt = new Date();
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    },
    flash(el, msg, type = 'info', ms = 3000) {
      if (!el) return;
      el.textContent = msg;
      el.className = `flash ${type}`;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, ms);
    },
    redirect(url) { window.location.href = url; },
    getQueryParam(name) { return new URLSearchParams(window.location.search).get(name); }
  };

  function initNav() {
    const nav = q('#nav');
    if (!nav) return;
    // Mark active link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    qa('a', nav).forEach(a => {
      const href = a.getAttribute('href');
    });

    // Add Login/Logout link dynamically (last item)
    let authLink = q('#nav .auth-link');
    if (!authLink) {
      authLink = document.createElement('a');
      authLink.className = 'auth-link';
      nav.appendChild(authLink);
    }
    const user = auth.current();
    if (user) {
      authLink.textContent = `Logout (${user.name.split(' ')[0]})`;
      authLink.href = '#logout';
      authLink.addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
        // After logout, if on reservation page, send to login
        const isReservation = /reservation\.html$/i.test(window.location.pathname);
        utils.redirect(isReservation ? 'login.html' : window.location.href);
      }, { once: true });
    } else {
      authLink.textContent = 'Login';
      authLink.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    }
  }

  function initFooterSubscribe() {
    const container = q('#foot-upper');
    if (!container) return;
    const input = q('input[type="text"]', container);
    const btn = q('button', container);
    if (!input || !btn) return;

    btn.addEventListener('click', () => {
      const email = input.value.trim();
      if (!utils.isValidEmail(email)) { alert('Please enter a valid email.'); return; }
      const subs = storage.get(LS_KEYS.SUBSCRIBERS, []);
      if (subs.includes(email)) { alert('You are already subscribed!'); return; }
      subs.push(email);
      storage.set(LS_KEYS.SUBSCRIBERS, subs);
      alert('Subscribed! You will receive updates soon.');
      input.value = '';
    });
  }

  function initContactForm() {
    const form = q('#contact-page .contact-form form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = q('#contact-page #name')?.value?.trim() || q('#contact-page input[name="name"]')?.value?.trim();
      const email = q('#contact-page #email')?.value?.trim() || q('#contact-page input[type="email"]')?.value?.trim();
      const message = q('#contact-page #message')?.value?.trim();
      if (!name || !utils.isValidEmail(email) || !message) {
        alert('Please fill out name, a valid email, and message.');
        return;
      }
      const contacts = storage.get(LS_KEYS.CONTACTS, []);
      contacts.push({ name, email, message, ts: new Date().toISOString() });
      storage.set(LS_KEYS.CONTACTS, contacts);
      alert('Message sent! We will get back to you soon.');
      form.reset();
    });
  }

  function initReservationForm() {
    const section = q('#reservation');
    if (!section) return;
    const form = q('#reservation form');
    if (!form) return;

    const dateInput = q('#date', form);
    if (dateInput) dateInput.min = utils.todayStr();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!auth.isLoggedIn()) {
        const back = encodeURIComponent('reservation.html');
        alert('Please login to make a reservation. Redirecting to login...');
        utils.redirect(`login.html?redirect=${back}`);
        return;
      }

      const name = q('#name', form)?.value.trim();
      const email = q('#email', form)?.value.trim();
      const phone = q('#phone', form)?.value.trim();
      const date = q('#date', form)?.value;
      const time = q('#time', form)?.value;
      const guests = parseInt(q('#guests', form)?.value, 10);

      if (!name || !utils.isValidEmail(email) || !/^\d{10}$/.test(phone || '')) {
        alert('Please enter a valid name, 10-digit phone number, and email.');
        return;
      }
      if (!date || !time || !(guests >= 1 && guests <= 12)) {
        alert('Please select date, time, and guests between 1 and 12.');
        return;
      }

      const res = storage.get(LS_KEYS.RESERVATIONS, []);
      res.push({ name, email, phone, date, time, guests, by: auth.current(), ts: new Date().toISOString() });
      storage.set(LS_KEYS.RESERVATIONS, res);

      alert('Reservation received! We\'ll confirm shortly by email.');
      form.reset();
    });
  }

  function initGalleryLightbox() {
    const grid = q('.gallery-grid');
    if (!grid) return;

    // Simple lightbox
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:none;align-items:center;justify-content:center;z-index:9999;';
    const img = document.createElement('img');
    img.style.cssText = 'max-width:90%;max-height:90%;border-radius:12px;';
    overlay.appendChild(img);
    overlay.addEventListener('click', () => overlay.style.display = 'none');
    document.body.appendChild(overlay);

    qa('img', grid).forEach(i => {
      i.style.cursor = 'zoom-in';
      i.addEventListener('click', () => {
        img.src = i.src;
        overlay.style.display = 'flex';
      });
    });
  }

  function initLoginPage() {
    const form = q('#auth-form');
    if (!form) return; // not on login page

    const nameWrap = q('.auth-name-wrap');
    const title = q('.auth-title');
    const toggle = q('#toggle-auth-mode');
    let mode = 'login'; // or 'signup'

    function render() {
      if (title) title.textContent = mode === 'login' ? 'Login' : 'Create Account';
      if (nameWrap) nameWrap.style.display = mode === 'signup' ? 'block' : 'none';
      const submit = q('button[type="submit"]', form);
      if (submit) submit.textContent = mode === 'login' ? 'Login' : 'Sign Up';
      if (toggle) toggle.textContent = mode === 'login' ? 'New here? Sign up' : 'Have an account? Login';
    }

    render();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = q('#auth-name')?.value?.trim();
      const email = q('#auth-email')?.value?.trim();
      const password = q('#auth-password')?.value || '';

      if (!utils.isValidEmail(email)) { alert('Enter a valid email.'); return; }
      if (!password || password.length < 6) { alert('Password must be at least 6 characters.'); return; }

      try {
        if (mode === 'signup') {
          if (!name || name.length < 2) { alert('Enter your full name.'); return; }
          auth.signup({ name, email, password });
        } else {
          auth.login({ email, password });
        }
      } catch (err) {
        alert(err.message || 'Something went wrong.');
        return;
      }

      // Redirect back if provided
      const redirect = utils.getQueryParam('redirect') || 'index.html';
      utils.redirect(redirect);
    });

    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        mode = mode === 'login' ? 'signup' : 'login';
        render();
      });
    }
  }

  function bootstrap() {
    initNav();
    initFooterSubscribe();
    initContactForm();
    initReservationForm();
    initGalleryLightbox();
    initLoginPage();

    // Expose for debugging
    window.GF = { auth, storage, utils };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();




 // Cart functionality
    // ✅ Add item to cart and save in localStorage
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
      alert(`${name} added to your cart!`);
    }

    // ✅ Load and display cart
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

    // ✅ Quantity +/-
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

    // ✅ Remove item
    function removeItem(index) {
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      loadCart();
    }

    // ✅ Checkout
    function checkoutCart() {
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      alert("Thank you for your order! 🎉");
      localStorage.removeItem("cart");
      loadCart();
    }

    // Toggle mobile menu
    function toggleMenu() {
      const nav = document.getElementById('nav');
      nav.classList.toggle('show');
    }

    // Subscribe function
    function subscribe() {
      const email = document.getElementById('emailInput').value;
      if (email && email.includes('@')) {
        alert('Thank you for subscribing!');
        document.getElementById('emailInput').value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    }

    // Load cart on page ready
    if (document.getElementById("cart-items")) {
      window.onload = loadCart;
    }