
import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { WeatherDataPoint } from '../types';

interface Props {
  data: WeatherDataPoint[];
}

const WeatherChart: React.FC<Props> = ({ data }) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    temp: true,
    precip: true,
    humidity: true,
    wind: false,
  });

  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
  }));

  const Toggle = ({ metric, label, color }: { metric: keyof typeof visibleMetrics, label: string, color: string }) => (
    <button
      onClick={() => setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }))}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
        visibleMetrics[metric] 
          ? `bg-white text-slate-700 shadow-sm border-slate-200` 
          : `bg-slate-100 text-slate-400 border-transparent opacity-60`
      }`}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visibleMetrics[metric] ? color : '#cbd5e1' }}></span>
      {label}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">詳細コンポジットチャート</h3>
        <div className="flex flex-wrap gap-2">
          <Toggle metric="temp" label="気温" color="#ef4444" />
          <Toggle metric="precip" label="降水" color="#0ea5e9" />
          <Toggle metric="humidity" label="湿度" color="#3b82f6" />
          <Toggle metric="wind" label="風速" color="#10b981" />
        </div>
      </div>

      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              interval={2} 
              fontSize={11} 
              tick={{ fill: '#64748b' }} 
            />
            <YAxis 
              yAxisId="temp"
              fontSize={10} 
              tick={{ fill: '#64748b' }} 
              domain={['auto', 'auto']}
              hide={!visibleMetrics.temp}
            />
            <YAxis 
              yAxisId="percent"
              orientation="right"
              fontSize={10} 
              tick={{ fill: '#64748b' }} 
              hide={!visibleMetrics.humidity}
            />
            <YAxis 
              yAxisId="precip"
              orientation="right"
              fontSize={10} 
              tick={{ fill: '#64748b' }} 
              hide={!visibleMetrics.precip && !visibleMetrics.wind}
            />
            
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={30}/>

            {visibleMetrics.humidity && (
              <Area
                yAxisId="percent"
                name="湿度 (%)"
                type="monotone"
                dataKey="relative_humidity_2m"
                fill="#dbeafe"
                stroke="#3b82f6"
                strokeWidth={1}
                fillOpacity={0.3}
              />
            )}
            
            {visibleMetrics.precip && (
              <Bar
                yAxisId="precip"
                name="降水量 (mm)"
                dataKey="precipitation"
                fill="#0ea5e9"
                radius={[2, 2, 0, 0]}
                barSize={10}
              />
            )}

            {visibleMetrics.temp && (
              <Line
                yAxisId="temp"
                name="気温 (°C)"
                type="monotone"
                dataKey="temperature_2m"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
              />
            )}

            {visibleMetrics.wind && (
              <Line
                yAxisId="precip"
                name="風速 (m/s)"
                type="monotone"
                dataKey="wind_speed_10m"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeatherChart;
