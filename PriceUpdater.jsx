import React, { useState } from 'react';

const PriceUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(localStorage.getItem('lastPriceUpdate') || 'Never');

  const updatePrices = async () => {
    try {
      setIsUpdating(true);
      setUpdateStatus('Updating prices. This may take a few minutes...');
      
      const response = await fetch('/api/update-prices');
      const data = await response.json();
      
      setUpdateStatus(data.message);
      
      // Set last updated time
      const now = new Date().toLocaleString();
      setLastUpdated(now);
      localStorage.setItem('lastPriceUpdate', now);
      
      // Check for completion after a delay (since it's async)
      setTimeout(async () => {
        try {
          const checkResponse = await fetch('/api/samsung-data');
          const samsungData = await checkResponse.json();
          
          // Find the most recent lastPriceUpdate value
          let mostRecentUpdate = null;
          for (const phone of samsungData.samsungPhones) {
            if (phone.lastPriceUpdate) {
              const updateDate = new Date(phone.lastPriceUpdate);
              if (!mostRecentUpdate || updateDate > mostRecentUpdate) {
                mostRecentUpdate = updateDate;
              }
            }
          }
          
          if (mostRecentUpdate) {
            setUpdateStatus('Price update complete!');
            setLastUpdated(mostRecentUpdate.toLocaleString());
            localStorage.setItem('lastPriceUpdate', mostRecentUpdate.toLocaleString());
          }
        } catch (error) {
          console.error('Error checking update status:', error);
        } finally {
          setIsUpdating(false);
        }
      }, 10000);
    } catch (error) {
      console.error('Error updating prices:', error);
      setUpdateStatus('Error updating prices. Please try again.');
      setIsUpdating(false);
    }
  };

  return (
    <div className="price-updater">
      <h3>Real-Time Price Updates</h3>
      <p>Get the latest prices from major retailers for all Samsung phones.</p>
      <button 
        onClick={updatePrices} 
        disabled={isUpdating}
        className={`update-button ${isUpdating ? 'updating' : ''}`}
      >
        {isUpdating ? 'Updating...' : 'Update Prices Now'}
      </button>
      
      {updateStatus && <p className="update-status">{updateStatus}</p>}
      
      <div className="last-updated">
        <p>Last updated: {lastUpdated}</p>
      </div>
      
      <style jsx>{`
        .price-updater {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .update-button {
          background: #0072ce;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .update-button:hover:not(:disabled) {
          background: #005ea8;
        }
        
        .update-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .update-button.updating {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        .update-status {
          margin-top: 15px;
          padding: 10px;
          background: #e9ecef;
          border-radius: 4px;
        }
        
        .last-updated {
          font-size: 0.9em;
          color: #6c757d;
          margin-top: 15px;
        }
      `}</style>
    </div>
  );
};

export default PriceUpdater; 