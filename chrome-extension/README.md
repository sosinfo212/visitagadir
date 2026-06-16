# Visit Agadir — Chrome Extension (Google Maps Importer)

Extension Chrome séparée du projet Next.js. Elle scanne une fiche **Google Maps** (nom, contact, note, photos, avis) et l’envoie à l’API Visit Agadir.

## Prérequis côté app

1. Ajoutez une clé dans `.env` à la racine du projet :

```env
EXTENSION_API_KEY=change-me-to-a-long-random-secret
```

2. Redémarrez le serveur Next.js.

Endpoints utilisés :

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/api/extension/categories` | Header `X-Extension-Key` |
| POST | `/api/extension/import` | Header `X-Extension-Key` |

## Installation (mode développeur)

1. Ouvrez Chrome → `chrome://extensions`
2. Activez **Mode développeur**
3. **Charger l’extension non empaquetée**
4. Sélectionnez ce dossier : `chrome-extension/`

## Configuration

1. Ouvrez une fiche lieu sur [Google Maps](https://www.google.com/maps)
2. Cliquez l’icône de l’extension
3. Renseignez :
   - **URL de l’app** — ex. `http://localhost:3000` ou `https://www.visitagadir.info`
   - **Clé API extension** — même valeur que `EXTENSION_API_KEY`
   - **Catégorie par défaut** — cliquez *Enregistrer*, puis choisissez une catégorie
4. **Scanner cette fiche** → **Envoyer à l’app**

## Conseils scraping Google Maps

- Ouvrez la fiche complète du lieu (pas seulement la recherche)
- Pour plus d’avis : ouvrez l’onglet **Avis** sur Maps avant de scanner
- Les photos visibles dans la galerie sont récupérées (URLs Google CDN ; l’app les télécharge côté serveur)
- Google change souvent le DOM : si un champ manque, mettez à jour `content/google-maps.js`

## Structure

```
chrome-extension/
├── manifest.json          # Manifest V3
├── background.js          # Service worker
├── content/
│   └── google-maps.js     # Scraper (content script)
├── lib/
│   ├── api-client.js      # Appels API Visit Agadir
│   ├── storage.js         # chrome.storage.sync
│   └── types.js           # JSDoc types
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── icons/
    └── icon.svg
```

## Développement

- Modifier le scraper → recharger l’extension dans `chrome://extensions`
- Logs content script → DevTools sur l’onglet Google Maps
- Logs popup → clic droit sur la popup → Inspecter

## Sécurité

- Ne commitez pas la clé API dans git
- Utilisez une clé longue et aléatoire en production
- L’extension n’envoie des données qu’aux domaines autorisés dans `manifest.json`
