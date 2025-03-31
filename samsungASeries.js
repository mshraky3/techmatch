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
    console.log('Successfully updated Samsung.json with new A and M series phones');
    return true;
  } catch (error) {
    console.error(`Error saving Samsung data: ${error.message}`);
    return false;
  }
}

// Common headers for all requests
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
};

// ===== EXTRA.COM A Series & M Series Scraper =====
async function scrapeExtraSamsungPhones() {
  try {
    console.log('Searching Extra.com for Samsung A and M series phones...');
    
    const phones = [];
    const models = ['Samsung A', 'Samsung Galaxy A', 'Samsung M', 'Samsung Galaxy M'];
    
    for (const model of models) {
      // Use the search functionality
      const searchUrl = `https://www.extra.com/ar-sa/search/?text=${encodeURIComponent(model)}`;
      
      const response = await axios.get(searchUrl, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      // Look for product listings
      const products = $('.product-item');
      
      products.each((index, element) => {
        const productTitle = $(element).find('.product-title').text().trim();
        
        // Check if this is a Samsung A or M series phone
        if ((productTitle.toLowerCase().includes('samsung') || productTitle.toLowerCase().includes('سامسونج')) && 
            (productTitle.toLowerCase().includes('galaxy a') || 
             /\ba\d+\b/i.test(productTitle) ||
             productTitle.toLowerCase().includes('galaxy m') || 
             /\bm\d+\b/i.test(productTitle))) {
          
          // Extract price
          const priceElement = $(element).find('.product-price .product-price__main');
          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim();
            const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
            
            if (!isNaN(priceSAR)) {
              const phone = {
                title: productTitle,
                sar: priceSAR,
                usd: Math.round(priceSAR / 3.75),
                source: 'extra.com'
              };
              
              phones.push(phone);
              console.log(`Found Extra.com: ${phone.title} - SAR ${phone.sar}`);
            }
          }
        }
      });
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return phones;
  } catch (error) {
    console.error(`Error scraping Extra.com: ${error.message}`);
    return [];
  }
}

// ===== NOON.COM A Series & M Series Scraper =====
async function scrapeNoonSamsungPhones() {
  try {
    console.log('Searching Noon.com for Samsung A and M series phones...');
    
    const phones = [];
    const models = ['Samsung A', 'Samsung Galaxy A', 'Samsung M', 'Samsung Galaxy M'];
    
    for (const model of models) {
      // Use the search functionality
      const searchUrl = `https://www.noon.com/saudi-ar/search?q=${encodeURIComponent(model)}`;
      
      const response = await axios.get(searchUrl, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      // Look for product listings
      const products = $('[data-qa="product-item"]');
      
      products.each((index, element) => {
        const productTitle = $(element).find('[data-qa="product-name"]').text().trim();
        
        // Check if this is a Samsung A or M series phone
        if ((productTitle.toLowerCase().includes('samsung') || productTitle.toLowerCase().includes('سامسونج')) && 
            (productTitle.toLowerCase().includes('galaxy a') || 
             /\ba\d+\b/i.test(productTitle) ||
             productTitle.toLowerCase().includes('galaxy m') || 
             /\bm\d+\b/i.test(productTitle))) {
          
          // Extract price
          const priceElement = $(element).find('[data-qa="product-price"]');
          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim();
            const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
            
            if (!isNaN(priceSAR)) {
              const phone = {
                title: productTitle,
                sar: priceSAR,
                usd: Math.round(priceSAR / 3.75),
                source: 'noon.com'
              };
              
              phones.push(phone);
              console.log(`Found Noon.com: ${phone.title} - SAR ${phone.sar}`);
            }
          }
        }
      });
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return phones;
  } catch (error) {
    console.error(`Error scraping Noon.com: ${error.message}`);
    return [];
  }
}

// ===== JARIR.COM A Series & M Series Scraper =====
async function scrapeJarirSamsungPhones() {
  try {
    console.log('Searching Jarir.com for Samsung A and M series phones...');
    
    const phones = [];
    const models = ['Samsung A', 'Samsung Galaxy A', 'Samsung M', 'Samsung Galaxy M'];
    
    for (const model of models) {
      // Use the search functionality
      const searchUrl = `https://www.jarir.com/sa-en/catalogsearch/result/?q=${encodeURIComponent(model)}`;
      
      const response = await axios.get(searchUrl, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      // Look for product listings
      const products = $('.product-item');
      
      products.each((index, element) => {
        const productTitle = $(element).find('.product-item-link').text().trim();
        
        // Check if this is a Samsung A or M series phone
        if ((productTitle.toLowerCase().includes('samsung') || productTitle.toLowerCase().includes('سامسونج')) && 
            (productTitle.toLowerCase().includes('galaxy a') || 
             /\ba\d+\b/i.test(productTitle) ||
             productTitle.toLowerCase().includes('galaxy m') || 
             /\bm\d+\b/i.test(productTitle))) {
          
          // Extract price
          const priceElement = $(element).find('.price');
          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim();
            const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
            
            if (!isNaN(priceSAR)) {
              const phone = {
                title: productTitle,
                sar: priceSAR,
                usd: Math.round(priceSAR / 3.75),
                source: 'jarir.com'
              };
              
              phones.push(phone);
              console.log(`Found Jarir.com: ${phone.title} - SAR ${phone.sar}`);
            }
          }
        }
      });
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return phones;
  } catch (error) {
    console.error(`Error scraping Jarir.com: ${error.message}`);
    return [];
  }
}

// ===== Mobily A Series & M Series Scraper =====
async function scrapeMobilySamsungPhones() {
  try {
    console.log('Searching Mobily.com.sa for Samsung A and M series phones...');
    
    const phones = [];
    const searchUrl = 'https://shop.mobily.com.sa/product-category/smartphones-ar/%D8%A7%D8%AC%D9%87%D8%B2%D8%A9-%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%D8%AC/';
    
    const response = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(response.data);
    
    // Look for product listings
    const products = $('.product-small');
    
    products.each((index, element) => {
      const productTitle = $(element).find('.product-title a').text().trim();
      
      // Check if this is a Samsung A or M series phone
      if ((productTitle.toLowerCase().includes('samsung') || productTitle.toLowerCase().includes('سامسونج')) && 
          (productTitle.toLowerCase().includes('galaxy a') || 
           /\ba\d+\b/i.test(productTitle) ||
           productTitle.toLowerCase().includes('galaxy m') || 
           /\bm\d+\b/i.test(productTitle))) {
        
        // Extract price
        const priceElement = $(element).find('.price .amount');
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
          
          if (!isNaN(priceSAR)) {
            const phone = {
              title: productTitle,
              sar: priceSAR,
              usd: Math.round(priceSAR / 3.75),
              source: 'mobily.com.sa'
            };
            
            phones.push(phone);
            console.log(`Found Mobily.com.sa: ${phone.title} - SAR ${phone.sar}`);
          }
        }
      }
    });
    
    return phones;
  } catch (error) {
    console.error(`Error scraping Mobily.com.sa: ${error.message}`);
    return [];
  }
}

// ===== ALMANEA A Series & M Series Scraper =====
async function scrapeAlmaneaSamsungPhones() {
  try {
    console.log('Searching Almanea.sa for Samsung A and M series phones...');
    
    const phones = [];
    const models = ['Samsung A', 'Samsung Galaxy A', 'Samsung M', 'Samsung Galaxy M'];
    
    for (const model of models) {
      // Use the search functionality
      const searchUrl = `https://www.almanea.sa/search?q=${encodeURIComponent(model)}`;
      
      const response = await axios.get(searchUrl, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      // Look for product listings
      const products = $('.product-item');
      
      products.each((index, element) => {
        const productTitle = $(element).find('.product-title').text().trim();
        
        // Check if this is a Samsung A or M series phone
        if ((productTitle.toLowerCase().includes('samsung') || productTitle.toLowerCase().includes('سامسونج')) && 
            (productTitle.toLowerCase().includes('galaxy a') || 
             /\ba\d+\b/i.test(productTitle) ||
             productTitle.toLowerCase().includes('galaxy m') || 
             /\bm\d+\b/i.test(productTitle))) {
          
          // Extract price
          const priceElement = $(element).find('.price');
          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim();
            const priceSAR = parseFloat(priceText.replace(/[^\d.]/g, ''));
            
            if (!isNaN(priceSAR)) {
              const phone = {
                title: productTitle,
                sar: priceSAR,
                usd: Math.round(priceSAR / 3.75),
                source: 'almanea.sa'
              };
              
              phones.push(phone);
              console.log(`Found Almanea.sa: ${phone.title} - SAR ${phone.sar}`);
            }
          }
        }
      });
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return phones;
  } catch (error) {
    console.error(`Error scraping Almanea.sa: ${error.message}`);
    return [];
  }
}

// Process scraped data into standardized phone objects
function processPhoneData(scrapedPhones) {
  const phones = [];
  const modelMap = new Map();
  
  // First, group by model to find the best data
  for (const phone of scrapedPhones) {
    // Extract model information
    let model = '';
    let releaseYear = new Date().getFullYear();
    
    // Handle A series
    const aSeriesMatch = phone.title.match(/galaxy\s+a(\d+)(?:\s*([a-z]+))?(?:\s+(\d{4}))?/i);
    if (aSeriesMatch) {
      const modelNumber = aSeriesMatch[1];
      const suffix = aSeriesMatch[2] || '';
      model = `Galaxy A${modelNumber}${suffix ? ' ' + suffix : ''}`;
      // Try to extract year if present
      if (aSeriesMatch[3]) {
        releaseYear = parseInt(aSeriesMatch[3]);
      } else {
        // Estimate year based on model number
        if (modelNumber.startsWith('2')) {
          releaseYear = 2020;
        } else if (modelNumber.startsWith('3')) {
          releaseYear = 2021;
        } else if (modelNumber.startsWith('4')) {
          releaseYear = 2022;
        } else if (modelNumber.startsWith('5')) {
          releaseYear = 2023;
        } else if (modelNumber.startsWith('6')) {
          releaseYear = 2024;
        }
      }
    } else {
      // Handle M series
      const mSeriesMatch = phone.title.match(/galaxy\s+m(\d+)(?:\s*([a-z]+))?(?:\s+(\d{4}))?/i);
      if (mSeriesMatch) {
        const modelNumber = mSeriesMatch[1];
        const suffix = mSeriesMatch[2] || '';
        model = `Galaxy M${modelNumber}${suffix ? ' ' + suffix : ''}`;
        // Try to extract year if present
        if (mSeriesMatch[3]) {
          releaseYear = parseInt(mSeriesMatch[3]);
        } else {
          // Estimate year based on model number
          if (modelNumber.startsWith('2')) {
            releaseYear = 2020;
          } else if (modelNumber.startsWith('3')) {
            releaseYear = 2021;
          } else if (modelNumber.startsWith('4')) {
            releaseYear = 2022;
          } else if (modelNumber.startsWith('5')) {
            releaseYear = 2023;
          } else if (modelNumber.startsWith('6')) {
            releaseYear = 2024;
          }
        }
      } else {
        // Try generic number extraction
        const numMatch = phone.title.match(/(?:a|m)(\d+)/i);
        if (numMatch) {
          const seriesType = phone.title.match(/\b([am])(\d+)/i)[1].toUpperCase();
          const modelNumber = numMatch[1];
          model = `Galaxy ${seriesType}${modelNumber}`;
          
          // Estimate year based on model number
          if (modelNumber.startsWith('2')) {
            releaseYear = 2020;
          } else if (modelNumber.startsWith('3')) {
            releaseYear = 2021;
          } else if (modelNumber.startsWith('4')) {
            releaseYear = 2022;
          } else if (modelNumber.startsWith('5')) {
            releaseYear = 2023;
          } else if (modelNumber.startsWith('6')) {
            releaseYear = 2024;
          }
        } else {
          // Skip if we can't identify the model
          continue;
        }
      }
    }
    
    // Skip super old models
    if (releaseYear < 2020) {
      continue;
    }
    
    const key = model.toLowerCase();
    if (!modelMap.has(key)) {
      modelMap.set(key, {
        model,
        releaseYear,
        prices: [{ price: phone.sar, source: phone.source }]
      });
    } else {
      modelMap.get(key).prices.push({ price: phone.sar, source: phone.source });
    }
  }
  
  // Then, create standardized phone objects
  for (const [key, data] of modelMap.entries()) {
    // Get median price
    const prices = data.prices.map(p => p.price).sort((a, b) => a - b);
    const medianPrice = prices[Math.floor(prices.length / 2)];
    
    // Determine some specs based on model
    const isASeries = data.model.includes('A');
    const modelNumber = parseInt(data.model.match(/\d+/)[0]);
    
    // Determine screen size based on model number
    let screenSize = '6.5\"';
    let screenSizeLabel = 'medium';
    if (isASeries) {
      if (modelNumber >= 70) {
        screenSize = '6.7\"';
        screenSizeLabel = 'large';
      } else if (modelNumber >= 50) {
        screenSize = '6.5\"';
        screenSizeLabel = 'large';
      } else if (modelNumber >= 30) {
        screenSize = '6.4\"';
        screenSizeLabel = 'medium';
      } else {
        screenSize = '6.2\"';
        screenSizeLabel = 'medium';
      }
    } else { // M series
      if (modelNumber >= 50) {
        screenSize = '6.7\"';
        screenSizeLabel = 'large';
      } else {
        screenSize = '6.5\"';
        screenSizeLabel = 'large';
      }
    }
    
    // Determine camera quality based on model number
    let cameraQuality = 'Dual 12 MP (Rear)';
    let cameraQualityLabel = 'good';
    if (isASeries) {
      if (modelNumber >= 70) {
        cameraQuality = 'Quad 64 MP (Rear)';
        cameraQualityLabel = 'very good';
      } else if (modelNumber >= 50) {
        cameraQuality = 'Triple 64 MP (Rear)';
        cameraQualityLabel = 'very good';
      } else if (modelNumber >= 30) {
        cameraQuality = 'Triple 48 MP (Rear)';
        cameraQualityLabel = 'good';
      } else {
        cameraQuality = 'Dual 13 MP (Rear)';
        cameraQualityLabel = 'good';
      }
    } else { // M series
      if (modelNumber >= 50) {
        cameraQuality = 'Triple 50 MP (Rear)';
        cameraQualityLabel = 'good';
      } else if (modelNumber >= 30) {
        cameraQuality = 'Triple 48 MP (Rear)';
        cameraQualityLabel = 'good';
      } else {
        cameraQuality = 'Dual 48 MP (Rear)';
        cameraQualityLabel = 'good';
      }
    }
    
    // Determine battery based on model series
    let batteryLife = '4000 mAh';
    let batteryLifeLabel = 'good';
    if (isASeries) {
      if (modelNumber >= 70) {
        batteryLife = '5000 mAh';
        batteryLifeLabel = 'very good';
      } else if (modelNumber >= 50) {
        batteryLife = '5000 mAh';
        batteryLifeLabel = 'very good';
      } else if (modelNumber >= 30) {
        batteryLife = '4500 mAh';
        batteryLifeLabel = 'good';
      } else {
        batteryLife = '4000 mAh';
        batteryLifeLabel = 'good';
      }
    } else { // M series - known for good battery
      if (modelNumber >= 30) {
        batteryLife = '6000 mAh';
        batteryLifeLabel = 'very good';
      } else {
        batteryLife = '5000 mAh';
        batteryLifeLabel = 'very good';
      }
    }
    
    const screenType = (modelNumber >= 50) ? 'Super AMOLED' : 'LCD';
    
    // Create the standardized phone object
    const phone = {
      model: data.model,
      releaseYear: data.releaseYear,
      company: 'Samsung',
      price: {
        usd: Math.round(medianPrice / 3.75),
        sar: medianPrice
      },
      screenSize,
      screenSizeLabel,
      cameraQuality,
      cameraQualityLabel,
      screenType,
      batteryLife,
      batteryLifeLabel,
      lastPriceUpdate: new Date().toISOString(),
      priceSource: data.prices[0].source
    };
    
    phones.push(phone);
  }
  
  return phones;
}

// ===== PREDEFINED A SERIES & M SERIES PHONES =====
// This function provides predefined data for A and M series phones that will be added
// to the dataset if scraping fails
function getPredefinedSamsungPhones() {
  const currentYear = new Date().getFullYear();
  
  // A series phones
  const aSeriesPhones = [
    // 2024 Models
    {
      model: "Galaxy A55",
      releaseYear: 2024,
      price: { usd: 450, sar: 1690 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A54",
      releaseYear: 2023,
      price: { usd: 400, sar: 1500 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A53",
      releaseYear: 2022,
      price: { usd: 350, sar: 1315 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 64 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A35",
      releaseYear: 2024,
      price: { usd: 320, sar: 1200 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A34",
      releaseYear: 2023,
      price: { usd: 300, sar: 1125 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A33",
      releaseYear: 2022,
      price: { usd: 270, sar: 1015 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A25",
      releaseYear: 2024,
      price: { usd: 260, sar: 975 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A24",
      releaseYear: 2023,
      price: { usd: 240, sar: 900 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A23",
      releaseYear: 2022,
      price: { usd: 220, sar: 825 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A15",
      releaseYear: 2024,
      price: { usd: 200, sar: 750 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A14",
      releaseYear: 2023,
      price: { usd: 180, sar: 675 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A13",
      releaseYear: 2022,
      price: { usd: 160, sar: 600 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A05",
      releaseYear: 2024,
      price: { usd: 140, sar: 525 },
      screenSize: "6.7\"",
      screenSizeLabel: "large",
      cameraQuality: "Dual 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A04",
      releaseYear: 2023,
      price: { usd: 120, sar: 450 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Dual 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A03",
      releaseYear: 2022,
      price: { usd: 110, sar: 415 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Dual 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    // A series 2020-2021
    {
      model: "Galaxy A52",
      releaseYear: 2021,
      price: { usd: 300, sar: 1125 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 64 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "4500 mAh",
      batteryLifeLabel: "good"
    },
    {
      model: "Galaxy A32",
      releaseYear: 2021,
      price: { usd: 230, sar: 865 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 64 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A22",
      releaseYear: 2021,
      price: { usd: 200, sar: 750 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A12",
      releaseYear: 2021,
      price: { usd: 150, sar: 565 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A51",
      releaseYear: 2020,
      price: { usd: 260, sar: 975 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "4000 mAh",
      batteryLifeLabel: "good"
    },
    {
      model: "Galaxy A31",
      releaseYear: 2020,
      price: { usd: 210, sar: 790 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy A21",
      releaseYear: 2020,
      price: { usd: 180, sar: 675 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "4000 mAh",
      batteryLifeLabel: "good"
    },
    {
      model: "Galaxy A11",
      releaseYear: 2020,
      price: { usd: 140, sar: 525 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Triple 13 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "4000 mAh",
      batteryLifeLabel: "good"
    }
  ];
  
  // M series phones
  const mSeriesPhones = [
    // 2024-2022 Models
    {
      model: "Galaxy M55",
      releaseYear: 2024,
      price: { usd: 420, sar: 1575 },
      screenSize: "6.7\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M54",
      releaseYear: 2023,
      price: { usd: 380, sar: 1425 },
      screenSize: "6.7\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 108 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M53",
      releaseYear: 2022,
      price: { usd: 330, sar: 1240 },
      screenSize: "6.7\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 108 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M35",
      releaseYear: 2024,
      price: { usd: 310, sar: 1165 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M34",
      releaseYear: 2023,
      price: { usd: 280, sar: 1050 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M33",
      releaseYear: 2022,
      price: { usd: 250, sar: 940 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M25",
      releaseYear: 2024,
      price: { usd: 240, sar: 900 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M24",
      releaseYear: 2023,
      price: { usd: 220, sar: 825 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M23",
      releaseYear: 2022,
      price: { usd: 200, sar: 750 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M15",
      releaseYear: 2024,
      price: { usd: 180, sar: 675 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M14",
      releaseYear: 2023,
      price: { usd: 160, sar: 600 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M13",
      releaseYear: 2022,
      price: { usd: 145, sar: 545 },
      screenSize: "6.6\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 50 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    // M series 2020-2021
    {
      model: "Galaxy M52",
      releaseYear: 2021,
      price: { usd: 320, sar: 1200 },
      screenSize: "6.7\"",
      screenSizeLabel: "large",
      cameraQuality: "Triple 64 MP (Rear)",
      cameraQualityLabel: "very good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M32",
      releaseYear: 2021,
      price: { usd: 240, sar: 900 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 64 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M22",
      releaseYear: 2021,
      price: { usd: 190, sar: 715 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M12",
      releaseYear: 2021,
      price: { usd: 140, sar: 525 },
      screenSize: "6.5\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M51",
      releaseYear: 2020,
      price: { usd: 290, sar: 1090 },
      screenSize: "6.7\"",
      screenSizeLabel: "large",
      cameraQuality: "Quad 64 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "7000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M31",
      releaseYear: 2020,
      price: { usd: 220, sar: 825 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Quad 64 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M21",
      releaseYear: 2020,
      price: { usd: 160, sar: 600 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Triple 48 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "Super AMOLED",
      batteryLife: "6000 mAh",
      batteryLifeLabel: "very good"
    },
    {
      model: "Galaxy M11",
      releaseYear: 2020,
      price: { usd: 130, sar: 490 },
      screenSize: "6.4\"",
      screenSizeLabel: "medium",
      cameraQuality: "Triple 13 MP (Rear)",
      cameraQualityLabel: "good",
      screenType: "LCD",
      batteryLife: "5000 mAh",
      batteryLifeLabel: "very good"
    }
  ];
  
  // Combine A and M series
  const phones = [...aSeriesPhones, ...mSeriesPhones];
  
  // Add company info and lastPriceUpdate to all entries
  const timestamp = new Date().toISOString();
  const completedPhones = phones.map(phone => ({
    ...phone,
    company: "Samsung",
    lastPriceUpdate: timestamp,
    priceSource: "predefined"
  }));
  
  return completedPhones;
}

// Main function to find A series and M series Samsung phones
async function findSamsungSeriesPhones() {
  try {
    console.log('Starting to add Samsung A and M series phones...');
    
    // Get predefined phones data
    const predefinedPhones = getPredefinedSamsungPhones();
    console.log(`Generated ${predefinedPhones.length} predefined Samsung A and M series phone records`);
    
    // Load existing Samsung data
    const samsungData = await loadSamsungData();
    if (!samsungData) {
      console.error('Failed to load Samsung data');
      return false;
    }
    
    // Check for duplicate models
    const existingModels = new Set(samsungData.samsungPhones.map(phone => phone.model.toLowerCase()));
    const newPhones = predefinedPhones.filter(phone => !existingModels.has(phone.model.toLowerCase()));
    
    console.log(`Adding ${newPhones.length} new A and M series phones to Samsung.json`);
    
    // Add new phones to Samsung data
    samsungData.samsungPhones = [...samsungData.samsungPhones, ...newPhones];
    
    // Sort by model name
    samsungData.samsungPhones.sort((a, b) => {
      if (a.releaseYear !== b.releaseYear) {
        return b.releaseYear - a.releaseYear; // Newest first
      }
      return a.model.localeCompare(b.model);
    });
    
    // Save updated Samsung data
    await saveSamsungData(samsungData);
    
    console.log('Successfully added A and M series phones to Samsung.json');
    return true;
  } catch (error) {
    console.error(`Error in findSamsungSeriesPhones: ${error.message}`);
    return false;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  findSamsungSeriesPhones().then((success) => {
    console.log(`Samsung A and M series phone search ${success ? 'completed successfully' : 'failed'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = { findSamsungSeriesPhones }; 