import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const URL = 'https://www.jarir.com/sa-en/catalogsearch/result?search=';

// Function to fetch data from Jarir
async function fetchData(query) {
  try {
    const response = await axios.get(URL + query);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Function to parse product information from HTML
function parseProductInfo(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Example of extracting product details
  const products = Array.from(doc.querySelectorAll('.product-tile__product-labelmt4'))
    .map(product => ({
      title: product.querySelector('.product-title__title').textContent.trim(),
      info: Array.from(product.querySelectorAll('.product-title__info--box')).map(info => info.textContent.trim()),
      price: product.querySelector('.price__currency').textContent.trim() + ' ' + product.querySelector('.price').textContent.trim()
    }));

  return products;
}

// Function to filter products based on user-defined criteria
function filterProducts(products, criteria) {
  return products.filter(product => {
    const { releaseYear, company, price, screenSizeLabel, cameraQualityLabel, batteryLifeLabel, isNew } = criteria;

    if (releaseYear && product.releaseYear !== releaseYear) return false;
    if (company && product.company !== company) return false;
    if (price.min && product.price < price.min) return false;
    if (price.max && product.price > price.max) return false;
    if (screenSizeLabel && !product.screenSize.includes(screenSizeLabel)) return false;
    if (cameraQualityLabel && !product.cameraQuality.includes(cameraQualityLabel)) return false;
    if (batteryLifeLabel && !product.batteryLife.includes(batteryLifeLabel)) return false;
    if (isNew && !product.isNew) return false;

    return true;
  });
}

// Main server code
import  express from 'express';
const app = express();

app.get('/', async (req, res) => {
  try {
    const query = req.query.q; // Assuming the search term is passed via query parameter
    const products = await fetchData(query);

    const parsedProducts = parseProductInfo(products);
    const filteredProducts = filterProducts(parsedProducts, {
      releaseYear: parseInt(req.query.releaseYear),
      company: req.query.company,
      price: {
        min: parseInt(req.query.priceMin),
        max: parseInt(req.query.priceMax)
      },
      screenSizeLabel: req.query.screenSizeLabel,
      cameraQualityLabel: req.query.cameraQualityLabel,
      batteryLifeLabel: req.query.batteryLifeLabel,
      isNew: req.query.isNew === 'true'
    });

    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});