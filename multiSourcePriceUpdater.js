const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Load the phone data (Samsung or Apple)
async function loadPhoneData(brand) {
  try {
    const filePath = path.join(__dirname, `${brand}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading ${brand} data: ${error.message}`);
    return null;
  }
}

// Save updated phone data
async function savePhoneData(data, brand) {
  try {
    const filePath = path.join(__dirname, `${brand}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${brand}.json with current market prices`);
    return true;
  } catch (error) {
    console.error(`Error saving ${brand} data: ${error.message}`);
    return false;
  }
}

// Common headers for all requests
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
};

// ===== EXTRA.COM Scraper =====
async function scrapeExtraPrice(model, brand) {
  try {
    // Clean up the model name for search
    let searchTerm = model.replace(' (Estimated)', '');
    if (brand === 'Apple') {
      searchTerm = searchTerm.replace('iPhone ', 'iPhone');
    } else {
      searchTerm = searchTerm.replace('Galaxy ', '').replace('+', ' Plus');
    }
    
    console.log(`Searching Extra.com for "${searchTerm}"...`);
    
    // Use the search functionality
    const searchUrl = `https://www.extra.com/ar-sa/search/?text=${encodeURIComponent(searchTerm)}`;
    
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('.product-item');
    let bestMatch = null;
    
    products.each((index, element) => {
      const productTitle = $(element).find('.product-title').text().trim();
      
      // Check if product matches our model
      const titleLower = productTitle.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      const brandLower = brand.toLowerCase();
      
      // Make sure product title contains brand name and model
      if (titleLower.includes(brandLower) && 
          (titleLower.includes(searchTermLower) || searchTermLower.includes(titleLower))) {
        
        // Extract price
        const priceElement = $(element).find('.product-price .product-price__main');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            bestMatch = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75), // Convert to USD
              source: 'extra.com'
            };
            return false; // Break the loop
          }
        }
      }
    });
    
    if (bestMatch) {
      console.log(`Found Extra.com price for ${model}: ${bestMatch.title} - SAR ${bestMatch.sar} (USD ${bestMatch.usd})`);
      return bestMatch;
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping Extra.com for ${model}: ${error.message}`);
    return null;
  }
}

// ===== NOON.COM Scraper =====
async function scrapeNoonPrice(model, brand) {
  try {
    // Clean up the model name for search
    let searchTerm = model.replace(' (Estimated)', '');
    if (brand === 'Apple') {
      searchTerm = searchTerm.replace('iPhone ', 'iPhone');
    } else {
      searchTerm = searchTerm.replace('Galaxy ', '');
    }
    
    console.log(`Searching Noon.com for "${searchTerm}"...`);
    
    // Use the search functionality
    const searchUrl = `https://www.noon.com/saudi-ar/search?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('[data-qa="product-item"]');
    let bestMatch = null;
    
    products.each((index, element) => {
      const productTitle = $(element).find('[data-qa="product-name"]').text().trim();
      
      // Check if product matches our model
      const titleLower = productTitle.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      const brandLower = brand.toLowerCase();
      
      if (titleLower.includes(brandLower) && 
          (titleLower.includes(searchTermLower) || searchTermLower.includes(titleLower))) {
        
        // Extract price
        const priceElement = $(element).find('[data-qa="product-price"]');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            bestMatch = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75),
              source: 'noon.com'
            };
            return false; // Break the loop
          }
        }
      }
    });
    
    if (bestMatch) {
      console.log(`Found Noon.com price for ${model}: ${bestMatch.title} - SAR ${bestMatch.sar} (USD ${bestMatch.usd})`);
      return bestMatch;
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping Noon.com for ${model}: ${error.message}`);
    return null;
  }
}

// ===== JARIR.COM Scraper =====
async function scrapeJarirPrice(model, brand) {
  try {
    // Clean up the model name for search
    let searchTerm = model.replace(' (Estimated)', '');
    if (brand === 'Apple') {
      searchTerm = searchTerm.replace('iPhone ', 'iPhone');
    } else {
      searchTerm = searchTerm.replace('Galaxy ', '');
    }
    
    console.log(`Searching Jarir.com for "${searchTerm}"...`);
    
    // Use the search functionality on Jarir website
    const searchUrl = `https://www.jarir.com/sa-en/catalogsearch/result/?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('.product-item');
    let bestMatch = null;
    
    products.each((index, element) => {
      const productTitle = $(element).find('.product-item-link').text().trim();
      
      // Check if product matches our model
      const titleLower = productTitle.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      const brandLower = brand.toLowerCase();
      
      if (titleLower.includes(brandLower) && 
          (titleLower.includes(searchTermLower) || searchTermLower.includes(titleLower))) {
        
        // Extract price
        const priceElement = $(element).find('.price');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            bestMatch = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75),
              source: 'jarir.com'
            };
            return false; // Break the loop
          }
        }
      }
    });
    
    if (bestMatch) {
      console.log(`Found Jarir.com price for ${model}: ${bestMatch.title} - SAR ${bestMatch.sar} (USD ${bestMatch.usd})`);
      return bestMatch;
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping Jarir.com for ${model}: ${error.message}`);
    return null;
  }
}

// ===== MOBILY Scraper =====
async function scrapeMobilyPrice(model, brand) {
  try {
    // Clean up the model name for search
    let searchTerm = model.replace(' (Estimated)', '');
    
    console.log(`Searching Mobily for "${searchTerm}"...`);
    
    let searchUrl;
    if (brand === 'Samsung') {
      searchUrl = 'https://shop.mobily.com.sa/product-category/smartphones-ar/%D8%A7%D8%AC%D9%87%D8%B2%D8%A9-%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%D8%AC/';
    } else if (brand === 'Apple') {
      searchUrl = 'https://shop.mobily.com.sa/product-category/smartphones-ar/%D8%A7%D8%AC%D9%87%D8%B2%D8%A9-%D8%A7%D9%8A%D9%81%D9%88%D9%86/';
    } else {
      return null;
    }
    
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('.product-small');
    let bestMatch = null;
    
    products.each((index, element) => {
      const productTitle = $(element).find('.product-title a').text().trim();
      
      // Check if product matches our model
      const titleLower = productTitle.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      
      // Check for model match, accounting for different naming conventions
      if ((titleLower.includes(searchTermLower) || searchTermLower.includes(titleLower))) {
        
        // Extract price
        const priceElement = $(element).find('.price .amount');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            bestMatch = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75),
              source: 'mobily.com.sa'
            };
            return false; // Break the loop
          }
        }
      }
    });
    
    if (bestMatch) {
      console.log(`Found Mobily price for ${model}: ${bestMatch.title} - SAR ${bestMatch.sar} (USD ${bestMatch.usd})`);
      return bestMatch;
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping Mobily for ${model}: ${error.message}`);
    return null;
  }
}

// ===== ALMANEA Scraper =====
async function scrapeAlmaneaPrice(model, brand) {
  try {
    // Clean up the model name for search
    let searchTerm = model.replace(' (Estimated)', '');
    
    console.log(`Searching Almanea for "${searchTerm}"...`);
    
    const searchUrl = `https://www.almanea.sa/search?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('.product-item');
    let bestMatch = null;
    
    products.each((index, element) => {
      const productTitle = $(element).find('.product-title').text().trim();
      
      // Check if product matches our model
      const titleLower = productTitle.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      const brandLower = brand.toLowerCase();
      
      if (titleLower.includes(brandLower) && 
          (titleLower.includes(searchTermLower) || searchTermLower.includes(titleLower))) {
        
        // Extract price
        const priceElement = $(element).find('.price');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            bestMatch = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75),
              source: 'almanea.sa'
            };
            return false; // Break the loop
          }
        }
      }
    });
    
    if (bestMatch) {
      console.log(`Found Almanea price for ${model}: ${bestMatch.title} - SAR ${bestMatch.sar} (USD ${bestMatch.usd})`);
      return bestMatch;
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping Almanea for ${model}: ${error.message}`);
    return null;
  }
}

// Function to estimate price based on model and current market trends (fallback)
function estimatePrice(model, brand) {
  const modelLower = model.toLowerCase();
  const isEstimated = model.includes('(Estimated)');
  let basePrice = 0;
  
  if (brand === 'Samsung') {
    // Base price estimation for Samsung
    if (modelLower.includes('fold')) {
      basePrice = 1799;
    } else if (modelLower.includes('flip')) {
      basePrice = 999;
    } else if (modelLower.includes('ultra')) {
      basePrice = 1199;
    } else if (modelLower.includes('plus') || modelLower.includes('+')) {
      basePrice = 999;
    } else if (modelLower.includes('fe')) {
      basePrice = 599;
    } else if (modelLower.includes('galaxy s')) {
      basePrice = 799;
    } else if (modelLower.includes('note')) {
      basePrice = 899;
    } else if (modelLower.includes('galaxy a')) {
      // Extract model number for A series
      const modelMatch = modelLower.match(/a(\d+)/);
      if (modelMatch) {
        const modelNum = parseInt(modelMatch[1]);
        if (modelNum >= 50) {
          basePrice = 449;
        } else if (modelNum >= 30) {
          basePrice = 299;
        } else {
          basePrice = 199;
        }
      } else {
        basePrice = 299;
      }
    } else {
      basePrice = 499;
    }
    
    // Adjust price based on release year and current market for Samsung
    const yearMatch = model.match(/s(\d+)/i);
    if (yearMatch) {
      const seriesNum = parseInt(yearMatch[1]);
      
      // S25 models are new/future models
      if (seriesNum >= 25) {
        basePrice = Math.round(basePrice * 1.1);
      }
      // S24 models are current models
      else if (seriesNum === 24) {
        // No discount
      } 
      // S23 models get a 20% discount (last year's models)
      else if (seriesNum === 23) {
        basePrice = Math.round(basePrice * 0.8);
      }
      // S22 models get a 40% discount (two years old)
      else if (seriesNum === 22) {
        basePrice = Math.round(basePrice * 0.6);
      }
      // S21 models get a 60% discount (three years old)
      else if (seriesNum === 21) {
        basePrice = Math.round(basePrice * 0.4);
      }
      // Older models get a 70% discount
      else if (seriesNum < 21) {
        basePrice = Math.round(basePrice * 0.3);
      }
    }
  } else if (brand === 'Apple') {
    // Base price estimation for Apple
    if (modelLower.includes('pro max')) {
      basePrice = 1099;
    } else if (modelLower.includes('pro')) {
      basePrice = 999;
    } else if (modelLower.includes('plus')) {
      basePrice = 899;
    } else if (modelLower.includes('mini')) {
      basePrice = 699;
    } else if (modelLower.includes('iphone se')) {
      basePrice = 429;
    } else if (modelLower.includes('iphone')) {
      basePrice = 799;
    } else if (modelLower.includes('ipad pro')) {
      basePrice = 799;
    } else if (modelLower.includes('ipad air')) {
      basePrice = 599;
    } else if (modelLower.includes('ipad mini')) {
      basePrice = 499;
    } else if (modelLower.includes('ipad')) {
      basePrice = 329;
    } else {
      basePrice = 699;
    }
    
    // Adjust price based on iPhone generation
    const genMatch = modelLower.match(/iphone (\d+)/);
    if (genMatch) {
      const generation = parseInt(genMatch[1]);
      
      // iPhone 16 is newest
      if (generation >= 16) {
        basePrice = Math.round(basePrice * 1.1);
      }
      // iPhone 15 is current
      else if (generation === 15) {
        // No discount
      }
      // iPhone 14 is one generation old
      else if (generation === 14) {
        basePrice = Math.round(basePrice * 0.8);
      }
      // iPhone 13 is two generations old
      else if (generation === 13) {
        basePrice = Math.round(basePrice * 0.6);
      }
      // iPhone 12 and older
      else if (generation <= 12) {
        basePrice = Math.round(basePrice * 0.5);
      }
    }
  }
  
  // Saudi market adjustment (prices can be 5-15% higher)
  const marketAdjustment = 1.10;
  basePrice = Math.round(basePrice * marketAdjustment);
  
  // Convert to SAR (1 USD = 3.75 SAR)
  const sarPrice = Math.round(basePrice * 3.75);
  
  return {
    usd: basePrice,
    sar: sarPrice,
    source: 'estimated'
  };
}

// Function to get the best price from multiple sources
async function getBestPrice(model, brand) {
  // Try all sources
  const promises = [
    scrapeExtraPrice(model, brand),
    scrapeNoonPrice(model, brand),
    scrapeJarirPrice(model, brand),
    scrapeMobilyPrice(model, brand),
    scrapeAlmaneaPrice(model, brand)
  ];
  
  // Wait for all scraping attempts to complete
  const results = await Promise.all(promises);
  
  // Filter out null results
  const validResults = results.filter(result => result !== null);
  
  if (validResults.length > 0) {
    // Sort by price (lowest first)
    validResults.sort((a, b) => a.sar - b.sar);
    
    // Return the cheapest price
    return validResults[0];
  }
  
  // If no valid results, use estimation
  return estimatePrice(model, brand);
}

// Main function to update all prices for a specific brand
async function updateAllPrices(brand) {
  console.log(`Starting multi-source price update process for ${brand}...`);
  console.log(`Current date: ${new Date().toISOString()}`);
  
  const phoneData = await loadPhoneData(brand);
  if (!phoneData) return false;
  
  const phoneArray = brand === 'Samsung' ? phoneData.samsungPhones : phoneData.iPhones;
  const total = phoneArray.length;
  let updated = 0;
  let scrapedCount = 0;
  
  // Process in batches to avoid overwhelming the websites
  const batchSize = 3;
  const batches = Math.ceil(phoneArray.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, phoneArray.length);
    const batch = phoneArray.slice(start, end);
    
    console.log(`Processing batch ${i+1}/${batches} (phones ${start+1}-${end} of ${total})`);
    
    // Process each phone in the batch
    for (const phone of batch) {
      try {
        // Only try to scrape current/recent models that are not estimated
        const shouldScrape = phone.releaseYear >= 2022 && !phone.model.includes('Estimated');
        
        let newPrice;
        
        if (shouldScrape) {
          // Try to get the best price from multiple sources
          newPrice = await getBestPrice(phone.model, brand);
          if (newPrice.source !== 'estimated') {
            scrapedCount++;
          }
        } else {
          // Just estimate for older or future models
          newPrice = estimatePrice(phone.model, brand);
          console.log(`Using estimated price for ${phone.model}: $${newPrice.usd} (SAR ${newPrice.sar})`);
        }
        
        // Update the price
        phone.price = {
          usd: newPrice.usd,
          sar: newPrice.sar
        };
        phone.lastPriceUpdate = new Date().toISOString();
        phone.priceSource = newPrice.source;
        updated++;
        
      } catch (error) {
        console.error(`Error updating price for ${phone.model}: ${error.message}`);
      }
    }
    
    // Save after each batch in case of interruption
    await savePhoneData(phoneData, brand);
    
    // Wait between batches to be nice to the servers
    if (i < batches - 1) {
      console.log('Waiting 8 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
  }
  
  console.log(`Updated prices for ${updated}/${total} ${brand} phones (${scrapedCount} from web, ${updated - scrapedCount} estimated)`);
  
  // Final save
  await savePhoneData(phoneData, brand);
  console.log(`All ${brand} prices have been updated with current market data.`);
  return true;
}

// Run the update for both brands
async function updateAllBrands() {
  try {
    console.log('Starting comprehensive price update for all brands...');
    
    // Update Samsung first
    await updateAllPrices('Samsung');
    
    // Then update Apple
    await updateAllPrices('Apple');
    
    console.log('All phone prices have been updated successfully!');
    return true;
  } catch (error) {
    console.error(`Error in updateAllBrands: ${error.message}`);
    return false;
  }
}

// Run the update directly if this script is executed
if (require.main === module) {
  updateAllBrands().then((success) => {
    console.log(`Multi-source price update completed ${success ? 'successfully' : 'with errors'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  updateAllPrices,
  updateAllBrands
}; 