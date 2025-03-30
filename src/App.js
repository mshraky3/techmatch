import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import './App.css';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (results) => {
    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TechMatch</h1>
        <p className="subtitle">Find your perfect phone at the best price</p>
      </header>
      <main className="App-main">
        <SearchForm onSearch={handleSearch} />
        {hasSearched && <SearchResults results={searchResults} />}
      </main>
      <footer className="App-footer">
        <p>&copy; {new Date().getFullYear()} TechMatch - Comparing phones across major Saudi retailers</p>
      </footer>
    </div>
  );
}

export default App; 