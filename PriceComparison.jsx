import React, { useState, useEffect } from 'react';

const PriceComparison = () => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/price-sources');
        const data = await response.json();
        setPriceData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load price data');
        console.error('Error fetching price data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, []);

  if (loading) {
    return <div className="price-comparison loading">Loading price data...</div>;
  }

  if (error) {
    return <div className="price-comparison error">{error}</div>;
  }

  if (!priceData || !priceData.sources) {
    return <div className="price-comparison empty">No price data available</div>;
  }

  // Get unique sources
  const sources = Object.keys(priceData.sources);
  
  // Filter data based on selected options
  let displayData = [];
  
  Object.entries(priceData.sources).forEach(([source, phones]) => {
    if (selectedSource === 'all' || selectedSource === source) {
      const filteredPhones = phones.filter(phone => 
        selectedBrand === 'all' || selectedBrand === phone.brand
      );
      
      displayData = [...displayData, ...filteredPhones.map(phone => ({
        ...phone,
        source
      }))];
    }
  });
  
  // Sort by price (lowest first)
  displayData.sort((a, b) => a.price.sar - b.price.sar);

  return (
    <div className="price-comparison">
      <h2>Saudi Retailer Price Comparison</h2>
      
      <div className="last-update">
        Last updated: {new Date(priceData.lastUpdate).toLocaleString()}
      </div>
      
      <div className="filters">
        <div className="filter">
          <label htmlFor="brand-filter">Brand:</label>
          <select 
            id="brand-filter" 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="all">All Brands</option>
            <option value="Apple">Apple</option>
            <option value="Samsung">Samsung</option>
          </select>
        </div>
        
        <div className="filter">
          <label htmlFor="source-filter">Retailer:</label>
          <select 
            id="source-filter" 
            value={selectedSource} 
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="all">All Retailers</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Total Phones:</span>
          <span className="stat-value">{priceData.totalPhones}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Web-Scraped Prices:</span>
          <span className="stat-value">{priceData.totalScraped}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Retailers:</span>
          <span className="stat-value">{sources.length}</span>
        </div>
      </div>
      
      <table className="price-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Model</th>
            <th>Price (SAR)</th>
            <th>Price (USD)</th>
            <th>Retailer</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((item, index) => (
            <tr key={index}>
              <td>{item.brand}</td>
              <td>{item.model}</td>
              <td>{item.price.sar.toLocaleString()} SAR</td>
              <td>${item.price.usd.toLocaleString()}</td>
              <td>{item.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {displayData.length === 0 && (
        <div className="no-results">
          No phones match your filter criteria
        </div>
      )}
      
      <style jsx>{`
        .price-comparison {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h2 {
          color: #333;
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .last-update {
          color: #666;
          font-size: 0.9em;
          margin-bottom: 20px;
        }
        
        .filters {
          display: flex;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .filter {
          display: flex;
          align-items: center;
        }
        
        label {
          margin-right: 8px;
          font-weight: bold;
        }
        
        select {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        
        .stats {
          display: flex;
          margin-bottom: 20px;
          background: #e9ecef;
          border-radius: 4px;
          padding: 10px;
          gap: 20px;
        }
        
        .stat {
          flex: 1;
          text-align: center;
        }
        
        .stat-label {
          display: block;
          font-size: 0.9em;
          color: #666;
        }
        
        .stat-value {
          display: block;
          font-size: 1.2em;
          font-weight: bold;
          color: #333;
        }
        
        .price-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .price-table th, .price-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .price-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        .price-table tbody tr:hover {
          background-color: #f5f5f5;
        }
        
        .no-results {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        
        .loading, .error, .empty {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        
        .error {
          color: #d9534f;
        }
      `}</style>
    </div>
  );
};

export default PriceComparison; 