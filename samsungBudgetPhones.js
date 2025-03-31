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
    console.log('Successfully updated Samsung.json with new A and M series phones');
    return true;
  } catch (error) {
    console.error(`Error saving Samsung data: ${error.message}`);
    return false;
  }
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
async function addSamsungBudgetPhones() {
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
    console.error(`Error in addSamsungBudgetPhones: ${error.message}`);
    return false;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  addSamsungBudgetPhones().then((success) => {
    console.log(`Samsung A and M series phone addition ${success ? 'completed successfully' : 'failed'}`);
    process.exit(success ? 0 : 1);
  });
}

module.exports = { addSamsungBudgetPhones }; 