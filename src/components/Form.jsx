import React, { useState } from 'react';
import axios from "axios";
import "./Form.css";

const Form = () => {
  const [formData, setFormData] = useState({
    minYear: '2018',
    brands: [],
    minPrice: '',
    maxPrice: '',
    storageSize: '',
    minDisplay: '',
    maxDisplay: '',
    minBattery: '',
    maxBattery: ''
  });

  const [results, setResults] = useState(null);
  const [more, setmore] = useState(false);

  const [loading, setLoading] = useState(false);



  const brandIdMap = {
    'Samsung': 9,
    'Apple': 48,
    'Huawei': 58,
    'Xiaomi': 80,
    'Oppo': 82,
    'Honor': 121
  };
  const brandsOptions = Object.keys(brandIdMap);

  const storageOptions = [
    { value: '', label: 'Don\'t Care' },
    { value: 64, label: '64 GB' },
    { value: 128, label: '128 GB' },
    { value: 256, label: '256 GB' },
    { value: 512, label: '512 GB' },
    { value: 1024, label: '1 TB' }
  ];

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2017 }, (_, i) => 2018 + i);
  };

  const handleBrandChange = (brandName, isChecked) => {
    const brandValue = brandIdMap[brandName];
    setFormData(prev => ({
      ...prev,
      brands: isChecked
        ? [...prev.brands, brandValue]
        : prev.brands.filter(b => b !== brandValue)
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/", formData);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("Error fetching results. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleSpecsClick = async (e, link) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/more", { link });
      
      setmore(response.data);
    } catch (error) {
      console.error("Error fetching detailed specs:", error);
      alert("Error loading specifications. Please try again.");
    }
  };
  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="filter-form">
        <div className="form-group">
          <label>Minimum Release Year:</label>
          <select
            name="minYear"
            value={formData.minYear}
            onChange={handleChange}
          >
            <option value="dont-care">Don't Care</option>
            {generateYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Brands:</label>
          <div className="brands-checkbox-group">
            {brandsOptions.map(brand => (
              <div key={brand} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`brand-${brand}`}
                  checked={formData.brands.includes(brandIdMap[brand])}
                  onChange={(e) => handleBrandChange(brand, e.target.checked)}
                />
                <label htmlFor={`brand-${brand}`}>{brand}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Price Range ($):</label>
          <div className="range-group">
            <input
              type="number"
              name="minPrice"
              placeholder="Min Price"
              value={formData.minPrice}
              onChange={handleChange}
            />
            <span>-</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max Price"
              value={formData.maxPrice}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Storage Size:</label>
          <select
            name="storageSize"
            value={formData.storageSize}
            onChange={handleChange}
          >
            {storageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Display Size (inches):</label>
          <div className="range-group">
            <input
              type="number"
              name="minDisplay"
              placeholder="Min (3.2)"
              min="3.2"
              max="7.2"
              step="0.1"
              value={formData.minDisplay}
              onChange={handleChange}
            />
            <span>-</span>
            <input
              type="number"
              name="maxDisplay"
              placeholder="Max (7.2)"
              min="3.2"
              max="7.2"
              step="0.1"
              value={formData.maxDisplay}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Battery Size (mAh):</label>
          <div className="range-group">
            <input
              type="number"
              name="minBattery"
              placeholder="Min (3000)"
              min="3000"
              max="7000"
              value={formData.minBattery}
              onChange={handleChange}
            />
            <span>-</span>
            <input
              type="number"
              name="maxBattery"
              placeholder="Max (7000)"
              min="3000"
              max="7000"
              value={formData.maxBattery}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Searching...' : 'Filter Devices'}
        </button>
      </form>

      {results && (
        <div className="results-section">
          <h2>Found {results.length} devices</h2>
          <div className="results-grid">
            {results.map((device, index) => (
              <div key={index} className="device-card">
                <img
                  src={device.imgSrc}
                  alt={device.model}
                  className="device-image"
                  onError={(e) => {
                    e.target.src = 'fallback-image-url';
                  }}
                />
                <div className="device-info">
                  <h3>{device.model}</h3>
                  <p className="brand">{device.name}</p>
                  <a
                    href={`https://www.gsmarena.com/${device.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="specs-link"
                    onClick={(e) => handleSpecsClick(e, device.link)}
                  >
                    View Full Specifications
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;