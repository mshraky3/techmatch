import React, { useState } from 'react';
import './Form.css';

const Form = ({ onSearch }) => {
  const [formData, setFormData] = useState({
    minYear: 2020,
    brands: [],
    minPriceSAR: 0,
    maxPriceSAR: 10000,
    storageSize: 64,
    minDisplay: 5,
    maxDisplay: 7,
    minBattery: 3000,
    maxBattery: 6000
  });

  const brands = [
    { id: 9, name: 'Samsung' },
    { id: 48, name: 'Apple' },
    { id: 58, name: 'Huawei' },
    { id: 80, name: 'Xiaomi' },
    { id: 82, name: 'Oppo' },
    { id: 121, name: 'Honor' }
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleBrandChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      brands: checked 
        ? [...prev.brands, Number(value)]
        : prev.brands.filter(id => id !== Number(value))
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(formData);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Minimum Year:</label>
        <input
          type="number"
          name="minYear"
          value={formData.minYear}
          onChange={handleChange}
          min="2000"
          max={new Date().getFullYear()}
        />
      </div>

      <div className="form-group">
        <label>Brands:</label>
        <div className="brands-grid">
          {brands.map(brand => (
            <label key={brand.id} className="brand-checkbox">
              <input
                type="checkbox"
                value={brand.id}
                checked={formData.brands.includes(brand.id)}
                onChange={handleBrandChange}
              />
              {brand.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Price Range (SAR):</label>
        <div className="range-inputs">
          <input
            type="number"
            name="minPriceSAR"
            value={formData.minPriceSAR}
            onChange={handleChange}
            min="0"
            placeholder="Min Price"
          />
          <span>to</span>
          <input
            type="number"
            name="maxPriceSAR"
            value={formData.maxPriceSAR}
            onChange={handleChange}
            min={formData.minPriceSAR}
            placeholder="Max Price"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Storage Size (GB):</label>
        <select name="storageSize" value={formData.storageSize} onChange={handleChange}>
          <option value="32">32 GB</option>
          <option value="64">64 GB</option>
          <option value="128">128 GB</option>
          <option value="256">256 GB</option>
          <option value="512">512 GB</option>
          <option value="1024">1 TB</option>
        </select>
      </div>

      <div className="form-group">
        <label>Display Size (inches):</label>
        <div className="range-inputs">
          <input
            type="number"
            name="minDisplay"
            value={formData.minDisplay}
            onChange={handleChange}
            min="3"
            max={formData.maxDisplay}
            step="0.1"
            placeholder="Min Display"
          />
          <span>to</span>
          <input
            type="number"
            name="maxDisplay"
            value={formData.maxDisplay}
            onChange={handleChange}
            min={formData.minDisplay}
            max="10"
            step="0.1"
            placeholder="Max Display"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Battery Capacity (mAh):</label>
        <div className="range-inputs">
          <input
            type="number"
            name="minBattery"
            value={formData.minBattery}
            onChange={handleChange}
            min="1000"
            max={formData.maxBattery}
            step="100"
            placeholder="Min Battery"
          />
          <span>to</span>
          <input
            type="number"
            name="maxBattery"
            value={formData.maxBattery}
            onChange={handleChange}
            min={formData.minBattery}
            max="10000"
            step="100"
            placeholder="Max Battery"
          />
        </div>
      </div>

      <button type="submit" className="search-button">Find My Phone</button>
    </form>
  );
};

export default Form;
