const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { updateAllPrices, addPriceUpdateEndpoint } = require('./priceUpdater');
const { startScheduledUpdates, addSchedulerEndpoints } = require('./scheduledUpdates');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Google API setup
const customsearch = google.customsearch('v1');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// Samsung model data
const samsungData = {
  "samsungPhones": []
};

// Max retries for API calls and scraping
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second delay between retries

// Trusted websites for scraping (in order of preference)
const TRUSTED_SITES = [
  'gsmarena.com',
  'samsung.com',
  'techradar.com',
  'gadgets360.com',
  'phonearena.com',
  'tomsguide.com',
  'androidauthority.com',
  'cnet.com',
  'theverge.com'
];

// Category labels based on specifications
const categorizeScreenSize = (size) => {
  const numSize = parseFloat(size);
  if (numSize < 5) return "small";
  if (numSize <= 6.5) return "medium";
  return "large";
};

const categorizeBatteryLife = (capacity) => {
  // Extract numeric value from strings like "4500 mAh"
  const capValue = parseInt(capacity.replace(/[^0-9]/g, ''));
  if (capValue < 3000) return "bad";
  if (capValue <= 4500) return "good";
  return "very good";
};

const categorizeCameraQuality = (camera) => {
  // Handle multi-lens cameras
  if (camera.toLowerCase().includes('quad') || camera.toLowerCase().includes('triple')) {
    return "very good";
  }
  
  // Extract MP value
  const mpMatch = camera.match(/(\d+)\s*MP/i);
  if (mpMatch) {
    const mpValue = parseInt(mpMatch[1]);
    if (mpValue < 10) return "bad";
    if (mpValue <= 30) return "good";
    return "very good";
  }
  
  return "good"; // Default if we can't determine
};

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function for API calls
async function retryOperation(operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);
      lastError = error;
      await sleep(delay * (attempt + 1)); // Exponential backoff
    }
  }
  throw lastError;
}

// Function to ensure we have all the required fields for a phone
function isCompletePhoneData(phoneData) {
  const requiredFields = [
    'model', 'releaseYear', 'company', 'price', 
    'screenSize', 'screenSizeLabel', 'cameraQuality', 
    'cameraQualityLabel', 'screenType', 'batteryLife', 'batteryLifeLabel'
  ];

  const missingFields = requiredFields.filter(field => {
    if (field === 'price') {
      return !phoneData.price || (phoneData.price.usd === 0 && phoneData.price.sar === 0);
    }
    return !phoneData[field] || phoneData[field] === "Unknown";
  });

  return missingFields.length === 0;
}

// Function to search for Samsung phone data
async function searchSamsungPhones() {
  try {
    const existingData = loadExistingData();
    if (existingData.samsungPhones && existingData.samsungPhones.length > 0) {
      samsungData.samsungPhones = existingData.samsungPhones;
      console.log(`Loaded ${samsungData.samsungPhones.length} existing phone entries`);
    }
    
    // Years to search (2014-2025)
    const years = Array.from({length: 12}, (_, i) => 2014 + i);
    
    // Different Samsung series
    const series = [
      'Galaxy S', 'Galaxy Note', 'Galaxy A', 
      'Galaxy Z Fold', 'Galaxy Z Flip', 'Galaxy M',
      'Galaxy F', 'Galaxy J', 'Galaxy Tab S'
    ];
    
    for (const year of years) {
      console.log(`Searching for Samsung phones from ${year}...`);
      
      // Create a more specific model list for each year to ensure we get comprehensive data
      const specificModels = getSpecificModels(year);
      const searchTerms = [...series, ...specificModels];
      
      // Track how many new models we found for this year
      let newModelsFoundForYear = 0;
      
      for (const searchTerm of searchTerms) {
        // Don't oversearch recent years if we already have good data
        if (year >= 2020 && newModelsFoundForYear >= 10) {
          console.log(`Already found ${newModelsFoundForYear} models for ${year}, moving to next year`);
          break;
        }
        
        await searchAndProcess(searchTerm, year);
        
        // Save progress after each search term
        saveDataToFile();
        await sleep(500); // Short delay to avoid API rate limits
      }
    }
    
    // Final data cleanup and validation
    cleanupAndValidateData();
    
    // Final save
    saveDataToFile();
    console.log('All Samsung phone data collected and saved!');
    
  } catch (error) {
    console.error(`Error in searchSamsungPhones: ${error.message}`);
    // Save whatever data we have so far
    saveDataToFile();
  }
}

// Function to get specific model search terms based on year
function getSpecificModels(year) {
  const models = [];
  
  if (year === 2014) models.push('Galaxy S5', 'Galaxy Note 4', 'Galaxy Alpha');
  else if (year === 2015) models.push('Galaxy S6', 'Galaxy S6 Edge', 'Galaxy Note 5');
  else if (year === 2016) models.push('Galaxy S7', 'Galaxy S7 Edge', 'Galaxy Note 7');
  else if (year === 2017) models.push('Galaxy S8', 'Galaxy S8+', 'Galaxy Note 8');
  else if (year === 2018) models.push('Galaxy S9', 'Galaxy S9+', 'Galaxy Note 9');
  else if (year === 2019) models.push('Galaxy S10', 'Galaxy S10+', 'Galaxy Note 10', 'Galaxy Fold');
  else if (year === 2020) models.push('Galaxy S20', 'Galaxy S20+', 'Galaxy Note 20', 'Galaxy Z Fold 2', 'Galaxy Z Flip');
  else if (year === 2021) models.push('Galaxy S21', 'Galaxy S21+', 'Galaxy Z Fold 3', 'Galaxy Z Flip 3');
  else if (year === 2022) models.push('Galaxy S22', 'Galaxy S22+', 'Galaxy Z Fold 4', 'Galaxy Z Flip 4');
  else if (year === 2023) models.push('Galaxy S23', 'Galaxy S23+', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5');
  else if (year === 2024) models.push('Galaxy S24', 'Galaxy S24+', 'Galaxy Z Fold 6', 'Galaxy Z Flip 6');
  else if (year === 2025) models.push('Galaxy S25', 'Galaxy S25+', 'Galaxy Z Fold 7', 'Galaxy Z Flip 7');
  
  // Add more specific model variants
  if (year >= 2019) {
    models.push(`Galaxy A${year % 100}`, `Galaxy A${year % 100}s`);
  }
  
  return models;
}

// Search for a specific term and process results
async function searchAndProcess(searchTerm, year) {
  for (let siteIndex = 0; siteIndex < TRUSTED_SITES.length; siteIndex++) {
    try {
      const site = TRUSTED_SITES[siteIndex];
      const query = `Samsung ${searchTerm} ${year} specifications site:${site}`;
      
      console.log(`Searching for: ${query}`);
      
      // Use retry for the search operation
      const response = await retryOperation(async () => {
        return await customsearch.cse.list({
          auth: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: query,
          num: 10
        });
      });
      
      if (response.data.items && response.data.items.length > 0) {
        // Process each search result
        for (const item of response.data.items) {
          try {
            // Extract model name from title with more comprehensive pattern matching
            const title = item.title;
            let modelMatch = null;
            
            // Try different regex patterns to match model names in different formats
            const regexPatterns = [
              /Samsung\s+(Galaxy\s+\w+\s+\w+\d*\+*)/i,
              /Samsung\s+(Galaxy\s+\w+\d*\+*)/i,
              /Samsung\s+(Galaxy\s+\w+\s+\w+)/i,
              /Samsung\s+(Galaxy\s+\w+)/i,
              /(Galaxy\s+\w+\s+\w+\d*\+*)/i,
              /(Galaxy\s+\w+\d*\+*)/i
            ];
            
            for (const pattern of regexPatterns) {
              const match = title.match(pattern);
              if (match) {
                modelMatch = match;
                break;
              }
            }
            
            if (modelMatch) {
              const model = modelMatch[1].trim();
              
              // Check if we already have this model
              const existingModel = samsungData.samsungPhones.find(phone => 
                phone.model.toLowerCase() === model.toLowerCase() && 
                phone.releaseYear === year
              );
              
              if (existingModel) {
                // If the existing model data is not complete, try to supplement it
                if (!isCompletePhoneData(existingModel)) {
                  console.log(`Found additional data source for ${model} (${year}): ${item.link}`);
                  const additionalData = await scrapePhoneData(item.link, model, year);
                  if (additionalData) {
                    // Merge the additional data with existing data
                    mergePhoneData(existingModel, additionalData);
                    console.log(`Updated data for ${model} (${year})`);
                  }
                }
              } else {
                // This is a new model, scrape its data
                const phoneData = await scrapePhoneData(item.link, model, year);
                if (phoneData) {
                  samsungData.samsungPhones.push(phoneData);
                  console.log(`Added data for ${model} (${year})`);
                }
              }
            }
          } catch (error) {
            console.error(`Error processing search result: ${error.message}`);
            continue;
          }
        }
      } else {
        console.log(`No results found for ${searchTerm} ${year} on ${site}`);
      }
      
      // If we find results on this site, don't need to try other sites for this search term
      if (response.data.items && response.data.items.length > 0) {
        break;
      }
      
    } catch (error) {
      console.error(`Error searching for ${searchTerm} ${year}: ${error.message}`);
      // Continue to next site rather than next search term
    }
  }
}

// Function to load existing data from Samsung.json
function loadExistingData() {
  try {
    const filePath = path.join(__dirname, 'Samsung.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (error) {
    console.error(`Error loading existing data: ${error.message}`);
  }
  return { samsungPhones: [] };
}

// Function to merge phone data from multiple sources
function mergePhoneData(existingData, newData) {
  // Only update fields that are unknown or empty in the existing data
  if (existingData.screenSize === "Unknown" || !existingData.screenSize.includes('"')) {
    existingData.screenSize = newData.screenSize;
    existingData.screenSizeLabel = newData.screenSizeLabel;
  }
  
  if (existingData.cameraQuality === "Unknown") {
    existingData.cameraQuality = newData.cameraQuality;
    existingData.cameraQualityLabel = newData.cameraQualityLabel;
  }
  
  if (existingData.batteryLife === "Unknown") {
    existingData.batteryLife = newData.batteryLife;
    existingData.batteryLifeLabel = newData.batteryLifeLabel;
  }
  
  if (existingData.screenType === "Unknown") {
    existingData.screenType = newData.screenType;
  }
  
  if (existingData.price.usd === 0 && newData.price.usd !== 0) {
    existingData.price = newData.price;
  }
}

// Function to cleanup and validate all collected data
function cleanupAndValidateData() {
  // Remove duplicates based on model name and year
  const uniquePhones = [];
  const seen = new Set();
  
  for (const phone of samsungData.samsungPhones) {
    const key = `${phone.model.toLowerCase()}-${phone.releaseYear}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePhones.push(phone);
    }
  }
  
  samsungData.samsungPhones = uniquePhones;
  
  // Ensure all models have complete data
  for (const phone of samsungData.samsungPhones) {
    // Make sure all required fields exist and have values
    if (!phone.screenSize || phone.screenSize === "Unknown") {
      phone.screenSize = estimateScreenSize(phone.model, phone.releaseYear);
      phone.screenSizeLabel = categorizeScreenSize(phone.screenSize);
    }
    
    if (!phone.cameraQuality || phone.cameraQuality === "Unknown") {
      phone.cameraQuality = estimateCameraQuality(phone.model, phone.releaseYear);
      phone.cameraQualityLabel = categorizeCameraQuality(phone.cameraQuality);
    }
    
    if (!phone.batteryLife || phone.batteryLife === "Unknown") {
      phone.batteryLife = estimateBatteryLife(phone.model, phone.releaseYear);
      phone.batteryLifeLabel = categorizeBatteryLife(phone.batteryLife);
    }
    
    if (!phone.screenType || phone.screenType === "Unknown") {
      phone.screenType = estimateScreenType(phone.model, phone.releaseYear);
    }
    
    if (!phone.price || (phone.price.usd === 0 && phone.price.sar === 0)) {
      phone.price = estimatePrice(phone.model, phone.releaseYear);
    }
    
    // Ensure proper formatting
    if (!phone.screenSize.includes('"')) {
      phone.screenSize = `${phone.screenSize}"`;
    }
    
    // Mark future models as estimated
    if (phone.releaseYear >= 2024 && !phone.model.includes('(Estimated)')) {
      phone.model = `${phone.model} (Estimated)`;
    }
  }
}

// Estimation functions for missing data
function estimateScreenSize(model, year) {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('fold')) {
    return year < 2020 ? "7.3" : year < 2022 ? "7.6" : "7.8";
  } else if (modelLower.includes('flip')) {
    return year < 2021 ? "6.7" : "6.9";
  } else if (modelLower.includes('note')) {
    return year < 2017 ? "5.7" : year < 2020 ? "6.3" : "6.8";
  } else if (modelLower.includes('s') && !modelLower.includes('plus') && !modelLower.includes('+')) {
    return year < 2017 ? "5.1" : year < 2020 ? "5.8" : year < 2022 ? "6.2" : "6.4";
  } else if (modelLower.includes('s') && (modelLower.includes('plus') || modelLower.includes('+'))) {
    return year < 2017 ? "5.7" : year < 2020 ? "6.2" : year < 2022 ? "6.7" : "6.9";
  } else if (modelLower.includes('a')) {
    return year < 2019 ? "5.6" : year < 2021 ? "6.1" : "6.5";
  } else {
    return year < 2017 ? "5.0" : year < 2020 ? "5.8" : "6.4";
  }
}

function estimateCameraQuality(model, year) {
  const modelLower = model.toLowerCase();
  
  if (year < 2016) {
    return "12 MP (Rear)";
  } else if (year < 2019) {
    return "Dual 12 MP (Rear)";
  } else if (year < 2021) {
    if (modelLower.includes('s') || modelLower.includes('note')) {
      return "Triple 12 MP (Rear)";
    } else {
      return "Dual 12 MP (Rear)";
    }
  } else {
    if (modelLower.includes('s') || modelLower.includes('note') || modelLower.includes('fold')) {
      return "Quad 108 MP (Rear)";
    } else if (modelLower.includes('a') && parseInt(modelLower.match(/\d+/)?.[0] || "0") > 50) {
      return "Triple 64 MP (Rear)";
    } else {
      return "Triple 12 MP (Rear)";
    }
  }
}

function estimateBatteryLife(model, year) {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('fold')) {
    return year < 2021 ? "4500 mAh" : "5000 mAh";
  } else if (modelLower.includes('flip')) {
    return "3300 mAh";
  } else if (modelLower.includes('note')) {
    return year < 2018 ? "3500 mAh" : year < 2021 ? "4000 mAh" : "5000 mAh";
  } else if (modelLower.includes('s') && !modelLower.includes('plus') && !modelLower.includes('+')) {
    return year < 2018 ? "3000 mAh" : year < 2021 ? "4000 mAh" : "4500 mAh";
  } else if (modelLower.includes('s') && (modelLower.includes('plus') || modelLower.includes('+'))) {
    return year < 2018 ? "3500 mAh" : year < 2021 ? "4500 mAh" : "5000 mAh";
  } else if (modelLower.includes('a')) {
    return year < 2019 ? "3000 mAh" : year < 2021 ? "4000 mAh" : "5000 mAh";
  } else {
    return year < 2018 ? "3000 mAh" : year < 2021 ? "4000 mAh" : "5000 mAh";
  }
}

function estimateScreenType(model, year) {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('fold') || modelLower.includes('flip')) {
    return "Dynamic AMOLED 2X Foldable";
  } else if (modelLower.includes('s') || modelLower.includes('note')) {
    return year < 2017 ? "Super AMOLED" : 
           year < 2020 ? "Dynamic AMOLED" : 
           "Dynamic AMOLED 2X";
  } else if (modelLower.includes('a') && parseInt(modelLower.match(/\d+/)?.[0] || "0") > 30) {
    return year < 2020 ? "Super AMOLED" : "AMOLED";
  } else {
    return year < 2018 ? "Super AMOLED" : "AMOLED";
  }
}

// Function to estimate price
function estimatePrice(model, year) {
  const { estimatePrice } = require('./priceUpdater');
  
  return estimatePrice(model);
}

// Function to scrape phone data from a webpage
async function scrapePhoneData(url, model, year) {
  try {
    // Use retry for the scraping operation
    const response = await retryOperation(async () => {
      return await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 second timeout
      });
    });
    
    const $ = cheerio.load(response.data);
    
    // Default values
    let screenSize = "Unknown";
    let cameraQuality = "Unknown";
    let batteryLife = "Unknown";
    let screenType = "Unknown";
    let price = { usd: 0, sar: 0 };
    
    // Extract data based on the website (different selectors for different sites)
    if (url.includes('gsmarena.com')) {
      // GSMArena specific selectors
      $('.specs-brief-accent').each((i, el) => {
        const text = $(el).text();
        if (text.includes('"')) {
          screenSize = text.match(/([0-9.]+)"/) ? text.match(/([0-9.]+)"/)[1] : "Unknown";
        }
      });
      
      $('td.ttl:contains("Camera")').each((i, el) => {
        cameraQuality = $(el).next().text().trim();
      });
      
      $('td.ttl:contains("Battery")').each((i, el) => {
        batteryLife = $(el).next().text().trim();
      });
      
      $('td.ttl:contains("Type")').each((i, el) => {
        if ($(el).parent().text().includes('Display')) {
          screenType = $(el).next().text().trim();
        }
      });

      $('td.ttl:contains("Price")').each((i, el) => {
        const priceText = $(el).next().text().trim();
        const usdMatch = priceText.match(/\$\s*([0-9,]+)/);
        if (usdMatch) {
          price.usd = parseInt(usdMatch[1].replace(/,/g, ''));
          // Approximate SAR conversion (1 USD ≈ 3.75 SAR)
          price.sar = Math.round(price.usd * 3.75);
        }
      });
    } else if (url.includes('samsung.com')) {
      // Samsung website specific selectors
      $('*:contains("Display")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('inch')) {
          const match = text.match(/([0-9.]+)\s*inch/);
          if (match) screenSize = match[1];
        }
      });
      
      $('*:contains("Camera")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('MP')) {
          cameraQuality = text.match(/([0-9]+\s*MP)/) ? text.match(/([0-9]+\s*MP)/)[1] : "Unknown";
        }
      });
      
      $('*:contains("Battery")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('mAh')) {
          batteryLife = text.match(/([0-9,]+)\s*mAh/) ? text.match(/([0-9,]+)\s*mAh/)[1] + ' mAh' : "Unknown";
        }
      });
      
      // Try to find price
      $('*:contains("$")').each((i, el) => {
        const text = $(el).text();
        const usdMatch = text.match(/\$\s*([0-9,]+)/);
        if (usdMatch && !text.includes('save') && !text.includes('discount')) {
          price.usd = parseInt(usdMatch[1].replace(/,/g, ''));
          price.sar = Math.round(price.usd * 3.75);
        }
      });
    } else if (url.includes('phonearena.com')) {
      // PhoneArena specific selectors
      $('.spectable tr').each((i, el) => {
        const title = $(el).find('th').text().trim();
        const value = $(el).find('td').text().trim();
        
        if (title.includes('Display size')) {
          const match = value.match(/([0-9.]+)\s*inches/);
          if (match) screenSize = match[1];
        } else if (title.includes('Camera')) {
          cameraQuality = value;
        } else if (title.includes('Battery')) {
          batteryLife = value;
        } else if (title.includes('Display type')) {
          screenType = value;
        } else if (title.includes('Price')) {
          const usdMatch = value.match(/\$\s*([0-9,]+)/);
          if (usdMatch) {
            price.usd = parseInt(usdMatch[1].replace(/,/g, ''));
            price.sar = Math.round(price.usd * 3.75);
          }
        }
      });
    } else if (url.includes('techradar.com') || url.includes('tomsguide.com') || url.includes('cnet.com')) {
      // Generic selectors for multiple tech sites
      // Look for specs in tables, lists, or paragraphs
      $('*:contains("inches")').each((i, el) => {
        const text = $(el).text();
        const match = text.match(/([0-9.]+)\s*inches/);
        if (match && !text.includes('TV') && !text.includes('monitor')) {
          screenSize = match[1];
        }
      });
      
      $('*:contains("MP")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('camera') || text.includes('Camera')) {
          const mpMatch = text.match(/(\d+)\s*MP/);
          if (mpMatch) cameraQuality = text;
        }
      });
      
      $('*:contains("mAh")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('battery') || text.includes('Battery')) {
          const mahMatch = text.match(/([0-9,]+)\s*mAh/);
          if (mahMatch) batteryLife = mahMatch[0];
        }
      });
      
      $('*:contains("AMOLED")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('display') || text.includes('screen')) {
          screenType = text.includes('Dynamic') ? 'Dynamic AMOLED' : 'AMOLED';
        }
      });
      
      $('*:contains("$")').each((i, el) => {
        const text = $(el).text();
        if (text.includes('price') || text.includes('Price')) {
          const usdMatch = text.match(/\$\s*([0-9,]+)/);
          if (usdMatch) {
            price.usd = parseInt(usdMatch[1].replace(/,/g, ''));
            price.sar = Math.round(price.usd * 3.75);
          }
        }
      });
    }
    
    // If we couldn't find specific details, use default estimates
    if (screenSize === "Unknown") {
      screenSize = estimateScreenSize(model, year);
    }
    
    if (cameraQuality === "Unknown") {
      cameraQuality = estimateCameraQuality(model, year);
    }
    
    if (batteryLife === "Unknown") {
      batteryLife = estimateBatteryLife(model, year);
    }
    
    if (screenType === "Unknown") {
      screenType = estimateScreenType(model, year);
    }
    
    if (price.usd === 0) {
      price = estimatePrice(model, year);
    }
    
    // Future models (2024-2025) should be marked as estimated
    const isEstimated = year >= 2024;
    const modelName = isEstimated ? `${model} (Estimated)` : model;
    
    // Apply categorization
    const screenSizeLabel = categorizeScreenSize(screenSize);
    const batteryLifeLabel = categorizeBatteryLife(batteryLife);
    const cameraQualityLabel = categorizeCameraQuality(cameraQuality);
    
    return {
      model: modelName,
      releaseYear: year,
      company: "Samsung",
      price: price,
      screenSize: `${screenSize}"`,
      screenSizeLabel: screenSizeLabel,
      cameraQuality: cameraQuality,
      cameraQualityLabel: cameraQualityLabel,
      screenType: screenType,
      batteryLife: batteryLife,
      batteryLifeLabel: batteryLifeLabel
    };
  } catch (error) {
    console.error(`Error scraping data from ${url}: ${error.message}`);
    return null;
  }
}

// Function to save the collected data to a JSON file
function saveDataToFile() {
  try {
    // Sort phones by release year (newest first)
    samsungData.samsungPhones.sort((a, b) => b.releaseYear - a.releaseYear);
    
    // Write to the Samsung.json file
    fs.writeFileSync(
      path.join(__dirname, 'Samsung.json'),
      JSON.stringify(samsungData, null, 2)
    );
    
    console.log(`Data saved successfully to Samsung.json (${samsungData.samsungPhones.length} models)`);
  } catch (error) {
    console.error(`Error saving data to file: ${error.message}`);
  }
}

// API endpoint to trigger the data collection
app.get('/api/collect-samsung-data', async (req, res) => {
  try {
    res.send({ message: 'Data collection started. This process may take several minutes.' });
    await searchSamsungPhones();
    console.log('Samsung phone data collection completed');
  } catch (error) {
    console.error(`Error in data collection endpoint: ${error.message}`);
  }
});

// API endpoint to get the collected data
app.get('/api/samsung-data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'Samsung.json'), 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to force refresh a specific year or model
app.get('/api/refresh-data', async (req, res) => {
  try {
    const { year, model } = req.query;
    
    if (year) {
      // Remove existing data for that year
      samsungData.samsungPhones = samsungData.samsungPhones.filter(phone => phone.releaseYear !== parseInt(year));
      console.log(`Removed existing data for year ${year}`);
      
      // Re-collect data for that year
      const searchTerms = [...getSpecificModels(parseInt(year)), 'Galaxy S', 'Galaxy Note', 'Galaxy A'];
      for (const searchTerm of searchTerms) {
        await searchAndProcess(searchTerm, parseInt(year));
      }
    } else if (model) {
      // Remove existing data for that model
      samsungData.samsungPhones = samsungData.samsungPhones.filter(phone => !phone.model.toLowerCase().includes(model.toLowerCase()));
      console.log(`Removed existing data for model ${model}`);
      
      // Search for that specific model across years
      const years = Array.from({length: 12}, (_, i) => 2014 + i);
      for (const year of years) {
        await searchAndProcess(model, year);
      }
    } else {
      res.status(400).json({ success: false, error: 'Please provide a year or model parameter' });
      return;
    }
    
    saveDataToFile();
    res.json({ success: true, message: 'Data refreshed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to get the latest price sources
app.get('/api/price-sources', (req, res) => {
  try {
    // Get all data
    const samsungData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Samsung.json'), 'utf8'));
    const appleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Apple.json'), 'utf8'));
    
    // Extract pricing sources
    const sources = {};
    
    // Process Samsung phones
    samsungData.samsungPhones.forEach(phone => {
      if (phone.priceSource && phone.priceSource !== 'estimated') {
        sources[phone.priceSource] = sources[phone.priceSource] || [];
        sources[phone.priceSource].push({
          brand: 'Samsung',
          model: phone.model,
          price: phone.price,
          lastUpdate: phone.lastPriceUpdate
        });
      }
    });
    
    // Process Apple phones
    appleData.iPhones.forEach(phone => {
      if (phone.priceSource && phone.priceSource !== 'estimated') {
        sources[phone.priceSource] = sources[phone.priceSource] || [];
        sources[phone.priceSource].push({
          brand: 'Apple',
          model: phone.model,
          price: phone.price,
          lastUpdate: phone.lastPriceUpdate
        });
      }
    });
    
    // Get last update time
    let lastUpdateTime = null;
    const allPhones = [...samsungData.samsungPhones, ...appleData.iPhones];
    
    for (const phone of allPhones) {
      if (phone.lastPriceUpdate) {
        const updateTime = new Date(phone.lastPriceUpdate);
        if (!lastUpdateTime || updateTime > lastUpdateTime) {
          lastUpdateTime = updateTime;
        }
      }
    }
    
    res.json({
      lastUpdate: lastUpdateTime ? lastUpdateTime.toISOString() : null,
      totalPhones: allPhones.length,
      totalScraped: Object.values(sources).flat().length,
      sources
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: "Error getting price sources"
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Visit http://localhost:' + PORT + '/api/collect-samsung-data to start data collection');
  console.log('Visit http://localhost:' + PORT + '/api/update-prices to update phone prices');
  
  // Start scheduled price updates
  startScheduledUpdates();
});

// Add the price update endpoint to the app
addPriceUpdateEndpoint(app);

// Add the scheduler endpoints to the app
addSchedulerEndpoints(app); 