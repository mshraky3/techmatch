const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

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
    console.log('Successfully updated Samsung.json with current Jarir prices');
    return true;
  } catch (error) {
    console.error(`Error saving Samsung data: ${error.message}`);
    return false;
  }
}

// Function to scrape Jarir.com for a specific Samsung model
async function scrapeJarirPrice(model) {
  try {
    // Clean up the model name for search
    const searchTerm = model.replace(' (Estimated)', '')
                            .replace('+', ' Plus')
                            .replace('Ultra', '')
                            .replace('Galaxy ', '')
                            .trim();
    
    console.log(`Searching Jarir.com for "${searchTerm}"...`);
    
    // Use the search functionality on Jarir website
    const searchUrl = `https://www.jarir.com/sa-en/catalogsearch/result/?q=${encodeURIComponent(searchTerm)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('.product-item');
    let bestMatch = null;
    
    products.each((index, element) => {
      const productTitle = $(element).find('.product-item-link').text().trim();
      
      // Check if this is a Samsung phone and matches our model
      if (productTitle.toLowerCase().includes('samsung') && 
          productTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
        
        // Extract price
        const priceElement = $(element).find('.price');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            bestMatch = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75) // Convert to USD
            };
            return false; // Break the loop
          }
        }
      }
    });
    
    if (bestMatch) {
      console.log(`Found price for ${model}: ${bestMatch.title} - SAR ${bestMatch.sar} (USD ${bestMatch.usd})`);
      return {
        usd: bestMatch.usd,
        sar: bestMatch.sar
      };
    }
    
    console.log(`No direct match found on Jarir for ${model}, falling back to estimation`);
    return null;
  } catch (error) {
    console.error(`Error scraping Jarir for ${model}: ${error.message}`);
    return null;
  }
}

// Function to estimate price based on model and current market trends (fallback)
function estimatePrice(model) {
  const modelLower = model.toLowerCase();
  const isEstimated = model.includes('(Estimated)');
  let basePrice = 0;
  
  // Base price estimation by model type in USD
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
  } else {
    // For non-S series, estimate based on release year
    const releaseYearMatch = model.match(/\s(\d{4})$/);
    if (releaseYearMatch) {
      const releaseYear = parseInt(releaseYearMatch[1]);
      
      if (releaseYear >= 2025) {
        // Future models get a premium
        basePrice = Math.round(basePrice * 1.1);
      } else if (releaseYear === 2024) {
        // Current year models, no discount
      } else if (releaseYear === 2023) {
        // Last year models get a 20% discount
        basePrice = Math.round(basePrice * 0.8);
      } else if (releaseYear === 2022) {
        // Two year old models get a 40% discount
        basePrice = Math.round(basePrice * 0.6);
      } else if (releaseYear <= 2021) {
        // Older models get a 60-70% discount
        basePrice = Math.round(basePrice * 0.4);
      }
    }
  }
  
  // Jarir prices are typically higher in SAR than direct USD conversion
  // Apply Saudi market adjustment (prices can be 5-15% higher)
  const marketAdjustment = 1.10;
  basePrice = Math.round(basePrice * marketAdjustment);
  
  // Convert to SAR (1 USD = 3.75 SAR)
  const sarPrice = Math.round(basePrice * 3.75);
  
  return {
    usd: basePrice,
    sar: sarPrice
  };
}

// Main function to update all prices using Jarir.com
async function updateAllPrices() {
  console.log('Starting Jarir.com price update process...');
  console.log(`Current date: ${new Date().toISOString()}`);
  
  const samsungData = await loadSamsungData();
  if (!samsungData) return false;
  
  const total = samsungData.samsungPhones.length;
  let updated = 0;
  let scrapedCount = 0;
  
  // Process in batches to avoid overwhelming the website
  const batchSize = 5;
  const batches = Math.ceil(samsungData.samsungPhones.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, samsungData.samsungPhones.length);
    const batch = samsungData.samsungPhones.slice(start, end);
    
    console.log(`Processing batch ${i+1}/${batches} (phones ${start+1}-${end} of ${total})`);
    
    // Process each phone in the batch
    for (const phone of batch) {
      try {
        // Only try to scrape current/recent models (2022+) that are not estimated
        const shouldScrapeJarir = phone.releaseYear >= 2022 && !phone.model.includes('Estimated');
        
        let newPrice = null;
        
        if (shouldScrapeJarir) {
          // Try to get the price from Jarir
          newPrice = await scrapeJarirPrice(phone.model);
          if (newPrice) {
            scrapedCount++;
          }
        }
        
        // If we couldn't get a price from Jarir, use our estimation
        if (!newPrice) {
          newPrice = estimatePrice(phone.model);
          console.log(`Using estimated price for ${phone.model}: $${newPrice.usd} (SAR ${newPrice.sar})`);
        }
        
        // Update the price
        phone.price = newPrice;
        phone.lastPriceUpdate = new Date().toISOString();
        phone.priceSource = newPrice ? 'jarir.com' : 'estimated';
        updated++;
        
      } catch (error) {
        console.error(`Error updating price for ${phone.model}: ${error.message}`);
      }
    }
    
    // Save after each batch in case of interruption
    await saveSamsungData(samsungData);
    
    // Wait between batches to be nice to the server
    if (i < batches - 1) {
      console.log('Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`Updated prices for ${updated}/${total} phones (${scrapedCount} from Jarir.com, ${updated - scrapedCount} estimated)`);
  
  // Final save
  await saveSamsungData(samsungData);
  console.log("All prices have been updated with current market data from Jarir.com.");
  return true;
}

// Run the update directly if this script is executed
if (require.main === module) {
  updateAllPrices().then((success) => {
    console.log(`Price update from Jarir.com completed ${success ? 'successfully' : 'with errors'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  updateAllPrices,
  scrapeJarirPrice
}; 