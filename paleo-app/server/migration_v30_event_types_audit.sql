-- ============================================================
-- v30 — Audit complet du journal d'événements
-- ------------------------------------------------------------
-- Seede les types d'événements ajoutés lors de l'audit « des logs pour
-- toutes les actions possibles » : actions d'authentification/sécurité,
-- modification des réglages, import de masse, et CRUD de contenu jusque-là
-- non journalisés (presse, missions, prestations, boutique, membres
-- d'équipe « À propos », notes internes de cartels).
--
-- Inclut aussi `user.password_changed` et `user.password_reset`, émis depuis
-- le durcissement sécurité mais qui n'avaient jamais été seedés dans
-- event_email_config (donc invisibles dans /app/admin/logs tant que non
-- déclenchés).
--
-- Seuls les TYPES sont seedés (enabled=0 par défaut) : aucune notification
-- email n'est activée automatiquement. Un superadmin active au cas par cas
-- via Admin → Journal d'événements → Configuration emails.
--
-- Idempotent : INSERT IGNORE sur la clé primaire `type`. Relancer cette
-- migration ne crée pas de doublon et n'écrase aucune config existante.
--
-- À exécuter une fois en local et en prod.
-- ============================================================

INSERT IGNORE INTO `event_email_config` (`type`) VALUES
  -- Authentification / sécurité
  ('auth.login'),
  ('auth.login_failed'),
  ('auth.locked_out'),
  ('auth.register'),
  ('user.password_changed'),
  ('user.password_reset'),
  -- Réglages, import, configuration des notifications
  ('setting.updated'),
  ('cartel.imported'),
  ('event_email_config.updated'),
  -- CRUD de contenu (pages publiques)
  ('mission.created'),       ('mission.updated'),       ('mission.deleted'),
  ('press_article.created'), ('press_article.updated'), ('press_article.deleted'),
  ('prestation.created'),    ('prestation.updated'),    ('prestation.deleted'),
  ('shop_item.created'),     ('shop_item.updated'),     ('shop_item.deleted'),
  ('team_member.created'),   ('team_member.updated'),   ('team_member.deleted'),
  -- Notes internes de cartels
  ('cartel_note.created'),   ('cartel_note.deleted');
