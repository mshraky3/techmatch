# PhoneDB Scraper

This script scrapes phone data from phonedb.net and organizes it by company into separate JSON files.

## Features

- Scrapes detailed phone specifications from phonedb.net
- Organizes data by company
- Saves data in JSON format
- Handles rate limiting and errors gracefully
- Shows progress and maximum ID found

## Setup

1. Install Python 3.7 or higher
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Simply run the script:

```bash
python scraper.py
```

The script will:

1. Start scraping from ID 1
2. Continue until it encounters 50 consecutive failed attempts
3. Save data for each company in the `company_data` directory
4. Print the maximum ID found

## Output

The script creates a `company_data` directory containing JSON files for each company (e.g., `samsung_phones.json`, `apple_phones.json`, etc.).

Each JSON file contains an array of phone objects with the following information:

- Brand
- Model
- Release date
- Dimensions
- Display size
- Resolution
- RAM
- Battery
- Camera
- ID
- URL
- Scrape date

## Rate Limiting

The script includes a 1-second delay between requests to be respectful to the server. Please be mindful of the server's resources when using this scraper.
