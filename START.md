# ✅ TOTUL E GATA! Cum să folosești aplicația

## 🚀 Start Rapid (3 pași simpli)

### 1️⃣ Pornește Serverul

Deschide **PowerShell** sau **Command Prompt** și rulează:

```powershell
cd "c:\Users\catal\Desktop\Teza licenta\server"
npm start
```

✅ Lasă fereastra deschisă! Serverul trebuie să ruleze în background.

Vei vedea:
```
🚀 SmartShop Scraper Server pornit pe http://localhost:3000
```

---

### 2️⃣ Deschide Aplicația

Dublu-click pe:
```
c:\Users\catal\Desktop\Teza licenta\index.html
```

---

### 3️⃣ Caută Produse!

**Exemplu:** Scrie "**iPhone 17 pro**" și apasă Enter

⏱️ **Așteaptă 15-30 secunde** (Puppeteer scrapuiește toate magazinele în timp real!)

---

## 🎯 Ce vei vedea?

✅ **Produse REALE** din:
- 🦎 Darwin.md
- 🌵 Cactus.md  
- 💣 Bomba.md
- 🐼 PandaShop.md

Cu:
- 📸 Imagini reale
- 💰 Prețuri reale în MDL
- 🔗 Link-uri funcționale către produse
- ⭐ Rating-uri și reviews
- 📊 Sortare inteligentă NLP

---

## 🧪 Test Rapid

Verifică dacă serverul funcționează:

**Deschide în browser:**
```
http://localhost:3000/health
```

Ar trebui să vezi:
```json
{"status":"ok","message":"SmartShop Scraper Server is running!"}
```

---

## 💡 Exemple de Căutări

- "iPhone 17 pro"
- "laptop gaming"
- "televizor Samsung"
- "frigider"
- "telefon Xiaomi"

---

## 🐛 Probleme?

### ❌ "Backend-ul nu răspunde"
→ Ai pornit serverul? Rulează `npm start` în folderul `server/`

### ❌ "npm: command not found"
→ Instalează Node.js de pe https://nodejs.org/

### ❌ "Port 3000 already in use"
→ Schimbă portul în `server/server.js` (linia `const PORT = 3000;`)

---

## 📖 Documentație Completă

Vezi **INSTALARE.md** pentru ghid detaliat cu troubleshooting complet.

---

## 🎉 Enjoy!

Acum poți compara prețurile din toate magazinele din Moldova într-un singur loc! 🇲🇩✨
