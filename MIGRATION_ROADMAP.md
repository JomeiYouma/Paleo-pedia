## 🗺️ MIGRATION AppContext → Supabase

**Taille du projet :** AppContext = 443 lignes + pages qui l'utilisent

**Stratégie :** Migrer page-par-page + AppContext progressivement
(Plutôt que tout changer d'un coup = trop risqué)

---

## 📋 PHASE 1 : Refactoriser AppContext (30% du temps)

### Changements à AppContext.jsx

| Aspect | Ancien (3 services) | Nouveau (Supabase) | Impact |
|---|---|---|---|
| getActiveService() | Retourne local/php/github | Retourne supabaseService | -80 lignes |
| login() | password → token | email/password → JWT | Changé |
| fetchData() | service.getFileContent() | supabaseService.getCartels() | Simplifié |
| createCartel() | service.saveJson() | supabaseService.createCartel() | Simplifié |
| deleteCartel() | filter + saveJson() | supabaseService.deleteCartel() | Simplifié |
| categories | sync local/serveur | supabaseService.getCategories() | Changé |
| RLS filtering | côté client (unsafe) | côté BD (safe) | ✅ Plus sûr |

**Résultat :** AppContext passe de 443 → ~200 lignes (cleaner, plus secure)

---

## 🎯 PHASE 2 : Migrer Pages (70% du temps)

### Priorité par complexité

**Tier 1 - Simple (read-only)**
- [ ] Library.jsx → `supabaseService.getPublishedCartels()`
- [ ] LandingPage.jsx → `supabaseService.getPublishedCartels()`

**Tier 2 - Moyenne (CRUD)**
- [ ] Create.jsx → `supabaseService.createCartel/updateCartel`
- [ ] Drafts.jsx → `supabaseService.getCartelsByStatus('draft')`
- [ ] Proposals.jsx → `supabaseService.getCartelsByStatus('pending_review')`

**Tier 3 - Complexe (Admin)**
- [ ] Admin.jsx → tout les statuts + publish/delete + audit logs
- [ ] Admin Workshops → `supabaseService.getWorkshops/updateWorkshop`

---

## 🔧 REFACTORISER AppContext - Template

```javascript
// Ancien (problématique)
const getActiveService = () => {
  if (isConfigured) return githubService;
  return isDev ? localService : phpService;
};

const createCartel = async (data) => {
  const service = getActiveService();
  const newCartels = [...cartels, { id: generateId(), ...data }];
  await service.saveJson('db_cartels.json', newCartels);
  setCartels(newCartels);
};

// Nouveau (clean + sûr)
const createCartel = async (data) => {
  const cartel = await supabaseService.createCartel(data);
  setCartels(prev => [...prev, cartel]);
};
```

---

## 🧪 VALIDATION APRÈS CHAQUE PAGE

Après chaque page migrée :
1. Lancer serveur dev
2. Tester la page en action (créer, éditer, supprimer)
3. Vérifier les logs Supabase audit_logs
4. Passer à la page suivante

---

## ⚠️ Points d'Attention

1. **Categories :** Maintenant dans la BD (pas localStorage)
   - Initialiser BD avec catégories par défaut
   - Charger au démarrage

2. **Auth :** JWT token maintenant géré par Supabase
   - Plus de hardcoded `password === 'admin'`
   - AppContext doit call `supabaseService.getCurrentUser()`

3. **RLS :** Sécurité côté BD
   - Pas de besoin de vérifier permissions en JS (BD le fait)
   - Si RLS rejette → error → afficher à l'user

4. **Workshops :** Hierarchie
   - `cartel_ids: text[]` en dénormalisé
   - Sync via trigger sur cartels.origin

---

## 📅 ROADMAP EXÉCUTION

**Semaine 1 :**
- Day 1 : Refactor AppContext (login, fetchData, CRUD)
- Day 2-3 : Trier tier 1 pages (Library, LandingPage)

**Semaine 2 :**
- Day 1-2 : Tier 2 pages (Create, Drafts, Proposals)
- Day 3 : Tier 3 (Admin) + testing complet

**Semaine 3 :**
- Cleanup : supprimer local.js, phpService.js, github.js
- Security audit
- Deploy prod

---

## ✅ CHECKLIST FINALE (GO/NO-GO)

- [ ] AppContext refactorisé
- [ ] Library page migré + test
- [ ] Create page migré + test
- [ ] Admin page migré + test + audit logs visibles
- [ ] Pas d'erreur console
- [ ] Vieilles services (local.js, php, github) supprimées
- [ ] Prod ready
