import axios from 'axios';
import { load } from 'cheerio';
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();

const app = express();
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

async function convertSARtoUSD(sarAmount) {
  try {
    const response = await axios.get(EXCHANGE_RATE_API);
    const rate = response.data.rates.SAR;
    return sarAmount / rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return sarAmount / 3.75; // Fallback rate
  }
}

async function convertUSDtoSAR(usdAmount) {
  try {
    const response = await axios.get(EXCHANGE_RATE_API);
    const rate = response.data.rates.SAR;
    return usdAmount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return usdAmount * 3.75; // Fallback rate
  }
}

// Configure CORS
app.use(cors({
  origin: '*',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main endpoint for phone search
app.post("/search", async (req, res) => {
  const { minYear, brands, minPriceSAR, maxPriceSAR, storageSize, minDisplay, maxDisplay, minBattery, maxBattery } = req.body;
  
  // Convert SAR prices to USD for searching
  const minPriceUSD = await convertSARtoUSD(minPriceSAR);
  const maxPriceUSD = await convertSARtoUSD(maxPriceSAR);
  
  try {
    // Try GSMArena first
    const gsmUrl = `https://www.gsmarena.com/results.php3?nYearMin=${minYear}&nPriceMin=${minPriceUSD}&nPriceMax=${maxPriceUSD}&sMakers=${brands}&DisplayInchesMin=${minDisplay}&fDisplayInchesMax=${maxDisplay}&nIntMemMin=${storageSize * 1000}&nBatCapacityMin=${minBattery}&nBatCapacityMax=${maxBattery}&sAvailabilities=1`;
    
    let gsmResponse;
    try {
      gsmResponse = await axios.get(gsmUrl);
      if (gsmResponse.status !== 200 || gsmResponse.status === 429) {
        throw new Error('GSMArena request failed');
      }
    } catch (error) {
      console.log('GSMArena request failed, switching to PhoneArena');
      // Continue to PhoneArena
    }

    // Only process GSMArena if we got a successful response
    if (gsmResponse && gsmResponse.status === 200) {

      const gsmHtml = gsmResponse.data;
      const $ = load(gsmHtml);
      
      const phones = [];
      $('.makers ul li').each((_, element) => {
        const $element = $(element);
        const link = $element.find('a').attr('href');
        const imgSrc = $element.find('img').attr('src');
        const name = link.split('_')[0];
        const model = $element.find('span').text().trim();
        
        phones.push({
          source: 'gsmarena',
          imgSrc,
          name,
          model,
          link: `https://www.gsmarena.com/${link}`,
          price: null
        });
      });

      if (phones.length > 0) {
        // Fetch prices for GSMArena phones
        const phonesWithPrices = await Promise.all(phones.map(async (phone) => {
          try {
            const detailsResponse = await axios.get(phone.link);
            if (detailsResponse.status !== 200 || detailsResponse.status === 429) {
              throw new Error('Details request failed');
            }
            const $details = load(detailsResponse.data);
            const priceText = $details.find('td:contains("Price")').next().text().trim();
            const priceUSD = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            const priceSAR = await convertUSDtoSAR(priceUSD);
            
            return {
              ...phone,
              price: priceSAR,
              priceText: `${priceSAR.toFixed(2)} SAR`,
              image: phone.imgSrc,
              brand: phone.name,
              year: minYear,
              storage: `${storageSize}GB`,
              display: `${minDisplay}-${maxDisplay} inches`,
              battery: `${minBattery}-${maxBattery} mAh`,
              features: ['4G LTE', 'Wi-Fi', 'Bluetooth', 'GPS']
            };
          } catch (error) {
            console.error(`Error fetching price for ${phone.model}:`, error);
            return {
              ...phone,
              price: 'N/A',
              priceText: 'Price not available',
              image: phone.imgSrc,
              brand: phone.name,
              year: minYear,
              storage: `${storageSize}GB`,
              display: `${minDisplay}-${maxDisplay} inches`,
              battery: `${minBattery}-${maxBattery} mAh`,
              features: ['4G LTE', 'Wi-Fi', 'Bluetooth', 'GPS']
            };
          }
        }));

        return res.json(phonesWithPrices);
      }
    }

    // If GSMArena fails, try PhoneArena
    const brandIdMap = {
      'Samsung': 9,
      'Apple': 48,
      'Huawei': 58,
      'Xiaomi': 80,
      'Oppo': 82,
      'Honor': 121
    };

    const brandsList = brands.map(id => {
      const brandName = Object.keys(brandIdMap).find(key => brandIdMap[key] === id);
      return brandName ? brandName.toLowerCase() : null;
    }).filter(Boolean);

    const queryParams = [];
    if (storageSize) {
      queryParams.push(`f[774][n]=${storageSize}GB`);
    }
    if (minDisplay || maxDisplay) {
      queryParams.push(`f[253][n]=${minDisplay || 3.2}&f[253][x]=${maxDisplay || 10}`);
    }
    if (minBattery || maxBattery) {
      queryParams.push(`f[55][n]=${minBattery || 1000}&f[55][x]=${maxBattery || 10000}`);
    }

    const phoneArenaUrl = `https://www.phonearena.com/phones/manufacturers/${brandsList.join(',')}?${queryParams.join('&')}`;
    console.log(phoneArenaUrl);
    
    try {
      const phoneArenaResponse = await axios.get(phoneArenaUrl);
      if (phoneArenaResponse.status !== 200 || phoneArenaResponse.status === 429) {
        throw new Error('PhoneArena request failed');
      }
      
      const $phoneArena = load(phoneArenaResponse.data);
      const phoneArenaPhones = [];
      
      $phoneArena('.widget.widget-tilePhoneCard').each((_, element) => {
        const $element = $phoneArena(element);
        const link = $element.find('a').attr('href');
        const titleText = $element.find('.caption .title').text().trim();
        const [company, ...modelParts] = titleText.split(' ');
        const model = modelParts.join(' ');
        const imgSrc = $element.find('picture.square img').attr('src');

        phoneArenaPhones.push({
          source: 'phonearena',
          imgSrc,
          name: company,
          model,
          link,
          price: null
        });
      });

      // Fetch prices for PhoneArena phones
      const phoneArenaPhonesWithPrices = await Promise.all(phoneArenaPhones.map(async (phone) => {
        try {
          const detailsResponse = await axios.get(phone.link);
          if (detailsResponse.status !== 200 || detailsResponse.status === 429) {
            throw new Error('Details request failed');
          }
          const $details = load(detailsResponse.data);
          const priceText = $details.find('th:contains("MSRP:")').next().text().trim();
          const priceUSD = parseFloat(priceText.replace(/[^0-9.]/g, ''));
          const priceSAR = await convertUSDtoSAR(priceUSD);

          return {
            ...phone,
            price: priceSAR,
            priceText: `${priceSAR.toFixed(2)} SAR`,
            image: phone.imgSrc,
            brand: phone.name,
            year: minYear,
            storage: `${storageSize}GB`,
            display: `${minDisplay}-${maxDisplay} inches`,
            battery: `${minBattery}-${maxBattery} mAh`,
            features: ['4G LTE', 'Wi-Fi', 'Bluetooth', 'GPS']
          };
        } catch (error) {
          console.error(`Error fetching price for ${phone.model}:`, error);
          return {
            ...phone,
            price: 'N/A',
            priceText: 'Price not available',
            image: phone.imgSrc,
            brand: phone.name,
            year: minYear,
            storage: `${storageSize}GB`,
            display: `${minDisplay}-${maxDisplay} inches`,
            battery: `${minBattery}-${maxBattery} mAh`,
            features: ['4G LTE', 'Wi-Fi', 'Bluetooth', 'GPS']
          };
        }
      }));

      res.json(phoneArenaPhonesWithPrices);
    } catch (error) {
      console.error('Error in PhoneArena search:', error);
      res.status(500).json({ error: 'Failed to fetch phone data from both sources' });
    }
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: 'Failed to fetch phone data' });
  }
});

// Endpoint for getting detailed specifications
app.post("/details", async (req, res) => {
  const { link, source } = req.body;
  
  try {
    const response = await axios.get(link);
    const $ = load(response.data);
    
    let specifications = {};
    
    if (source === 'gsmarena') {
      $('.specs-list').each((_, element) => {
        const category = $(element).find('h2').text().trim();
        const specs = {};
        
        $(element).find('tr').each((_, row) => {
          const key = $(row).find('td.ttl').text().trim();
          const value = $(row).find('td.nfo').text().trim();
          if (key && value) {
            specs[key] = value;
          }
        });
        
        specifications[category] = specs;
      });
    } else if (source === 'phonearena') {
      $('table').each((_, table) => {
        const category = $(table).find('h3').text().trim();
        const specs = {};
        
        $(table).find('tr').each((_, row) => {
          const key = $(row).find('th').text().trim();
          const value = $(row).find('td').text().trim();
          if (key && value) {
            specs[key] = value;
          }
        });
        
        specifications[category] = specs;
      });
    }
    
    res.json(specifications);
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ error: 'Failed to fetch phone details' });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
}); 