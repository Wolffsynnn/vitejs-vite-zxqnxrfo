import { createClient } from '@supabase/supabase-js';

// Tes infos Supabase
const supabaseUrl = 'https://beythkafwrxypqhlhdjl.supabase.co';
const supabaseKey = 'sb_publishable_88QM0sCElcl_eIvRViVjrg_gYVYoVmn';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RÉCUPÉRATION DES ÉLÉMENTS ---
const loginScreen = document.getElementById('login-screen');
const hubScreen = document.getElementById('hub-screen');

const loginBtn = document.getElementById('discord-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const notifBtn = document.getElementById('notif-btn');
const adminzoneBtn = document.getElementById('adminzone-btn');

// --- FONCTIONS D'AFFICHAGE ---
function showHub() {
  loginScreen.classList.remove('active');
  hubScreen.classList.add('active');
}

function showLogin() {
  hubScreen.classList.remove('active');
  loginScreen.classList.add('active');
}

// --- VÉRIFICATION INITIALE ---
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showHub();
  } else {
    showLogin();
  }
}

checkSession();

// --- ÉCOUTEUR D'ÉVÉNEMENTS (Le correctif est ici !) ---
// Ça écoute les changements de connexion en temps réel
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    showHub(); // Dès que la connexion est validée, on affiche le Hub
  } else {
    showLogin(); // Si on se déconnecte, on affiche le login
  }
});

// --- CONNEXION ---
loginBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error('Erreur de connexion :', error.message);
    alert('Erreur de connexion, vérifie la console.');
  }
});

// --- DÉCONNEXION ---
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// --- BOUTON NOTIFICATION ---
notifBtn.addEventListener('click', () => {
  alert("Aucune nouvelle notification pour le moment ! 🔔");
});

// --- BOUTON ADMINZONE ---
adminzoneBtn.addEventListener('click', (e) => {
  e.preventDefault();
  alert("⛔ Accès refusé. Vous n'avez pas les permissions d'administrateur.");
});