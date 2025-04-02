// ----- Data Generation Script (generate-data.js) -----
// This script runs in GitHub Actions to generate static JSON files

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Set up Google credentials from environment variable
const credentials = JSON.parse(
  process.env.GOOGLE_CREDENTIALS || fs.readFileSync('credentials.json', 'utf8')
);

async function getGoogleSheetsClient() {
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function getRaceData() {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Races!A2:Z',
  });
  
  const rows = response.data.values || [];
  return rows.map(row => ({
    name: row[0],
    location: row[1],
    distance: row[2],
    elevation: row[3],
    description: row[4],
    keyFeatures: row[5]?.split(',').map(f => f.trim()) || [],
    terrain: row[6],
    weatherExposure: row[7],
    technicalDifficulty: row[8],
    baseScore: parseInt(row[9]) || 0,
    historicalScore: parseInt(row[10]) || 0,
    terrainScore: parseInt(row[11]) || 0,
    environmentalScore: parseInt(row[12]) || 0
  }));
}

async function generateInsights(raceData) {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Generate insights for an ultra running race with these details:
            Name: ${raceData.name}
            Location: ${raceData.location}
            Distance: ${raceData.distance}
            Elevation: ${raceData.elevation}
            Key Features: ${raceData.keyFeatures.join(', ')}
            Terrain: ${raceData.terrain}
            Weather Exposure: ${raceData.weatherExposure}
            Technical Difficulty: ${raceData.technicalDifficulty}
            
            Provide a concise analysis of what makes this race challenging, 
            preparation tips, notable sections, and what type of runner 
            would excel at this course. Limit to 3-4 paragraphs.`
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate insights at this time.';
  }
}

function calculateRating(raceData) {
  const totalScore = raceData.baseScore + raceData.historicalScore + 
                    raceData.terrainScore + raceData.environmentalScore;
  
  let rating;
  if (totalScore >= 90) rating = 'Elite';
  else if (totalScore >= 80) rating = 'Advanced';
  else if (totalScore >= 70) rating = 'Intermediate';
  else rating = 'Beginner';
  
  return {
    totalScore,
    rating,
    componentScores: {
      baseMetrics: `${raceData.baseScore}/30`,
      historicalData: `${raceData.historicalScore}/30`,
      terrainAnalysis: `${raceData.terrainScore}/25`,
      environmentalFactors: `${raceData.environmentalScore}/15`
    }
  };
}

async function generateAllData() {
  try {
    const races = await getRaceData();
    
    // Generate races.json with summary data
    const racesList = races.map((race, index) => {
      const rating = calculateRating(race);
      return {
        id: index,
        name: race.name,
        location: race.location,
        distance: race.distance,
        elevation: race.elevation,
        rating: rating.rating,
        totalScore: rating.totalScore
      };
    });
    
    fs.writeFileSync(
      path.join(dataDir, 'races.json'),
      JSON.stringify(racesList, null, 2)
    );
    
    // Generate individual race files with AI insights
    for (let i = 0; i < races.length; i++) {
      const race = races[i];
      const insights = await generateInsights(race);
      const rating = calculateRating(race);
      
      const raceData = {
        ...race,
        insights,
        rating: rating.rating,
        totalScore: rating.totalScore,
        componentScores: rating.componentScores
      };
      
      fs.writeFileSync(
        path.join(dataDir, `race-${i}.json`),
        JSON.stringify(raceData, null, 2)
      );
      
      console.log(`Generated data for race: ${race.name}`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('All race data generated successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
    process.exit(1);
  }
}

generateAllData();