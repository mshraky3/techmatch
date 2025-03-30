import React from 'react';
import './SearchResults.css';

const SearchResults = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div className="search-results empty">
        <h3>No matches found</h3>
        <p>Try adjusting your search criteria to get better results.</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <h3>Best Matches</h3>
      <div className="results-grid">
        {results.map((result, index) => (
          <div key={index} className="result-card">
            <div className="result-header">
              <span className="seller-name">{result.seller}</span>
              <span className="match-score">Match: {result.matchScore}%</span>
            </div>
            
            <div className="result-body">
              {result.image && (
                <div className="result-image">
                  <img src={result.image} alt={result.title} />
                </div>
              )}
              
              <div className="result-details">
                <h4 className="result-title">{result.title}</h4>
                
                <div className="result-price">
                  {result.price ? (
                    <span>{Number(result.price).toLocaleString()} SAR</span>
                  ) : (
                    <span>Price not available</span>
                  )}
                </div>
                
                {result.rating > 0 && (
                  <div className="result-rating">
                    <div className="stars" style={{ '--rating': result.rating }}>
                      <span>★★★★★</span>
                    </div>
                    <span>({result.reviews || 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="result-footer">
              <a 
                href={result.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-button"
              >
                View on {result.seller}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults; 