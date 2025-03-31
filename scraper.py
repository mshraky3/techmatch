import requests
from bs4 import BeautifulSoup
import json
import os
import time
from datetime import datetime
import urllib3
import re
from collections import defaultdict
import shutil

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class PhoneDBScraper:
    def __init__(self):
        self.base_url = "https://phonedb.net/index.php?m=device&id="
        self.companies = {}
        self.ids_since_last_save = 0
        self.stats = defaultdict(int)
        self.start_time = None
        
        # Create or clear company_data directory
        if os.path.exists('company_data'):
            shutil.rmtree('company_data')
        os.makedirs('company_data')
        print("Created clean company_data directory for saving JSON files")
        
    def extract_year(self, release_date):
        if not release_date:
            return None
        # Try to extract year from various date formats
        year_match = re.search(r'20\d{2}', release_date)
        if year_match:
            return int(year_match.group())
        return None
        
    def extract_field_value(self, row):
        """Extract value from a table row based on the exact HTML structure"""
        try:
            # Get all td elements
            cells = row.find_all('td')
            if len(cells) < 2:
                return None
                
            value_cell = cells[1]
            
            # First try to get text from links
            links = value_cell.find_all('a')
            if links:
                # Join multiple links with commas (for things like market countries)
                values = [link.text.strip() for link in links if link.text.strip()]
                if values:
                    return ', '.join(values)
            
            # If no links or empty link text, get direct text
            text = value_cell.get_text(strip=True)
            return text if text else None
            
        except Exception as e:
            print(f"Error extracting field value: {str(e)}")
            return None
            
    def find_field_row(self, datasheet, field_name):
        """Find a row containing the specified field name"""
        try:
            # First try finding by strong tag
            for row in datasheet.find_all('tr'):
                first_cell = row.find('td')
                if first_cell:
                    strong = first_cell.find('strong')
                    if strong and field_name in strong.text:
                        return row
                        
            # If not found, try finding by direct text in first cell
            for row in datasheet.find_all('tr'):
                first_cell = row.find('td')
                if first_cell and field_name in first_cell.text:
                    return row
                    
            return None
            
        except Exception as e:
            print(f"Error finding field row: {str(e)}")
            return None
        
    def scrape_phone(self, id):
        try:
            url = f"{self.base_url}{id}"
            response = requests.get(url, verify=False)
            if response.status_code != 200:
                print(f"Failed to fetch ID {id}")
                return None
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the main datasheet table - try different approaches
            datasheet = None
            
            # Try by style first
            datasheet = soup.find('table', {'style': 'width : 98%; margin : 2px;'})
            
            # If not found, try finding the largest table with relevant content
            if not datasheet:
                tables = soup.find_all('table')
                for table in tables:
                    if table.find('td', string=lambda x: x and ('Brand' in x or 'Model' in x)):
                        datasheet = table
                        break
                        
            if not datasheet:
                print(f"No datasheet found for ID {id}")
                return None
                
            phone_data = {}
            
            # Check release date first
            release_row = self.find_field_row(datasheet, 'Released')
            if release_row:
                release_date = self.extract_field_value(release_row)
                if release_date:
                    year = self.extract_year(release_date)
                    if not year or year < 2021:
                        print(f"Skipping ID {id} - Released {release_date}")
                        self.stats['skipped_old'] += 1
                        return None
                    phone_data['released'] = release_date
            else:
                self.stats['skipped_no_date'] += 1
                return None
            
            # Extract brand first
            brand_row = self.find_field_row(datasheet, 'Brand')
            if not brand_row:
                self.stats['skipped_no_brand'] += 1
                return None
                
            brand = self.extract_field_value(brand_row)
            if not brand:
                return None
            phone_data['brand'] = brand
            
            # Define fields to extract based on the HTML structure
            fields = {
                'model': 'Model',
                'hardware_designer': 'Hardware Designer',
                'manufacturer': 'Manufacturer',
                'device_category': 'Device Category',
                'width': 'Width',
                'height': 'Height',
                'depth': 'Depth',
                'dimensions': 'Dimensions',
                'mass': 'Mass',
                'platform': 'Platform',
                'os': 'Operating System',
                'cpu': 'CPU',
                'cpu_clock': 'CPU Clock',
                'ram': 'RAM Capacity (converted)',
                'ram_type': 'RAM Type',
                'storage': 'Non-volatile Memory Capacity (converted)',
                'display_size': 'Display Diagonal',
                'resolution': 'Resolution',
                'display_type': 'Display Type',
                'pixel_density': 'Pixel Density',
                'display_protection': 'Scratch Resistant Screen',
                'gpu': 'Graphical Controller',
                'camera': 'Camera Image Sensor',
                'flash': 'Flash',
                'secondary_camera': 'Secondary Camera Sensor',
                'battery': 'Battery',
                'battery_capacity': 'Nominal Battery Capacity',
                'battery_life': 'Estimated Battery Life',
                'cellular': 'Supported Cellular Bands',
                'wifi': 'Wireless LAN',
                'bluetooth': 'Bluetooth',
                'usb': 'USB',
                'sensors': 'Built-in accelerometer',
                'protection_solids': 'Protection from solid materials',
                'protection_liquids': 'Protection from liquids',
                'market_regions': 'Market Regions',
                'market_countries': 'Market Countries'
            }
            
            # Extract each field
            for key, field_name in fields.items():
                try:
                    row = self.find_field_row(datasheet, field_name)
                    if row:
                        value = self.extract_field_value(row)
                        if value and value.lower() not in ['no', 'not supported']:
                            phone_data[key] = value
                except Exception as e:
                    print(f"Error extracting field {field_name}: {str(e)}")
                    continue
            
            # Add metadata
            phone_data['id'] = id
            phone_data['url'] = url
            phone_data['scraped_date'] = datetime.now().isoformat()
            
            return phone_data
            
        except Exception as e:
            print(f"Error scraping ID {id}: {str(e)}")
            self.stats['errors'] += 1
            return None
            
    def organize_by_company(self, phone_data):
        if not phone_data:
            return
            
        brand = phone_data['brand']
        if brand not in self.companies:
            self.companies[brand] = []
            
        # Check if phone already exists
        exists = any(p['id'] == phone_data['id'] for p in self.companies[brand])
        if not exists:
            self.companies[brand].append(phone_data)
            self.stats['phones_by_brand'][brand] = self.stats['phones_by_brand'].get(brand, 0) + 1
        
    def save_company_data(self):
        """
        Saves phone data to JSON files organized by company.
        Creates one JSON file per company in the company_data directory.
        """
        saved_count = 0
        new_companies = 0
        
        for company, phones in self.companies.items():
            # Create safe filename from company name
            safe_company = company.lower().replace(' ', '_').replace('/', '_').replace('\\', '_')
            filename = f"company_data/{safe_company}_phones.json"
            
            # Sort phones by release date (newest first)
            phones.sort(key=lambda x: x.get('released', ''), reverse=True)
            
            # Check if this is a new company file
            is_new = not os.path.exists(filename)
            
            # Save the data
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    'company_name': company,
                    'total_phones': len(phones),
                    'last_updated': datetime.now().isoformat(),
                    'phones': phones
                }, f, indent=2, ensure_ascii=False)
            
            saved_count += len(phones)
            if is_new:
                new_companies += 1
                print(f"Created new company file: {filename}")
            
        print(f"\nSaved {saved_count} phones across {len(self.companies)} companies")
        if new_companies > 0:
            print(f"Added {new_companies} new company files")
        print(f"Data saved in: {os.path.abspath('company_data')}")
        
    def print_stats(self):
        """Print detailed statistics about the scraping process"""
        elapsed_time = time.time() - self.start_time
        hours = int(elapsed_time // 3600)
        minutes = int((elapsed_time % 3600) // 60)
        seconds = int(elapsed_time % 60)
        
        print("\n=== Scraping Statistics ===")
        print(f"Time elapsed: {hours:02d}:{minutes:02d}:{seconds:02d}")
        print(f"Total phones found: {sum(self.stats['phones_by_brand'].values())}")
        print("\nPhones by brand:")
        for brand, count in sorted(self.stats['phones_by_brand'].items(), key=lambda x: x[1], reverse=True):
            print(f"  {brand}: {count}")
        print("\nSkipped phones:")
        print(f"  Pre-2021 phones: {self.stats['skipped_old']}")
        print(f"  No release date: {self.stats['skipped_no_date']}")
        print(f"  No brand info: {self.stats['skipped_no_brand']}")
        print(f"  Invalid data: {self.stats['invalid_data']}")
        print(f"Errors encountered: {self.stats['errors']}")
        
    def run(self, start_id=1, max_id=None):
        current_id = start_id
        consecutive_failures = 0
        max_consecutive_failures = 50
        phones_found = 0
        self.start_time = time.time()
        self.stats['phones_by_brand'] = {}
        
        print(f"Starting scrape at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("Press Ctrl+C at any time to stop and save progress\n")
        
        while True:
            if max_id and current_id > max_id:
                print(f"Reached maximum ID {max_id}. Stopping.")
                break
                
            if consecutive_failures >= max_consecutive_failures:
                print(f"Reached {max_consecutive_failures} consecutive failures. Stopping.")
                break
                
            print(f"Scraping ID: {current_id}")
            phone_data = self.scrape_phone(current_id)
            
            if phone_data:
                consecutive_failures = 0
                self.organize_by_company(phone_data)
                phones_found += 1
                print(f"Successfully scraped {phone_data['brand']} {phone_data['model']} ({phone_data.get('released', 'Unknown release date')})")
                self.ids_since_last_save += 1
                
                # Save every 15 successful scrapes
                if self.ids_since_last_save >= 15:
                    print(f"\nSaving checkpoint... (Found {phones_found} phones from 2021 or later)")
                    self.save_company_data()
                    self.print_stats()
                    self.ids_since_last_save = 0
                    print("\nContinuing scraping...\n")
            else:
                consecutive_failures += 1
                
            current_id += 1
            time.sleep(1)  # Be nice to the server
            
        print(f"\nFinished scraping. Last ID checked: {current_id - 1}")
        print(f"Total phones found from 2021 or later: {phones_found}")
        self.save_company_data()  # Final save
        self.print_stats()
        return current_id - 1

if __name__ == "__main__":
    try:
        max_id = int(input("Enter the maximum ID to scrape (or press Enter for no limit): ") or 0)
        scraper = PhoneDBScraper()
        if max_id > 0:
            last_id = scraper.run(max_id=max_id)
        else:
            last_id = scraper.run()
        print(f"Maximum ID found: {last_id}")
    except KeyboardInterrupt:
        print("\nScraping interrupted by user. Saving collected data...")
        scraper.save_company_data()
        scraper.print_stats()
        print("Data saved successfully.")
    except ValueError:
        print("Invalid input. Please enter a number or press Enter for no limit.")
        exit(1) 