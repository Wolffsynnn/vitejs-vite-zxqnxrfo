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

const loginBtn = document.getElementById('discord-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const notifBtn = document.getElementById('notif-btn');
const adminzoneBtn = document.getElementById('adminzone-btn');
const craftidBtn = document.getElementById('craftid-btn');
const backToHubBtn = document.getElementById('back-to-hub-btn');

const onboardingForm = document.getElementById('onboarding-form');
const saveProfileBtn = document.getElementById('save-profile-btn');

// --- FONCTIONS D'AFFICHAGE ---
function showScreen(screenToShow) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
}

// --- LOGIQUE PRINCIPALE (Vérification Session & Profil) ---
async function checkUser() {
  // 1. On vérifie si l'utilisateur est connecté
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    showScreen(loginScreen);
    return;
  }

  // 2. Il est connecté, on vérifie s'il a déjà un profil dans la table "profiles"
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Erreur de lecture du profil :", error);
  }

  if (!profile) {
    // Pas de profil -> On affiche le formulaire
    showScreen(onboardingScreen);
  } else {
    // Profil existant -> On affiche le Hub
    showScreen(hubScreen);
  }
}

// Lancement au chargement
checkUser();

// Écouteur de connexion/déconnexion
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    checkUser();
  } else {
    showScreen(loginScreen);
  }
});

// --- CONNEXION ---
loginBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: window.location.origin }
  });
  if (error) console.error("Erreur connexion", error);
});

// --- DÉCONNEXION ---
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// --- SAUVEGARDE DU FORMULAIRE (ONBOARDING) ---
onboardingForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Empêche la page de se recharger
  
  saveProfileBtn.innerText = "Enregistrement...";
  saveProfileBtn.disabled = true;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Récupération des valeurs du formulaire
  const pseudoEuria = document.getElementById('pseudo-euria').value;
  const pseudoMc = document.getElementById('pseudo-mc').value;
  const nomRp = document.getElementById('nom-rp').value;
  const ageRp = parseInt(document.getElementById('age-rp').value);

  // Insertion dans Supabase
  const { error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: session.user.id, 
        pseudo_euria: pseudoEuria, 
        pseudo_minecraft: pseudoMc, 
        nom_rp: nomRp, 
        age_rp: ageRp,
        updated_at: new Date()
      }
    ]);

  if (error) {
    console.error("Erreur d'enregistrement :", error);
    alert("Erreur lors de la création du profil.");
    saveProfileBtn.innerText = "Créer mon profil";
    saveProfileBtn.disabled = false;
  } else {
    // Succès ! On va sur le Hub
    showScreen(hubScreen);
  }
});

// --- BOUTONS DU HUB ---
notifBtn.addEventListener('click', () => {
  alert("Aucune nouvelle notification pour le moment !");
});

adminzoneBtn.addEventListener('click', (e) => {
  e.preventDefault();
  alert("⛔ Accès refusé. Vous n'avez pas les permissions d'administrateur.");
});

// --- PAGE CRAFTID (Profil) ---
craftidBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  // On récupère les données de l'utilisateur connecté
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // On récupère les données Discord (Avatar, Pseudo)
  const user = session.user;
  const avatarUrl = user.user_metadata.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'; // Avatar par défaut
  const discordName = user.user_metadata.full_name || user.user_metadata.name;

  // On récupère le profil RP dans la base de données
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // On remplit la page avec les infos
  document.getElementById('user-avatar').src = avatarUrl;
  document.getElementById('user-name').innerText = discordName;
  
  if (profile) {
    document.getElementById('user-rp-name').innerText = profile.nom_rp;
    document.getElementById('user-mc').innerText = profile.pseudo_minecraft;
    document.getElementById('user-age').innerText = profile.age_rp + " ans";
  }
  
  document.getElementById('user-id').innerText = user.id;

  // On affiche l'écran CraftID
  showScreen(craftidScreen);
});

// --- RETOUR AU HUB ---
backToHubBtn.addEventListener('click', () => {
  showScreen(hubScreen);
});