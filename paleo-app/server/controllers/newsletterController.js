/**
 * newsletterController.js
 * Inscription publique à la newsletter, relayée vers Sendy (auto-hébergé) via
 * son API POST /subscribe. On passe par un proxy serveur plutôt que par un
 * POST direct navigateur → Sendy pour :
 *   - ne pas exposer l'ID de liste Sendy au client ;
 *   - éviter le blocage CORS (Sendy ne renvoie pas d'en-tête CORS, le
 *     navigateur ne pourrait pas lire la réponse) ;
 *   - réutiliser le honeypot anti-bot du reste du site.
 *
 * Configuration via variables d'environnement :
 *   - SENDY_URL     : racine de l'installation Sendy (sans slash final)
 *   - SENDY_LIST_ID : ID de la liste (Sendy → « View all lists » → colonne ID)
 * Si l'une manque, l'endpoint répond 503 (non configuré) sans planter.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NewsletterController = {

  async subscribe(req, res) {
    try {
      const body = req.body || {};

      // Honeypot : un humain ne remplit pas ce champ caché.
      if (typeof body.website === 'string' && body.website.trim() !== '') {
        return res.status(400).json({ error: 'Requête invalide.' });
      }

      const email = (body.email || '').trim();
      const name  = (body.name || '').trim();

      if (!email) return res.status(400).json({ error: "L'e-mail est requis." });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail invalide.' });
      if (email.length > 255 || name.length > 255) return res.status(400).json({ error: 'Champs trop longs.' });

      const sendyUrl = (process.env.SENDY_URL || '').replace(/\/+$/, '');
      const listId   = process.env.SENDY_LIST_ID || '';
      const apiKey   = process.env.SENDY_API_KEY || '';
      if (!sendyUrl || !listId) {
        console.error('[newsletter] SENDY_URL ou SENDY_LIST_ID manquant : inscription impossible.');
        return res.status(503).json({ error: "L'inscription à la newsletter n'est pas encore configurée." });
      }

      // API Sendy : POST /subscribe. `boolean=true` demande une réponse en
      // texte brut ("1" = succès, sinon un message d'erreur) plutôt qu'une
      // redirection HTML vers la page « merci ». En mode API, Sendy exige aussi
      // la clé d'API (SENDY_API_KEY) sur cet endpoint.
      const params = new URLSearchParams({ email, list: listId, boolean: 'true' });
      if (name)   params.set('name', name);
      if (apiKey) params.set('api_key', apiKey);
      params.set('referrer', req.get('referer') || '');

      let sendyText;
      try {
        const r = await fetch(`${sendyUrl}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        sendyText = (await r.text()).trim();
      } catch (e) {
        console.error('[newsletter] Sendy injoignable :', e.message);
        return res.status(502).json({ error: 'Service de newsletter momentanément indisponible.' });
      }

      // Réponses Sendy (boolean=true) : "1"/"true" = succès. « Already
      // subscribed. » = déjà inscrit → on le traite comme un succès idempotent.
      const ok      = sendyText === '1' || sendyText.toLowerCase() === 'true';
      const already = /already subscribed/i.test(sendyText);
      if (ok || already) {
        return res.status(200).json({ ok: true, already });
      }

      // Erreurs de configuration (clé d'API absente/invalide, mauvais list ID) :
      // ce n'est pas la faute du visiteur → 503 « pas configuré » + log pour
      // l'admin, plutôt qu'un message technique affiché dans le formulaire.
      if (/api key|invalid list id/i.test(sendyText)) {
        console.error('[newsletter] Config Sendy invalide :', sendyText);
        return res.status(503).json({ error: "L'inscription à la newsletter n'est pas encore configurée." });
      }

      // Sinon Sendy renvoie un message destiné au visiteur ("Invalid email
      // address.", "Some fields are missing.", …). On le remonte tel quel.
      return res.status(400).json({ error: sendyText || 'Inscription impossible.' });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },
};
