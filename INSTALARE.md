# 🚀 Ghid Complet de Instalare și Folosire - SmartShop AI Moldova

## 📋 Ce ai nevoie

1. **Node.js** - Descarcă de aici: https://nodejs.org/ (versiunea LTS)
2. **Un browser modern** (Chrome, Firefox, Edge)
3. **Command Prompt** (cmd.exe)

---

## 🔧 Pasul 1: Instalează Serverul

### 1.1 Deschide Command Prompt în folderul server

```cmd
cd "c:\Users\catal\Desktop\Teza licenta\server"
```

### 1.2 Instalează dependențele

```cmd
npm install
```

**⏱️ Prima instalare poate dura 2-5 minute** (descarcă Chromium pentru Puppeteer - ~170MB)

Vei vedea:
```
✓ Installing puppeteer
✓ Installing express
✓ Installing cors
✓ Installing node-cache
```

---

## ▶️ Pasul 2: Pornește Serverul

În același Command Prompt, rulează:

```cmd
npm start
```

Dacă totul e OK, vei vedea:

```
🚀 SmartShop Scraper Server pornit pe http://localhost:3000
📝 Test: http://localhost:3000/search?q=iPhone
💚 Health: http://localhost:3000/health
```

**✅ Lasă această fereastră de Command Prompt deschisă!** (Serverul trebuie să ruleze în background)

---

## 🌐 Pasul 3: Deschide Aplicația Frontend

### 3.1 Deschide index.html în browser

Navighează la:
```
c:\Users\catal\Desktop\Teza licenta\index.html
```

Apasă **dublu-click** sau **click-dreapta → Open with → Chrome/Firefox/Edge**

### 3.2 Testează căutarea

1. Scrie în bara de căutare: **"iPhone 17 pro"**
2. Apasă **Enter** sau click pe butonul de căutare 🔍
3. **Așteaptă 10-30 secunde** (backend-ul scrapuiește toate magazinele în timp real!)

---

## 🎯 Ce se întâmplă în spate?

1. **Frontend-ul (index.html)** trimite query-ul către backend: `http://localhost:3000/search?q=iPhone+17+pro`
2. **Backend-ul (server.js)** lansează Puppeteer (Chrome headless)
3. **Puppeteer vizitează fiecare magazin**:
   - Darwin.md → caută "iPhone 17 pro"
   - Cactus.md → caută "iPhone 17 pro"
   - Bomba.md → caută "iPhone 17 pro"
   - PandaShop.md → caută "iPhone 17 pro"
4. **Extrage datele reale**: titlu, preț, imagine, link către produs
5. **Returnează JSON** cu toate produsele găsite
6. **Frontend-ul afișează rezultatele** cu sorting și filtrare NLP

---

## 🧪 Testare Rapidă a Backend-ului

Deschide în browser (în timp ce serverul rulează):

**Health Check:**
```
http://localhost:3000/health
```

Ar trebui să vezi:
```json
{"status":"ok","message":"SmartShop Scraper Server is running!"}
```

**Căutare Test:**
```
http://localhost:3000/search?q=laptop
```

Ar trebui să vezi un JSON cu produse:
```json
[
  {
    "id": "Darwin.md_1699999999_0",
    "title": "Laptop ASUS...",
    "price": 8999,
    "image": "https://...",
    "productUrl": "https://darwin.md/product/...",
    "store": "Darwin.md",
    ...
  },
  ...
]
```

---

## 🎨 Cum să folosești aplicația

### Căutare Produse
1. Introdu numele produsului (ex: "iPhone 17 pro", "laptop gaming", "televizor Samsung")
2. Apasă Enter sau click 🔍
3. Așteaptă rezultatele (10-30 secunde pentru toate magazinele)

### Filtre
- **Sortare**: Preț (crescător/descrescător), Rating, Relevență
- **Magazine**: Bifează/debifează magazinele din care vrei rezultate
- **Preț**: Folosește sliderul pentru interval de preț

### Click pe Produs
- **Click pe card** → deschide produsul pe site-ul magazinului (tab nou)
- **Buton "Detalii"** → deschide modal cu specs și reviews
- **Buton "Vezi în <Magazin>"** → deschide produsul pe site

---

## 🐛 Troubleshooting

### ❌ "Backend-ul nu răspunde"

**Problemă:** Serverul nu e pornit sau a crash-uit

**Soluție:**
1. Verifică dacă Command Prompt cu serverul încă rulează
2. Dacă nu, pornește-l din nou:
   ```cmd
   cd "c:\Users\catal\Desktop\Teza licenta\server"
   npm start
   ```

### ❌ "Port 3000 is already in use"

**Problemă:** Alt program folosește portul 3000

**Soluție:** Editează `server/server.js` și schimbă linia:
```javascript
const PORT = 3000;  // Schimbă în 3001, 3002, etc.
```

Apoi editează `scraper.js` și schimbă:
```javascript
const response = await fetch(`http://localhost:3001/search?q=...`);
```

### ❌ "Nu găsește produse / returneză array gol"

**Problemă:** Selectoarele pentru magazine nu sunt corecte

**Soluție:** Deschide `server/server.js` și verifică secțiunea `storeConfigs`.

**Cum să găsești selectoarele corecte:**

1. Deschide un magazin în browser (ex: darwin.md)
2. Caută un produs
3. Click-dreapta pe un produs → **Inspect Element**
4. Găsește clasa CSS a cardului (ex: `.product-item`, `.product-card`)
5. Actualizează în `server.js`:

```javascript
darwin: {
    selectors: {
        productCard: '.product-item',  // Clasa cardului
        title: '.product-name',         // Clasa titlului
        price: '.price-current',        // Clasa prețului
        image: 'img',                   // Tag-ul imaginii
        link: 'a'                       // Tag-ul linkului
    }
}
```

6. Salvează și repornește serverul (Ctrl+C în cmd, apoi `npm start`)

### ❌ "Datele simulate apar în loc de date reale"

**Problemă:** Backend-ul nu găsește produse → fallback la simulate

**Cauze posibile:**
- Selectoarele din `server.js` nu se potrivesc cu structura reală a paginii
- Site-ul folosește JavaScript intens pentru a încărca produsele (Puppeteer ar trebui să le prindă)
- Site-ul blochează request-urile automate (unlikely pentru site-uri moldovenești)

**Soluție:**
1. Verifică consola browserului (F12) pentru erori
2. Verifică consola Command Prompt (serverul) pentru log-uri:
   ```
   🔍 Scraping Darwin.md pentru: iPhone
   ✅ Darwin.md: 5 produse găsite
   ```
3. Dacă vezi `✅ 0 produse găsite` → trebuie actualizate selectoarele

### ⚠️ "Primul search durează foarte mult"

**Normal!** Prima dată, Puppeteer lansează Chromium (browser headless). După aceea, cache-ul face căutările mai rapide (5-15 secunde).

---

## 📊 Logs și Debugging

### Frontend Console (F12 în browser)

Vei vedea:
```
Searching for: "iPhone 17 pro" in all stores...
🚀 Încercăm backend-ul Puppeteer...
✅ Backend-ul a returnat 12 produse reale!
```

### Backend Console (Command Prompt)

Vei vedea:
```
🔎 Căutare nouă: "iPhone 17 pro"
🔍 Scraping Darwin.md pentru: iPhone 17 pro
✅ Darwin.md: 3 produse găsite
🔍 Scraping Cactus.md pentru: iPhone 17 pro
✅ Cactus.md: 4 produse găsite
...
✨ Total: 12 produse găsite
```

---

## 🚀 Performance Tips

1. **Cache:** Backend-ul cache-uiește rezultatele pentru 5 minute. Căutări repetate sunt instant!
2. **Delay-uri:** Serverul așteaptă 2 secunde între vizite pe fiecare site pentru a nu face spam
3. **Headless Mode:** Puppeteer rulează în background fără ferestre vizibile (mult mai rapid!)

---

## 🎓 Cum să testezi pentru "iPhone 17 pro"

```
1. Pornește serverul: cd server && npm start
2. Deschide index.html în browser
3. Caută: "iPhone 17 pro"
4. Așteaptă ~15-30 secunde
5. Vei vedea produsele reale din toate magazinele!
```

**Rezultate așteptate:**
- Produse reale cu imagini reale
- Prețuri reale în MDL
- Link-uri funcționale către paginile produselor
- Sortare inteligentă după preț/rating/relevență

---

## 💡 Funcționalități NLP

Aplicația folosește **NLP Engine** pentru a sorta rezultatele inteligent:

- **Tokenizare**: Desparte query-ul în cuvinte cheie
- **Relevance Scoring**: Calculează scor bazat pe match-uri în titlu/descriere
- **Sentiment Analysis**: Analizează reviews pentru rating general
- **Smart Filtering**: Filtrează automat produse irelevante

Exemplu: căutând "laptop gaming ieftin", sistemul va:
1. Identifica keywords: `laptop`, `gaming`, `ieftin`
2. Da prioritate produselor care conțin toate 3 keywords
3. Sortează mai sus produsele cu preț mic + rating bun
4. Filtrează laptopurile non-gaming

---

## 🔐 Considerații Legale

⚠️ **Importante:**

1. **Scraping-ul este LEGAL** pentru uz personal/educational în Moldova
2. **NU face spam** - serverul are delay-uri integrate
3. **NU revinde datele** - doar pentru compararea prețurilor tale
4. **Respectă robots.txt** - verifică fiecare magazin

Acest proiect este **pentru demonstrație educațională** și comparare personală de prețuri.

---

## 📞 Ajutor Suplimentar

Dacă întâmpini probleme:

1. **Verifică consola** (F12 în browser)
2. **Verifică logs-urile serverului** (Command Prompt)
3. **Testează health endpoint-ul**: http://localhost:3000/health
4. **Testează backend direct**: http://localhost:3000/search?q=test

---

## 🎉 Success!

Dacă vezi produse reale cu prețuri reale și poți să dai click să mergi pe site-uri, **totul funcționează perfect!**

Acum poți căuta orice produs și să compari prețurile din toate magazinele din Moldova! 🇲🇩

---

**Enjoy shopping smart! 🛒✨**
