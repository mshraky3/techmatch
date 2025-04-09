import React, { useState } from 'react';
import './PhoneList.css';
import PhoneDetails from './PhoneDetails';

const PhoneList = ({ phones }) => {
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = async (phone) => {
    setSelectedPhone(phone);
    setLoading(true);
    try {
      const response = await fetch('/api/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link: phone.link,
          source: phone.source
        }),
      });
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedPhone(null);
    setDetails(null);
  };

  if (!phones || phones.length === 0) {
    return (
      <div className="no-results">
        <p>No phones found matching your criteria. Try adjusting your search filters.</p>
      </div>
    );
  }

  return (
    <div className="phone-list-container">
      <div className="phone-grid">
        {phones.map((phone) => (
          <div key={`${phone.name}-${phone.model}`} className="phone-card">
            <div className="phone-image">
              <img src={phone.imgSrc} alt={`${phone.name} ${phone.model}`} />
            </div>
            <div className="phone-info">
              <h3>{phone.name}</h3>
              <h4>{phone.model}</h4>
              {phone.priceText && <p className="price">{phone.priceText}</p>}
              <button
                className="view-details-button"
                onClick={() => handleViewDetails(phone)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPhone && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {loading ? (
              <div className="loading">Loading details...</div>
            ) : (
              <PhoneDetails
                phone={selectedPhone}
                details={details}
                onClose={handleCloseDetails}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneList; 