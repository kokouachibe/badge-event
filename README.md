# BadgeEvent 🎭

> Générateur de badges numériques pour événements — Créez votre badge "J'y Serai" en 30 secondes !

![BadgeEvent](./assets/hero.png)

## ✨ Fonctionnalités

- 📸 **Upload photo** — Glissez-déposez ou parcourez vos fichiers (JPG, PNG, WEBP jusqu'à 10 Mo)
- 🖼️ **6 cadres stylisés** — Royal, Électro, Festival, Sport, Gala, Culturel + possibilité d'uploader votre propre cadre
- 🎨 **Personnalisation** — Zoom, position X/Y, ajout de votre nom
- ⬇️ **Téléchargement PNG 1000×1000px** — Haute qualité, prêt pour les réseaux sociaux
- 📤 **Partage direct** — WhatsApp, Facebook, Twitter
- 🌙 **100% côté navigateur** — Aucune donnée envoyée à un serveur, vie privée respectée

## 🚀 Démarrage rapide

### En local

Ouvrez simplement `index.html` dans votre navigateur. Aucune installation requise !

```bash
# Option : serveur local avec Python
python -m http.server 8000

# Option : avec Node.js
npx serve .
```

### Déploiement GitHub Pages

1. Forkez ou poussez ce repo sur GitHub
2. Allez dans **Settings → Pages**
3. Sélectionnez la branche `main` et le dossier `/ (root)`
4. Votre site sera disponible sur `https://votrenom.github.io/badge-event`

## 📁 Structure du projet

```
badge-event/
├── index.html      # Page principale
├── style.css       # Styles (dark theme, glassmorphism)
├── app.js          # Logique de génération de badge (Canvas API)
├── assets/
│   ├── hero.png    # Image bannière
│   └── frame1.png  # Image cadre de référence
└── README.md
```

## 🛠️ Technologies

- **HTML5** — Structure sémantique
- **CSS3** — Variables CSS, animations, glassmorphism, responsive
- **Canvas API** — Génération de badges et cadres procéduraux
- **JavaScript ES6+** — Logique de l'application

## 📜 Licence

MIT © 2026 BadgeEvent
