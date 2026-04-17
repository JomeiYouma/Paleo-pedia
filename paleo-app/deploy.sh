#!/bin/bash
# deploy.sh — Déploiement Paleo Cartels sur o2switch
# Usage (depuis le dossier de l'app sur le serveur) : bash deploy.sh
#
# Pré-requis (à faire UNE SEULE FOIS sur o2switch) :
#   1. Créer le dossier persistant : mkdir ~/paleo-uploads
#   2. Migrer les images existantes : mv ~/ton-dossier-app/public/images/* ~/paleo-uploads/
#   3. Ajouter dans .env : UPLOADS_DIR=/home/ton_cpanel_user/paleo-uploads
#   4. Rendre ce script exécutable : chmod +x deploy.sh

set -e

echo "🌿 Déploiement Paleo Cartels..."

# 1. Récupérer le code (les images ne sont pas dans Git, rien à craindre)
git pull origin main

# 2. Installer les dépendances de production
npm install --omit=dev

# 3. Construire le frontend React
npm run build

# 4. Redémarrer l'application Node.js sur o2switch
#    o2switch utilise Phusion Passenger — deux options selon la config :
#
#    Option A (automatique via Passenger) :
mkdir -p tmp && touch tmp/restart.txt
#
#    Option B (si A ne suffit pas) : aller dans cPanel > Setup Node.js App > Restart
#    Option C (si accès SSH complet) : kill l'ancien process et relancer node server/server.js

echo ""
echo "✅ Déploiement terminé."
echo "   Images stockées dans : ${UPLOADS_DIR:-public/images (configurer UPLOADS_DIR dans .env)}"
