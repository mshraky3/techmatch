import React from 'react';
import './PhoneDetails.css';

const PhoneDetails = ({ phone, onClose }) => {
  if (!phone) return null;

  return (
    <div className="phone-details">
      <div className="details-header">
        <h2>{phone.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="details-content">
        <div className="details-image">
          <img src={phone.image} alt={phone.name} />
        </div>

        <div className="details-info">
          <div className="price-section">
            <h3>Price: {phone.price}</h3>
            <p className="currency-note">(Prices are converted to USD)</p>
          </div>

          <div className="specs-section">
            <h3>Specifications</h3>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">Brand:</span>
                <span className="spec-value">{phone.brand}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Model:</span>
                <span className="spec-value">{phone.model}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Year:</span>
                <span className="spec-value">{phone.year}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Storage:</span>
                <span className="spec-value">{phone.storage}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Display:</span>
                <span className="spec-value">{phone.display}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Battery:</span>
                <span className="spec-value">{phone.battery}</span>
              </div>
            </div>
          </div>

          <div className="features-section">
            <h3>Features</h3>
            <ul className="features-list">
              {phone.features?.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="source-section">
            <p className="source-note">
              Data sourced from: {phone.source}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneDetails; 