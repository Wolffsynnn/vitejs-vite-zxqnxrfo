import { createClient } from '@supabase/supabase-js';

// Tes infos Supabase
const supabaseUrl = 'https://beythkafwrxypqhlhdjl.supabase.co';
const supabaseKey = 'sb_publishable_88QM0sCElcl_eIvRViVjrg_gYVYoVmn';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RÉCUPÉRATION DES ÉLÉMENTS ---
const loginScreen = document.getElementById('login-screen');
const onboardingScreen = document.getElementById('onboarding-screen');
const hubScreen = document.getElementById('hub-screen');
const craftidScreen = document.getElementById('craftid-screen');
const paycraftScreen = document.getElementById('paycraft-screen');

const loginBtn = document.getElementById('discord-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const notifBtn = document.getElementById('notif-btn');
const adminzoneBtn = document.getElementById('adminzone-btn');

const onboardingForm = document.getElementById('onboarding-form');
const saveProfileBtn = document.getElementById('save-profile-btn');

const craftidBtn = document.getElementById('craftid-btn');
const backToHubBtn = document.getElementById('back-to-hub-btn');
const paycraftBtn = document.querySelector('.apps-grid a:nth-child(1)'); 
const backFromPaycraftBtn = document.getElementById('back-from-paycraft-btn');

// --- GESTION DES ÉCRANS ---
function showScreen(screenToShow) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
}

// --- LOGIQUE PRINCIPALE (Session & Profil) ---
async function checkUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Erreur session:", sessionError);
    showScreen(loginScreen);
    return;
  }

  if (!session) {
    showScreen(loginScreen);
    return;
  }

  // On cherche le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle(); // maybeSingle() évite les erreurs si la table est vide

  console.log("Résultat recherche profil :", profile, profileError);

  // Si pas de profil (ou erreur), on affiche le formulaire
  if (!profile || profileError) {
    showScreen(onboardingScreen);
  } else {
    showScreen(hubScreen);
  }
}
checkUser();

supabase.auth.onAuthStateChange((event, session) => {
  if (session) checkUser();
  else showScreen(loginScreen);
});

// --- CONNEXION / DÉCONNEXION ---
loginBtn.addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: window.location.origin }
  });
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// --- ONBOARDING ---
onboardingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveProfileBtn.innerText = "Enregistrement...";
  saveProfileBtn.disabled = true;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const pseudoEuria = document.getElementById('pseudo-euria').value;
  const pseudoMc = document.getElementById('pseudo-mc').value;
  const nomRp = document.getElementById('nom-rp').value;
  const ageRp = parseInt(document.getElementById('age-rp').value);

  // Génération manuelle du code EURIA au cas où
  const euriaCode = 'EURIA-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);

  const { error } = await supabase.from('profiles').insert([{ 
    id: session.user.id, 
    pseudo_euria: pseudoEuria, 
    pseudo_minecraft: pseudoMc, 
    nom_rp: nomRp, 
    age_rp: ageRp,
    euria_code: euriaCode,
    balance: 1000
  }]);

  if (error) {
    alert("Erreur: " + error.message);
    saveProfileBtn.innerText = "Créer mon profil";
    saveProfileBtn.disabled = false;
  } else {
    showScreen(hubScreen);
  }
});

// --- CRAFTID ---
craftidBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const user = session.user;
  document.getElementById('user-avatar').src = user.user_metadata.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png';
  document.getElementById('user-name').innerText = user.user_metadata.full_name || user.user_metadata.name;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile) {
    document.getElementById('user-rp-name').innerText = profile.nom_rp;
    document.getElementById('user-mc').innerText = profile.pseudo_minecraft;
    document.getElementById('user-age').innerText = profile.age_rp + " ans";
    document.getElementById('user-id').innerText = profile.euria_code || user.id; // Affiche le code EURIA
  }
  showScreen(craftidScreen);
});
backToHubBtn.addEventListener('click', () => showScreen(hubScreen));

// --- BOUTONS DIVERS ---
notifBtn.addEventListener('click', () => alert("Aucune notification."));
adminzoneBtn.addEventListener('click', (e) => { e.preventDefault(); alert("⛔ Accès refusé."); });


// ==========================================
// --- LOGIQUE PAYCRAFT (MENU & FORMULAIRES) -
// ==========================================

// Éléments du menu PayCraft
const paycraftMenu = document.getElementById('paycraft-menu');
const paycraftContent = document.getElementById('paycraft-content');
const paycraftForms = document.querySelectorAll('.paycraft-form');
const paycraftBackMenuBtn = document.getElementById('paycraft-back-menu');
const menuButtons = document.querySelectorAll('.paycraft-menu-btn');

// Ouvrir PayCraft
paycraftBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabase.from('profiles').select('balance, euria_code').eq('id', session.user.id).single();
  if (profile) {
    document.getElementById('paycraft-balance').innerText = (profile.balance || 1000) + " Euria";
    document.getElementById('paycraft-code').innerText = profile.euria_code || "Génération...";
  }

  // Reset le menu à l'état initial
  paycraftMenu.style.display = 'grid';
  paycraftContent.style.display = 'none';
  paycraftForms.forEach(f => f.style.display = 'none');

  showScreen(paycraftScreen);
});

// Retour au Hub
backFromPaycraftBtn.addEventListener('click', () => showScreen(hubScreen));

// Navigation dans le menu PayCraft
menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    paycraftMenu.style.display = 'none';
    paycraftContent.style.display = 'block';
    
    // Cacher tous les formulaires
    paycraftForms.forEach(f => f.style.display = 'none');
    
    // Afficher le bon formulaire
    const target = btn.getAttribute('data-target');
    document.getElementById(`form-${target}`).style.display = 'block';
  });
});

// Bouton retour au menu depuis un formulaire
paycraftBackMenuBtn.addEventListener('click', () => {
  paycraftMenu.style.display = 'grid';
  paycraftContent.style.display = 'none';
});

// --- FORMULAIRE 1 : VIREMENT ---
document.getElementById('form-virement').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const receiverInput = document.getElementById('transfer-receiver').value.trim();
  const amount = parseInt(document.getElementById('transfer-amount').value);
  const reason = document.getElementById('transfer-reason').value.trim();

  const { data: receiver } = await supabase.from('profiles').select('id, pseudo_euria, balance').or(`pseudo_euria.eq.${receiverInput},euria_code.eq.${receiverInput}`).single();

  if (!receiver) return alert("❌ Destinataire introuvable.");
  if (receiver.id === session.user.id) return alert("❌ Impossible de s'envoyer de l'argent.");

  const { data: sender } = await supabase.from('profiles').select('balance').eq('id', session.user.id).single();
  if (sender.balance < amount) return alert("❌ Fonds insuffisants.");

  if (!window.confirm(`Envoyer ${amount} Euria à ${receiver.pseudo_euria} ?`)) return;

  await supabase.from('profiles').update({ balance: sender.balance - amount }).eq('id', session.user.id);
  await supabase.from('profiles').update({ balance: receiver.balance + amount }).eq('id', receiver.id);
  await supabase.from('transactions').insert({ sender_id: session.user.id, receiver_id: receiver.id, amount, reason });

  alert(`✅ Virement de ${amount} Euria effectué !`);
  document.getElementById('paycraft-balance').innerText = (sender.balance - amount) + " Euria";
  document.getElementById('form-virement').reset();
  paycraftBackMenuBtn.click(); // Retour au menu
});

// --- FORMULAIRE 2 : DEMANDE D'ARGENT ---
document.getElementById('form-demande').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const amount = parseInt(document.getElementById('demande-amount').value);
  const reason = document.getElementById('demande-reason').value;

  const { error } = await supabase.from('money_requests').insert([{ user_id: session.user.id, amount, reason }]);

  if (error) return alert("❌ Erreur lors de l'envoi.");
  
  alert("✅ Demande envoyée au staff !");
  document.getElementById('form-demande').reset();
  paycraftBackMenuBtn.click();
});

// --- FORMULAIRE 3 : SIGNALEMENT ---
document.getElementById('form-signalement').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Note : Pour l'instant on l'enregistre dans money_requests avec un montant à 0 pour faire simple
  const player = document.getElementById('signal-player').value;
  const reason = document.getElementById('signal-reason').value;
  const fullReason = `[SIGNALEMENT] Joueur concerné : ${player} - Détails : ${reason}`;

  const { error } = await supabase.from('money_requests').insert([{ user_id: session.user.id, amount: 0, reason: fullReason, status: 'SIGNAL' }]);

  if (error) return alert("❌ Erreur lors de l'envoi.");
  
  alert("🚨 Signalement transmis au staff !");
  document.getElementById('form-signalement').reset();
  paycraftBackMenuBtn.click();
});