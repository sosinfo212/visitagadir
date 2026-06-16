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

## Utilisation

### Import multiple (recommandé)

1. Ouvrez une **recherche** Google Maps (ex. « restaurants Agadir »)
2. Faites défiler la liste à gauche pour charger plus de résultats
3. Cliquez l’icône de l’extension
4. Configurez URL, clé API et catégorie (voir ci-dessous)
5. **Lister les lieux visibles** → cochez les fiches à importer
6. **Importer la sélection** — l’extension ouvre chaque fiche, scanne et envoie les données

L’import batch navigue dans l’onglet Maps : ne fermez pas cet onglet pendant l’import.

### Import unique (fiche ouverte)

1. Ouvrez la fiche complète d’un lieu sur Google Maps
2. **Scanner la fiche ouverte** → **Envoyer à l’app**

## Configuration

1. Ouvrez Google Maps (recherche ou fiche lieu)
2. Cliquez l’icône de l’extension
3. Renseignez :
   - **URL de l’app** — ex. `http://localhost:3000` ou `https://www.visitagadir.info`
   - **Clé API extension** — même valeur que `EXTENSION_API_KEY`
   - **Catégorie par défaut** — cliquez *Enregistrer*, puis choisissez une catégorie

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
│   ├── batch-import.js    # Import séquentiel multi-lieux
│   ├── import-one.js      # Import d’une fiche scannée
│   ├── image-uploader.js
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
