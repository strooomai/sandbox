import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';
import { Battery, Sun, Car, Thermometer, Home, Zap, TrendingDown, TrendingUp, Leaf, Euro, Activity } from 'lucide-react';
import './App.css';

// ============ MOCK DATA (Replace with FlexMeasures API calls) ============

const generateTimeSeriesData = () => {
  const data = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now);
    hour.setHours(i, 0, 0, 0);
    
    const baseLoad = 1.5 + Math.sin(i / 24 * Math.PI * 2) * 0.8;
    const solarGen = i >= 6 && i <= 20 ? Math.sin((i - 6) / 14 * Math.PI) * 4.5 : 0;
    const evCharging = i >= 22 || i <= 6 ? 3.5 + Math.random() * 1.5 : 0;
    const heatPump = i >= 5 && i <= 8 || i >= 17 && i <= 22 ? 2 + Math.random() * 1 : 0.5;
    
    const priceBase = 0.15 + Math.sin((i - 3) / 24 * Math.PI * 2) * 0.12;
    const price = Math.max(0.05, priceBase + (Math.random() - 0.5) * 0.04);
    
    data.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      hour: i,
      consumption: +(baseLoad + evCharging + heatPump).toFixed(2),
      solar: +solarGen.toFixed(2),
      grid: +(baseLoad + evCharging + heatPump - solarGen).toFixed(2),
      price: +price.toFixed(3),
      optimized: +(baseLoad + (i >= 1 && i <= 5 ? evCharging : 0) + (i >= 2 && i <= 6 ? heatPump * 1.5 : heatPump * 0.3)).toFixed(2),
    });
  }
  return data;
};

const MOCK_HOMES = [
  { id: 1, name: 'Villa Noord', battery: { soc: 78, capacity: 13.5, power: -2.1 }, solar: { power: 3.8, capacity: 8 }, ev: { soc: 45, departure: '07:30', power: 7.4 }, heatPump: { power: 1.2, temp: 21.5, target: 21 }, status: 'optimizing' },
  { id: 2, name: 'Huis Zuid', battery: { soc: 34, capacity: 10, power: 3.2 }, solar: { power: 2.1, capacity: 6 }, ev: null, heatPump: { power: 2.8, temp: 19.8, target: 20 }, status: 'charging' },
  { id: 3, name: 'Woning Oost', battery: { soc: 92, capacity: 13.5, power: 0 }, solar: { power: 4.2, capacity: 10 }, ev: { soc: 88, departure: '08:00', power: 0 }, heatPump: { power: 0.5, temp: 21.2, target: 21 }, status: 'idle' },
  { id: 4, name: 'Appartement West', battery: { soc: 56, capacity: 7, power: -1.5 }, solar: { power: 1.8, capacity: 4 }, ev: { soc: 23, departure: '06:30', power: 11 }, heatPump: null, status: 'optimizing' },
  { id: 5, name: 'Rijwoning Centrum', battery: null, solar: { power: 2.9, capacity: 5 }, ev: { soc: 67, departure: '09:00', power: 0 }, heatPump: { power: 1.8, temp: 20.5, target: 21 }, status: 'heating' },
  { id: 6, name: 'Villa Park', battery: { soc: 100, capacity: 20, power: -4.5 }, solar: { power: 6.2, capacity: 12 }, ev: { soc: 95, departure: '10:00', power: 0 }, heatPump: { power: 0.3, temp: 22.1, target: 22 }, status: 'exporting' },
];

const MOCK_STATS = {
  totalHomes: 12,
  totalSavings: 1247.50,
  co2Saved: 2.4,
  selfConsumption: 76,
  currentGridPower: -8.4,
  totalSolarPower: 28.6,
  totalBatteryPower: -12.3,
};

// ============ COMPONENTS ============

const StatCard = ({ icon: Icon, label, value, unit, trend, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)`, color }}>
      <Icon size={22} />
    </div>
    <div className="stat-content">
      <span className="stat-label">{label}</span>
      <div className="stat-value-row">
        <span className="stat-value">{value}</span>
        <span className="stat-unit">{unit}</span>
        {trend && (
          <span className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  </div>
);

const AssetBadge = ({ icon: Icon, value, unit, status, color }) => (
  <div className="asset-badge" style={{ '--accent': color }}>
    <Icon size={16} />
    <span className="asset-value">{value}</span>
    <span className="asset-unit">{unit}</span>
    {status && <span className={`asset-status ${status}`} />}
  </div>
);

const HomeCard = ({ home, isSelected, onClick }) => {
  const statusColors = {
    optimizing: '#10b981',
    charging: '#3b82f6',
    idle: '#6b7280',
    heating: '#f59e0b',
    exporting: '#8b5cf6',
  };

  return (
    <div 
      className={`home-card ${isSelected ? 'selected' : ''}`} 
      onClick={onClick}
      style={{ '--status-color': statusColors[home.status] }}
    >
      <div className="home-header">
        <div className="home-icon">
          <Home size={18} />
        </div>
        <div className="home-info">
          <span className="home-name">{home.name}</span>
          <span className="home-status">{home.status}</span>
        </div>
        <div className="home-power">
          <Zap size={14} />
          <span>{(home.solar?.power || 0) - (home.battery?.power || 0) > 0 ? '+' : ''}
            {((home.solar?.power || 0) - (home.heatPump?.power || 0) - (home.ev?.power || 0) / 3).toFixed(1)} kW
          </span>
        </div>
      </div>
      <div className="home-assets">
        {home.battery && (
          <AssetBadge 
            icon={Battery} 
            value={home.battery.soc} 
            unit="%" 
            color="#10b981"
            status={home.battery.power > 0 ? 'charging' : home.battery.power < 0 ? 'discharging' : null}
          />
        )}
        {home.solar && (
          <AssetBadge icon={Sun} value={home.solar.power} unit="kW" color="#f59e0b" />
        )}
        {home.ev && (
          <AssetBadge 
            icon={Car} 
            value={home.ev.soc} 
            unit="%" 
            color="#3b82f6"
            status={home.ev.power > 0 ? 'charging' : null}
          />
        )}
        {home.heatPump && (
          <AssetBadge icon={Thermometer} value={home.heatPump.temp} unit="°C" color="#ef4444" />
        )}
      </div>
    </div>
  );
};

const DetailPanel = ({ home }) => {
  if (!home) return (
    <div className="detail-panel empty">
      <Home size={48} strokeWidth={1} />
      <p>Select a home to view details</p>
    </div>
  );

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>{home.name}</h3>
        <span className="detail-status" style={{ 
          background: home.status === 'exporting' ? '#8b5cf622' : 
                      home.status === 'optimizing' ? '#10b98122' : '#3b82f622',
          color: home.status === 'exporting' ? '#8b5cf6' : 
                 home.status === 'optimizing' ? '#10b981' : '#3b82f6'
        }}>
          {home.status}
        </span>
      </div>

      <div className="detail-grid">
        {home.battery && (
          <div className="detail-card battery">
            <div className="detail-card-header">
              <Battery size={20} />
              <span>Battery</span>
              <span className="detail-card-capacity">{home.battery.capacity} kWh</span>
            </div>
            <div className="detail-card-body">
              <div className="soc-bar">
                <div className="soc-fill" style={{ width: `${home.battery.soc}%` }} />
                <span className="soc-label">{home.battery.soc}%</span>
              </div>
              <div className="detail-stat">
                <span>Power</span>
                <span className={home.battery.power > 0 ? 'charging' : 'discharging'}>
                  {home.battery.power > 0 ? '+' : ''}{home.battery.power} kW
                </span>
              </div>
            </div>
          </div>
        )}

        {home.solar && (
          <div className="detail-card solar">
            <div className="detail-card-header">
              <Sun size={20} />
              <span>Solar PV</span>
              <span className="detail-card-capacity">{home.solar.capacity} kWp</span>
            </div>
            <div className="detail-card-body">
              <div className="solar-output">
                <span className="solar-power">{home.solar.power}</span>
                <span className="solar-unit">kW</span>
              </div>
              <div className="detail-stat">
                <span>Efficiency</span>
                <span>{((home.solar.power / home.solar.capacity) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {home.ev && (
          <div className="detail-card ev">
            <div className="detail-card-header">
              <Car size={20} />
              <span>EV</span>
              <span className="detail-card-capacity">Dep: {home.ev.departure}</span>
            </div>
            <div className="detail-card-body">
              <div className="soc-bar ev">
                <div className="soc-fill" style={{ width: `${home.ev.soc}%` }} />
                <span className="soc-label">{home.ev.soc}%</span>
              </div>
              <div className="detail-stat">
                <span>Charging</span>
                <span className={home.ev.power > 0 ? 'charging' : ''}>
                  {home.ev.power > 0 ? `${home.ev.power} kW` : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        )}

        {home.heatPump && (
          <div className="detail-card heatpump">
            <div className="detail-card-header">
              <Thermometer size={20} />
              <span>Heat Pump</span>
              <span className="detail-card-capacity">Target: {home.heatPump.target}°C</span>
            </div>
            <div className="detail-card-body">
              <div className="temp-display">
                <span className="temp-value">{home.heatPump.temp}</span>
                <span className="temp-unit">°C</span>
              </div>
              <div className="detail-stat">
                <span>Power</span>
                <span>{home.heatPump.power} kW</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PriceScheduleChart = ({ data }) => {
  const currentHour = new Date().getHours();
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Day-Ahead Prices & Optimized Schedule</h3>
        <div className="chart-legend">
          <span><i style={{ background: '#10b981' }} /> Optimized Load</span>
          <span><i style={{ background: '#3b82f6' }} /> Original Load</span>
          <span><i style={{ background: '#f59e0b' }} /> Price</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="optimizedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            interval={2}
          />
          <YAxis 
            yAxisId="power"
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            domain={[0, 'auto']}
            label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis 
            yAxisId="price"
            orientation="right"
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            domain={[0, 0.35]}
            label={{ value: '€/kWh', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip 
            contentStyle={{ 
              background: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
            labelStyle={{ color: '#f1f5f9' }}
            itemStyle={{ color: '#94a3b8' }}
          />
          <ReferenceLine x={`${currentHour.toString().padStart(2, '0')}:00`} yAxisId="power" stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Now', fill: '#ef4444', fontSize: 10 }} />
          <Area 
            yAxisId="power"
            type="monotone" 
            dataKey="optimized" 
            stroke="#10b981" 
            strokeWidth={2}
            fill="url(#optimizedGradient)" 
            name="Optimized"
          />
          <Line 
            yAxisId="power"
            type="monotone" 
            dataKey="consumption" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Original"
          />
          <Line 
            yAxisId="price"
            type="stepAfter" 
            dataKey="price" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            name="Price"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const PowerFlowChart = ({ data }) => (
  <div className="chart-container power-flow">
    <div className="chart-header">
      <h3>Neighborhood Power Flow</h3>
      <div className="chart-legend">
        <span><i style={{ background: '#f59e0b' }} /> Solar</span>
        <span><i style={{ background: '#10b981' }} /> To Grid</span>
        <span><i style={{ background: '#ef4444' }} /> From Grid</span>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="time" 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          interval={3}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
        />
        <Tooltip 
          contentStyle={{ 
            background: '#1e293b', 
            border: '1px solid #334155',
            borderRadius: '8px'
          }}
        />
        <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="url(#solarGradient)" strokeWidth={2} />
        <Area type="monotone" dataKey="grid" stroke="#10b981" fill="url(#gridGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// ============ MAIN DASHBOARD ============

export default function App() {
  const [selectedHome, setSelectedHome] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setTimeSeriesData(generateTimeSeriesData());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <div className="logo">
            <Zap size={28} color="white" />
          </div>
          <div>
            <h1>Smart Neighborhood</h1>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Powered by DNET Labs & Co</span>
          </div>
        </div>
        <div className="live-indicator">
          <div className="live-dot" />
          <span>LIVE</span>
          <span style={{ color: '#f1f5f9' }}>
            {currentTime.toLocaleTimeString('en-GB')}
          </span>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard 
          icon={Home} 
          label="Connected Homes" 
          value={MOCK_STATS.totalHomes} 
          unit="homes"
          color="#3b82f6"
        />
        <StatCard 
          icon={Euro} 
          label="Monthly Savings" 
          value={MOCK_STATS.totalSavings.toFixed(0)} 
          unit="€"
          trend={12}
          color="#10b981"
        />
        <StatCard 
          icon={Leaf} 
          label="CO₂ Saved" 
          value={MOCK_STATS.co2Saved} 
          unit="tons"
          trend={8}
          color="#22c55e"
        />
        <StatCard 
          icon={Sun} 
          label="Solar Generation" 
          value={MOCK_STATS.totalSolarPower} 
          unit="kW"
          color="#f59e0b"
        />
        <StatCard 
          icon={Activity} 
          label="Self Consumption" 
          value={MOCK_STATS.selfConsumption} 
          unit="%"
          trend={5}
          color="#8b5cf6"
        />
        <StatCard 
          icon={Zap} 
          label="Grid Export" 
          value={Math.abs(MOCK_STATS.currentGridPower)} 
          unit="kW"
          color="#06b6d4"
        />
      </div>

      <div className="main-grid">
        <div className="left-column">
          <PriceScheduleChart data={timeSeriesData} />
          <PowerFlowChart data={timeSeriesData} />
        </div>

        <div className="right-column">
          <div className="homes-section">
            <h3><Home size={18} /> Homes</h3>
            <div className="homes-grid">
              {MOCK_HOMES.map(home => (
                <HomeCard 
                  key={home.id}
                  home={home}
                  isSelected={selectedHome?.id === home.id}
                  onClick={() => setSelectedHome(home)}
                />
              ))}
            </div>
          </div>

          <DetailPanel home={selectedHome} />
        </div>
      </div>
    </div>
  );
}
