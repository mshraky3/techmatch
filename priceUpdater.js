const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { google } = require('googleapis');
require('dotenv').config();

// Google API setup
const customsearch = google.customsearch('v1');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// Price sources to search
const PRICE_SOURCES = [
  'amazon.com',
  'samsung.com',
  'bestbuy.com',
  'walmart.com',
  'newegg.com',
  'bhphotovideo.com'
];

// Load the Samsung phone data
async function loadSamsungData() {
  try {
    const filePath = path.join(__dirname, 'Samsung.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading Samsung data: ${error.message}`);
    return null;
  }
}

// Save updated Samsung data
async function saveSamsungData(data) {
  try {
    const filePath = path.join(__dirname, 'Samsung.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Successfully updated Samsung.json with current prices');
    return true;
  } catch (error) {
    console.error(`Error saving Samsung data: ${error.message}`);
    return false;
  }
}

// Function to search for current prices
async function searchPhonePrice(model, retries = 3) {
  // Remove "Estimated" for future models
  const searchModel = model.replace(' (Estimated)', '');
  
  console.log(`Searching for current price of ${searchModel}...`);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Build search query targeting recent listings
      const searchQuery = `${searchModel} price USD current site:${PRICE_SOURCES.join(' OR site:')}`;
      
      const response = await customsearch.cse.list({
        auth: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: searchQuery,
        num: 5, // Get top 5 results
        dateRestrict: 'm3' // Restrict to past 3 months
      });
      
      if (response.data.items && response.data.items.length > 0) {
        // Process search results
        for (const item of response.data.items) {
          try {
            const price = await extractPriceFromPage(item.link, searchModel);
            if (price && price.usd > 0) {
              console.log(`Found price for ${searchModel}: $${price.usd} (SAR ${price.sar})`);
              return price;
            }
          } catch (error) {
            console.error(`Error extracting price from ${item.link}: ${error.message}`);
            continue;
          }
        }
      }
      
      // If no results, try a different query format
      if (attempt === 1) {
        const altQuery = `"${searchModel}" "price" "buy" current`;
        console.log(`Trying alternative query: ${altQuery}`);
        
        const altResponse = await customsearch.cse.list({
          auth: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: altQuery,
          num: 5
        });
        
        if (altResponse.data.items && altResponse.data.items.length > 0) {
          for (const item of altResponse.data.items) {
            try {
              const price = await extractPriceFromPage(item.link, searchModel);
              if (price && price.usd > 0) {
                console.log(`Found price for ${searchModel}: $${price.usd} (SAR ${price.sar})`);
                return price;
              }
            } catch (error) {
              console.error(`Error extracting price from ${item.link}: ${error.message}`);
              continue;
            }
          }
        }
      }
      
      // Sleep before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Search attempt ${attempt + 1} failed: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // If all attempts fail, estimate based on model and year
  console.log(`Could not find current price for ${searchModel}, using estimation`);
  return estimatePrice(model);
}

// Function to extract price from a webpage
async function extractPriceFromPage(url, model) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    let priceText = null;
    
    // Different scraping strategies based on the website
    if (url.includes('amazon.com')) {
      priceText = $('.a-price .a-offscreen').first().text().trim();
      if (!priceText) {
        priceText = $('#priceblock_ourprice').text().trim();
      }
      if (!priceText) {
        priceText = $('.a-price-whole').first().text().trim() + $('.a-price-fraction').first().text().trim();
      }
    } else if (url.includes('samsung.com')) {
      priceText = $('.pd-price-block__card-cprice').first().text().trim();
      if (!priceText) {
        priceText = $('.pd-price-block__price').first().text().trim();
      }
      if (!priceText) {
        $('*:contains("$")').each((i, el) => {
          const text = $(el).text().trim();
          if (text.match(/\$[0-9,]+\.[0-9]{2}/) && text.length < 20) {
            priceText = text;
            return false; // break the loop
          }
        });
      }
    } else if (url.includes('bestbuy.com')) {
      priceText = $('.priceView-customer-price span').first().text().trim();
      if (!priceText) {
        priceText = $('.pricing-price__regular-price').first().text().trim();
      }
    } else {
      // Generic price extraction for other sites
      const priceRegex = /\$([0-9,]+(?:\.[0-9]{2})?)/;
      const bodyText = $('body').text();
      const match = bodyText.match(priceRegex);
      
      if (match) {
        priceText = match[0];
      } else {
        // Try to find any element containing a price
        $('*:contains("$")').each((i, el) => {
          const text = $(el).text().trim();
          if (text.match(/\$[0-9,]+\.[0-9]{2}/) && text.length < 30 && text.includes(model.split(' ').pop())) {
            priceText = text;
            return false; // break the loop
          }
        });
      }
    }
    
    if (priceText) {
      // Extract the numeric value from the price text
      const priceMatch = priceText.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
      if (priceMatch) {
        const usdPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        // Convert to SAR (1 USD = 3.75 SAR)
        const sarPrice = Math.round(usdPrice * 3.75);
        
        return {
          usd: usdPrice,
          sar: sarPrice
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
    return null;
  }
}

// Function to estimate price based on model and current market trends
function estimatePrice(model) {
  const modelLower = model.toLowerCase();
  const isEstimated = model.includes('(Estimated)');
  let basePrice = 0;
  
  // Base price estimation by model type
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
  
  // Adjust price based on release year and current market
  const yearMatch = model.match(/s(\d+)/i);
  if (yearMatch) {
    const seriesNum = parseInt(yearMatch[1]);
    
    // Current year models (S23, etc.)
    if (seriesNum === 23) {
      // No discount on current models
    } 
    // One year old models get a 20% discount
    else if (seriesNum === 22) {
      basePrice = Math.round(basePrice * 0.8);
    }
    // Two year old models get a 40% discount
    else if (seriesNum === 21) {
      basePrice = Math.round(basePrice * 0.6);
    }
    // Three year old models get a 60% discount
    else if (seriesNum === 20) {
      basePrice = Math.round(basePrice * 0.4);
    }
    // Older models get a 70-80% discount
    else if (seriesNum < 20) {
      basePrice = Math.round(basePrice * 0.3);
    }
    // Future models might have a price premium
    else if (isEstimated) {
      basePrice = Math.round(basePrice * 1.05);
    }
  }
  
  // Convert to SAR
  const sarPrice = Math.round(basePrice * 3.75);
  
  return {
    usd: basePrice,
    sar: sarPrice
  };
}

// Main function to update all prices
async function updateAllPrices() {
  console.log('Starting price update process...');
  console.log(`Current date: ${new Date().toISOString()}`);
  
  const samsungData = await loadSamsungData();
  if (!samsungData) return false;
  
  const total = samsungData.samsungPhones.length;
  let updated = 0;
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  const batches = Math.ceil(samsungData.samsungPhones.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, samsungData.samsungPhones.length);
    const batch = samsungData.samsungPhones.slice(start, end);
    
    console.log(`Processing batch ${i+1}/${batches} (phones ${start+1}-${end} of ${total})`);
    
    // Process each phone in the batch concurrently
    const results = await Promise.all(batch.map(async (phone) => {
      try {
        // Only update prices for phones that are available in the market (not too old)
        if (phone.releaseYear >= 2020 || phone.model.includes('Estimated')) {
          const newPrice = await searchPhonePrice(phone.model);
          if (newPrice) {
            phone.price = newPrice;
            phone.lastPriceUpdate = new Date().toISOString();
            updated++;
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error(`Error updating price for ${phone.model}: ${error.message}`);
        return false;
      }
    }));
    
    // Wait between batches to avoid hitting rate limits
    if (i < batches - 1) {
      console.log('Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`Updated prices for ${updated}/${total} phones`);
  
  // Save the updated data
  await saveSamsungData(samsungData);
  return true;
}

// Add this function to the Express app endpoints
async function addPriceUpdateEndpoint(app) {
  app.get('/api/update-prices', async (req, res) => {
    try {
      res.send({ message: 'Price update started. This process may take several minutes.' });
      const success = await updateAllPrices();
      console.log(`Price update ${success ? 'completed successfully' : 'failed'}`);
    } catch (error) {
      console.error(`Error in price update endpoint: ${error.message}`);
    }
  });
}

module.exports = {
  updateAllPrices,
  addPriceUpdateEndpoint
}; 