-- ============================================================
-- Migration v31 — Activer les notifications email des messages publics
-- ============================================================
-- Le type d'événement `contact_message.created` (formulaire /contact + nouveau
-- formulaire « Participer au projet ») était seedé DÉSACTIVÉ : aucun email ne
-- partait, les messages s'accumulaient en base sans notifier l'équipe.
--
-- On l'active et on fixe le destinataire par défaut (modifiable ensuite dans
-- l'admin : Système → Journal d'événements → notifications email).
--
-- Idempotent : le garde `recipient = ''` évite d'écraser un destinataire déjà
-- configuré manuellement si la migration est rejouée.

UPDATE `event_email_config`
   SET `enabled` = 1,
       `recipient` = 'hello@atelier21.org'
 WHERE `type` = 'contact_message.created'
   AND (`recipient` = '' OR `recipient` IS NULL);
