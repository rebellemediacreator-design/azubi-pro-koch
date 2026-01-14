# Azubi App — Netlify/GitHub-ready

## Inhalt
- Static Site (HTML/CSS/JS) — kein Build nötig
- Einstieg: `index.html`

## GitHub (schnell)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <DEIN_GITHUB_REPO_URL>
git push -u origin main
```

## Netlify (am einfachsten)
### Option A: Drag & Drop
- In Netlify: **Add new site → Deploy manually**
- Ordner **entpacken** und alles aus diesem Ordner hochziehen

### Option B: GitHub-Deploy
- Netlify: **Add new site → Import from Git**
- Repo auswählen
- Build command: *(leer)*
- Publish directory: `.`
