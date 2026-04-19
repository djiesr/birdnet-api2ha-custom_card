# birdnet-api2ha-custom_card

Carte Lovelace personnalisée pour Home Assistant — visualisation des détections d'oiseaux BirdNET-Go sous forme de heatmap, avec navigation par heure, jour, semaine et mois.

> **Partie de l'écosystème birdnet-api2ha.**
> Le dépôt principal (intégration HA) est [birdnet-api2ha-custom_components](https://github.com/djiesr/birdnet-api2ha-custom_components).

---

## Écosystème

| Dépôt | Rôle |
|-------|------|
| [birdnet-api2ha-custom_components](https://github.com/djiesr/birdnet-api2ha-custom_components) | **Intégration HA** — dépôt principal, capteurs et binary sensors |
| [birdnet-api2ha](https://github.com/djiesr/birdnet-api2ha) | **API REST** — lit la base BirdNET-Go, sert les données |
| **birdnet-api2ha-custom_card** *(ce dépôt)* | **Carte Lovelace** — heatmap d'activité, addon optionnel |

---

## Prérequis

1. **[birdnet-api2ha](https://github.com/djiesr/birdnet-api2ha)** installé et en cours d'exécution sur le Pi / serveur.
2. **[birdnet-api2ha-custom_components](https://github.com/djiesr/birdnet-api2ha-custom_components)** installé dans Home Assistant (optionnel mais recommandé).

---

## Installation

### 1. Copier le fichier JS

Copier `birdnet-hourly-card.js` dans le dossier `www` de votre configuration Home Assistant :

```bash
cp birdnet-hourly-card.js /config/www/
```

### 2. Enregistrer la ressource dans HA

**Paramètres → Tableaux de bord → Ressources → Ajouter une ressource**

| Champ | Valeur |
|-------|--------|
| URL | `/local/birdnet-hourly-card.js` |
| Type | JavaScript module |

Recharger le navigateur (Ctrl+Maj+R) après l'ajout.

### 3. Ajouter la carte

Dans un tableau de bord, **Ajouter une carte → Manuel** :

```yaml
type: custom:birdnet-hourly-card
api_url: "http://192.168.x.x:8081"
title: "Daily Activity"
```

Remplacer `192.168.x.x` par l'IP du serveur où tourne **birdnet-api2ha** (port 8081 par défaut).

---

## Modes d'affichage

| Onglet | Période | Colonnes |
|--------|---------|---------|
| **Heure** | Journée sélectionnable | 00 → 23 h + barre daylight + navigation |
| **Jour** | 30 derniers jours | Une colonne par date |
| **Semaine** | 13 dernières semaines | Une colonne par semaine |
| **Mois** | 12 derniers mois | Une colonne par mois |

- Le gradient bleu indique l'intensité relative des détections (plus foncé = plus de détections).
- Les photos d'oiseaux proviennent du cache `image_caches` de BirdNET-Go (s'enrichit au fil des détections).
- En mode **Heure**, la barre *Daylight* indique nuit / lever / jour / coucher selon les données de BirdNET-Go.

---

## Mise à jour

```bash
cp birdnet-hourly-card.js /config/www/
```

Puis recharger la page HA (Ctrl+Maj+R) — aucun redémarrage de HA nécessaire.

---

## Licence

MIT
