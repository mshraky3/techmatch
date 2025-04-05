import axios from 'axios';
import { load } from 'cheerio';
import dotenv from "dotenv"
import express from "express";
import cors from "cors"
dotenv.config()
const app = express();

const Years = (minYear) => {
  minYear = NaN ? minYear : 2020
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= minYear; year--) {
    years.push(`f[y][]=${year}&`);
  }
  return years;
};

var corsOptions = {
  origin: '*',
}
cors(corsOptions)
app.use(cors())
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/", async (req, res) => {
  const { minYear, brands, minPrice, maxPrice, storageSize, minDisplay, maxDisplay, minBattery, maxBattery } = req.body
  try {
  const url = `https://www.gsmarena.com/results.php3?nYearMin=${minYear}&nPriceMin=${minPrice}&?nPriceMax=${maxPrice}&sMakers=${brands}&DisplayInchesMin=${minDisplay}&fDisplayInchesMax=${maxDisplay}&nIntMemMin=${storageSize *1000}&nBatCapacityMin=${minBattery}&nBatCapacityMax=${maxBattery}&sAvailabilities=1`;
    const response = await axios.get(url);
    const html = response.data;

    const $ = load(html);
    const makersElements = $('.makers ul li').toArray();

    const items = makersElements.map(makerElement => {
      const element = $(makerElement);
      const link = element.find('a').attr('href');
      const imgSrc = element.find('img').attr('src');
      const name = link.split("_")[0];
      const model = element.find('span').text().trim(); // More reliable than splitting the link

      return {
        imgSrc,
        name,
        model,
        link
      };
    });

    console.log(items)
    res.json(items)
  } catch (error) {

  try {
    const brandIdMap = {
      'Samsung': 9,
      'Apple': 48,
      'Huawei': 58,
      'Xiaomi': 80,
      'Oppo': 82,
      'Honor': 121
    };
  
    let ides = req.body.brands;
    if (!Array.isArray(ides) || ides.length === 0) {
      ides = Object.values(brandIdMap);
    }
    
    const brands = ides
      .map(id => {
        const brandName = Object.keys(brandIdMap).find(key => brandIdMap[key] === id);
        return brandName ? brandName.toLowerCase() : null;
      })
      .filter(Boolean);
  
    const queryParams = [];
  
    if (req.body.storageSize) {
      const storage = req.body.storageSize < 1000 ? `${req.body.storageSize}GB` : `1TB`;
      queryParams.push(`f[774][n]=${storage}`);
    }
  
    if (req.body.minDisplay || req.body.maxDisplay) {
      const minD = req.body.minDisplay || 3.2;
      const maxD = req.body.maxDisplay || 10;
      queryParams.push(`f[253][n]=${minD}&f[253][x]=${maxD}`);
    }
  
    if (req.body.minBattery || req.body.maxBattery) {
      const minB = req.body.minBattery || 1000;
      const maxB = req.body.maxBattery || 10000;
      queryParams.push(`f[55][n]=${minB}&f[55][x]=${maxB}`);
    }
  
    const currentYear = new Date().getFullYear();
    const yearsToInclude = req.body.minYear 
      ? Array.from({length: currentYear - req.body.minYear + 1}, (_, i) => currentYear - i)
      : [2025, 2024, 2023, 2022];
    
    yearsToInclude.forEach(year => {
      queryParams.push(`f[y][]=${year}`);
    });
  
    const baseUrl = `https://www.phonearena.com/phones/manufacturers/${brands}`;
    const url = queryParams.length > 0 
      ? `${baseUrl}?${queryParams.join('&')}`
      : baseUrl;
  
    console.log(url);
    const response = await axios.get(url);
    const $ = load(response.data);
  
    const phoneData = [];
    $('.widget.widget-tilePhoneCard').each((index, element) => {
      const phoneElement = $(element);
      const link = phoneElement.find('a').attr('href');
      const titleText = phoneElement.find('.caption .title').text().trim();
      const [company, ...modelParts] = titleText.split(' ');
      const model = modelParts.join(' ');
      const imgSrc = phoneElement.find('picture.square img').attr('src');
      
      phoneData.push({
        link,
        company,
        model,
        imgSrc,
        element: phoneElement
      });
    });
  
    const minPrice = req.body.minPrice || 0;
    const maxPrice = req.body.maxPrice || Infinity;
  
    const phonesWithValidPrices = await Promise.all(
      phoneData.map(async (phone) => {
        try {
          const priceText = phone.element.find('th:contains("MSRP:")').siblings('td').text().trim() || 
                           await extractPriceFromDetailsPage(phone.link);
          
          const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
          const isValidNumber = !isNaN(priceValue);
          const withinRange = isValidNumber ? (priceValue >= minPrice && priceValue <= maxPrice) : true;
  
          return {
            name: phone.company,
            model: phone.model,
            imgSrc: phone.imgSrc,
            price: isValidNumber ? priceValue : priceText,
            link: phone.link,
            valid: withinRange
          };
        } catch (error) {
          console.error(`Error processing ${phone.link}:`, error.message);
          return { link: phone.link, valid: false };
        }
      })
    );
  
    async function extractPriceFromDetailsPage(url) {
      const response = await axios.get(url);
      const $ = load(response.data);
      return $('th:contains("MSRP:")').siblings('td').text().trim();
    }
  
    const validPhones = phonesWithValidPrices.filter(phone => phone.valid);
    
    validPhones.sort((a, b) => Math.abs(a.price - maxPrice) - Math.abs(b.price - maxPrice));
    const topThree = validPhones.slice(0, 3);
  
    console.log(topThree);
    res.json(topThree);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }
  }

})



app.post("/more", async (req, res) => {
  try {
    const url = "https://www.gsmarena.com/" + req.body.link
    const response = await axios.get(url);
    const html = response.data;
    const $ = load(html);
    const makersElements = $('.makers ul li').toArray();
    const items = makersElements.map(makerElement => {
      const element = $(makerElement);
      const link = element.find('a').attr('href');
      const imgSrc = element.find('img').attr('src');
      const name = link.split("_")[0];
      const model = element.find('span').text().trim();

      return {
        imgSrc,
        name,
        model,
        link
      };
    });
    console.log(items)
    res.send("items")
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }

})





app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

