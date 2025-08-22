#!/bin/bash

echo "🚀 Déploiement de Planify Frontend"
echo "=================================="

# 1. Nettoyer le build précédent
echo "🧹 Nettoyage du build précédent..."
rm -rf dist/

# 2. Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
npm install

# 3. Build du projet
echo "🔨 Build du projet..."
npm run build

# 4. Vérifier les assets
echo "🔍 Vérification des assets..."
node check-assets.js

# 5. Afficher la taille du build
echo "📊 Taille du build :"
du -sh dist/

echo ""
echo "✅ Build terminé !"
echo "📁 Dossier dist/ prêt à être uploadé sur IONOS"
echo ""
echo "💡 Instructions :"
echo "1. Uploader TOUT le contenu du dossier dist/ sur ton sous-domaine frontend"
echo "2. Remplacer complètement l'ancien contenu"
echo "3. Vider le cache navigateur (Ctrl+F5)"
echo "4. Tester le footer sur https://ton-domaine.com" 