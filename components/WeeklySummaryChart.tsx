
import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getDayLabel } from '../utils/dateUtils';

interface DailyData {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
}

interface Props {
  data: DailyData[];
}

const WeeklySummaryChart: React.FC<Props> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    label: getDayLabel(d.date),
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        週間の推移 (気温: 棒 / 降水: 線)
      </h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              fontSize={12} 
              tick={{ fill: '#64748b', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              yAxisId="left"
              fontSize={11} 
              tick={{ fill: '#64748b' }} 
              label={{ value: '気温 (°C)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 10 } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              fontSize={11} 
              tick={{ fill: '#64748b' }} 
              label={{ value: '降水量 (mm)', angle: 90, position: 'insideRight', offset: 0, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 10 } }}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" align="right" height={40}/>
            <Bar yAxisId="left" name="最高気温" dataKey="maxTemp" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={25} />
            <Bar yAxisId="left" name="最低気温" dataKey="minTemp" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={25} />
            <Line 
              yAxisId="right" 
              name="降水量" 
              type="monotone" 
              dataKey="precipitation" 
              stroke="#0ea5e9" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#0ea5e9' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklySummaryChart;
