// Motor de recomandări cu algoritmi de scoring
class RecommendationEngine {
    constructor(nlpEngine) {
        this.nlpEngine = nlpEngine;
        this.weights = {
            price: 0.25,
            rating: 0.30,
            reviews: 0.15,
            availability: 0.10,
            relevance: 0.20
        };
    }

    // Normalizează prețul (inversul scorului - prețuri mai mici = scor mai mare)
    normalizePriceScore(price, minPrice, maxPrice) {
        if (maxPrice === minPrice) return 100;
        // Inversăm scorul: prețuri mici primesc scor mare
        return ((maxPrice - price) / (maxPrice - minPrice)) * 100;
    }

    // Normalizează rating-ul
    normalizeRatingScore(rating, reviewCount) {
        // Scoring bazat pe rating cu pondere pentru numărul de recenzii
        const ratingScore = (rating / 5) * 100;
        
        // Confidence factor bazat pe numărul de recenzii
        const reviewConfidence = Math.min(reviewCount / 100, 1);
        
        return ratingScore * (0.7 + reviewConfidence * 0.3);
    }

    // Scor pentru disponibilitate
    availabilityScore(inStock) {
        return inStock ? 100 : 0;
    }

    // Calculează scorul compozit pentru fiecare produs
    calculateProductScore(product, searchQuery, priceRange) {
        const { minPrice, maxPrice } = priceRange;

        // Score individual pentru fiecare criteriu
        const priceScore = this.normalizePriceScore(product.price, minPrice, maxPrice);
        const ratingScore = this.normalizeRatingScore(product.rating, product.reviewCount);
        const availScore = this.availabilityScore(product.inStock);
        
        // NLP Analysis
        const nlpAnalysis = this.nlpEngine.analyzeProduct(product, searchQuery);
        const relevanceScore = nlpAnalysis.relevanceScore;

        // Bonus pentru sentiment pozitiv
        let sentimentBonus = 0;
        if (nlpAnalysis.sentiment.label === 'positive') {
            sentimentBonus = nlpAnalysis.sentiment.confidence * 0.1;
        }

        // Review count score (mai multe recenzii = mai de încredere)
        const reviewScore = Math.min((product.reviewCount / 500) * 100, 100);

        // Calculează scorul final ponderat
        const finalScore = (
            priceScore * this.weights.price +
            ratingScore * this.weights.rating +
            reviewScore * this.weights.reviews +
            availScore * this.weights.availability +
            relevanceScore * this.weights.relevance +
            sentimentBonus
        );

        return {
            finalScore: Math.round(finalScore),
            breakdown: {
                price: Math.round(priceScore),
                rating: Math.round(ratingScore),
                reviews: Math.round(reviewScore),
                availability: Math.round(availScore),
                relevance: Math.round(relevanceScore),
                sentiment: nlpAnalysis.sentiment
            },
            nlpAnalysis
        };
    }

    // Extrage numere din text (pentru model matching)
    extractNumbers(text) {
        const matches = text.match(/\d+/g);
        return matches ? matches.map(n => parseInt(n)) : [];
    }

    // Verifică dacă produsul este un accesoriu (husă, folie, cablu, etc.)
    isAccessory(productTitle) {
        const accessoryKeywords = [
            'husă', 'husa', 'huse', 'case',
            'folie', 'folii', 'sticlă', 'sticla', 'protecție', 'protectie', 'glass',
            'cablu', 'cabluri', 'cable', 'încărcător', 'incarcator', 'charger',
            'adaptor', 'adapter',
            'căști', 'casti', 'headphones', 'earphones', 'airpods',
            'suport', 'holder', 'stand',
            'baterie externă', 'powerbank', 'power bank',
            'stylus', 'pen',
            'card memorie', 'sd card', 'micro sd',
            'sim card',
            'cleaner', 'curățare', 'curatare'
        ];
        
        const lowerTitle = productTitle.toLowerCase();
        return accessoryKeywords.some(keyword => lowerTitle.includes(keyword));
    }

    // Verifică dacă produsul match-uiește exact cu modelul cerut
    matchesModelNumber(productTitle, searchQuery) {
        // Extrage numerele din query și din titlu
        const queryNumbers = this.extractNumbers(searchQuery);
        const titleNumbers = this.extractNumbers(productTitle);
        
        // Dacă query-ul nu conține numere, acceptă orice produs
        if (queryNumbers.length === 0) {
            return true;
        }
        
        // Dacă query conține doar un număr mic (< 20), fie este model fie alte specs
        // De ex: "iphone 13" → trebuie să conțină 13
        // Dar "laptop 8gb" → 8 poate fi RAM, nu model
        if (queryNumbers.length === 1 && queryNumbers[0] <= 20) {
            // Verifică dacă numărul din query apare în titlu
            return titleNumbers.includes(queryNumbers[0]);
        }
        
        // Pentru query-uri cu multiple numere sau numere mari,
        // verifică dacă măcar UNUL din numerele principale din query apare în titlu
        // Asta permite "iphone 13 pro max 256gb" să matchuiască produse cu "13"
        const mainQueryNumbers = queryNumbers.filter(n => n <= 20); // Numere mici = modele
        
        if (mainQueryNumbers.length === 0) {
            return true; // Nu sunt numere de model în query
        }
        
        // Verifică dacă măcar un număr de model apare în titlu
        return mainQueryNumbers.some(queryNum => titleNumbers.includes(queryNum));
    }

    // Filtrează și sortează produsele
    recommendProducts(products, searchQuery, filters = {}) {
        if (!products || products.length === 0) {
            return [];
        }

        // Filtrare
        let filteredProducts = products.filter(product => {
            // FILTRU NOU: Exclude accesoriile când cauți telefoane
            if (this.isAccessory(product.title)) {
                return false;
            }

            // FILTRU NOU: Match exact pe numărul modelului
            if (!this.matchesModelNumber(product.title, searchQuery)) {
                return false;
            }

            // Filtru preț
            if (filters.maxPrice && product.price > filters.maxPrice) {
                return false;
            }

            // Filtru rating
            if (filters.minRating && product.rating < filters.minRating) {
                return false;
            }

            // Filtru disponibilitate
            if (filters.inStock && !product.inStock) {
                return false;
            }

            return true;
        });

        // Găsește range-ul de prețuri pentru normalizare
        const prices = filteredProducts.map(p => p.price);
        const priceRange = {
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices)
        };

        // Calculează scor pentru fiecare produs
        const scoredProducts = filteredProducts.map(product => {
            const scoreData = this.calculateProductScore(product, searchQuery, priceRange);
            return {
                ...product,
                recommendationScore: scoreData.finalScore,
                scoreBreakdown: scoreData.breakdown,
                nlpData: scoreData.nlpAnalysis
            };
        });

        // Sortare
        return this.sortProducts(scoredProducts, filters.sortBy || 'score');
    }

    // Sortare produse după criteriu
    sortProducts(products, sortBy) {
        const sorted = [...products];

        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => a.price - b.price);
            
            case 'price-desc':
                return sorted.sort((a, b) => b.price - a.price);
            
            case 'rating':
                return sorted.sort((a, b) => {
                    if (b.rating === a.rating) {
                        return b.reviewCount - a.reviewCount;
                    }
                    return b.rating - a.rating;
                });
            
            case 'score':
            default:
                return sorted.sort((a, b) => b.recommendationScore - a.recommendationScore);
        }
    }

    // Generează explicații pentru recomandări
    generateExplanation(product) {
        const reasons = [];

        if (product.recommendationScore >= 80) {
            reasons.push('Cel mai bun raport calitate-preț');
        }

        if (product.scoreBreakdown.rating >= 85) {
            reasons.push(`Rating excelent (${product.rating}⭐)`);
        }

        if (product.reviewCount > 100) {
            reasons.push(`${product.reviewCount} recenzii verificate`);
        }

        if (product.nlpData.sentiment.label === 'positive') {
            reasons.push('Recenzii predominantly pozitive');
        }

        if (product.scoreBreakdown.price >= 70) {
            reasons.push('Preț competitiv');
        }

        if (Object.keys(product.nlpData.features).length >= 3) {
            reasons.push('Caracteristici complete');
        }

        return reasons.length > 0 ? reasons : ['Produs recomandat'];
    }

    // Găsește produse similare
    findSimilarProducts(targetProduct, allProducts, limit = 3) {
        const similarities = allProducts
            .filter(p => p.id !== targetProduct.id)
            .map(product => {
                const titleSim = this.nlpEngine.calculateSimilarity(
                    targetProduct.title,
                    product.title
                );
                const priceSim = 1 - Math.abs(targetProduct.price - product.price) / 
                    Math.max(targetProduct.price, product.price);
                
                const similarity = (titleSim * 0.7 + priceSim * 0.3);
                
                return { product, similarity };
            })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        return similarities.map(s => s.product);
    }
}

// Export pentru utilizare
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationEngine;
}