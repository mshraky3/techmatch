const { updateAllPrices } = require('./priceUpdater');
const fs = require('fs');
const path = require('path');

// Default schedule: Run price updates once a day
const DEFAULT_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Flag to track if updates are currently running
let isUpdating = false;

// Track when the last update occurred
let lastUpdateTime = null;

// Initialize scheduler state from file if it exists
function initializeScheduler() {
  try {
    if (fs.existsSync(path.join(__dirname, 'scheduler-state.json'))) {
      const schedulerState = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'scheduler-state.json'), 'utf8')
      );
      
      if (schedulerState.lastUpdateTime) {
        lastUpdateTime = new Date(schedulerState.lastUpdateTime);
        console.log(`Last price update was on: ${lastUpdateTime.toLocaleString()}`);
      }
      
      return schedulerState.updateInterval || DEFAULT_UPDATE_INTERVAL;
    }
  } catch (error) {
    console.error(`Error initializing scheduler: ${error.message}`);
  }
  
  return DEFAULT_UPDATE_INTERVAL;
}

// Save scheduler state to file
function saveSchedulerState(updateInterval) {
  try {
    fs.writeFileSync(
      path.join(__dirname, 'scheduler-state.json'),
      JSON.stringify({
        lastUpdateTime: lastUpdateTime ? lastUpdateTime.toISOString() : null,
        updateInterval: updateInterval
      }, null, 2)
    );
  } catch (error) {
    console.error(`Error saving scheduler state: ${error.message}`);
  }
}

// Function to start the scheduled updates
function startScheduledUpdates(interval = null) {
  // Use provided interval or get from saved state
  const updateInterval = interval || initializeScheduler();
  
  console.log(`Price updates scheduled to run every ${updateInterval / (60 * 60 * 1000)} hours`);
  
  // Run an initial update if never run before or last run was more than the interval ago
  if (!lastUpdateTime || (new Date() - lastUpdateTime > updateInterval)) {
    console.log('Scheduling initial price update...');
    setTimeout(runScheduledUpdate, 5000); // Run first update after 5 seconds
  } else {
    // Calculate time until next update
    const timeUntilNextUpdate = updateInterval - (new Date() - lastUpdateTime);
    console.log(`Next price update in ${Math.round(timeUntilNextUpdate / (60 * 1000))} minutes`);
    
    // Schedule next update
    setTimeout(runScheduledUpdate, timeUntilNextUpdate);
  }
  
  // Save the scheduler state
  saveSchedulerState(updateInterval);
  
  return {
    updateInterval,
    lastUpdateTime,
    changeInterval: (newInterval) => {
      startScheduledUpdates(newInterval);
    }
  };
}

// Function to run the scheduled update
async function runScheduledUpdate() {
  if (isUpdating) {
    console.log('Price update already in progress, skipping scheduled run');
    return;
  }
  
  try {
    isUpdating = true;
    console.log('Starting scheduled price update...');
    
    await updateAllPrices();
    
    // Update the last update time
    lastUpdateTime = new Date();
    saveSchedulerState();
    
    console.log(`Scheduled price update completed at ${lastUpdateTime.toLocaleString()}`);
  } catch (error) {
    console.error(`Error in scheduled price update: ${error.message}`);
  } finally {
    isUpdating = false;
    
    // Get the update interval from the saved state
    const updateInterval = initializeScheduler();
    
    // Schedule the next update
    setTimeout(runScheduledUpdate, updateInterval);
  }
}

// Function to check if an update is currently running
function isUpdateRunning() {
  return isUpdating;
}

// Function to get the last update time
function getLastUpdateTime() {
  return lastUpdateTime;
}

// Function to manually trigger an immediate update
async function triggerImmediateUpdate() {
  if (isUpdating) {
    return {
      success: false,
      message: 'Price update already in progress'
    };
  }
  
  try {
    isUpdating = true;
    await updateAllPrices();
    
    // Update the last update time
    lastUpdateTime = new Date();
    saveSchedulerState();
    
    return {
      success: true,
      message: `Price update completed at ${lastUpdateTime.toLocaleString()}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error in price update: ${error.message}`
    };
  } finally {
    isUpdating = false;
  }
}

// Add this function to the Express app endpoints
function addSchedulerEndpoints(app) {
  // Endpoint to get scheduler status
  app.get('/api/price-scheduler/status', (req, res) => {
    const updateInterval = initializeScheduler();
    
    res.json({
      isRunning: isUpdateRunning(),
      lastUpdateTime: lastUpdateTime ? lastUpdateTime.toISOString() : null,
      updateInterval: updateInterval,
      nextUpdateTime: lastUpdateTime ? 
        new Date(lastUpdateTime.getTime() + updateInterval).toISOString() : 
        null
    });
  });
  
  // Endpoint to change the update interval
  app.post('/api/price-scheduler/interval', (req, res) => {
    const { hours } = req.body;
    
    if (!hours || isNaN(hours) || hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interval. Please provide a value between 1 and 168 hours.'
      });
    }
    
    const newInterval = hours * 60 * 60 * 1000;
    startScheduledUpdates(newInterval);
    
    res.json({
      success: true,
      message: `Update interval changed to ${hours} hours`
    });
  });
  
  // Endpoint to trigger an immediate update
  app.post('/api/price-scheduler/trigger', async (req, res) => {
    res.json({
      message: 'Price update triggered. This process may take several minutes.'
    });
    
    const result = await triggerImmediateUpdate();
    console.log(result.message);
  });
}

module.exports = {
  startScheduledUpdates,
  isUpdateRunning,
  getLastUpdateTime,
  triggerImmediateUpdate,
  addSchedulerEndpoints
}; 