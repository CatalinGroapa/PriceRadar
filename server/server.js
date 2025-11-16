const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const PORT = 3000;

// Cache pentru 5 minute
const cache = new NodeCache({ stdTTL: 300 });

app.use(cors());
app.use(express.json());

// Funcție helper pentru delay între request-uri
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configurație selectori pentru fiecare magazin
const storeConfigs = {
    darwin: {
        name: 'Darwin.md',
        icon: '🦎',
        // TEMPORARY: folosim pagina de categorie în loc de search (Livewire issues)
        searchUrl: (query) => {
            // Pentru iPhone/Apple căutări, folosește categoria Apple
            if (query.toLowerCase().includes('iphone') || query.toLowerCase().includes('apple')) {
                return `https://darwin.md/telefoane/smartphone/apple-iphone`;
            }
            // Pentru alte căutări, încearcă search-ul normal
            return `https://darwin.md/ro/search?q=${encodeURIComponent(query)}`;
        },
        selectors: {
            productCard: '.product-card',
            title: '.title-product',
            price: '.price-new',
            image: 'img',
            link: 'a.product-link'
        }
    },
    cactus: {
        name: 'Cactus.md',
        icon: '🌵',
        searchUrl: (query) => `https://www.cactus.md/ro/search/?q=${encodeURIComponent(query)}`,
        selectors: {
            productCard: '.catalog__pill',
            title: '.catalog__pill__text__title',
            price: '.catalog__pill__controls__price',
            image: '.catalog__pill__img__prime',
            link: 'a'
        }
    },
    bomba: {
        name: 'Bomba.md',
        icon: '💣',
        searchUrl: (query) => `https://bomba.md/ru/poisk/?query=${encodeURIComponent(query)}`,
        selectors: {
            productCard: '.product__item',
            title: 'a.name',
            price: '.product-price .price',
            image: '.product__photo img',
            link: 'a.name'
        }
    },
    panda: {
        name: 'PandaShop.md',
        icon: '🐼',
        searchUrl: (query) => `https://pandashop.md/ro/search/?text=${encodeURIComponent(query)}`,
        selectors: {
            productCard: '.card',
            title: '.card-title .lnk-txt',
            price: '.card-price_curr',
            image: 'img',
            link: 'a[href*="/product/"]'
        }
    }
};

// Funcție de scraping pentru un magazin specific
async function scrapeStore(browser, storeName, query, config) {
    const page = await browser.newPage();
    
    try {
        console.log(`🔍 Scraping ${config.name} pentru: ${query}`);
        
        // Setează user agent pentru a părea browser normal
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navighează la pagina de căutare
        const searchUrl = config.searchUrl(query);
        console.log(`📡 URL: ${searchUrl}`);
        await page.goto(searchUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000  // Măresc la 60s
        });
        
        // Așteaptă ca produsele să se încarce (JavaScript dinamic)
        try {
            await page.waitForSelector(config.selectors.productCard, { timeout: 15000 });
            console.log(`✅ Selectorul ${config.selectors.productCard} găsit!`);
        } catch (e) {
            console.log(`⚠️ Nu s-au găsit produse cu selectorul ${config.selectors.productCard}`);
        }
        
        // Delay suplimentar pentru siguranta
        await delay(2000);
        
        // SCROLL AUTOMAT pentru a încărca toate produsele (scroll infinit)
        console.log(`📜 Încep scroll automat pentru a încărca toate produsele...`);
        let previousHeight = 0;
        let scrollAttempts = 0;
        const maxScrolls = 10; // Maxim 10 scroll-uri pentru a nu aștepta prea mult
        
        while (scrollAttempts < maxScrolls) {
            // Scroll la sfârșitul paginii
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await delay(1500); // Așteaptă încărcarea
            
            // Verifică dacă s-au încărcat mai multe produse
            const currentHeight = await page.evaluate(() => document.body.scrollHeight);
            const productCount = await page.evaluate((selector) => 
                document.querySelectorAll(selector).length, 
                config.selectors.productCard
            );
            
            console.log(`  Scroll ${scrollAttempts + 1}: ${productCount} produse găsite`);
            
            // Dacă înălțimea nu s-a schimbat, nu mai sunt produse
            if (currentHeight === previousHeight) {
                console.log(`✅ Nu mai sunt produse de încărcat`);
                break;
            }
            
            previousHeight = currentHeight;
            scrollAttempts++;
        }
        
        // Scroll înapoi sus
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(500);
        
        // Extrage produsele
        const products = await page.evaluate((selectors, storeName, storeIcon, storeUrl) => {
            const productCards = document.querySelectorAll(selectors.productCard);
            console.log(`🔍 Găsite ${productCards.length} carduri cu selectorul: ${selectors.productCard}`);
            const results = [];
            
            productCards.forEach((card, index) => {
                try {
                    // Extrage titlul
                    const titleEl = card.querySelector(selectors.title);
                    const title = titleEl ? titleEl.textContent.trim() : null;
                    
                    console.log(`  Card ${index}: title="${title}"`);
                    
                    if (!title || title.length < 3) return; // Skip dacă nu e titlu valid
                    
                    // Extrage prețul
                    const priceEl = card.querySelector(selectors.price);
                    let price = 0;
                    if (priceEl) {
                        const priceText = priceEl.textContent.trim();
                        const priceMatch = priceText.match(/[\d\s]+/);
                        if (priceMatch) {
                            price = parseFloat(priceMatch[0].replace(/\s/g, ''));
                        }
                    }
                    
                    // Extrage imaginea
                    const imgEl = card.querySelector(selectors.image);
                    let image = '/api/placeholder/200/200';
                    if (imgEl) {
                        image = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || image;
                        // Normalizează URL-ul imaginii
                        if (image.startsWith('//')) {
                            image = 'https:' + image;
                        } else if (image.startsWith('/')) {
                            image = window.location.origin + image;
                        }
                    }
                    
                    // Extrage link-ul către produs
                    const linkEl = card.querySelector(selectors.link) || card.closest('a');
                    let productUrl = storeUrl;
                    if (linkEl) {
                        productUrl = linkEl.href || linkEl.getAttribute('href') || storeUrl;
                        // Normalizează URL-ul
                        if (productUrl.startsWith('//')) {
                            productUrl = 'https:' + productUrl;
                        } else if (productUrl.startsWith('/')) {
                            productUrl = window.location.origin + productUrl;
                        }
                    }
                    
                    results.push({
                        id: `${storeName}_${Date.now()}_${index}`,
                        title: title,
                        price: price,
                        image: image,
                        productUrl: productUrl,
                        store: storeName,
                        storeIcon: storeIcon,
                        storeUrl: storeUrl,
                        description: title,
                        rating: 4 + Math.random(), // Random rating între 4-5
                        reviews: Math.floor(Math.random() * 100) + 10,
                        availability: price > 0 ? 'În stoc' : 'Indisponibil',
                        inStock: price > 0  // Pentru filtrul frontend
                    });
                } catch (err) {
                    console.error('Error parsing product card:', err);
                }
            });
            
            return results;
        }, config.selectors, config.name, config.icon, config.searchUrl(query).split('?')[0]);
        
        console.log(`✅ ${config.name}: ${products.length} produse găsite`);
        
        await page.close();
        return products;
        
    } catch (error) {
        console.error(`❌ Error scraping ${config.name}:`, error.message);
        await page.close();
        return [];
    }
}

// Endpoint principal de căutare
app.get('/search', async (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    console.log(`\n🔎 Căutare nouă: "${query}"`);
    
    // Verifică cache
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('📦 Returnat din cache');
        return res.json(cached);
    }
    
    let browser;
    try {
        // Lansează browser Puppeteer
        console.log('🌐 Lansez Puppeteer browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        console.log('✅ Puppeteer browser lansat cu succes!');
        
        // Scrape toate magazinele în paralel
        const scrapePromises = Object.entries(storeConfigs).map(([storeName, config]) => 
            scrapeStore(browser, config.name, query, config)
                .catch(err => {
                    console.error(`Error in ${storeName}:`, err);
                    return [];
                })
        );
        
        const results = await Promise.all(scrapePromises);
        
        // Combină toate rezultatele
        const allProducts = results.flat();
        
        console.log(`\n✨ Total: ${allProducts.length} produse găsite`);
        
        // Salvează în cache
        cache.set(cacheKey, allProducts);
        
        await browser.close();
        res.json(allProducts);
        
    } catch (error) {
        console.error('❌ Server error:', error);
        if (browser) await browser.close();
        res.status(500).json({ 
            error: 'Failed to scrape products',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SmartShop Scraper Server is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 SmartShop Scraper Server pornit pe http://localhost:${PORT}`);
    console.log(`📝 Test: http://localhost:${PORT}/search?q=iPhone`);
    console.log(`💚 Health: http://localhost:${PORT}/health\n`);
});
