import axios from 'axios';
import { load } from 'cheerio';
import express from "express";
import cors from "cors"

const app = express();

var corsOptions = {
  origin: '*',
}
cors(corsOptions)
app.use(cors())
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.post("/" , async (req , res)=>{
  console.log(req.body)
  const {minYear ,  brands ,  minPrice , maxPrice , storageSize , minDisplay ,maxDisplay , minBattery ,maxBattery} = req.body
  try {
    const url = `https://www.gsmarena.com/results.php3?nYearMin=${minYear}&nPriceMin=450&sMakers=${brands}&sAvailabilities=1`;
    console.log(url)
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
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }
  
})



app.post("/more" , async (req, res)=>{
  try {
    const url =  "https://www.gsmarena.com/" + req.body.link
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
    res.send("items")
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }
  
})

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});