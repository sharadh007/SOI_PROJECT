// ===== API + FIREBASE SETUP =====
const API_BASE = 'http://localhost:5000/api';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCFTIqMvtSM1WhEjhe7pb7Tkix9ggDuS_s",
  authDomain: "pm-intrenship.firebaseapp.com",
  databaseURL: "https://pm-intrenship-default-rtdb.firebaseio.com",
  projectId: "pm-intrenship",
  storageBucket: "pm-intrenship.firebasestorage.app",
  messagingSenderId: "682720260870",
  appId: "1:682720260870:web:84af139577b2bc51e46487",
  measurementId: "G-L5YJBSR69C"
};

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.database();



function hideRecs() {
  try {
    document.getElementById('recommendationsSection').style.display = 'none';
    document.getElementById('recommendationCards').innerHTML = '';
  } catch(e) {}
}



// 🔥 CRITICAL: DEFINE THESE FIRST (BEFORE Profile)
function clearAllForms() {
  document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="tel"], select').forEach(input => {
    input.value = '';
  });
  document.querySelectorAll('.recommendations-container, #recommendations, .rec-card').forEach(el => {
    if (el) {
      el.style.display = 'none';
      el.innerHTML = '';
    }
  });
  console.log('✅ Forms cleared');
}

// Global function - clears everything when called


function safeLogout() {
  // Firebase logout
  auth.signOut().then(() => {
    // BULLETPROOF CLEAR - targets your exact HTML
    const section = document.getElementById('recommendationsSection');
    const cards = document.getElementById('recommendationCards');
    const greeting = document.getElementById('greetingText');
    const message = document.getElementById('recommendationsMessage');
    
    if (section) section.style.display = 'none';
    if (cards) cards.innerHTML = '';
    if (greeting) greeting.textContent = '';
    if (message) message.textContent = '';
    
    // Clear forms too
    clearAllForms();
    
    console.log('🔥 SAFE LOGOUT COMPLETE');
  }).catch(err => console.error('Logout failed:', err));
}

// 🔥 PROFILE SYSTEM (NOW SAFE)
let currentProfile = null;
let isProfileModalOpen = false;

const $ = id => document.getElementById(id);

const Profile = {
  open() {
    if (!auth.currentUser || isProfileModalOpen) return;
    const modal = $('profileModal');
    if (modal) {
      isProfileModalOpen = true;
      modal.style.display = 'flex';
      this.displayData();
    }
  },
  close() {
    isProfileModalOpen = false;
    const modal = $('profileModal'), view = $('profileViewMode'), edit = $('profileEditMode');
    if (modal) modal.style.display = 'none';
    if (view) view.style.display = 'block';
    if (edit) edit.style.display = 'none';
  },
  show(profile) {
    currentProfile = profile;
    const container = $('profileContainer'), buttons = $('authButtons'), nameEl = $('profileName');
    if (container) container.style.display = 'block';
    if (buttons) buttons.style.display = 'none';
    if (nameEl) nameEl.textContent = profile.first_name || profile.name || 'User';
  },
  hide() {
    const container = $('profileContainer'), buttons = $('authButtons'), modal = $('profileModal');
    if (container) container.style.display = 'none';
    if (buttons) buttons.style.display = 'flex';
    if (modal) modal.style.display = 'none';
    this.close();
  },
  displayData() {
    if (!currentProfile) return;
    const fields = {viewFirstName: 'first_name', viewLastName: 'last_name', viewEmail: 'email', viewPhone: 'phone', viewSkills: 'skills'};
    Object.entries(fields).forEach(([id, key]) => {
      const el = $(id);
      if (el) el.textContent = currentProfile[key] || (key === 'skills' ? 'Not set' : '');
    });
  },
  edit() {
    const view = $('profileViewMode'), edit = $('profileEditMode');
    if (!currentProfile || !view || !edit) return;
    const fields = {editFirstName: 'first_name', editLastName: 'last_name', editEmail: 'email', editPhone: 'phone', editSkills: 'skills'};
    Object.entries(fields).forEach(([id, key]) => {
      const el = $(id);
      if (el) el.value = key === 'skills' ? currentProfile.skills?.join(', ') || '' : currentProfile[key] || '';
    });
    view.style.display = 'none';
    edit.style.display = 'block';
  },
  save() {
    if (!auth.currentUser) return;
    const data = {
      uid: auth.currentUser.uid,
      first_name: $('editFirstName')?.value.trim() || '',
      last_name: $('editLastName')?.value.trim() || '',
      email: $('editEmail')?.value.trim() || '',
      phone: $('editPhone')?.value.trim() || '',
      skills: $('editSkills')?.value.trim().split(',').map(s => s.trim()).filter(Boolean) || []
    };
    // 🔥 FIX 400 ERROR - Use POST /students/
    fetch(`${API_BASE}/students/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        currentProfile = data.data;
        Profile.displayData();
        Profile.cancelEdit();
        Profile.autoFillForm();
        alert('✅ Profile saved!');
      } else alert('❌ ' + (data.error || 'Failed'));
    }).catch(() => alert('Network error'));
  },
  cancelEdit()
 {
    const view = $('profileViewMode'), edit = $('profileEditMode');
    if (view) view.style.display = 'block';
    if (edit) edit.style.display = 'none';
  },
  autoFillForm() {
    const fields = {name: 'name', phone: 'phone', skills: 'skills'};
    Object.entries(fields).forEach(([key, id]) => {
      const el = $(id);
      if (el && currentProfile[key]) el.value = Array.isArray(currentProfile[key]) ? currentProfile[key].join(', ') : currentProfile[key];
    });
  }
};

// SINGLE CLEAN EVENT LISTENER


// SINGLE CLEAN AUTH LISTENER
auth.onAuthStateChanged(async user => {
  if (user) {
    console.log('✅ Logged in:', user.email);
    try {
      const res = await fetch(`${API_BASE}/students/${user.uid}`);
      const data = await res.json();
      Profile.show(data.success && data.data ? data.data : {
        first_name: user.email.split('@')[0], email: user.email
      });
      Profile.autoFillForm();
    } catch (e) {
      Profile.show({ first_name: user.email.split('@')[0], email: user.email });
    }
  } else {
    console.log('👋 Logged out');
    Profile.hide();
    safeLogout();
    clearAllForms();
    updateAuthUI(null);
  }
});


// ===== NEXT FUNCTIONS (getRecommendations, etc.) CONTINUE HERE =====



// ===== ALL AUTH FUNCTIONS =====
function updateAuthUI(userName) {
  const loginBtn = document.querySelector('.login-btn');
  const registerBtn = document.querySelector('.register-btn');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const greeting = document.getElementById('userGreeting');

  if (userName) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (greeting) {
      greeting.style.display = 'inline';
      greeting.textContent = 'Hi, ' + userName;
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (greeting) greeting.style.display = 'none';
  }
}

function openLoginModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  switchToLogin();
  if (document.getElementById('loginMessage')) document.getElementById('loginMessage').textContent = '';
  if (document.getElementById('registerMessage')) document.getElementById('registerMessage').textContent = '';
}

function openRegisterModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  switchToRegister();
  if (document.getElementById('loginMessage')) document.getElementById('loginMessage').textContent = '';
  if (document.getElementById('registerMessage')) document.getElementById('registerMessage').textContent = '';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
}

function switchToLogin() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) loginForm.classList.add('active');
  if (registerForm) registerForm.classList.remove('active');
  const tabs = document.querySelectorAll('.tab-btn');
  if (tabs[0]) tabs[0].classList.add('active');
  if (tabs[1]) tabs[1].classList.remove('active');
}

function switchToRegister() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) loginForm.classList.remove('active');
  if (registerForm) registerForm.classList.add('active');
  const tabs = document.querySelectorAll('.tab-btn');
  if (tabs[0]) tabs[0].classList.remove('active');
  if (tabs[1]) tabs[1].classList.add('active');
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use': return 'This email is already registered.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    default: return 'Something went wrong. Please try again.';
  }
}

function showLoginMessage(text, type = '') {
  const box = document.getElementById('loginMessage');
  if (box) {
    box.textContent = text;
    box.className = 'auth-message';
    if (type) box.classList.add(type);
  }
}

function showRegisterMessage(text, type = '') {
  const box = document.getElementById('registerMessage');
  if (box) {
    box.textContent = text;
    box.className = 'auth-message';
    if (type) box.classList.add(type);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const emailEl = document.getElementById('loginEmail');
  const passEl = document.getElementById('loginPassword');
  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const password = passEl.value;

 

  showLoginMessage('Login successful!');

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const user = result.user;
    const snap = await db.ref('users/' + user.uid).once('value');
    
    if (!snap.exists()) {
      auth.signOut();
      showLoginMessage('Account not found in PM Internship portal.', 'error');
      return;
    }
    
    updateAuthUI(snap.val().name || email);
    showLoginMessage('Logged in successfully!', 'success');
    setTimeout(closeAuthModal, 1000);

    showLoginMessage('Login successful!', 'success');
updateAuthUI(user.displayName || user.email);
clearAllForms();  // ← ADD THIS LINE
setTimeout(closeAuthModal, 1000);
  } catch (err) {
    showLoginMessage(mapFirebaseError(err.code), 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const nameEl = document.getElementById('registerName');
  const emailEl = document.getElementById('registerEmail');
  const passEl = document.getElementById('registerPassword');
  if (!nameEl || !emailEl || !passEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passEl.value;

  showRegisterMessage('');

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const user = result.user;
    
    await db.ref('users/' + user.uid).set({
      name, email, createdAt: new Date().toISOString()
    });
    
    updateAuthUI(name);
    showRegisterMessage('Account created successfully!', 'success');
    clearAllForms();
    setTimeout(closeAuthModal, 1000);
  } catch (err) {
    showRegisterMessage(mapFirebaseError(err.code), 'error');
  }
}






function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      return db.ref('users/' + user.uid).once('value');
    })
    .then((snap) => {
      if (!snap.exists()) {
        const user = auth.currentUser;
        return db.ref('users/' + user.uid).set({
          name: user.displayName || '',
          email: user.email,
          createdAt: new Date().toISOString()
        });
      }
    })
    .then(() => {
      const user = auth.currentUser;
      updateAuthUI(user.displayName || user.email);
      closeAuthModal();
    })
    .catch((error) => {
      console.error('Google login error:', error);
      
    });
}

async function saveUserProfile(name, email, skills, location) {
  const uid = auth.currentUser.uid;  // Get Firebase UID
  
  try {
    const response = await fetch(API_BASE + '/student/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,  // ← Send Firebase UID
        name,
        email,
        phone: '9876543210',  // from form
        age: 21,  // from form
        qualification: 'B.Tech CS',  // from form
        skills: ['JavaScript', 'React'],  // from form
        preferredSector: 'Technology',
        preferredState: 'Andhra Pradesh'
      })
    });
    const data = await response.json();
    console.log('Profile saved:', data);
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}


function togglePassword(inputId, el) {
  const input = document.getElementById(inputId);
  if (!input || !el) return;
  if (input.type === 'password') {
    input.type = 'text';
    el.textContent = 'Hide password';
  } else {
    input.type = 'password';
    el.textContent = 'Show password';
  }
}

// Auth state listener
auth.onAuthStateChanged((user) => {
  if (user) {
    db.ref('users/' + user.uid).once('value').then((snap) => {
      if (snap.exists()) {
        updateAuthUI(snap.val().name || user.email);
      }
    });
  } else {
    updateAuthUI(null);
  }
});

// Close modal on outside click
window.addEventListener('click', (e) => {
  if (e.target.id === 'authModal') {
    closeAuthModal();
  }
});


// ========== END AUTHENTICATION CODE ==========



function switchAuthForm(mode) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const title = document.getElementById('authTitle');

  if (mode === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    title.textContent = 'Login to your account';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    title.textContent = 'Create your account';
  }
}

function showAuthMessage(text, type = '') {
  const box = document.getElementById('authMessage');
  if (!box) return;
  box.textContent = text;
  box.className = 'auth-message';
  if (type) box.classList.add(type);
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  showRegisterMessage('');

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await firebase.database().ref('users/' + user.uid).set({
      name,
      email,
      createdAt: new Date().toISOString()
    });

    showRegisterMessage('Account created! Logging in…', 'success');
    setTimeout(() => {
      updateAuthUI(name || email);
      closeAuthModal();
    }, 800);
  } catch (err) {
    showRegisterMessage(mapFirebaseError(err.code), 'error');
  }
}


async function handleLogin(event) {
  event.preventDefault();
  const emailEl = document.getElementById('loginEmail');
  const passEl = document.getElementById('loginPassword');
  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const password = passEl.value;

  showLoginMessage('Logging in...', 'info');

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const user = result.user;
    const snap = await db.ref('users/' + user.uid).once('value');
    
    if (!snap.exists()) {
      auth.signOut();
      showLoginMessage('Account not found in PM Internship portal.', 'error');
      return;
    }
    
    // SINGLE SUCCESS BLOCK - CORRECTED
    updateAuthUI(snap.val().name || email);
    showLoginMessage('Login successful!', 'success');
    clearAllForms();  // ✅ ADDED HERE
    setTimeout(closeAuthModal, 1000);
    
  } catch (err) {
    showLoginMessage(mapFirebaseError(err.code), 'error');
  }
}


function updateAuthUI(displayNameOrEmail) {
  const greeting = document.getElementById('userGreeting');
  const logoutBtn = document.getElementById('logoutBtn');

  if (displayNameOrEmail) {
    if (greeting) {
      greeting.style.display = 'inline';
      greeting.textContent = 'Hi, ' + displayNameOrEmail;
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-flex';
    }
  } else {
    if (greeting) greeting.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}




auth.onAuthStateChanged((user) => {
  if (user) {
    updateAuthUI(user.displayName || user.email);
  } else {
    updateAuthUI(null);
  }
});
// Login
document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const idToken = await user.getIdToken();

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();

    if (json.success) {
      authToken = json.data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userId', user.uid);

      alert('✅ Login successful!');
      closeAuthModal();
      updateAuthUI(user.displayName || email);
    } else {
      alert('❌ ' + json.error);
    }

  } catch (error) {
    console.error('Login error:', error);
    alert('❌ ' + error.message);
  }
});

// Update UI after login
function updateAuthUI(userName) {
  const loginBtn = document.querySelector('.login-btn');
  const registerBtn = document.querySelector('.register-btn');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const greeting = document.getElementById('userGreeting');

  if (userName) {
    // LOGGED IN
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (greeting) {
      greeting.style.display = 'inline';
      greeting.textContent = 'Hi, ' + userName;
    }
  } else {
    // LOGGED OUT
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (greeting) greeting.style.display = 'none';
  }
}


// Check if user is already logged in on page load
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is logged in → fetch name, then show logout
    firebase.database().ref('users/' + user.uid).once('value', (snapshot) => {
      const data = snapshot.val() || {};
      const nameOrEmail = data.name || user.email;
      updateAuthUI(nameOrEmail);
    });
  } else {
    // No user logged in → show login/register
    updateAuthUI(null);
  }
});



let internships = []; // Will be loaded from backend

// Load internships from backend API
async function loadIntershipDataFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/internships`);
    const json = await res.json();

    if (json.success && json.data) {
      internships = json.data;
      filteredBrowseAll = [...internships];
      console.log('✅ Internships loaded from backend:', internships.length);

      // IMPORTANT: render browse list now
      if (typeof initializeBrowseAllPage === 'function') {
        initializeBrowseAllPage();
      } else if (typeof filterInternships === 'function') {
        filterInternships();
      }
    } else {
      console.error('❌ Failed to load internships:', json.error);
      alert('Failed to load internships. Backend may be down.');
    }
  } catch (error) {
    console.error('❌ Error loading internships:', error);
    alert('Error connecting to backend. Make sure npm start is running on port 5000.');
  }
}


// Multi-language translations
const translations = {
  en: {
    "nav-title": "Prime Minister's Internship Scheme",
    "nav-home": "Home",
    "nav-about": "About",
    "nav-find": "Find Internships",
    "nav-browse": "Browse All",
    "nav-contact": "Contact",
    "btn-login": "Login",
    "btn-register": "Register",
    "hero-title": "Prime Minister's Internship Scheme",
    "hero-subtitle": "Empowering India's Youth with Real-World Experience and Career Opportunities",
    "hero-description": "Providing valuable opportunities for youth across India, including those from rural areas, tribal districts, and underserved communities to gain practical work experience.",
    "btn-find-now": "Find Internships Now",
    "feature-internships": "Internships",
    "feature-internships-sub": "Over 5 years",
    "feature-stipend": "Monthly Stipend",
    "feature-stipend-sub": "Plus ₹6,000 one-time grant",
    "feature-sectors": "Sectors",
    "feature-sectors-sub": "Covered across India",
    "feature-duration": "Months Duration",
    "feature-duration-sub": "Full-time internship",
    "overview-title": "About the Scheme",
    "overview-text": "The Prime Minister's Internship Scheme is a landmark initiative by the Government of India to provide practical work experience to youth from diverse backgrounds. This program bridges the gap between education and employment, offering hands-on training in top companies across various sectors.",
    "about-title": "About Prime Minister's Internship Scheme",
    "about-background-title": "Background & Objectives",
    "about-background-text": "The Prime Minister's Internship Scheme was launched to address the employability gap among Indian youth. It aims to provide practical work experience, enhance skills, and improve the career prospects of young graduates across the country, with special focus on rural, tribal, and underserved communities.",
    "about-eligibility-title": "Eligibility Criteria",
    "about-eligibility-1": "Age: 21-24 years",
    "about-eligibility-2": "Education: Bachelor's degree or Diploma in relevant field",
    "about-eligibility-3": "Family income: Up to ₹8 lakh per annum",
    "about-eligibility-4": "Indian citizen with valid Aadhaar card",
    "about-eligibility-5": "Not currently employed or enrolled in full-time education",
    "about-benefits-title": "Benefits",
    "about-benefits-1": "Monthly stipend of ₹5,000",
    "about-benefits-2": "One-time assistance of ₹6,000",
    "about-benefits-3": "12 months of practical work experience",
    "about-benefits-4": "Industry exposure with leading companies",
    "about-benefits-5": "Certificate of completion",
    "about-benefits-6": "Skill development and training",
    "about-sectors-title": "Participating Sectors",
    "find-title": "Find Internships",
    "search-placeholder": "Search by company, role, or location...",
    "btn-search": "Search",
    "browse-title": "Browse All Internships",
    "filter-sector": "Sector:",
    "filter-location": "Location:",
    "filter-all": "All",
    "btn-reset": "Reset Filters",
    "contact-title": "Contact Us",
    "contact-helpline": "Helpline Number",
    "contact-helpline-time": "Available: Monday to Friday, 9 AM - 6 PM IST",
    "contact-email-title": "Email Support",
    "contact-faq-title": "Frequently Asked Questions",
    "faq-q1": "Who is eligible for the PM Internship Scheme?",
    "faq-a1": "Youth between 21-24 years with a Bachelor's degree or Diploma, and family income up to ₹8 lakh per annum.",
    "faq-q2": "What is the stipend amount?",
    "faq-a2": "₹5,000 per month plus a one-time assistance of ₹6,000.",
    "faq-q3": "How long is the internship duration?",
    "faq-a3": "The internship duration is 12 months (1 year).",
    "contact-form-title": "Send us a Message",
    "form-name": "Name:",
    "form-email": "Email:",
    "form-message": "Message:",
    "btn-submit": "Submit",
    "btn-view-details": "View Details",
    "btn-apply": "Apply Now",
    "modal-location": "Location",
    "modal-sector": "Sector",
    "modal-duration": "Duration",
    "modal-stipend": "Monthly Stipend",
    "modal-grant": "One-time Grant",
    "modal-requirements": "Requirements",
    "modal-skills": "Skills Required",
    "modal-description": "Description"
  },
  hi: {
    "nav-title": "प्रधानमंत्री इंटर्नशिप योजना",
    "nav-home": "होम",
    "nav-about": "के बारे में",
    "nav-find": "इंटर्नशिप खोजें",
    "nav-browse": "सभी देखें",
    "nav-contact": "संपर्क करें",
    "btn-login": "लॉगिन",
    "btn-register": "रजिस्टर",
    "hero-title": "प्रधानमंत्री इंटर्नशिप योजना",
    "hero-subtitle": "भारत के युवाओं को वास्तविक अनुभव और करियर के अवसर प्रदान करना",
    "hero-description": "ग्रामीण क्षेत्रों, आदिवासी जिलों और वंचित समुदायों सहित पूरे भारत में युवाओं को व्यावहारिक कार्य अनुभव प्राप्त करने के लिए मूल्यवान अवसर प्रदान करना।",
    "btn-find-now": "अभी इंटर्नशिप खोजें",
    "feature-internships": "इंटर्नशिप",
    "feature-internships-sub": "5 वर्षों में",
    "feature-stipend": "मासिक वेतन",
    "feature-stipend-sub": "प्लस ₹6,000 एकमुश्त अनुदान",
    "feature-sectors": "क्षेत्र",
    "feature-sectors-sub": "पूरे भारत में",
    "feature-duration": "महीने की अवधि",
    "feature-duration-sub": "पूर्णकालिक इंटर्नशिप",
    "overview-title": "योजना के बारे में",
    "overview-text": "प्रधानमंत्री इंटर्नशिप योजना विविध पृष्ठभूमि के युवाओं को व्यावहारिक कार्य अनुभव प्रदान करने के लिए भारत सरकार की एक ऐतिहासिक पहल है। यह कार्यक्रम शिक्षा और रोजगार के बीच की खाई को पाटता है।",
    "about-title": "प्रधानमंत्री इंटर्नशिप योजना के बारे में",
    "about-background-title": "पृष्ठभूमि और उद्देश्य",
    "about-background-text": "प्रधानमंत्री इंटर्नशिप योजना भारतीय युवाओं के बीच रोजगार अंतर को दूर करने के लिए शुरू की गई थी। इसका उद्देश्य व्यावहारिक कार्य अनुभव प्रदान करना, कौशल बढ़ाना और देश भर के युवा स्नातकों की करियर संभावनाओं में सुधार करना है।",
    "about-eligibility-title": "पात्रता मानदंड",
    "about-eligibility-1": "आयु: 21-24 वर्ष",
    "about-eligibility-2": "शिक्षा: स्नातक की डिग्री या प्रासंगिक क्षेत्र में डिप्लोमा",
    "about-eligibility-3": "पारिवारिक आय: प्रति वर्ष ₹8 लाख तक",
    "about-eligibility-4": "वैध आधार कार्ड के साथ भारतीय नागरिक",
    "about-eligibility-5": "वर्तमान में नियोजित या पूर्णकालिक शिक्षा में नामांकित नहीं",
    "about-benefits-title": "लाभ",
    "about-benefits-1": "₹5,000 का मासिक वेतन",
    "about-benefits-2": "₹6,000 की एकमुश्त सहायता",
    "about-benefits-3": "12 महीने का व्यावहारिक कार्य अनुभव",
    "about-benefits-4": "अग्रणी कंपनियों के साथ उद्योग अनुभव",
    "about-benefits-5": "पूर्णता का प्रमाण पत्र",
    "about-benefits-6": "कौशल विकास और प्रशिक्षण",
    "about-sectors-title": "भाग लेने वाले क्षेत्र",
    "find-title": "इंटर्नशिप खोजें",
    "search-placeholder": "कंपनी, भूमिका या स्थान से खोजें...",
    "btn-search": "खोजें",
    "browse-title": "सभी इंटर्नशिप देखें",
    "filter-sector": "क्षेत्र:",
    "filter-location": "स्थान:",
    "filter-all": "सभी",
    "btn-reset": "फ़िल्टर रीसेट करें",
    "contact-title": "संपर्क करें",
    "contact-helpline": "हेल्पलाइन नंबर",
    "contact-helpline-time": "उपलब्ध: सोमवार से शुक्रवार, सुबह 9 बजे से शाम 6 बजे IST",
    "contact-email-title": "ईमेल सहायता",
    "contact-faq-title": "अक्सर पूछे जाने वाले प्रश्न",
    "faq-q1": "पीएम इंटर्नशिप योजना के लिए कौन पात्र है?",
    "faq-a1": "21-24 वर्ष के बीच के युवा जिनके पास स्नातक की डिग्री या डिप्लोमा है और पारिवारिक आय ₹8 लाख प्रति वर्ष तक है।",
    "faq-q2": "वेतन की राशि क्या है?",
    "faq-a2": "₹5,000 प्रति माह प्लस ₹6,000 की एकमुश्त सहायता।",
    "faq-q3": "इंटर्नशिप की अवधि कितनी है?",
    "faq-a3": "इंटर्नशिप की अवधि 12 महीने (1 वर्ष) है।",
    "contact-form-title": "हमें एक संदेश भेजें",
    "form-name": "नाम:",
    "form-email": "ईमेल:",
    "form-message": "संदेश:",
    "btn-submit": "जमा करें",
    "btn-view-details": "विवरण देखें",
    "btn-apply": "अभी आवेदन करें",
    "modal-location": "स्थान",
    "modal-sector": "क्षेत्र",
    "modal-duration": "अवधि",
    "modal-stipend": "मासिक वेतन",
    "modal-grant": "एकमुश्त अनुदान",
    "modal-requirements": "आवश्यकताएं",
    "modal-skills": "आवश्यक कौशल",
    "modal-description": "विवरण"
  },
  ta: {
    "nav-title": "பிரதம மந்திரி இன்டர்ன்ஷிப் திட்டம்",
    "nav-home": "முகப்பு",
    "nav-about": "பற்றி",
    "nav-find": "இன்டர்ன்ஷிப்களைக் கண்டறியவும்",
    "nav-browse": "அனைத்தையும் பார்க்கவும்",
    "nav-contact": "தொடர்பு",
    "btn-login": "உள்நுழைய",
    "btn-register": "பதிவு",
    "hero-title": "பிரதம மந்திரி இன்டர்ன்ஷிப் திட்டம்",
    "hero-subtitle": "இந்தியாவின் இளைஞர்களுக்கு நடைமுறை அனுபவம் மற்றும் தொழில் வாய்ப்புகளை வழங்குதல்",
    "hero-description": "கிராமப்புற பகுதிகள், பழங்குடி மாவட்டங்கள் மற்றும் சேவை செய்யப்படாத சமூகங்களை உள்ளடக்கிய இந்தியா முழுவதும் உள்ள இளைஞர்களுக்கு நடைமுறை பணி அனுபவத்தைப் பெற மதிப்புமிக்க வாய்ப்புகளை வழங்குதல்.",
    "btn-find-now": "இப்போதே இன்டர்ன்ஷிப்களைக் கண்டறியவும்",
    "feature-internships": "இன்டர்ன்ஷிப்கள்",
    "feature-internships-sub": "5 ஆண்டுகளில்",
    "feature-stipend": "மாதாந்திர உதவித்தொகை",
    "feature-stipend-sub": "கூடுதலாக ₹6,000 ஒரு முறை மானியம்",
    "feature-sectors": "துறைகள்",
    "feature-sectors-sub": "இந்தியா முழுவதும்",
    "feature-duration": "மாதங்கள் காலம்",
    "feature-duration-sub": "முழுநேர இன்டர்ன்ஷிப்",
    "overview-title": "திட்டத்தைப் பற்றி",
    "overview-text": "பிரதம மந்திரி இன்டர்ன்ஷிப் திட்டம் பல்வேறு பின்னணியைச் சேர்ந்த இளைஞர்களுக்கு நடைமுறை பணி அனுபவத்தை வழங்க இந்திய அரசாங்கத்தின் ஒரு முக்கிய முயற்சியாகும். இந்த திட்டம் கல்வி மற்றும் வேலைவாய்ப்புக்கு இடையே உள்ள இடைவெளியை நிரப்புகிறது.",
    "about-title": "பிரதம மந்திரி இன்டர்ன்ஷிப் திட்டத்தைப் பற்றி",
    "about-background-title": "பின்னணி மற்றும் நோக்கங்கள்",
    "about-background-text": "இந்திய இளைஞர்களிடையே வேலைவாய்ப்பு இடைவெளியை நிவர்த்தி செய்ய பிரதம மந்திரி இன்டர்ன்ஷிப் திட்டம் தொடங்கப்பட்டது. இது நடைமுறை பணி அனுபவத்தை வழங்குவதையும், திறன்களை மேம்படுத்துவதையும், நாடு முழுவதும் உள்ள இளம் பட்டதாரிகளின் தொழில் வாய்ப்புகளை மேம்படுத்துவதையும் நோக்கமாகக் கொண்டுள்ளது.",
    "about-eligibility-title": "தகுதி விதிகள்",
    "about-eligibility-1": "வயது: 21-24 வயது",
    "about-eligibility-2": "கல்வி: பட்டப்படிப்பு அல்லது தொடர்புடைய துறையில் டிப்ளோமா",
    "about-eligibility-3": "குடும்ப வருமானம்: ஆண்டுக்கு ₹8 லட்சம் வரை",
    "about-eligibility-4": "சரியான ஆதார் அட்டையுடன் இந்திய குடிமகன்",
    "about-eligibility-5": "தற்போது வேலையில் இல்லாதவர் அல்லது முழுநேர கல்வியில் பதிவு செய்யப்படாதவர்",
    "about-benefits-title": "பலன்கள்",
    "about-benefits-1": "₹5,000 மாதாந்திர உதவித்தொகை",
    "about-benefits-2": "₹6,000 ஒரு முறை உதவி",
    "about-benefits-3": "12 மாதங்கள் நடைமுறை பணி அனுபவம்",
    "about-benefits-4": "முன்னணி நிறுவனங்களுடன் தொழில் வெளிப்பாடு",
    "about-benefits-5": "முடிவுச் சான்றிதழ்",
    "about-benefits-6": "திறன் மேம்பாடு மற்றும் பயிற்சி",
    "about-sectors-title": "பங்கேற்கும் துறைகள்",
    "find-title": "இன்டர்ன்ஷிப்களைக் கண்டறியவும்",
    "search-placeholder": "நிறுவனம், பங்கு அல்லது இடம் மூலம் தேடுங்கள்...",
    "btn-search": "தேடு",
    "browse-title": "அனைத்து இன்டர்ன்ஷிப்களையும் உலாவவும்",
    "filter-sector": "துறை:",
    "filter-location": "இடம்:",
    "filter-all": "அனைத்தும்",
    "btn-reset": "வடிப்பான்களை மீட்டமைக்கவும்",
    "contact-title": "எங்களை தொடர்பு கொள்ளுங்கள்",
    "contact-helpline": "உதவி எண்",
    "contact-helpline-time": "கிடைக்கும்: திங்கள் முதல் வெள்ளி, காலை 9 மணி முதல் மாலை 6 மணி IST",
    "contact-email-title": "மின்னஞ்சல் ஆதரவு",
    "contact-faq-title": "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    "faq-q1": "PM இன்டர்ன்ஷிப் திட்டத்திற்கு யார் தகுதியுடையவர்?",
    "faq-a1": "பட்டப்படிப்பு அல்லது டிப்ளோமாவுடன் 21-24 வயதுக்குட்பட்ட இளைஞர்கள் மற்றும் குடும்ப வருமானம் ஆண்டுக்கு ₹8 லட்சம் வரை உள்ளவர்கள்.",
    "faq-q2": "உதவித்தொகை தொகை என்ன?",
    "faq-a2": "மாதத்திற்கு ₹5,000 கூடுதலாக ₹6,000 ஒரு முறை உதவி.",
    "faq-q3": "இன்டர்ன்ஷிப் காலம் எவ்வளவு?",
    "faq-a3": "இன்டர்ன்ஷிப் காலம் 12 மாதங்கள் (1 ஆண்டு).",
    "contact-form-title": "எங்களுக்கு ஒரு செய்தி அனுப்புங்கள்",
    "form-name": "பெயர்:",
    "form-email": "மின்னஞ்சல்:",
    "form-message": "செய்தி:",
    "btn-submit": "சமர்ப்பிக்கவும்",
    "btn-view-details": "விவரங்களைக் காண்க",
    "btn-apply": "இப்போது விண்ணப்பிக்கவும்",
    "modal-location": "இடம்",
    "modal-sector": "துறை",
    "modal-duration": "காலம்",
    "modal-stipend": "மாதாந்திர உதவித்தொகை",
    "modal-grant": "ஒரு முறை மானியம்",
    "modal-requirements": "தேவைகள்",
    "modal-skills": "தேவையான திறன்கள்",
    "modal-description": "விளக்கம்"
  },
  ma: {
    "nav-title": "पंतप्रधान इंटर्नशिप योजना",
    "nav-home": "मुख्यपृष्ठ",
    "nav-about": "बद्दल",
    "nav-find": "इंटर्नशिप शोधा",
    "nav-browse": "सर्व पहा",
    "nav-contact": "संपर्क",
    "btn-login": "लॉगिन",
    "btn-register": "नोंदणी",
    "hero-title": "पंतप्रधान इंटर्नशिप योजना",
    "hero-subtitle": "भारताच्या युवकांना वास्तविक अनुभव आणि करिअरच्या संधी प्रदान करणे",
    "hero-description": "ग्रामीण भाग, आदिवासी जिल्हे आणि वंचित समुदायांसह संपूर्ण भारतातील युवकांना व्यावहारिक कामाचा अनुभव मिळवण्यासाठी मौल्यवान संधी प्रदान करणे.",
    "btn-find-now": "आता इंटर्नशिप शोधा",
    "feature-internships": "इंटर्नशिप",
    "feature-internships-sub": "5 वर्षांत",
    "feature-stipend": "मासिक वेतन",
    "feature-stipend-sub": "तसेच ₹6,000 एकवेळ अनुदान",
    "feature-sectors": "क्षेत्रे",
    "feature-sectors-sub": "संपूर्ण भारतात",
    "feature-duration": "महिने कालावधी",
    "feature-duration-sub": "पूर्णवेळ इंटर्नशिप",
    "overview-title": "योजनेबद्दल",
    "overview-text": "पंतप्रधान इंटर्नशिप योजना विविध पार्श्वभूमीतील युवकांना व्यावहारिक कामाचा अनुभव देण्यासाठी भारत सरकारचा एक महत्त्वाचा उपक्रम आहे. हा कार्यक्रम शिक्षण आणि रोजगार यांच्यातील अंतर भरून काढतो.",
    "about-title": "पंतप्रधान इंटर्नशिप योजनेबद्दल",
    "about-background-title": "पार्श्वभूमी आणि उद्दिष्टे",
    "about-background-text": "भारतीय युवकांमधील रोजगारक्षमतेची दरी भरून काढण्यासाठी पंतप्रधान इंटर्नशिप योजना सुरू करण्यात आली. देशभरातील तरुण पदवीधरांना व्यावहारिक कामाचा अनुभव देणे, कौशल्ये वाढवणे आणि करिअरची शक्यता सुधारणे हे त्याचे उद्दिष्ट आहे.",
    "about-eligibility-title": "पात्रता निकष",
    "about-eligibility-1": "वय: 21-24 वर्षे",
    "about-eligibility-2": "शिक्षण: संबंधित क्षेत्रात पदवी किंवा डिप्लोमा",
    "about-eligibility-3": "कौटुंबिक उत्पन्न: वर्षाला ₹8 लाख पर्यंत",
    "about-eligibility-4": "वैध आधार कार्डासह भारतीय नागरिक",
    "about-eligibility-5": "सध्या नोकरीत नाही किंवा पूर्णवेळ शिक्षणात नोंदणीकृत नाही",
    "about-benefits-title": "फायदे",
    "about-benefits-1": "₹5,000 मासिक वेतन",
    "about-benefits-2": "₹6,000 एकवेळ मदत",
    "about-benefits-3": "12 महिने व्यावहारिक कामाचा अनुभव",
    "about-benefits-4": "आघाडीच्या कंपन्यांसह उद्योग प्रदर्शन",
    "about-benefits-5": "पूर्णता प्रमाणपत्र",
    "about-benefits-6": "कौशल्य विकास आणि प्रशिक्षण",
    "about-sectors-title": "सहभागी क्षेत्रे",
    "find-title": "इंटर्नशिप शोधा",
    "search-placeholder": "कंपनी, भूमिका किंवा स्थान द्वारे शोधा...",
    "btn-search": "शोधा",
    "browse-title": "सर्व इंटर्नशिप ब्राउझ करा",
    "filter-sector": "क्षेत्र:",
    "filter-location": "स्थान:",
    "filter-all": "सर्व",
    "btn-reset": "फिल्टर रीसेट करा",
    "contact-title": "आमच्याशी संपर्क साधा",
    "contact-helpline": "हेल्पलाइन नंबर",
    "contact-helpline-time": "उपलब्ध: सोमवार ते शुक्रवार, सकाळी 9 ते संध्याकाळी 6 IST",
    "contact-email-title": "ईमेल सपोर्ट",
    "contact-faq-title": "वारंवार विचारले जाणारे प्रश्न",
    "faq-q1": "PM इंटर्नशिप योजनेसाठी कोण पात्र आहे?",
    "faq-a1": "पदवी किंवा डिप्लोमा असलेले 21-24 वर्षे वयोगटातील युवक आणि कौटुंबिक उत्पन्न वर्षाला ₹8 लाख पर्यंत.",
    "faq-q2": "वेतन रक्कम किती आहे?",
    "faq-a2": "₹5,000 प्रति महिना तसेच ₹6,000 एकवेळ मदत.",
    "faq-q3": "इंटर्नशिपचा कालावधी किती आहे?",
    "faq-a3": "इंटर्नशिपचा कालावधी 12 महिने (1 वर्ष) आहे.",
    "contact-form-title": "आम्हाला संदेश पाठवा",
    "form-name": "नाव:",
    "form-email": "ईमेल:",
    "form-message": "संदेश:",
    "btn-submit": "सबमिट करा",
    "btn-view-details": "तपशील पहा",
    "btn-apply": "आता अर्ज करा",
    "modal-location": "स्थान",
    "modal-sector": "क्षेत्र",
    "modal-duration": "कालावधी",
    "modal-stipend": "मासिक वेतन",
    "modal-grant": "एकवेळ अनुदान",
    "modal-requirements": "आवश्यकता",
    "modal-skills": "आवश्यक कौशल्ये",
    "modal-description": "वर्णन"
  }
};

let currentLanguage = 'en';
let filteredInternshipsList = [...internships];
let savedProfileData = null; // Store profile in memory instead of localStorage
let browseFilters = {
  sectors: [],
  locations: []
};
let browseAllFilters = {
  search: '',
  sector: '',
  location: '',
  sort: 'recent'
};
let filteredBrowseAll = [...internships];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  clearAllForms(); 
  initializeNavigation();
  initializeTheme();
  initializeLanguage();
  loadIntershipDataFromBackend(); 
  populateFilters();
  populateBrowseFilters();
  initScrollAnimations();
  initializeBrowseAllPage();
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.onclick = Profile.open.bind(Profile);
  }
  
  const overlay = document.querySelector('.profile-modal-overlay');
  if (overlay) {
    overlay.onclick = Profile.close;
  }
  
  console.log('✅ Profile system initialized safely');
});

// Smooth scroll to profile form
function scrollToProfile() {
  const profileSection = document.querySelector('.profile-section');
  if (profileSection) {
    profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Handle Quick Profile Form Submission
function handleQuickProfileSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const profileData = {};
  
  for (let [key, value] of formData.entries()) {
    profileData[key] = value;
  }
  
  // Save profile data to memory
  savedProfileData = profileData;
  
  // Get intelligent recommendations based on profile
  const recommendations = getIntelligentRecommendations(profileData);
  
  // Hide form and show recommendations
  const formCard = document.querySelector('.profile-form-card');
  formCard.style.display = 'none';
  
  // Display recommendations
  displayQuickProfileRecommendations(profileData, recommendations);
  
  // Scroll to recommendations
  setTimeout(() => {
    const recsSection = document.getElementById('quickProfileRecommendations');
    if (recsSection) {
      recsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// Intelligent Recommendation Algorithm
function getIntelligentRecommendations(profileData) {
  const skills = profileData.skills.toLowerCase();
  const careerGoal = profileData.career.toLowerCase();
  const industry = profileData.industry.toLowerCase();
  const location = profileData.location.toLowerCase();
  const field = profileData.field.toLowerCase();
  const experience = parseInt(profileData.experience) || 0;
  
  // Score each internship
  const scoredInternships = internships.map(internship => {
    let score = 0;
    
    // Skills matching (50% weight - 50 points max)
    const internshipSkills = internship.skills.toLowerCase();
    const skillsList = skills.split(',').map(s => s.trim());
    let skillMatches = 0;
    skillsList.forEach(skill => {
      if (internshipSkills.includes(skill) || internship.role.toLowerCase().includes(skill) || internship.description.toLowerCase().includes(skill)) {
        skillMatches++;
      }
    });
    score += Math.min((skillMatches / skillsList.length) * 50, 50);
    
    // Career Goal matching (25% weight - 25 points max)
    if (careerGoal.includes('technical') && (internship.sector === 'Information Technology' || internship.role.toLowerCase().includes('engineer') || internship.role.toLowerCase().includes('technical'))) {
      score += 25;
    } else if (careerGoal.includes('management') && (internship.role.toLowerCase().includes('management') || internship.role.toLowerCase().includes('manager'))) {
      score += 25;
    } else if (careerGoal.includes('finance') && (internship.sector.includes('Banking') || internship.sector.includes('Finance') || internship.sector.includes('Insurance'))) {
      score += 25;
    } else if (careerGoal.includes('operations') && internship.role.toLowerCase().includes('operations')) {
      score += 20;
    } else if (careerGoal.includes('sales') && internship.role.toLowerCase().includes('sales')) {
      score += 20;
    }
    
    // Industry Preference matching (25% weight - 25 points max)
    if (industry === 'it' && internship.sector === 'Information Technology') {
      score += 25;
    } else if (industry === 'finance' && (internship.sector.includes('Banking') || internship.sector.includes('Finance'))) {
      score += 25;
    } else if (industry === 'automotive' && internship.sector === 'Automotive') {
      score += 25;
    } else if (industry === 'energy' && (internship.sector.includes('Energy') || internship.sector.includes('Power'))) {
      score += 25;
    } else if (industry === 'manufacturing' && internship.sector === 'Manufacturing') {
      score += 25;
    } else if (industry === 'fmcg' && internship.sector === 'FMCG') {
      score += 25;
    } else if (industry === 'construction' && internship.sector === 'Construction') {
      score += 25;
    } else if (industry === 'healthcare' && internship.sector === 'Healthcare') {
      score += 25;
    } else if (industry === 'consulting' && internship.sector === 'Information Technology') {
      score += 15;
    }
    
    // Location preference (bonus 10 points)
    const locationsList = location.split(',').map(l => l.trim());
    locationsList.forEach(loc => {
      if (internship.location.toLowerCase().includes(loc)) {
        score += 10;
      }
    });
    
    // Field of study matching (bonus 5 points)
    if (field === 'cse' && internship.sector === 'Information Technology') {
      score += 5;
    } else if (field === 'commerce' && (internship.sector.includes('Banking') || internship.sector.includes('Finance'))) {
      score += 5;
    } else if (field === 'me' && (internship.sector === 'Automotive' || internship.sector === 'Manufacturing')) {
      score += 5;
    }
    
    return {
      internship,
      score
    };
  });
  
  // Sort by score and return top 3-5
  scoredInternships.sort((a, b) => b.score - a.score);
  const topCount = Math.min(5, Math.max(3, scoredInternships.filter(s => s.score > 20).length));
  return scoredInternships.slice(0, topCount).map(s => s.internship);
}

// Display Quick Profile Recommendations
function displayQuickProfileRecommendations(profileData, recommendations) {
  // Check if recommendations section exists, if not create it
  let recsSection = document.getElementById('quickProfileRecommendations');
  if (!recsSection) {
    recsSection = document.createElement('div');
    recsSection.id = 'quickProfileRecommendations';
    recsSection.className = 'recommendations-display';
    const profileSection = document.querySelector('.profile-section .container');
    profileSection.appendChild(recsSection);
  }
  
  recsSection.innerHTML = `
    <div class="recommendations-header">
      <h2>Hello, ${profileData.firstName}! 👋</h2>
      <p>We found ${recommendations.length} matching internships! Here are our top recommendations based on your profile:</p>
    </div>
    
    <div class="recommendation-cards" id="quickRecommendationCards">
      ${recommendations.map((internship, index) => `
        <div class="recommendation-card" onclick="openModal(${JSON.stringify(internship).replace(/"/g, '&quot;')})">
          <div class="recommendation-number num-${index + 1}">${index + 1}</div>
          <div class="recommendation-content">
            <h3 class="recommendation-title">${internship.role}</h3>
            <p class="recommendation-company">${internship.company}</p>
            <div class="recommendation-details">
              <span class="recommendation-detail">📍 ${internship.location}</span>
              <span class="recommendation-detail">🏢 ${internship.sector}</span>
              <span class="recommendation-detail">⏱️ ${internship.duration}</span>
              <span class="recommendation-detail">💰 ₹${internship.stipend.toLocaleString()}/month</span>
            </div>
            <p class="recommendation-description">${internship.description}</p>
          </div>
          <div class="recommendation-action">
            <button class="btn btn-primary" onclick="event.stopPropagation(); openModal(${JSON.stringify(internship).replace(/"/g, '&quot;')})">View Details</button>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="recommendation-actions">
      <button class="btn btn-outline btn-large" onclick="backToQuickProfileForm()">← Back to Form</button>
      <button class="btn btn-primary btn-large" onclick="navigateToSection('browse-all')">Browse All Internships →</button>
    </div>
  `;
  
  recsSection.style.display = 'block';
}

// Back to Quick Profile Form
function backToQuickProfileForm() {
  const formCard = document.querySelector('.profile-form-card');
  const recsSection = document.getElementById('quickProfileRecommendations');
  
  if (formCard) formCard.style.display = 'block';
  if (recsSection) recsSection.style.display = 'none';
  
  // Scroll to form
  setTimeout(() => {
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// Initialize scroll animations
function initScrollAnimations() {
  const cards = document.querySelectorAll('.feature-card, .stat-card, .why-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }, {
    threshold: 0.1
  });
  
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

// Navigation
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.page-section');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      
      // Update active states
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      // Show target section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
          section.classList.add('active');
        }
      });
      
      // Close mobile menu
      navMenu.classList.remove('active');
      
      // Scroll to top
      window.scrollTo(0, 0);
    });
  });
  
  // Mobile menu toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }
}

function navigateToSection(sectionId) {
  const targetLink = document.querySelector(`a[href="#${sectionId}"]`);
  if (targetLink) {
    targetLink.click();
  }
}

function navigateToFindInternships() {
  navigateToSection('find-internships');
  // Switch to browse tab
  setTimeout(() => {
    switchTab('browse');
  }, 100);
}

// Theme Toggle
function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = 'light'; // Default to light mode
  document.documentElement.setAttribute('data-color-scheme', savedTheme);
  
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-color-scheme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-color-scheme', newTheme);
  });
}

// Language Selector
function initializeLanguage() {
  const languageSelector = document.getElementById('languageSelector');
  languageSelector.addEventListener('change', function() {
    currentLanguage = this.value;
    updateLanguage();
  });
}

function updateLanguage() {
  const elements = document.querySelectorAll('[data-translate]');
  elements.forEach(element => {
    const key = element.getAttribute('data-translate');
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });
  
  // Update placeholder
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = translations[currentLanguage]['search-placeholder'] || 'Search...';
  }
  
  // Reload internships to update language
  loadInternships();
  filterInternships();
}

// Load Internships (legacy - no longer used)
function loadInternships() {
  // Internships are now loaded in browse tab via loadBrowseInternships()
}

function createInternshipCard(internship) {
  const card = document.createElement('div');
  card.className = 'internship-card';
  card.onclick = () => openModal(internship);
  
  card.innerHTML = `
    <h3 class="internship-company">${internship.company}</h3>
    <p class="internship-role">${internship.role}</p>
    <div class="internship-details">
      <div class="internship-detail">
        <span class="detail-icon">📍</span>
        <span>${internship.location}</span>
      </div>
      <div class="internship-detail">
        <span class="detail-icon">🏢</span>
        <span>${internship.sector}</span>
      </div>
      <div class="internship-detail">
        <span class="detail-icon">⏱️</span>
        <span>${internship.duration}</span>
      </div>
    </div>
    <div class="internship-footer">
      <span class="internship-stipend">₹${internship.stipend.toLocaleString()}/month</span>
      <button class="btn btn-primary" data-translate="btn-view-details">${translations[currentLanguage]['btn-view-details']}</button>
    </div>
  `;
  
  return card;
}

// Search Functionality (for Browse tab)
function searchInternships() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.toLowerCase();
  
  const filtered = internships.filter(internship => {
    return internship.company.toLowerCase().includes(searchTerm) ||
           internship.role.toLowerCase().includes(searchTerm) ||
           internship.location.toLowerCase().includes(searchTerm) ||
           internship.sector.toLowerCase().includes(searchTerm);
  });
  
  // Display in browse tab
  const container = document.getElementById('browseInternshipsList');
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--color-text-secondary); grid-column: 1/-1;">No internships found matching your search.</p>';
    return;
  }
  
  filtered.forEach(internship => {
    const card = createInternshipCard(internship);
    container.appendChild(card);
  });
}

// Populate Filters (legacy - kept for compatibility)
function populateFilters() {
  // This function is kept for compatibility but filters are now in browse tab
}

// Modal
function openModal(internship) {
  const modal = document.getElementById('internshipModal');
  const modalBody = document.getElementById('modalBody');
  
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-company">${internship.company}</h2>
      <p class="modal-role">${internship.role}</p>
    </div>
    
    <div class="modal-details">
      <div class="modal-detail-item">
        <span class="modal-detail-label" data-translate="modal-location">${translations[currentLanguage]['modal-location']}</span>
        <span class="modal-detail-value">${internship.location}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label" data-translate="modal-sector">${translations[currentLanguage]['modal-sector']}</span>
        <span class="modal-detail-value">${internship.sector}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label" data-translate="modal-duration">${translations[currentLanguage]['modal-duration']}</span>
        <span class="modal-detail-value">${internship.duration}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label" data-translate="modal-stipend">${translations[currentLanguage]['modal-stipend']}</span>
        <span class="modal-detail-value">₹${internship.stipend.toLocaleString()}</span>
      </div>
      <div class="modal-detail-item">
        <span class="modal-detail-label" data-translate="modal-grant">${translations[currentLanguage]['modal-grant']}</span>
        <span class="modal-detail-value">₹6,000</span>
      </div>
    </div>
    
    <div class="modal-section">
      <h3 data-translate="modal-description">${translations[currentLanguage]['modal-description']}</h3>
      <p>${internship.description}</p>
    </div>
    
    <div class="modal-section">
      <h3 data-translate="modal-requirements">${translations[currentLanguage]['modal-requirements']}</h3>
      <p>${internship.requirements}</p>
    </div>
    
    <div class="modal-section">
      <h3 data-translate="modal-skills">${translations[currentLanguage]['modal-skills']}</h3>
      <p>${internship.skills}</p>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()" data-translate="btn-view-details">Close</button>
      <a href="https://www.pminternship.mca.gov.in" target="_blank" class="btn btn-primary" data-translate="btn-apply">${translations[currentLanguage]['btn-apply']}</a>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('internshipModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close modal on outside click
document.getElementById('internshipModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});

// Tab Switching
function switchTab(tabName) {
  // Update tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update tab content
  const recommendationsTab = document.getElementById('recommendations-tab');
  const browseTab = document.getElementById('browse-tab');
  
  if (tabName === 'recommendations') {
    recommendationsTab.classList.add('active');
    browseTab.classList.remove('active');
  } else {
    recommendationsTab.classList.remove('active');
    browseTab.classList.add('active');
  }
}

// Profile Form Submission
async function getRecommendations() {
   if (!auth.currentUser) {
    alert('Please login for personalized recommendations');
    openLoginModal();
    return;
  }
  // ===== CHECK IF USER IS LOGGED IN =====
  console.log('Current user:', auth.currentUser);
  console.log('Auth state:', auth);
  
  const user = auth.currentUser;

  

  const name = document.getElementById('name').value;
  const age = document.getElementById('age').value;
  const qualification = document.getElementById('qualification').value;
  const skillsInput = document.getElementById('skills').value;
  const preferredState = document.getElementById('state').value;
  const preferredSector = document.getElementById('sector').value;
  
  // Validate inputs
  if (!name || !age || !qualification || !skillsInput || !preferredState) {
    alert('Please fill all fields');
    return;
  }

  try {
    // Convert skills from comma-separated string to array
    const skills = skillsInput.split(',').map(s => s.trim());

    // Call backend API
    const res = await fetch(`${API_BASE}/recommendations/get-recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age,
        qualification,
        skills,
        preferredSector,
        preferredState
      })
    });

    const json = await res.json();

    if (!json.success) {
      alert('Error getting recommendations: ' + json.error);
      return;
    }

    // Display recommendations
    const container = document.getElementById('recommendationResults');
    container.innerHTML = '';

    if (json.recommendations.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--color-text-secondary);">No recommendations found. Try adjusting your preferences.</p>';
      return;
    }

    json.recommendations.forEach((rec, index) => {
      const card = document.createElement('div');
      card.className = 'recommendation-card';
      card.innerHTML = `
        <div class="recommendation-rank">#${rec.rank}</div>
        <h3>${rec.company}</h3>
        <p class="recommendation-role">${rec.role}</p>
        <div class="recommendation-details">
          <div><strong>Location:</strong> ${rec.location}</div>
          <div><strong>Sector:</strong> ${rec.sector}</div>
          <div><strong>Stipend:</strong> ₹${rec.stipend}/month</div>
          <div><strong>Duration:</strong> ${rec.duration}</div>
        </div>
        <div class="match-score">
          <span class="score-label">Match Score:</span>
          <span class="score-percentage">${rec.matchPercentage}</span>
        </div>
        <p class="match-reason">${rec.description}</p>
      `;
      container.appendChild(card);
    });

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Error:', error);
    alert('Error connecting to backend. Make sure npm start is running.');
  }
}


// ===== RECOMMENDATIONS BY INTERESTS (NO LOGIN REQUIRED) =====
function getRecommendationsByInterests(interests) {
  // Filter internships based on interests, default to IT if not found
  let filtered = internships.filter(i => i.sector.includes(interests));
  
  // If no matches or IT selected, show IT internships
  if (filtered.length === 0 || interests === 'Information Technology') {
    interests = 'Information Technology';
    filtered = internships.filter(i => i.sector.includes('Information Technology'));
  }
  
  // Return top 5
  return filtered.slice(0, 5);
}


function displayRecommendations(recommendations) {
  const container = document.getElementById('recommendationCards');
  container.innerHTML = '';
  
  recommendations.forEach((internship, index) => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.onclick = () => openModal(internship);
    
    card.innerHTML = `
      <div class="recommendation-number num-${index + 1}">${index + 1}</div>
      <div class="recommendation-content">
        <h3 class="recommendation-title">${internship.role}</h3>
        <p class="recommendation-company">${internship.company}</p>
        <div class="recommendation-details">
          <span class="recommendation-detail">📍 ${internship.location}</span>
          <span class="recommendation-detail">🏢 ${internship.sector}</span>
          <span class="recommendation-detail">⏱️ ${internship.duration}</span>
          <span class="recommendation-detail">💰 ₹${internship.stipend.toLocaleString()}/month</span>
        </div>
        <p class="recommendation-description">${internship.description}</p>
      </div>
      <div class="recommendation-action">
        <button class="btn btn-primary" onclick="event.stopPropagation(); openModal(${JSON.stringify(internship).replace(/"/g, '&quot;')})">View &amp; Apply</button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

function backToForm() {
  document.getElementById('recommendationsSection').style.display = 'none';
  document.getElementById('profileFormSection').style.display = 'block';
  document.getElementById('profileFormSection').scrollIntoView({ behavior: 'smooth' });
}

// Save and Load Profile (using JavaScript variables)
function saveProfile() {
  savedProfileData = {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('emailAddress').value,
    education: document.getElementById('educationLevel').value,
    skills: document.getElementById('skillsInput').value,
    interests: document.getElementById('interests').value,
    location: document.getElementById('preferredLocation').value,
    language: document.getElementById('preferredLanguage').value
  };
  
  alert('Profile saved successfully! You can load it anytime during this session.');
}

function loadProfile() {
  if (!savedProfileData) {
    alert('No saved profile found. Please fill out the form and click "Save My Profile" first.');
    return;
  }
  
  document.getElementById('fullName').value = savedProfileData.fullName;
  document.getElementById('emailAddress').value = savedProfileData.email;
  document.getElementById('educationLevel').value = savedProfileData.education;
  document.getElementById('skillsInput').value = savedProfileData.skills;
  document.getElementById('interests').value = savedProfileData.interests;
  document.getElementById('preferredLocation').value = savedProfileData.location;
  document.getElementById('preferredLanguage').value = savedProfileData.language;
  
  alert('Profile loaded successfully!');
}

// Browse Tab - Populate Filters with Checkboxes
function populateBrowseFilters() {
  const sectorContainer = document.getElementById('sectorCheckboxes');
  const locationContainer = document.getElementById('locationCheckboxes');
  
  // Get unique sectors and locations
  const sectors = [...new Set(internships.map(i => i.sector))];
  const locations = [...new Set(internships.map(i => i.location))];
  
  sectors.forEach(sector => {
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    const id = `sector-${sector.replace(/[^a-zA-Z0-9]/g, '-')}`;
    div.innerHTML = `
      <input type="checkbox" id="${id}" value="${sector}" onchange="applyBrowseFilters()">
      <label for="${id}">${sector}</label>
    `;
    sectorContainer.appendChild(div);
  });
  
  locations.forEach(location => {
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    const id = `location-${location.replace(/[^a-zA-Z0-9]/g, '-')}`;
    div.innerHTML = `
      <input type="checkbox" id="${id}" value="${location}" onchange="applyBrowseFilters()">
      <label for="${id}">${location}</label>
    `;
    locationContainer.appendChild(div);
  });
}

function loadBrowseInternships() {
  const container = document.getElementById('browseInternshipsList');
  container.innerHTML = '';
  
  internships.forEach(internship => {
    const card = createInternshipCard(internship);
    container.appendChild(card);
  });
}

function applyBrowseFilters() {
  // Get selected sectors
  const sectorCheckboxes = document.querySelectorAll('#sectorCheckboxes input[type="checkbox"]:checked');
  const selectedSectors = Array.from(sectorCheckboxes).map(cb => cb.value);
  
  // Get selected locations
  const locationCheckboxes = document.querySelectorAll('#locationCheckboxes input[type="checkbox"]:checked');
  const selectedLocations = Array.from(locationCheckboxes).map(cb => cb.value);
  
  // Filter internships
  let filtered = [...internships];
  
  if (selectedSectors.length > 0) {
    filtered = filtered.filter(i => selectedSectors.includes(i.sector));
  }
  
  if (selectedLocations.length > 0) {
    filtered = filtered.filter(i => selectedLocations.includes(i.location));
  }
  
  // Display filtered results
  const container = document.getElementById('browseInternshipsList');
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--color-text-secondary); grid-column: 1/-1;">No internships found matching your filters.</p>';
    return;
  }
  
  filtered.forEach(internship => {
    const card = createInternshipCard(internship);
    container.appendChild(card);
  });
}

function resetBrowseFilters() {
  // Uncheck all checkboxes
  const allCheckboxes = document.querySelectorAll('#sectorCheckboxes input[type="checkbox"], #locationCheckboxes input[type="checkbox"]');
  allCheckboxes.forEach(cb => cb.checked = false);
  
  // Reload all internships
  loadBrowseInternships();
}

// Browse All Page Functions
function initializeBrowseAllPage() {
  // Populate sector filter
  const sectorSelect = document.getElementById('sectorFilterSelect');
  const sectors = [...new Set(internships.map(i => i.sector))].sort();
  sectors.forEach(sector => {
    const option = document.createElement('option');
    option.value = sector;
    option.textContent = sector;
    sectorSelect.appendChild(option);
  });
  
  // Populate location filter
  const locationSelect = document.getElementById('locationFilterSelect');
  const locations = [...new Set(internships.map(i => i.location))].sort();
  locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationSelect.appendChild(option);
  });
  
  // Load all internships initially
  loadBrowseAllInternships();
}

function loadBrowseAllInternships() {
  const container = document.getElementById('browseAllGrid');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (filteredBrowseAll.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--color-text-secondary); grid-column: 1/-1;">No internships found matching your criteria.</p>';
    updateResultsCount();
    return;
  }
  
  filteredBrowseAll.forEach(internship => {
    const card = createBrowseAllCard(internship);
    container.appendChild(card);
  });
  
  updateResultsCount();
}

function createBrowseAllCard(internship) {
  const card = document.createElement('div');
  card.className = 'browse-internship-card';
  card.onclick = () => openModal(internship);
  
  card.innerHTML = `
    <div class="card-header-gradient">
      <h3>${internship.role}</h3>
      <p>${internship.company}</p>
    </div>
    <div class="card-body">
      <div class="card-location">
        <span>📍</span>
        <span>${internship.location}</span>
      </div>
      <div>
        <span class="sector-badge">${internship.sector}</span>
      </div>
      <div class="card-info-item">
        <span>⏱️</span>
        <span>${internship.duration}</span>
      </div>
      <div class="card-requirements">
        <strong>📚 Requirements:</strong> ${internship.requirements}
      </div>
    </div>
    <div class="card-footer">
      <span class="card-stipend">₹5,000/month</span>
      <button class="btn btn-primary">View Details</button>
    </div>
  `;
  
  // Add click handler to button that doesn't propagate
  const button = card.querySelector('.btn-primary');
  button.onclick = (e) => {
    e.stopPropagation();
    openModal(internship);
  };
  
  return card;
}

function searchBrowseAll() {
  const searchInput = document.getElementById('browseSearchInput');
  browseAllFilters.search = searchInput.value.toLowerCase();
  applyAllBrowseFilters();
}

function filterBrowseAll() {
  const sectorSelect = document.getElementById('sectorFilterSelect');
  const locationSelect = document.getElementById('locationFilterSelect');
  
  browseAllFilters.sector = sectorSelect.value;
  browseAllFilters.location = locationSelect.value;
  
  applyAllBrowseFilters();
}

function sortBrowseAll() {
  const sortSelect = document.getElementById('sortBySelect');
  browseAllFilters.sort = sortSelect.value;
  applyAllBrowseFilters();
}

function applyAllBrowseFilters() {
  // Start with all internships
  let filtered = [...internships];
  
  // Apply search filter
  if (browseAllFilters.search) {
    filtered = filtered.filter(internship => {
      return internship.company.toLowerCase().includes(browseAllFilters.search) ||
             internship.role.toLowerCase().includes(browseAllFilters.search) ||
             internship.location.toLowerCase().includes(browseAllFilters.search) ||
             internship.sector.toLowerCase().includes(browseAllFilters.search);
    });
  }
  
  // Apply sector filter
  if (browseAllFilters.sector) {
    filtered = filtered.filter(i => i.sector === browseAllFilters.sector);
  }
  
  // Apply location filter
  if (browseAllFilters.location) {
    filtered = filtered.filter(i => i.location === browseAllFilters.location);
  }
  
  // Apply sorting
  if (browseAllFilters.sort === 'company') {
    filtered.sort((a, b) => a.company.localeCompare(b.company));
  } else if (browseAllFilters.sort === 'location') {
    filtered.sort((a, b) => a.location.localeCompare(b.location));
  }
  // 'recent' keeps original order
  
  filteredBrowseAll = filtered;
  loadBrowseAllInternships();
}

function clearAllBrowseFilters() {
  // Reset all filters
  browseAllFilters = {
    search: '',
    sector: '',
    location: '',
    sort: 'recent'
  };
  
  // Reset UI elements
  document.getElementById('browseSearchInput').value = '';
  document.getElementById('sectorFilterSelect').value = '';
  document.getElementById('locationFilterSelect').value = '';
  document.getElementById('sortBySelect').value = 'recent';
  
  // Reload all internships
  filteredBrowseAll = [...internships];
  loadBrowseAllInternships();
}

function updateResultsCount() {
  const counter = document.getElementById('resultsCount');
  if (counter) {
    counter.textContent = `Showing ${filteredBrowseAll.length} of ${internships.length} internships`;
  }
}

// Contact Form
function handleContactSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const message = document.getElementById('contactMessage').value;
  
  // In a real application, this would send data to a server
  alert(`Thank you ${name}! Your message has been received. We will get back to you at ${email} soon.`);
  
  // Reset form
  document.getElementById('contactForm').reset();
}