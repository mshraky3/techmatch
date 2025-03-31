const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Create an axios instance that ignores SSL certificate issues
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  timeout: 30000
});

// Create listing URL for phonedb.net with filter number
function createListingUrl(filterNumber) {
  return `https://phonedb.net/index.php?m=device&s=list&filter=${filterNumber}`;
}

// Save data to a JSON file
function saveData(filename, data) {
  try {
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully saved data to ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}: ${error.message}`);
    return false;
  }
}

// Load Samsung.json data
function loadSamsungData() {
  try {
    const filePath = path.join(__dirname, 'Samsung.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading Samsung.json: ${error.message}`);
    return { samsungPhones: [] };
  }
}

// Extract phone data from HTML element
function extractPhoneData($, element) {
  try {
    // Find the link element containing the phone image and details
    const linkElement = $(element).find('a[href*="index.php?m=device&id="]');
    if (!linkElement.length) return null;

    const href = linkElement.attr('href');
    const imgElement = linkElement.find('img');
    const altText = imgElement.attr('alt');
    
    // Extract model number and name from alt text
    const modelMatch = altText.match(/Samsung\s+([A-Z0-9-]+)\s+Galaxy\s+([A-Z0-9\s+]+)/i);
    if (!modelMatch) return null;

    const modelNumber = modelMatch[1];
    const modelName = modelMatch[2].trim();

    // Extract storage and variant info
    const storageMatch = altText.match(/(\d+GB)/i);
    const storage = storageMatch ? storageMatch[1] : '128GB';

    // Determine if it's a 5G model
    const is5G = altText.toLowerCase().includes('5g');

    // Extract region/variant info
    const regionMatch = altText.match(/([A-Z]{2}(?:\s+[A-Z]{2})*)/);
    const region = regionMatch ? regionMatch[1] : 'Global';

    // Create phone object
    const phone = {
      modelNumber,
      model: `Galaxy ${modelName}`,
      storage,
      is5G,
      region,
      fullName: altText,
      url: `https://phonedb.net/${href}`,
      imageUrl: imgElement.attr('src') ? `https://phonedb.net/${imgElement.attr('src')}` : null,
      isNew: true,
      lastUpdated: new Date().toISOString()
    };

    return phone;
  } catch (error) {
    console.error('Error extracting phone data:', error.message);
    return null;
  }
}

// Check a single filter for new phones
async function checkFilterForNewPhones(filterNumber) {
  try {
    console.log(`\nChecking filter ${filterNumber} for new phones...`);
    const listingUrl = createListingUrl(filterNumber);
    
    const response = await axiosInstance.get(listingUrl);
    const $ = cheerio.load(response.data);
    
    // Find all elements containing "New" label
    const newPhoneElements = $('span.new').parent().parent();
    console.log(`Found ${newPhoneElements.length} new phones on page with filter=${filterNumber}`);
    
    const newPhones = [];
    
    // Process each new phone element
    newPhoneElements.each((i, element) => {
      const phoneData = extractPhoneData($, element);
      if (phoneData) {
        newPhones.push(phoneData);
        console.log(`Found new phone: ${phoneData.model} ${phoneData.storage}`);
      }
    });
    
    return { 
      totalFound: newPhoneElements.length,
      newPhones,
      hasContent: newPhoneElements.length > 0
    };
  } catch (error) {
    console.error(`Error checking filter ${filterNumber}: ${error.message}`);
    return { 
      totalFound: 0, 
      newPhones: [],
      hasContent: false,
      error: error.message
    };
  }
}

// Scan a range of filters looking for new phones
async function scanForNewPhones(startFilter = 0, endFilter = 1200, skipEmptyAfter = 5) {
  console.log(`Starting new phone hunt from filter ${startFilter} to ${endFilter}...`);
  
  let currentFilter = startFilter;
  let newPhones = [];
  let consecutiveEmpty = 0;
  const nonEmptyFilters = [];
  
  // Stats for tracking progress
  const stats = {
    filtersTried: 0,
    nonEmptyFilters: 0,
    newPhonesFound: 0,
    s25ModelsFound: 0,
    emptyPages: 0,
    errors: 0
  };
  
  const startTime = new Date();
  
  // Loop through all specified filters
  while (currentFilter <= endFilter) {
    stats.filtersTried++;
    
    try {
      const result = await checkFilterForNewPhones(currentFilter);
      
      if (!result.hasContent) {
        consecutiveEmpty++;
        stats.emptyPages++;
        console.log(`Empty page (${consecutiveEmpty} in a row)`);
        
        // If we've seen too many empty pages in a row, skip ahead
        if (consecutiveEmpty >= skipEmptyAfter) {
          const skipTo = currentFilter + 50;
          console.log(`Skipping ahead to filter ${skipTo} after ${consecutiveEmpty} empty pages`);
          currentFilter = skipTo - 1;
          consecutiveEmpty = 0;
        }
      } else {
        consecutiveEmpty = 0;
        stats.nonEmptyFilters++;
        nonEmptyFilters.push(currentFilter);
        
        if (result.newPhones.length > 0) {
          console.log(`🎉 FOUND ${result.newPhones.length} NEW PHONES IN FILTER ${currentFilter}! 🎉`);
          
          // Filter for S25 models specifically
          const s25Models = result.newPhones.filter(phone => 
            phone.model.toLowerCase().includes('s25')
          );
          
          if (s25Models.length > 0) {
            console.log(`🎯 Found ${s25Models.length} Galaxy S25 models!`);
            stats.s25ModelsFound += s25Models.length;
          }
          
          newPhones = [...newPhones, ...result.newPhones];
          stats.newPhonesFound += result.newPhones.length;
          
          // Save what we've found immediately
          saveData('new_phones.json', { 
            newPhones, 
            lastUpdated: new Date().toISOString(),
            stats
          });
          
          // Update Samsung.json with the new models
          updateSamsungJSON(result.newPhones);
        }
      }
      
      // Status update every 10 filters
      if (currentFilter % 10 === 0) {
        const runMinutes = Math.floor((new Date() - startTime) / 60000);
        console.log(`\n=== SCAN PROGRESS (${currentFilter}/${endFilter}) ===`);
        console.log(`Filters tried: ${stats.filtersTried}`);
        console.log(`New phones found: ${stats.newPhonesFound}`);
        console.log(`Galaxy S25 models found: ${stats.s25ModelsFound}`);
        console.log(`Running time: ${runMinutes} minutes`);
      }
    } catch (error) {
      stats.errors++;
      console.error(`Error in scanning process at filter ${currentFilter}: ${error.message}`);
      
      // Wait a bit longer after an error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Wait between requests to avoid overloading the server
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    currentFilter++;
  }
  
  // Final save and summary
  saveData('new_phones.json', { 
    newPhones, 
    lastUpdated: new Date().toISOString(),
    stats, 
    nonEmptyFilters
  });
  
  // Display summary
  const runMinutes = Math.floor((new Date() - startTime) / 60000);
  console.log(`\n=== NEW PHONE HUNT COMPLETE ===`);
  console.log(`Filters tried: ${stats.filtersTried}`);
  console.log(`Non-empty filters: ${stats.nonEmptyFilters}`);
  console.log(`New phones found: ${stats.newPhonesFound}`);
  console.log(`Galaxy S25 models found: ${stats.s25ModelsFound}`);
  console.log(`Running time: ${runMinutes} minutes`);
  
  if (stats.newPhonesFound > 0) {
    console.log(`\nNew phones were found in filters: ${nonEmptyFilters.join(', ')}`);
  } else {
    console.log(`\nNo new phones were found in the scanned range.`);
  }
  
  return { newPhones, stats };
}

// Function to update Samsung.json with the newly found phones
function updateSamsungJSON(newPhones) {
  try {
    // Load existing Samsung data
    const samsungData = loadSamsungData();
    let updated = false;
    
    for (const newPhone of newPhones) {
      // Normalize the model name for better matching
      const normalizedNew = newPhone.model.toLowerCase()
        .replace(/galaxy\s+/i, '')
        .replace(/\s+/g, '');
      
      // Find if this model exists in our database
      const existingModelIndex = samsungData.samsungPhones.findIndex(phone => {
        const normalizedExisting = phone.model.toLowerCase()
          .replace(/galaxy\s+/i, '')
          .replace(/\s+/g, '')
          .replace(/\(.*?\)/g, '');
        
        return normalizedExisting.includes(normalizedNew) || 
               normalizedNew.includes(normalizedExisting);
      });
      
      if (existingModelIndex >= 0) {
        // Update existing model
        const existingPhone = samsungData.samsungPhones[existingModelIndex];
        console.log(`Updating existing model ${existingPhone.model} in Samsung.json`);
        
        // Update specs with latest information
        existingPhone.releaseYear = 2025; // New phones are 2025 models
        existingPhone.lastPriceUpdate = new Date().toISOString();
        existingPhone.priceSource = 'phonedb.net';
        existingPhone.isNew = true;
        
        updated = true;
      } else {
        // Create a new entry
        console.log(`Adding new model ${newPhone.model} to Samsung.json`);
        
        // Estimate price based on model and storage
        let basePrice = 800; // Standard S25
        if (newPhone.model.toLowerCase().includes('ultra')) {
          basePrice = 1200;
        } else if (newPhone.model.toLowerCase().includes('plus')) {
          basePrice = 1000;
        }
        
        // Add price based on storage
        const storageGB = parseInt(newPhone.storage);
        if (storageGB >= 512) {
          basePrice += 100;
        } else if (storageGB >= 256) {
          basePrice += 50;
        }
        
        // Estimate specs based on model
        let screenSize = '6.1"';
        let batteryLife = '4000 mAh';
        let cameraQuality = 'Triple 50 MP (Rear)';
        
        if (newPhone.model.toLowerCase().includes('ultra')) {
          screenSize = '6.8"';
          batteryLife = '5000 mAh';
          cameraQuality = 'Quad 108 MP (Rear)';
        } else if (newPhone.model.toLowerCase().includes('plus')) {
          screenSize = '6.7"';
          batteryLife = '4700 mAh';
          cameraQuality = 'Triple 50 MP (Rear)';
        }
        
        // Create new phone object
        const newPhoneEntry = {
          model: newPhone.model,
          releaseYear: 2025,
          company: 'Samsung',
          price: {
            usd: basePrice,
            sar: basePrice * 3.75
          },
          screenSize,
          screenSizeLabel: screenSize.startsWith('6.8') ? 'large' : screenSize.startsWith('6.7') ? 'large' : 'medium',
          cameraQuality,
          cameraQualityLabel: 'excellent',
          screenType: 'Dynamic AMOLED 2X',
          batteryLife,
          batteryLifeLabel: 'excellent',
          lastPriceUpdate: new Date().toISOString(),
          priceSource: 'phonedb.net',
          isNew: true,
          storage: newPhone.storage,
          is5G: newPhone.is5G,
          region: newPhone.region,
          modelNumber: newPhone.modelNumber
        };
        
        // Add to the array
        samsungData.samsungPhones.push(newPhoneEntry);
        updated = true;
      }
    }
    
    // Save if changes were made
    if (updated) {
      // Sort by release year (newest first) and then by model name
      samsungData.samsungPhones.sort((a, b) => {
        if (a.releaseYear !== b.releaseYear) {
          return b.releaseYear - a.releaseYear;
        }
        return a.model.localeCompare(b.model);
      });
      
      saveData('Samsung.json', samsungData);
      console.log('Samsung.json updated with new phone models');
    }
  } catch (error) {
    console.error(`Error updating Samsung.json: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('Starting new phone hunt on phonedb.net...');
  
  try {
    // Parse command line arguments
    const startFilter = parseInt(process.argv[2]) || 0;
    const endFilter = parseInt(process.argv[3]) || 1200;
    
    console.log(`Will hunt for new phones from filter ${startFilter} to ${endFilter}`);
    
    // Start the hunt for new phones
    await scanForNewPhones(startFilter, endFilter);
    
    console.log('New phone hunt completed!');
  } catch (error) {
    console.error(`Critical error in main process: ${error.message}`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { scanForNewPhones }; 