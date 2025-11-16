# SmartShop Scraper Server

Backend server pentru scraping real al produselor din magazinele din Moldova.

## 📦 Instalare

1. Asigură-te că ai Node.js instalat (descarcă de la https://nodejs.org/)

2. Deschide Command Prompt în folderul `server`:
```cmd
cd "c:\Users\catal\Desktop\Teza licenta\server"
```

3. Instalează dependențele:
```cmd
npm install
```

## 🚀 Pornire Server

```cmd
npm start
```

Serverul va porni pe `http://localhost:3000`

## 🧪 Testare

Deschide în browser:
- Health check: http://localhost:3000/health
- Căutare test: http://localhost:3000/search?q=iPhone

## 📋 Cum funcționează

1. **Serverul primește un query** (ex: "iPhone 17 pro")
2. **Puppeteer lansează un browser headless** (Chrome invizibil)
3. **Vizitează fiecare magazin** (Darwin, Cactus, Bomba, PandaShop)
4. **Extrage produsele** - titlu, preț, imagine, link
5. **Returnează JSON** cu toate produsele găsite
6. **Cache-uiește rezultatele** pentru 5 minute

## 🔧 Configurare Selectori

Dacă selectoarele nu funcționează pentru un magazin, editează obiectul `storeConfigs` în `server.js`:

```javascript
darwin: {
    searchUrl: (query) => `https://darwin.md/ro/search?q=${query}`,
    selectors: {
        productCard: '.product-card',  // Selector pentru cardul produsului
        title: '.product-title',       // Selector pentru titlu
        price: '.product-price',       // Selector pentru preț
        image: 'img',                  // Selector pentru imagine
        link: 'a'                      // Selector pentru link
    }
}
```

## 💡 Note Importante

- Serverul trebuie să fie pornit când folosești aplicația frontend
- Cache-ul este activ 5 minute pentru a reduce load-ul pe site-uri
- Puppeteer poate lua 10-30 secunde pentru prima căutare (descarcă Chromium)
- Respectă regulile de scraping și nu face prea multe request-uri

## 🐛 Troubleshooting

**Eroare: "Cannot find module 'puppeteer'"**
→ Rulează `npm install` din folderul server

**Eroare: "Port 3000 is already in use"**
→ Schimbă `PORT = 3000` în alt număr în server.js

**Nu găsește produse**
→ Verifică în consolă ce erori apar și actualizează selectoarele
