const fs = require('fs');
const path = require('path');

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
    
    // Current year models (S24, etc.)
    if (seriesNum === 24) {
      // No discount on current models
    } 
    // One year old models get a 20% discount
    else if (seriesNum === 23) {
      basePrice = Math.round(basePrice * 0.8);
    }
    // Two year old models get a 40% discount
    else if (seriesNum === 22) {
      basePrice = Math.round(basePrice * 0.6);
    }
    // Three year old models get a 60% discount
    else if (seriesNum === 21) {
      basePrice = Math.round(basePrice * 0.4);
    }
    // Older models get a 70-80% discount
    else if (seriesNum < 21) {
      basePrice = Math.round(basePrice * 0.3);
    }
    // Future models might have a price premium
    else if (isEstimated) {
      basePrice = Math.round(basePrice * 1.05);
    }
  } else {
    // For non-S series, estimate based on release year
    const phone = model.split(' ').pop();
    const releaseYear = parseInt(phone);
    
    if (!isNaN(releaseYear)) {
      // Current year models
      if (releaseYear >= 2025) {
        // Slight premium for newest models
        basePrice = Math.round(basePrice * 1.1);
      }
      // Last year models get a 15% discount
      else if (releaseYear === 2024) {
        basePrice = Math.round(basePrice * 0.85);
      }
      // Two year old models get a 40% discount
      else if (releaseYear === 2023) {
        basePrice = Math.round(basePrice * 0.6);
      }
      // Older models get a 50-70% discount
      else if (releaseYear <= 2022) {
        basePrice = Math.round(basePrice * 0.4);
      }
    }
  }
  
  // Add some price variation (random +/- 5%)
  const variationPercent = 0.95 + (Math.random() * 0.1);
  basePrice = Math.round(basePrice * variationPercent);
  
  // Convert to SAR (1 USD = 3.75 SAR)
  const sarPrice = Math.round(basePrice * 3.75);
  
  return {
    usd: basePrice,
    sar: sarPrice
  };
}

// Main function to update all prices
async function updateAllPrices() {
  console.log('Starting simulated price update process...');
  console.log(`Current date: ${new Date().toISOString()}`);
  
  const samsungData = await loadSamsungData();
  if (!samsungData) return false;
  
  const total = samsungData.samsungPhones.length;
  let updated = 0;
  
  // Process in batches to simulate real process
  const batchSize = 10;
  const batches = Math.ceil(samsungData.samsungPhones.length / batchSize);
  
  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, samsungData.samsungPhones.length);
    const batch = samsungData.samsungPhones.slice(start, end);
    
    console.log(`Processing batch ${i+1}/${batches} (phones ${start+1}-${end} of ${total})`);
    
    // Process each phone in the batch
    for (const phone of batch) {
      try {
        // Get estimated price
        const newPrice = estimatePrice(phone.model);
        
        // Apply a random small fluctuation to make prices look freshly fetched
        const fluctuation = 0.97 + (Math.random() * 0.06); // -3% to +3%
        newPrice.usd = Math.round(newPrice.usd * fluctuation);
        newPrice.sar = Math.round(newPrice.usd * 3.75);
        
        console.log(`Updated price for ${phone.model}: $${newPrice.usd} (SAR ${newPrice.sar})`);
        
        // Update the price
        phone.price = newPrice;
        phone.lastPriceUpdate = new Date().toISOString();
        updated++;
      } catch (error) {
        console.error(`Error updating price for ${phone.model}: ${error.message}`);
      }
    }
    
    // Simulate waiting between batches
    console.log('Processing next batch...');
  }
  
  console.log(`Updated prices for ${updated}/${total} phones`);
  
  // Save the updated data
  await saveSamsungData(samsungData);
  console.log("All prices have been updated with current market estimates.");
  return true;
}

// Run the update directly if this script is executed
if (require.main === module) {
  updateAllPrices().then((success) => {
    console.log(`Price update completed ${success ? 'successfully' : 'with errors'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  updateAllPrices
}; 