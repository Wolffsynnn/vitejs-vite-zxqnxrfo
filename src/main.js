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

// Boutons de navigation
const craftidBtn = document.getElementById('craftid-btn');
const backToHubBtn = document.getElementById('back-to-hub-btn');
const paycraftBtn = document.querySelector('.apps-grid a:nth-child(1)'); // L'icône PayCraft
const backFromPaycraftBtn = document.getElementById('back-from-paycraft-btn');

// Formulaire PayCraft
const transferForm = document.getElementById('transfer-form');

// --- FONCTIONS D'AFFICHAGE ---
function showScreen(screenToShow) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
}

// --- LOGIQUE PRINCIPALE (Vérification Session & Profil) ---
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    showScreen(loginScreen);
    return;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    showScreen(onboardingScreen);
  } else {
    showScreen(hubScreen);
  }
}

checkUser();

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    checkUser();
  } else {
    showScreen(loginScreen);
  }
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

// --- SAUVEGARDE DU FORMULAIRE (ONBOARDING) ---
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

  const { error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: session.user.id, 
        pseudo_euria: pseudoEuria, 
        pseudo_minecraft: pseudoMc, 
        nom_rp: nomRp, 
        age_rp: ageRp
      }
    ]);

  if (error) {
    alert("Erreur lors de la création du profil.");
    saveProfileBtn.innerText = "Créer mon profil";
    saveProfileBtn.disabled = false;
  } else {
    showScreen(hubScreen);
  }
});

// --- BOUTONS DU HUB ---
notifBtn.addEventListener('click', () => alert("Aucune nouvelle notification !"));
adminzoneBtn.addEventListener('click', (e) => {
  e.preventDefault();
  alert("⛔ Accès refusé.");
});

// --- PAGE CRAFTID (Profil) ---
craftidBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const user = session.user;
  const avatarUrl = user.user_metadata.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const discordName = user.user_metadata.full_name || user.user_metadata.name;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  document.getElementById('user-avatar').src = avatarUrl;
  document.getElementById('user-name').innerText = discordName;
  
  if (profile) {
    document.getElementById('user-rp-name').innerText = profile.nom_rp;
    document.getElementById('user-mc').innerText = profile.pseudo_minecraft;
    document.getElementById('user-age').innerText = profile.age_rp + " ans";
    // Optionnel : Afficher le code EURIA sur le profil aussi
    // document.getElementById('user-id').innerText = profile.euria_code; 
  }
  
  document.getElementById('user-id').innerText = user.id;
  showScreen(craftidScreen);
});

backToHubBtn.addEventListener('click', () => showScreen(hubScreen));


// --- LOGIQUE PAYCRAFT ---

// Ouvrir PayCraft
paycraftBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance, euria_code')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    document.getElementById('paycraft-balance').innerText = (profile.balance || 1000) + " Euria";
    document.getElementById('paycraft-code').innerText = profile.euria_code || "Génération...";
  }

  showScreen(paycraftScreen);
});

// Retour au Hub depuis PayCraft
backFromPaycraftBtn.addEventListener('click', () => showScreen(hubScreen));

// Envoyer un virement
transferForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const receiverInput = document.getElementById('transfer-receiver').value.trim();
  const amount = parseInt(document.getElementById('transfer-amount').value);
  const reason = document.getElementById('transfer-reason').value.trim();

  // 1. Chercher le destinataire
  const { data: receiverProfile, error: searchError } = await supabase
    .from('profiles')
    .select('id, pseudo_euria, balance')
    .or(`pseudo_euria.eq.${receiverInput},euria_code.eq.${receiverInput}`)
    .single();

  if (searchError || !receiverProfile) {
    alert("❌ Destinataire introuvable.");
    return;
  }

  if (receiverProfile.id === session.user.id) {
    alert("❌ Vous ne pouvez pas vous envoyer de l'argent.");
    return;
  }

  // 2. Vérifier le solde de l'expéditeur
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', session.user.id)
    .single();

  if ((senderProfile.balance || 1000) < amount) {
    alert("❌ Fonds insuffisants !");
    return;
  }

  // 3. Confirmation
  if (!window.confirm(`Envoyer ${amount} Euria à ${receiverProfile.pseudo_euria} ?`)) return;

  // 4. Effectuer le virement
  await supabase.from('profiles').update({ balance: (senderProfile.balance || 1000) - amount }).eq('id', session.user.id);
  await supabase.from('profiles').update({ balance: (receiverProfile.balance || 1000) + amount }).eq('id', receiverProfile.id);

  // 5. Historique
  await supabase.from('transactions').insert({
    sender_id: session.user.id,
    receiver_id: receiverProfile.id,
    amount: amount,
    reason: reason
  });

  alert(`✅ Virement de ${amount} Euria effectué vers ${receiverProfile.pseudo_euria} !`);
  document.getElementById('paycraft-balance').innerText = ((senderProfile.balance || 1000) - amount) + " Euria";
  transferForm.reset();
});