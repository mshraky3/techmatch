import React, { useState } from 'react';
import Form from './components/Form';
import PhoneList from './components/PhoneList';
import './App.css';

function App() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (searchParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      const data = await response.json();
      setPhones(data);
    } catch (error) {
      setError('Failed to fetch phone data. Please try again later.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TechMatch</h1>
        <p>Find your perfect phone match</p>
      </header>

      <main className="app-main">
        <Form onSearch={handleSearch} />
        
        {loading && (
          <div className="loading">
            <p>Searching for phones...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && <PhoneList phones={phones} />}
      </main>

      <footer className="app-footer">
        <p>© 2024 TechMatch. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
