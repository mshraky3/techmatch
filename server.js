require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_PORT_ATTEMPTS = 10;

// Middleware
app.use(cors());
app.use(express.json());

// Phone brands data
const PHONE_BRANDS = [
  { 
    id: 'apple', 
    name: 'Apple', 
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone 12']
  },
  { 
    id: 'samsung', 
    name: 'Samsung', 
    models: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S22', 'Galaxy S21']
  },
  { 
    id: 'xiaomi', 
    name: 'Xiaomi', 
    models: ['Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13T Pro', 'Xiaomi 13T', 'Xiaomi 13 Pro', 'Xiaomi 13', 'Redmi Note 12 Pro+', 'Redmi Note 12 Pro']
  },
  { 
    id: 'oppo', 
    name: 'OPPO', 
    models: ['Find X7 Ultra', 'Find X7', 'Reno 11 Pro', 'Reno 11', 'Find X6 Pro', 'Find X6', 'Reno 10 Pro+', 'Reno 10 Pro']
  },
  { 
    id: 'vivo', 
    name: 'Vivo', 
    models: ['X100 Pro', 'X100', 'X90 Pro', 'X90', 'V30 Pro', 'V30', 'V29 Pro', 'V29']
  },
  { 
    id: 'oneplus', 
    name: 'OnePlus', 
    models: ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 9 Pro', 'OnePlus 9']
  },
  { 
    id: 'google', 
    name: 'Google', 
    models: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a']
  },
  { 
    id: 'huawei', 
    name: 'Huawei', 
    models: ['Mate 60 Pro', 'Mate 60', 'P60 Pro', 'P60', 'Mate 50 Pro', 'Mate 50', 'P50 Pro', 'P50']
  },
  { 
    id: 'sony', 
    name: 'Sony', 
    models: ['Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V', 'Xperia 1 IV', 'Xperia 5 IV', 'Xperia 10 IV', 'Xperia 1 III', 'Xperia 5 III']
  },
  { 
    id: 'nokia', 
    name: 'Nokia', 
    models: ['Nokia X30', 'Nokia G60', 'Nokia G50', 'Nokia G42', 'Nokia G22', 'Nokia G21', 'Nokia G20', 'Nokia G10']
  }
];

// Sellers data with scraping selectors
const SELLERS = {
  amazon: {
    name: 'Amazon',
    baseUrl: 'https://www.amazon.sa',
    searchUrl: 'https://www.amazon.sa/s',
    selectors: {
      productContainer: '.s-result-item',
      title: 'h2 .a-link-normal',
      price: '.a-price .a-offscreen',
      rating: '.a-icon-star-small .a-icon-alt',
      reviews: 'span.a-size-base.s-underline-text',
      image: '.s-image',
      link: 'h2 .a-link-normal'
    }
  },
  jarir: {
    name: 'Jarir',
    baseUrl: 'https://www.jarir.com',
    searchUrl: 'https://www.jarir.com/sa-en/catalogsearch/result',
    selectors: {
      productContainer: '.product-item',
      title: '.product-item-link',
      price: '.price',
      rating: '.rating-summary .rating-result',
      reviews: '.reviews-actions a',
      image: '.product-image-photo',
      link: '.product-item-link'
    }
  },
  noon: {
    name: 'Noon',
    baseUrl: 'https://www.noon.com',
    searchUrl: 'https://www.noon.com/saudi-en/search',
    selectors: {
      productContainer: '.productContainer',
      title: '.name',
      price: '.price',
      rating: '.rating span',
      reviews: '.reviewCount',
      image: 'img',
      link: 'a'
    }
  },
  extra: {
    name: 'Extra',
    baseUrl: 'https://www.extra.com',
    searchUrl: 'https://www.extra.com/en-sa/search',
    selectors: {
      productContainer: '.product-item',
      title: '.product-item-link',
      price: '.price',
      rating: '.rating-summary .rating-result',
      reviews: '.reviews-actions a',
      image: '.product-image-photo',
      link: '.product-item-link'
    }
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get brands endpoint
app.get('/api/brands', (req, res) => {
  res.json(PHONE_BRANDS);
});

// Helper function to construct search query based on parameters
const constructSearchQuery = (seller, { brand, model, priceRange, screenSize, batteryCapacity, cameraQuality }) => {
  let query = '';
  
  // Brand is required
  query += brand;
  
  // Add model if specified
  if (model) {
    query += ` ${model}`;
  }
  
  // Add price range keywords
  if (priceRange) {
    switch (priceRange) {
      case 'budget':
        query += ' budget phone';
        break;
      case 'mid':
        query += ' mid-range phone';
        break;
      case 'premium':
        query += ' premium phone';
        break;
    }
  }
  
  // Add screen size keywords
  if (screenSize) {
    switch (screenSize) {
      case 'small':
        query += ' small screen';
        break;
      case 'medium':
        query += ' medium screen';
        break;
      case 'large':
        query += ' large screen';
        break;
    }
  }
  
  // Add battery capacity keywords
  if (batteryCapacity) {
    switch (batteryCapacity) {
      case 'small':
        query += ' small battery';
        break;
      case 'medium':
        query += ' medium battery';
        break;
      case 'large':
        query += ' large battery';
        break;
    }
  }
  
  // Add camera quality keywords
  if (cameraQuality) {
    switch (cameraQuality) {
      case 'basic':
        query += ' basic camera';
        break;
      case 'advanced':
        query += ' advanced camera';
        break;
      case 'professional':
        query += ' professional camera';
        break;
    }
  }
  
  return query;
};

// Function to scrape product data from seller websites
const scrapeProductData = async (seller, searchParams) => {
  try {
    const searchQuery = constructSearchQuery(seller, searchParams);
    const url = new URL(SELLERS[seller].searchUrl);
    
    // Set search parameters based on the seller
    if (seller === 'amazon') {
      url.searchParams.set('k', searchQuery);
    } else if (seller === 'jarir') {
      url.searchParams.set('q', searchQuery);
    } else if (seller === 'noon') {
      url.searchParams.set('q', searchQuery);
    } else if (seller === 'extra') {
      url.searchParams.set('term', searchQuery);
    }
    
    console.log(`Searching ${SELLERS[seller].name} with query: ${searchQuery}`);
    
    const response = await axios.get(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const selectors = SELLERS[seller].selectors;
    const products = [];
    
    $(selectors.productContainer).slice(0, 5).each((i, el) => {
      const title = $(el).find(selectors.title).text().trim();
      const priceText = $(el).find(selectors.price).text().trim();
      const price = priceText.replace(/[^\d.]/g, '');
      
      let rating = 0;
      if (seller === 'amazon') {
        const ratingText = $(el).find(selectors.rating).text();
        const match = ratingText.match(/\d+(\.\d+)?/);
        rating = match ? parseFloat(match[0]) : 0;
      } else {
        rating = parseFloat($(el).find(selectors.rating).attr('style')?.match(/\d+/)?.[0] / 20) || 0;
      }
      
      const reviewsText = $(el).find(selectors.reviews).text().trim();
      const reviews = reviewsText.match(/\d+/) ? parseInt(reviewsText.match(/\d+/)[0]) : 0;
      
      let imageSrc = $(el).find(selectors.image).attr('src');
      if (!imageSrc) {
        imageSrc = $(el).find(selectors.image).attr('data-src');
      }
      
      let link = $(el).find(selectors.link).attr('href');
      if (link && !link.startsWith('http')) {
        link = `${SELLERS[seller].baseUrl}${link}`;
      }
      
      products.push({
        title,
        price,
        rating,
        reviews,
        image: imageSrc,
        link,
        seller: SELLERS[seller].name
      });
    });
    
    return products;
  } catch (error) {
    console.error(`Error scraping ${SELLERS[seller].name}:`, error.message);
    return [];
  }
};

// Calculate match score based on user priorities and product features
const calculateMatchScore = (priorities, priceRange, screenSize, batteryCapacity, cameraQuality) => {
  let score = 80; // Base score
  const priorityWeight = 5; // Weight for each priority match
  
  // Add score for each matching priority
  if (priorities.includes('price') && priceRange) {
    score += priorityWeight;
  }
  
  if (priorities.includes('screen') && screenSize) {
    score += priorityWeight;
  }
  
  if (priorities.includes('battery') && batteryCapacity) {
    score += priorityWeight;
  }
  
  if (priorities.includes('camera') && cameraQuality) {
    score += priorityWeight;
  }
  
  // Ensure score is not above 100
  return Math.min(score, 100);
};

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const searchParams = req.body;
    const { brand, priorities = [] } = searchParams;
    
    if (!brand) {
      return res.status(400).json({ message: 'Brand is required' });
    }
    
    const selectedBrand = PHONE_BRANDS.find(b => b.id === brand);
    if (!selectedBrand) {
      return res.status(400).json({ message: 'Invalid brand' });
    }
    
    // Search across all sellers
    const sellerPromises = Object.keys(SELLERS).map(seller => 
      scrapeProductData(seller, searchParams)
    );
    
    const results = await Promise.all(sellerPromises);
    const allProducts = results.flat();
    
    // Calculate match score for each product
    const productsWithScore = allProducts.map(product => {
      const matchScore = calculateMatchScore(
        priorities, 
        searchParams.priceRange, 
        searchParams.screenSize, 
        searchParams.batteryCapacity, 
        searchParams.cameraQuality
      );
      
      return {
        ...product,
        matchScore
      };
    });
    
    // Sort by match score and limit to top results
    const topResults = productsWithScore
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);
    
    res.json(topResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Start server with port fallback mechanism
const startServer = async (initialPort) => {
  let currentPort = initialPort;
  
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort, () => {
          console.log(`Server is running on port ${currentPort}`);
          resolve();
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
            currentPort++;
            server.close();
            reject(error);
          } else {
            console.error('Server error:', error);
            reject(error);
          }
        });
      });
      
      // If we reach here, the server started successfully
      return;
    } catch (error) {
      if (attempt === MAX_PORT_ATTEMPTS - 1) {
        console.error(`Failed to start server after ${MAX_PORT_ATTEMPTS} attempts`);
        process.exit(1);
      }
      // Continue to next attempt
    }
  }
};

startServer(PORT).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 