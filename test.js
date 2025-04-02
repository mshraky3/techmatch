import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';

const baseUrl = 'https://www.extra.com/en-sa/mobiles-tablets/mobiles/c/2-212/facet/';
const queryParams = '?q=%3Arelevance%3Atype%3APRODUCT&text=&pg=';
const pageSize = '&pageSize=48'; // Adjust pageSize as needed
const sortParam = '&sort=relevance';

let pageNumber = 0;
let allPhones = [];

async function fetchPage(pageNumber) {
    const url = `${baseUrl}${queryParams}${pageNumber}${pageSize}${sortParam}`;
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching page ${pageNumber}:`, error);
        return null;
    }
}

function parsePage(html) {
    const $ = load(html);
    const phones = [];

    $('.product-item').each((index, element) => {
        const name = $(element).find('.product-name').text().trim();
        const price = $(element).find('.product-price').text().trim();
        const imageUrl = $(element).find('.product-image img').attr('src');

        phones.push({ name, price, imageUrl });
    });

    return phones;
}

async function scrapeAllPages() {
    let hasMorePages = true;

    while (hasMorePages) {
        const html = await fetchPage(pageNumber);
        if (!html) {
            break;
        }

        const phones = parsePage(html);
        if (phones.length === 0) {
            hasMorePages = false;
        } else {
            allPhones = [...allPhones, ...phones];
            pageNumber++;
        }
    }

    fs.writeFileSync('phones.json', JSON.stringify(allPhones, null, 2));
    console.log('Scraping completed. Data saved to phones.json');
}

scrapeAllPages();