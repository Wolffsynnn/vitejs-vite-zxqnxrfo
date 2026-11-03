import { createClient } from '@supabase/supabase-js';

// Tes infos Supabase
const supabaseUrl = 'https://beythkafwrxypqhlhdjl.supabase.co';
const supabaseKey = 'sb_publishable_88QM0sCElcl_eIvRViVjrg_gYVYoVmn';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RÉCUPÉRATION SÉCURISÉE DES ÉLÉMENTS ---
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
// On cible l'icône PayCraft par son lien (plus sûr que nth-child)
const paycraftBtn = document.getElementById('paycraft-btn');
const backFromPaycraftBtn = document.getElementById('back-from-paycraft-btn');

// --- GESTION DES ÉCRANS ---
function showScreen(screenToShow) {
  if (!screenToShow) return; // Sécurité
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
}

// --- LOGIQUE PRINCIPALE (Session & Profil) ---
async function checkUser() {
  // On attend un petit peu que Supabase charge la session (surtout après Discord)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    showScreen(loginScreen);
    return;
  }

  // On cherche le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erreur recherche profil:", profileError);
  }

  // Si pas de profil, on force le formulaire !
  if (!profile) {
    showScreen(onboardingScreen);
  } else {
    showScreen(hubScreen);
  }
}

// On lance la vérification au démarrage
setTimeout(checkUser, 500); // Petit délai de sécurité

// On écoute les changements (connexion/déconnexion)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') checkUser();
  if (event === 'SIGNED_OUT') showScreen(loginScreen);
});

// --- CONNEXION / DÉCONNEXION ---
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    });
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });
}

// --- ONBOARDING (Création du profil) ---
if (onboardingForm) {
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
}

// --- CRAFTID ---
if (craftidBtn) {
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
      document.getElementById('user-id').innerText = profile.euria_code || user.id; 
    }
    showScreen(craftidScreen);
  });
}

if (backToHubBtn) {
  backToHubBtn.addEventListener('click', () => showScreen(hubScreen));
}

// --- BOUTONS DIVERS ---
if (notifBtn) notifBtn.addEventListener('click', () => alert("Aucune notification."));
if (adminzoneBtn) adminzoneBtn.addEventListener('click', (e) => { e.preventDefault(); alert("⛔ Accès refusé."); });


// ==========================================
// --- LOGIQUE PAYCRAFT (MENU & FORMULAIRES) -
// ==========================================
const paycraftMenu = document.getElementById('paycraft-menu');
const paycraftContent = document.getElementById('paycraft-content');
const paycraftForms = document.querySelectorAll('.paycraft-form');
const paycraftBackMenuBtn = document.getElementById('paycraft-back-menu');
const menuButtons = document.querySelectorAll('.paycraft-menu-btn');

if (paycraftBtn) {
  paycraftBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase.from('profiles').select('balance, euria_code').eq('id', session.user.id).single();
    if (profile) {
      document.getElementById('paycraft-balance').innerText = (profile.balance || 1000) + " Euria";
      document.getElementById('paycraft-code').innerText = profile.euria_code || "Génération...";
    }

    if (paycraftMenu) paycraftMenu.style.display = 'grid';
    if (paycraftContent) paycraftContent.style.display = 'none';
    paycraftForms.forEach(f => f.style.display = 'none');

    showScreen(paycraftScreen);
  });
}

if (backFromPaycraftBtn) backFromPaycraftBtn.addEventListener('click', () => showScreen(hubScreen));

if (menuButtons.length > 0) {
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (paycraftMenu) paycraftMenu.style.display = 'none';
      if (paycraftContent) paycraftContent.style.display = 'block';
      
      paycraftForms.forEach(f => f.style.display = 'none');
      
      const target = btn.getAttribute('data-target');
      const targetForm = document.getElementById(`form-${target}`);
      if (targetForm) targetForm.style.display = 'block';
    });
  });
}

if (paycraftBackMenuBtn) {
  paycraftBackMenuBtn.addEventListener('click', () => {
    if (paycraftMenu) paycraftMenu.style.display = 'grid';
    if (paycraftContent) paycraftContent.style.display = 'none';
  });
}

// --- FORMULAIRE 1 : VIREMENT ---
const virementForm = document.getElementById('form-virement');
if (virementForm) {
  virementForm.addEventListener('submit', async (e) => {
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
    virementForm.reset();
    if (paycraftBackMenuBtn) paycraftBackMenuBtn.click(); 
  });
}

// --- FORMULAIRE 2 : DEMANDE D'ARGENT ---
const demandeForm = document.getElementById('form-demande');
if (demandeForm) {
  demandeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const amount = parseInt(document.getElementById('demande-amount').value);
    const reason = document.getElementById('demande-reason').value;

    const { error } = await supabase.from('money_requests').insert([{ user_id: session.user.id, amount, reason }]);

    if (error) return alert("❌ Erreur lors de l'envoi.");
    
    alert("✅ Demande envoyée au staff !");
    demandeForm.reset();
    if (paycraftBackMenuBtn) paycraftBackMenuBtn.click();
  });
}

// --- FORMULAIRE 3 : SIGNALEMENT ---
const signalementForm = document.getElementById('form-signalement');
if (signalementForm) {
  signalementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const player = document.getElementById('signal-player').value;
    const reason = document.getElementById('signal-reason').value;
    const fullReason = `[SIGNALEMENT] Joueur concerné : ${player} - Détails : ${reason}`;

    const { error } = await supabase.from('money_requests').insert([{ user_id: session.user.id, amount: 0, reason: fullReason, status: 'SIGNAL' }]);

    if (error) return alert("❌ Erreur lors de l'envoi.");
    
    alert("🚨 Signalement transmis au staff !");
    signalementForm.reset();
    if (paycraftBackMenuBtn) paycraftBackMenuBtn.click();
  });
}