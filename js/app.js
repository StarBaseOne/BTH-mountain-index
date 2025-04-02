// ----- Client-side JavaScript (app.js) -----
// This runs in the browser on GitHub Pages

document.addEventListener('DOMContentLoaded', () => {
    // Load the list of races
    fetch('./data/races.json')
      .then(response => response.json())
      .then(races => {
        const raceList = document.getElementById('race-list');
        
        races.forEach(race => {
          const raceItem = document.createElement('div');
          raceItem.className = 'race-item';
          raceItem.innerHTML = `
            <div class="race-summary">
              <h3>${race.name}</h3>
              <p>${race.location} | ${race.distance} | ${race.elevation}</p>
              <span class="rating ${race.rating.toLowerCase()}">${race.rating} (${race.totalScore})</span>
            </div>
            <button class="view-button" data-id="${race.id}">View Details</button>
          `;
          
          raceList.appendChild(raceItem);
        });
        
        // Add click handlers to view buttons
        document.querySelectorAll('.view-button').forEach(button => {
          button.addEventListener('click', () => {
            const raceId = button.getAttribute('data-id');
            loadRaceDetails(raceId);
          });
        });
      })
      .catch(error => {
        console.error('Error loading race list:', error);
        document.getElementById('race-list').innerHTML = 
          '<p class="error">Failed to load race data. Please try again later.</p>';
      });
  });
  
  function loadRaceDetails(raceId) {
    fetch(`./data/race-${raceId}.json`)
      .then(response => response.json())
      .then(race => {
        // Show the race details section
        const detailsSection = document.getElementById('race-details');
        detailsSection.style.display = 'block';
        
        // Scroll to it
        detailsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Render the race card
        renderRaceCard(race, detailsSection);
      })
      .catch(error => {
        console.error('Error loading race details:', error);
        document.getElementById('race-details').innerHTML = 
          '<p class="error">Failed to load race details. Please try again later.</p>';
      });
  }
  
  function renderRaceCard(race, container) {
    // Calculate component score percentages
    const baseScorePercent = (parseInt(race.baseScore) / 30) * 100;
    const historicalScorePercent = (parseInt(race.historicalScore) / 30) * 100;
    const terrainScorePercent = (parseInt(race.terrainScore) / 25) * 100;
    const environmentalScorePercent = (parseInt(race.environmentalScore) / 15) * 100;
    
    // Create the race card HTML
    container.innerHTML = `
      <div class="race-card">
        <div class="card-header" style="background-color: ${getRatingColor(race.rating)}">
          <h2>${race.name}</h2>
          <div class="rating-badge">${race.totalScore}</div>
          <p>${race.location} | ${race.distance} | ${race.elevation}</p>
        </div>
        
        <div class="card-content">
          <p class="description">${race.description}</p>
          
          <h3>Key Features</h3>
          <ul class="features-list">
            ${race.keyFeatures.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
          
          <h3>Component Scores</h3>
          <div class="score-container">
            <div class="score-row">
              <span class="score-label">Base Metrics</span>
              <div class="score-bar">
                <div class="score-fill blue" style="width: ${baseScorePercent}%"></div>
              </div>
              <span class="score-value">${race.componentScores.baseMetrics}</span>
            </div>
            
            <div class="score-row">
              <span class="score-label">Historical Data</span>
              <div class="score-bar">
                <div class="score-fill purple" style="width: ${historicalScorePercent}%"></div>
              </div>
              <span class="score-value">${race.componentScores.historicalData}</span>
            </div>
            
            <div class="score-row">
              <span class="score-label">Terrain Analysis</span>
              <div class="score-bar">
                <div class="score-fill green" style="width: ${terrainScorePercent}%"></div>
              </div>
              <span class="score-value">${race.componentScores.terrainAnalysis}</span>
            </div>
            
            <div class="score-row">
              <span class="score-label">Environmental Factors</span>
              <div class="score-bar">
                <div class="score-fill orange" style="width: ${environmentalScorePercent}%"></div>
              </div>
              <span class="score-value">${race.componentScores.environmentalFactors}</span>
            </div>
            
            <div class="score-row total">
              <span class="score-label">TOTAL SCORE</span>
              <div class="score-bar">
                <div class="score-fill brown" style="width: ${race.totalScore}%"></div>
              </div>
              <span class="score-value">${race.totalScore}/100</span>
            </div>
          </div>
          
          <div class="insights-section">
            <h3>AI-Generated Insights</h3>
            ${race.insights.split('\n').map(para => `<p>${para}</p>`).join('')}
          </div>
          
          <button id="back-button" class="back-button">Back to List</button>
        </div>
      </div>
    `;
    
    // Add event listener to back button
    document.getElementById('back-button').addEventListener('click', () => {
      container.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  function getRatingColor(rating) {
    switch(rating) {
      case 'Elite': return '#8B2323';
      case 'Advanced': return '#A52A2A';
      case 'Intermediate': return '#CD5C5C';
      default: return '#E9967A';
    }
  }