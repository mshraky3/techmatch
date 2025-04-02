import requests
from bs4 import BeautifulSoup
import json

base_url = 'https://www.extra.com/en-sa/mobiles-tablets/mobiles/c/2-212/facet/'
query_params = '?q=%3Arelevance%3Atype%3APRODUCT&text=&pg='
page_size = '&pageSize=48'  # Adjust pageSize as needed
sort_param = '&sort=relevance'

def fetch_page(page_number):
    url = f"{base_url}{query_params}{page_number}{page_size}{sort_param}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching page {page_number}: {e}")
        return None

def parse_page(html):
    soup = BeautifulSoup(html, 'html.parser')
    phones = []

    product_items = soup.find_all('div', class_='product-item')
    for item in product_items:
        name = item.find('div', class_='product-name').get_text(strip=True)
        price = item.find('div', class_='product-price').get_text(strip=True)
        image_tag = item.find('img', class_='product-image')
        image_url = image_tag['src'] if image_tag else None

        phones.append({
            'name': name,
            'price': price,
            'imageUrl': image_url
        })

    return phones

def scrape_all_pages():
    all_phones = []
    page_number = 0
    has_more_pages = True

    while has_more_pages:
        html = fetch_page(page_number)
        if not html:
            break

        phones = parse_page(html)
        if not phones:
            has_more_pages = False
        else:
            all_phones.extend(phones)
            page_number += 1

    with open('phones.json', 'w', encoding='utf-8') as f:
        json.dump(all_phones, f, ensure_ascii=False, indent=2)

    print('Scraping completed. Data saved to phones.json')

if __name__ == '__main__':
    scrape_all_pages()