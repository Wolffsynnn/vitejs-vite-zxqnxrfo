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
const maploadScreen = document.getElementById('mapload-screen');
const emessageScreen = document.getElementById('emessage-screen');

const loginBtn = document.getElementById('discord-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const notifBtn = document.getElementById('notif-btn');
const adminzoneBtn = document.getElementById('adminzone-btn');

const onboardingForm = document.getElementById('onboarding-form');
const saveProfileBtn = document.getElementById('save-profile-btn');

const craftidBtn = document.getElementById('craftid-btn');
const paycraftBtn = document.getElementById('paycraft-btn');
const maploadBtn = document.getElementById('mapload-btn');
const emessageBtn = document.getElementById('emessage-btn');

// Navigation retour
const backToHubBtn = document.getElementById('back-to-hub-btn');
const backFromPaycraftBtn = document.getElementById('back-from-paycraft-btn');
const backFromMaploadBtn = document.getElementById('back-from-mapload-btn');
const backFromEmessageBtn = document.getElementById('back-from-emessage-btn');

// --- GESTION DES ÉCRANS ---
function showScreen(screenToShow) {
  if (!screenToShow) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenToShow.classList.add('active');
}

// --- LOGIQUE PRINCIPALE ---
async function checkUser() {
  await new Promise(resolve => setTimeout(resolve, 500));
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    showScreen(loginScreen);
    return;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();

  if (!profile) {
    showScreen(onboardingScreen);
  } else {
    showScreen(hubScreen);
  }
}
checkUser();

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') checkUser();
  if (event === 'SIGNED_OUT') showScreen(loginScreen);
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
  const euriaCode = 'EURIA-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);

  const { error } = await supabase.from('profiles').upsert([{ 
    id: session.user.id, pseudo_euria: pseudoEuria, pseudo_minecraft: pseudoMc, nom_rp: nomRp, age_rp: ageRp, euria_code: euriaCode, balance: 1000
  }]);

  if (error) {
    alert("Erreur: " + error.message);
    saveProfileBtn.innerText = "Créer mon profil";
    saveProfileBtn.disabled = false;
  } else {
    showScreen(hubScreen);
  }
});

// --- BOUTONS DIVERS ---
notifBtn.addEventListener('click', () => alert("Aucune notification."));
adminzoneBtn.addEventListener('click', (e) => { e.preventDefault(); alert("⛔ Accès refusé."); });

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
    document.getElementById('user-id').innerText = profile.euria_code;
  }
  showScreen(craftidScreen);
});

// --- PAYCRAFT (Logique existante) ---
const paycraftMenu = document.getElementById('paycraft-menu');
const paycraftContent = document.getElementById('paycraft-content');
const paycraftForms = document.querySelectorAll('.paycraft-form');
const paycraftBackMenuBtn = document.getElementById('paycraft-back-menu');
const menuButtons = document.querySelectorAll('.paycraft-menu-btn');

paycraftBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { data: profile } = await supabase.from('profiles').select('balance, euria_code').eq('id', session.user.id).single();
  if (profile) {
    document.getElementById('paycraft-balance').innerText = (profile.balance || 1000) + " Euria";
    document.getElementById('paycraft-code').innerText = profile.euria_code || "---";
  }
  paycraftMenu.style.display = 'grid';
  paycraftContent.style.display = 'none';
  paycraftForms.forEach(f => f.style.display = 'none');
  showScreen(paycraftScreen);
});

menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    paycraftMenu.style.display = 'none';
    paycraftContent.style.display = 'block';
    paycraftForms.forEach(f => f.style.display = 'none');
    const target = btn.getAttribute('data-target');
    document.getElementById(`form-${target}`).style.display = 'block';
  });
});

paycraftBackMenuBtn.addEventListener('click', () => {
  paycraftMenu.style.display = 'grid';
  paycraftContent.style.display = 'none';
});

const virementForm = document.getElementById('form-virement');
virementForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const receiverInput = document.getElementById('transfer-receiver').value.trim();
  const amount = parseInt(document.getElementById('transfer-amount').value);
  const reason = document.getElementById('transfer-reason').value.trim();

  const { data: receiver } = await supabase.from('profiles').select('id, pseudo_euria, balance').or(`pseudo_euria.ilike.%${receiverInput}%,euria_code.ilike.%${receiverInput}%`).maybeSingle();
  if (!receiver) return alert("❌ Destinataire introuvable.");
  if (receiver.id === session.user.id) return alert("❌ Impossible de s'envoyer de l'argent.");
  const { data: sender } = await supabase.from('profiles').select('balance').eq('id', session.user.id).single();
  if (sender.balance < amount) return alert("❌ Fonds insuffisants.");
  if (!window.confirm(`Envoyer ${amount} Euria à ${receiver.pseudo_euria} ?`)) return;

  const { error } = await supabase.rpc('transfer_money', { sender: session.user.id, receiver: receiver.id, amount: amount });
  if (error) return alert("❌ Erreur lors du virement.");

  await supabase.from('transactions').insert({ sender_id: session.user.id, receiver_id: receiver.id, amount, reason });
  alert(`✅ Virement effectué !`);
  document.getElementById('paycraft-balance').innerText = (sender.balance - amount) + " Euria";
  virementForm.reset();
  paycraftBackMenuBtn.click();
});

document.getElementById('form-demande').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  const amount = parseInt(document.getElementById('demande-amount').value);
  const reason = document.getElementById('demande-reason').value;
  await supabase.from('money_requests').insert([{ user_id: session.user.id, amount, reason }]);
  alert("✅ Demande envoyée !");
  e.target.reset();
  paycraftBackMenuBtn.click();
});

document.getElementById('form-signalement').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  const player = document.getElementById('signal-player').value;
  const reason = document.getElementById('signal-reason').value;
  await supabase.from('money_requests').insert([{ user_id: session.user.id, amount: 0, reason: `[SIGNALEMENT] ${player} : ${reason}`, status: 'SIGNAL' }]);
  alert("🚨 Signalement transmis !");
  e.target.reset();
  paycraftBackMenuBtn.click();
});


// ==========================================
// --- LOGIQUE MAPLOAD ---
// ==========================================
const maploadMenu = document.getElementById('mapload-menu');
const maploadTerrains = document.getElementById('mapload-terrains');
const maploadForm = document.getElementById('mapload-form');
const landRequestForm = document.getElementById('land-request-form');

maploadBtn.addEventListener('click', (e) => {
  e.preventDefault();
  maploadMenu.style.display = 'block';
  maploadTerrains.style.display = 'none';
  maploadForm.style.display = 'none';
  showScreen(maploadScreen);
});

document.getElementById('btn-view-map').addEventListener('click', () => {
  alert("🗺️ Désolé, la carte interactive est en cours de développement et sera disponible très bientôt !");
});

document.getElementById('btn-buy-land').addEventListener('click', () => {
  maploadMenu.style.display = 'none';
  maploadTerrains.style.display = 'block';
});

document.getElementById('back-to-mapload-menu').addEventListener('click', () => {
  maploadMenu.style.display = 'block';
  maploadTerrains.style.display = 'none';
});

document.getElementById('back-to-terrains').addEventListener('click', () => {
  maploadTerrains.style.display = 'block';
  maploadForm.style.display = 'none';
});

// Sélection du terrain
document.querySelectorAll('.terrain-card').forEach(card => {
  card.addEventListener('click', () => {
    const size = card.getAttribute('data-size');
    const price = card.getAttribute('data-price');
    const dim = card.getAttribute('data-dim');
    
    document.getElementById('selected-size').value = size;
    document.getElementById('selected-price').value = price;
    document.getElementById('selected-dim').value = dim;
    document.getElementById('selected-terrain-title').innerText = `Demande : Terrain ${size} (${dim}) - ${price} Euria`;

    maploadTerrains.style.display = 'none';
    maploadForm.style.display = 'block';
  });
});

// Sélection de la ville
document.querySelectorAll('.city-card').forEach(card => {
  card.addEventListener('click', () => {
    if (card.getAttribute('data-city') === 'Nolway') {
      alert("Nolway est en construction, revenez plus tard !");
      return;
    }
    document.querySelectorAll('.city-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    document.getElementById('selected-city').value = card.getAttribute('data-city');
  });
});

// Envoi de la demande de terrain
landRequestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const size = document.getElementById('selected-size').value;
  const price = parseInt(document.getElementById('selected-price').value);
  const reason = document.getElementById('land-reason').value;
  const coords = document.getElementById('land-coords').value;
  const city = document.getElementById('selected-city').value;

  if (!city) return alert("Veuillez sélectionner une ville.");

  // 1. Enregistrement de la demande
  const { data: landData, error } = await supabase.from('land_requests').insert([{
    user_id: session.user.id, terrain_name: city, size, price, coordinates: coords, status: 'PENDING'
  }]).select().single();

  if (error) return alert("❌ Erreur lors de l'envoi.");

  // 2. Création de la conversation Emessage
  const subject = `Demande de terrain: ${size} à ${city}`;
  const { data: convData } = await supabase.from('conversations').insert([{
    user_id: session.user.id, subject: subject
  }]).select().single();

  if (convData) {
    // On ajoute le premier message (le récapitulatif)
    await supabase.from('messages').insert([{
      conversation_id: convData.id, sender_id: session.user.id, 
      content: `Bonjour, je souhaite acheter un terrain de type ${size} (${price} Euria) à ${city}.\nMotif: ${reason}\nCoordonnées: ${coords}`
    }]);
  }

  alert("✅ Demande envoyée ! Un admin va vous répondre dans Emessage.");
  landRequestForm.reset();
  document.querySelectorAll('.city-card').forEach(c => c.classList.remove('active'));
  showScreen(emessageScreen);
  loadConversations(); // Recharge la messagerie
});

// ==========================================
// --- LOGIQUE EMESSAGE ---
// ==========================================
let currentConversationId = null;

async function loadConversations() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // On récupère ton profil pour voir si tu es admin
  const { data: myProfile, error } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
  
  if (error) {
    console.error("Erreur de lecture du profil admin :", error);
  }

  const isAdmin = myProfile?.is_admin || false;
  console.log("Est-ce que je suis admin ?", isAdmin); // Ça affichera true ou false dans la console (F12)

  // Si tu es admin, on charge TOUTES les conversations
  let query = supabase.from('conversations').select('*').order('created_at', { ascending: false });
  
  if (!isAdmin) {
    query = query.eq('user_id', session.user.id); // Sinon, juste les tiennes
  }

  const { data: convs, error: convError } = await query;
  
  if (convError) {
    console.error("Erreur de chargement des conversations :", convError);
  }

  const list = document.getElementById('conversations-list');
  list.innerHTML = '';

  if (!convs || convs.length === 0) {
    list.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">Aucune conversation</div>';
    return;
  }

  convs.forEach(conv => {
    const div = document.createElement('div');
    div.style.padding = '15px';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    div.style.cursor = 'pointer';
    div.style.fontSize = '14px';
    div.innerText = conv.subject + (isAdmin ? ' 👑' : '');
    div.onclick = () => openConversation(conv.id, conv.subject);
    list.appendChild(div);
  });
}

async function openConversation(id, subject) {
  currentConversationId = id;
  document.getElementById('chat-header').innerText = subject;
  document.getElementById('chat-header').style.display = 'block';
  document.getElementById('chat-form').style.display = 'flex';
  document.getElementById('chat-messages').innerHTML = '<div style="color: #9ca3af; text-align: center;">Chargement...</div>';

  const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
  
  const msgContainer = document.getElementById('chat-messages');
  msgContainer.innerHTML = '';

  if (!msgs || msgs.length === 0) {
    msgContainer.innerHTML = '<div style="color: #9ca3af; text-align: center;">Aucun message.</div>';
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();

  msgs.forEach(msg => {
    const isMe = msg.sender_id === session.user.id;
    const div = document.createElement('div');
    div.style.maxWidth = '80%';
    div.style.padding = '10px 15px';
    div.style.borderRadius = '12px';
    div.style.fontSize = '14px';
    div.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
    div.style.background = isMe ? '#8b5cf6' : 'rgba(255,255,255,0.1)';
    div.style.color = 'white';
    div.innerText = msg.content;
    msgContainer.appendChild(div);
  });
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

emessageBtn.addEventListener('click', (e) => {
  e.preventDefault();
  showScreen(emessageScreen);
  loadConversations();
});

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('chat-input').value.trim();
  if (!content || !currentConversationId) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('messages').insert([{
    conversation_id: currentConversationId, sender_id: session.user.id, content: content
  }]);

  document.getElementById('chat-input').value = '';
  openConversation(currentConversationId, document.getElementById('chat-header').innerText);
});

// --- BOUTONS RETOUR ---
backToHubBtn.addEventListener('click', () => showScreen(hubScreen));
backFromPaycraftBtn.addEventListener('click', () => showScreen(hubScreen));
backFromMaploadBtn.addEventListener('click', () => showScreen(hubScreen));
backFromEmessageBtn.addEventListener('click', () => showScreen(hubScreen));