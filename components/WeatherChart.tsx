
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
} from 'recharts';
import { WeatherDataPoint } from '../types';

interface Props {
  data: WeatherDataPoint[];
}

const WeatherChart: React.FC<Props> = ({ data }) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    temp: true,
    apparent: true,
    precip: true,
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
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Weather Composite Timeline</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">気温と降水量の相関推移</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle metric="temp" label="気温" color="#ef4444" />
          <Toggle metric="apparent" label="体感温度" color="#f97316" />
          <Toggle metric="precip" label="降水量" color="#0ea5e9" />
        </div>
      </div>

      {/* Mobile Scroll Wrapper */}
      <div className="overflow-x-auto pb-4 scrollbar-hide sm:scrollbar-default">
        <div className="h-[450px] min-w-[750px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                interval={1} 
                fontSize={11} 
                tick={{ fill: '#64748b', fontWeight: 'bold' }} 
                axisLine={{ stroke: '#e2e8f0' }}
              />
              
              {/* Left Axis: Temperatures (Red/Orange) */}
              <YAxis 
                yAxisId="temp"
                fontSize={10} 
                tick={{ fill: '#ef4444', fontWeight: 'bold' }} 
                axisLine={{ stroke: '#fecaca' }}
                domain={['auto', 'auto']}
                label={{ 
                  value: '温度 (°C)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: -5,
                  style: { textAnchor: 'middle', fill: '#ef4444', fontSize: 10, fontWeight: 'black' } 
                }}
                hide={!visibleMetrics.temp && !visibleMetrics.apparent}
              />
              
              {/* Right Axis: Precipitation (Blue) */}
              <YAxis 
                yAxisId="precip"
                orientation="right"
                fontSize={10} 
                tick={{ fill: '#0ea5e9', fontWeight: 'bold' }} 
                axisLine={{ stroke: '#bae6fd' }}
                label={{ 
                  value: '降水量 (mm)', 
                  angle: 90, 
                  position: 'insideRight', 
                  offset: -5,
                  style: { textAnchor: 'middle', fill: '#0ea5e9', fontSize: 10, fontWeight: 'black' } 
                }}
                hide={!visibleMetrics.precip}
              />
              
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ marginBottom: '8px', color: '#64748b', fontWeight: 'black' }}
              />
              
              <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              
              {visibleMetrics.precip && (
                <Bar
                  yAxisId="precip"
                  name="降水量"
                  dataKey="precipitation"
                  fill="#0ea5e9"
                  fillOpacity={0.6}
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              )}

              {visibleMetrics.temp && (
                <Line
                  yAxisId="temp"
                  name="気温"
                  type="monotone"
                  dataKey="temperature_2m"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                  animationDuration={1500}
                />
              )}

              {visibleMetrics.apparent && (
                <Line
                  yAxisId="temp"
                  name="体感温度"
                  type="monotone"
                  dataKey="apparent_temperature"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  animationDuration={2000}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex items-center gap-2 justify-center sm:hidden">
        <div className="w-8 h-1 bg-slate-200 rounded-full">
          <div className="w-1/3 h-full bg-slate-400 rounded-full animate-pulse"></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Swipe to scroll chart</span>
      </div>
    </div>
  );
};

export default WeatherChart;
