import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACE CES DEUX LIGNES PAR TES VRAIES INFOS SUPABASE
const supabaseUrl = 'https://beythkafwrxypqhlhdjl.supabase.co';
const supabaseKey = 'sb_publishable_88QM0sCElcl_eIvRViVjrg_gYVYoVmn';

const supabase = createClient(supabaseUrl, supabaseKey);

// On récupère le bouton
const loginBtn = document.getElementById('discord-login-btn');

// On lance la connexion au clic
loginBtn.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin, // Revient sur ton site après la connexion
    },
  });

  if (error) {
    console.error('Erreur de connexion :', error.message);
    alert('Erreur de connexion, vérifie la console.');
  }
});
