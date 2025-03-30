import React, { useState, useEffect } from 'react';
import { searchPhones, fetchBrands } from '../services/api';
import './SearchForm.css';

const SearchForm = ({ onSearch }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    priceRange: '',
    screenSize: '',
    batteryCapacity: '',
    cameraQuality: '',
    priorities: [],
    currency: 'SAR'
  });
  const [brands, setBrands] = useState([]);
  const [selectedBrandModels, setSelectedBrandModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await fetchBrands();
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setError('Failed to load phone brands');
      }
    };

    loadBrands();
  }, []);

  const handleBrandSelect = (brand) => {
    setFormData(prev => ({
      ...prev,
      brand: brand.id,
      model: '' // Reset model when brand changes
    }));
    setSelectedBrandModels(brand.models);
    setShowFilters(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        priorities: checked 
          ? [...prev.priorities, value]
          : prev.priorities.filter(p => p !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const results = await searchPhones(formData);
      onSearch(results);
    } catch (error) {
      setError(error.message || 'Failed to search phones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h2>Find Your Perfect Phone</h2>
      <p className="subtitle">Select a brand to start your search</p>
      
      <div className="brand-grid">
        {brands.map(brand => (
          <div
            key={brand.id}
            className={`brand-card ${formData.brand === brand.id ? 'selected' : ''}`}
            onClick={() => handleBrandSelect(brand)}
          >
            <h3>{brand.name}</h3>
            <p>Latest models: {brand.models.slice(0, 2).join(', ')}</p>
          </div>
        ))}
      </div>

      {showFilters && (
        <form onSubmit={handleSubmit} className="search-form">
          <div className="form-group">
            <label htmlFor="model">Specific Model (Optional):</label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
            >
              <option value="">Any Model</option>
              {selectedBrandModels.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priceRange">Price Range:</label>
            <select
              id="priceRange"
              name="priceRange"
              value={formData.priceRange}
              onChange={handleChange}
              required
            >
              <option value="">Select price range</option>
              <option value="budget">Budget (Under 1125 SAR)</option>
              <option value="mid">Mid-Range (1125-2625 SAR)</option>
              <option value="premium">Premium (Over 2625 SAR)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="screenSize">Screen Size:</label>
            <select
              id="screenSize"
              name="screenSize"
              value={formData.screenSize}
              onChange={handleChange}
            >
              <option value="">Any</option>
              <option value="small">Small (Under 6 inches)</option>
              <option value="medium">Medium (6-6.5 inches)</option>
              <option value="large">Large (Over 6.5 inches)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="batteryCapacity">Battery Capacity:</label>
            <select
              id="batteryCapacity"
              name="batteryCapacity"
              value={formData.batteryCapacity}
              onChange={handleChange}
            >
              <option value="">Any</option>
              <option value="small">Small (Under 4000mAh)</option>
              <option value="medium">Medium (4000-5000mAh)</option>
              <option value="large">Large (Over 5000mAh)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cameraQuality">Camera Quality:</label>
            <select
              id="cameraQuality"
              name="cameraQuality"
              value={formData.cameraQuality}
              onChange={handleChange}
            >
              <option value="">Any</option>
              <option value="basic">Basic (Single/Dual)</option>
              <option value="advanced">Advanced (Triple/Quad)</option>
              <option value="professional">Professional (High-end)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Priorities:</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  value="price"
                  checked={formData.priorities.includes('price')}
                  onChange={handleChange}
                />
                Price
              </label>
              <label>
                <input
                  type="checkbox"
                  value="screen"
                  checked={formData.priorities.includes('screen')}
                  onChange={handleChange}
                />
                Screen
              </label>
              <label>
                <input
                  type="checkbox"
                  value="battery"
                  checked={formData.priorities.includes('battery')}
                  onChange={handleChange}
                />
                Battery
              </label>
              <label>
                <input
                  type="checkbox"
                  value="camera"
                  checked={formData.priorities.includes('camera')}
                  onChange={handleChange}
                />
                Camera
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search Phones'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SearchForm; 