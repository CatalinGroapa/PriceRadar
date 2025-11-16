# 🔍 Ghid Vizual: Cum să Găsești Selectoarele CSS

## 📌 De ce trebuie să actualizezi selectoarele?

Fiecare magazin online are structura HTML diferită. Pentru ca Puppeteer să extragă corect produsele, trebuie să-i spunem exact unde să caute:
- Care e clasa CSS a cardului produsului?
- Unde e titlul?
- Unde e prețul?
- Unde e imaginea?

---

## 🎯 TUTORIAL COMPLET - Darwin.md

### Pasul 1: Deschide pagina de căutare

Mergi la: `https://darwin.md/ro/search?q=laptop`

### Pasul 2: Deschide Developer Tools

Apasă **F12** sau **Click-dreapta → Inspect**

### Pasul 3: Activează "Select Element"

În Developer Tools, apasă pe iconița de săgeată din stânga-sus (sau Ctrl+Shift+C)

### Pasul 4: Click pe un produs

Mută mouse-ul peste un card de produs și click. HTML-ul va fi highlight-at în DevTools.

### Pasul 5: Identifică clasa cardului

Caută un element HTML care conține TOT produsul (imagine, titlu, preț, link).

De obicei arată așa:
```html
<div class="product-card">
  <img src="...">
  <h3 class="product-title">Laptop ASUS...</h3>
  <span class="product-price">8999 MDL</span>
  <a href="/product/123">Vezi detalii</a>
</div>
```

**Notează:** `.product-card` (include punctul!)

### Pasul 6: Identifică selectorul pentru titlu

În același element, găsește unde e titlul produsului.

Exemple comune:
- `.product-title`
- `.product-name`
- `h3`
- `h4`
- `.title`

### Pasul 7: Identifică selectorul pentru preț

Găsește elementul care conține prețul (de ex: "8999 MDL").

Exemple comune:
- `.product-price`
- `.price`
- `.price-current`
- `.cost`

### Pasul 8: Actualizează server.js

Deschide `server/server.js` și găsește secțiunea `darwin`:

```javascript
darwin: {
    name: 'Darwin.md',
    icon: '🦎',
    searchUrl: (query) => `https://darwin.md/ro/search?q=${encodeURIComponent(query)}`,
    selectors: {
        productCard: '.PUNE_AICI_CLASA_CARDULUI',  // Ex: '.product-item'
        title: '.PUNE_AICI_CLASA_TITLULUI',        // Ex: '.product-name'
        price: '.PUNE_AICI_CLASA_PRETULUI',        // Ex: '.price'
        image: 'img',                               // Lasă așa
        link: 'a'                                   // Lasă așa
    }
}
```

### Pasul 9: Salvează și repornește serverul

```cmd
Ctrl+C (în terminal pentru a opri serverul)
npm start (pentru a-l reporni)
```

### Pasul 10: Testează!

Deschide: `http://localhost:3000/search?q=laptop`

Dacă vezi produse în JSON → **SUCCESS!** ✅
Dacă vezi `[]` → selectoarele nu sunt corecte, încearcă din nou.

---

## 🎯 GHID RAPID - Cactus.md

**Pași:**
1. Mergi la: `https://www.cactus.md/search?q=laptop`
2. F12 → Select Element → Click pe produs
3. Identifică:
   - Card: `.product-card` sau `.item` sau `.product`
   - Titlu: `.product-title` sau `.product-name` sau `h3`
   - Preț: `.product-price` sau `.price` sau `.cost`
4. Actualizează în `server.js` secțiunea `cactus`
5. Repornește serverul
6. Testează: `http://localhost:3000/search?q=laptop`

---

## 🎯 GHID RAPID - Bomba.md

**Pași:**
1. Mergi la: `https://bomba.md/search?search=laptop`
2. F12 → Select Element → Click pe produs
3. Identifică selectoarele
4. Actualizează în `server.js` secțiunea `bomba`
5. Repornește serverul
6. Testează: `http://localhost:3000/search?q=laptop`

---

## 🎯 GHID RAPID - PandaShop.md

**Pași:**
1. Mergi la: `https://www.pandashop.md/ru/search?q=laptop`
2. F12 → Select Element → Click pe produs
3. Identifică selectoarele
4. Actualizează în `server.js` secțiunea `panda`
5. Repornește serverul
6. Testează: `http://localhost:3000/search?q=laptop`

---

## 💡 TIPS & TRICKS

### Cum să verifici dacă selectorul e corect?

În Developer Tools, deschide **Console** și scrie:

```javascript
document.querySelectorAll('.product-card').length
```

Dacă returnează un număr > 0 → selectorul e corect! ✅
Dacă returnează 0 → selectorul e greșit ❌

### Exemple de structuri comune

#### Structură Simplă
```html
<div class="product">
  <img src="image.jpg">
  <h3>Titlu Produs</h3>
  <span class="price">9999 MDL</span>
  <a href="/product/123">Link</a>
</div>
```
Selectori:
- Card: `.product`
- Titlu: `h3`
- Preț: `.price`

#### Structură Complexă
```html
<div class="col-md-3">
  <div class="product-item">
    <div class="product-image">
      <img src="...">
    </div>
    <div class="product-info">
      <h4 class="product-name">Titlu</h4>
      <div class="product-pricing">
        <span class="price-current">9999</span>
        <span class="currency">MDL</span>
      </div>
    </div>
    <a class="product-link" href="...">Detalii</a>
  </div>
</div>
```
Selectori:
- Card: `.product-item`
- Titlu: `.product-name`
- Preț: `.price-current`

### Ce faci dacă nu găsești clasa?

Uneori elementele nu au clase specifice. În acest caz, folosește:
- Tag-uri HTML: `h3`, `h4`, `span`, `div`
- Multiple selectori: `.product-card h3, .product-card h4`
- Attribute selectori: `[class*="product"]` (orice clasă care conține "product")

---

## 🧪 VERIFICARE FINALĂ

După ce ai actualizat toate cele 4 magazine:

### Test 1: Backend Direct
```
http://localhost:3000/search?q=laptop
```
Ar trebui să vezi un array JSON cu produse.

### Test 2: Pagina de Test
Deschide `test-backend.html` și click pe butoane de test.

### Test 3: Aplicația Principală
Deschide `index.html` și caută "iPhone 17 pro".

---

## 📝 TEMPLATE DE ACTUALIZARE

Folosește acest template pentru fiecare magazin:

```javascript
// ========================================
// ACTUALIZAT LA: [DATA]
// TESTAT CU QUERY: "laptop"
// REZULTATE: [NUMĂR] produse găsite
// ========================================

magazin: {
    name: 'Nume Magazin',
    icon: '🏪',
    searchUrl: (query) => `https://magazin.md/search?q=${encodeURIComponent(query)}`,
    selectors: {
        productCard: '.CLASA_IDENTIFICATA',  // Elementul părinte care conține tot produsul
        title: '.CLASA_TITLU',               // Unde e numele produsului
        price: '.CLASA_PRET',                // Unde e prețul (va extrage doar numerele)
        image: 'img',                        // Lasă 'img' (găsește primul img din card)
        link: 'a'                            // Lasă 'a' (găsește primul link din card)
    }
}
```

---

## 🎉 DUPĂ ACTUALIZARE

Când toate selectoarele sunt corecte:

✅ Backend-ul va returna produse REALE
✅ Imaginile vor fi REALE
✅ Prețurile vor fi REALE
✅ Link-urile vor duce la produsele REALE
✅ Aplicația va funcționa 100% cu date LIVE

**Fiecare magazin actualizat = +25% funcționalitate reală!**

---

## 🆘 AJUTOR

Dacă întâmpini probleme:

1. **Verifică în Console** (F12) pentru erori JavaScript
2. **Verifică în Terminal** (serverul) pentru log-uri de scraping
3. **Testează selectorul** direct în DevTools Console:
   ```javascript
   document.querySelectorAll('.selectorul-tau').length
   ```
4. **Încearcă selectori alternativi** dacă primii nu funcționează

---

## 📞 NEXT STEPS

1. Actualizează selectoarele pentru **Darwin.md** (15 min)
2. Testează cu query "laptop"
3. Repetă pentru **Cactus.md** (15 min)
4. Repetă pentru **Bomba.md** (15 min)
5. Repetă pentru **PandaShop.md** (15 min)

**Total timp estimat: 1 oră** pentru toate magazinele.

După asta: **APLICAȚIA FUNCȚIONEAZĂ 100% CU DATE REALE!** 🚀🎉
