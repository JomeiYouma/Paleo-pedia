# Manuel d'administration — Recettes (modes opératoires pas-à-pas)

> **Compagnon du _Manuel d'administration de la plateforme Paléo_.** Recettes pas-à-pas pour les tâches courantes des superadmins. Les renvois « §x » ou « chapitre x » désignent des sections du **manuel principal**.

---

### Recette A — Créer un nouveau sous-site
1. *Admin → Administration → Sous-sites thématiques → « Nouveau sous-site »*.
2. Renseignez **Nom**, vérifiez le **Slug**, choisissez la **Source** (catégorie ou atelier — **figée ensuite**).
3. Réglez **couleur**, **type de planète**, composez la **page d'accueil** (FR puis English).
4. *(Optionnel mais pratique)* Dans la section **« Compte propriétaire »**, saisissez l'**e-mail + mot de passe** de l'owner pour le créer **en même temps** (voir §8.2). Validez.
5. *(Si vous ne l'avez pas fait à l'étape 4)* Créez son **propriétaire** : *Gestion d'équipe (comptes)* → sélectionner le sous-site → inviter, puis activer **« Gérer l'équipe »**.
6. *(Optionnel)* Les **partenaires** du sous-site se règlent ensuite sur leur **page dédiée**, côté propriétaire (voir le *Manuel d'utilisation d'un site dédié*).

### Recette B — Valider une soumission d'un sous-site vers le principal
1. *Gestion → onglet **Soumissions*** (superadmin).
2. Vérifiez (Aperçu / Aperçu web).
3. **Approuver** (apparaît sur le principal, reste sur le sous-site) ou **Rejeter** (reste sur le sous-site).

### Recette C — Modérer une proposition de visiteur
1. *Gestion → onglet **En attente***.
2. **Aperçu** / **Éditer** pour vérifier/corriger.
3. **Publier** pour accepter, **Supprimer** pour refuser.

### Recette D — Recevoir par email les demandes du public
1. Faites configurer le **SMTP** par l'hébergeur (§24.5).
2. *Admin → Journal d'événements → Configuration emails*.
3. Activez **Email** + **Destinataire** pour `contact_message.created`, `mission_application.created`, `cartel.submission_pending`, `cartel.subsite_submitted` (ou « Appliquer à tous »). **Enregistrer**.

### Recette E — Préparer une borne d'exposition (mode immersif)
1. *Gestion* → sélectionnez les cartels de l'expo → **Associer à un atelier** (nouvel atelier).
2. *Admin → Catégories & ateliers* → éditez l'atelier → cochez **Immersif**.
3. Récupérez l'URL publique (**« Voir Version Publique »** → `/app/workshop/<id>`) et ouvrez-la sur la borne en plein écran.

### Recette F — Mettre à jour une page publique
- **Équipe** → *Admin → Équipe (page À propos)* · **Partenaires** → *Admin → Partenaires* · **Prestations / Boutique / Presse / Missions** → la page correspondante (chapitre 16). Remplissez la **version anglaise** et cochez **publié**.

### Recette G — Configurer la traduction automatique
1. *Admin → Réglages → Clés API*. Collez **DeepL** (FR↔EN) et/ou **OpenAI** (autres langues). **Enregistrer**.
2. Testez avec un cartel : bouton **Retraduire**.

### Recette H — Imprimer pour une exposition
1. *Gestion → Publiés*, sélectionnez → **Exporter → PDF impression** (ou JPEG ZIP). Chaque cartel porte un **QR code**.

### Recette I — Exposition à l'étranger (PDF dans une autre langue)
1. Vérifiez qu'une **clé OpenAI** est configurée.
2. Sélectionnez → **Exporter → « PDF traduit (autre langue)… »** → saisissez la langue → générez → **relisez** (non enregistré).

### Recette J — Sauvegarder / migrer les cartels
1. *Gestion* → **Exporter tout** → **Archive complète**.
2. Pour réimporter : **Importer** le ZIP → cartels en **Brouillon** → republier + ré-associer les catégories.

### Recette K — Nettoyer les images cassées
1. Ouvrez *Gestion* : la fenêtre d'audit s'affiche s'il y a des problèmes.
2. **« Voir les cartels problématiques »** → corrigez (rééditez l'image) les cas *Fichier introuvable* / *Chemin legacy*.

---


