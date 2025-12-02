# Smart Neighborhood Energy Flexibility Demo

A virtual smart neighborhood dashboard demonstrating energy optimization for batteries, heat pumps, solar PV, and EVs. 


## Features

- 🏠 **Neighborhood Overview** - Real-time KPIs for connected homes
- 🔋 **Battery Optimization** - SoC tracking, charge/discharge visualization
- ☀️ **Solar PV** - Generation monitoring, self-consumption tracking
- 🚗 **EV Smart Charging** - Departure constraints, charging status
- 🌡️ **Heat Pump** - Temperature monitoring, comfort optimization
- 💰 **Day-Ahead Prices** - Price-aware scheduling visualization
- 📊 **Interactive Charts** - Recharts-powered visualizations

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
npm run build
```

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 2: GitHub Integration

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite settings
6. Click "Deploy"

### Option 3: Manual Deploy

1. Run `npm run build`
2. Upload the `dist` folder to Vercel

## Project Structure

```
smart-neighborhood-demo/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Main dashboard component
│   ├── App.css          # Styles
│   └── main.jsx         # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md
```

## Connecting to FlexMeasures

The dashboard currently uses mock data. To connect to a real FlexMeasures instance:

1. Replace `MOCK_HOMES` with API calls to `/api/v3_0/assets`
2. Replace `generateTimeSeriesData()` with sensor data from `/api/v3_0/sensors/<id>/data`
3. Add authentication using FlexMeasures API tokens

Example API integration:

```javascript
// Fetch homes from FlexMeasures
const fetchHomes = async () => {
  const response = await fetch('https://your-fm-server/api/v3_0/assets', {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons
- **CSS** - Custom styling (no Tailwind)

## Target Markets

- 🇳🇱 Netherlands (ENTSO-E NL, GOPACS)
- 🇩🇪 Germany (ENTSO-E DE-LU, Redispatch 2.0)
- 🇧🇪 Belgium (ENTSO-E BE, Elia markets)

## License

MIT
