import axios from 'axios';

const getBaseURL = async () => {
  // Try ports from 3001 to 3010
  for (let port = 3001; port <= 3010; port++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) {
        return `http://localhost:${port}/api`;
      }
    } catch (error) {
      continue;
    }
  }
  return 'http://localhost:3001/api'; // Default fallback
};

let api = null;

const initializeAPI = async () => {
  const baseURL = await getBaseURL();
  api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return api;
};

export const searchPhones = async (searchParams) => {
  if (!api) {
    await initializeAPI();
  }
  try {
    const response = await api.post('/search', searchParams);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to search phones');
  }
};

export const fetchBrands = async () => {
  if (!api) {
    await initializeAPI();
  }
  try {
    const response = await api.get('/brands');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch brands');
  }
};

// Initialize API when the file is imported
initializeAPI();

export default api; 