
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { JAPANESE_CITIES } from './constants';
import { City, WeatherDataPoint } from './types';
import { fetchHistoricalWeather } from './services/weatherService';
import { analyzeWeatherWithAI } from './services/geminiService';
import WeatherChart from './components/WeatherChart';
import WeeklySummaryChart from './components/WeeklySummaryChart';
import WeatherIcon from './components/WeatherIcon';
import { getWeekRange } from './utils/dateUtils';

const App: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<City>(JAPANESE_CITIES[12]); // Default to Tokyo
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [weeklyData, setWeeklyData] = useState<WeatherDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAiAnalysis(null);
    try {
      const { start, end } = getWeekRange(selectedDate);
      const data = await fetchHistoricalWeather(
        selectedCity.lat,
        selectedCity.lng,
        start,
        end
      );
      setWeeklyData(data);
    } catch (err: any) {
      setError(err.message || 'データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedDate]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const dailyStats = useMemo(() => {
    if (weeklyData.length === 0) return [];
    
    const days: Record<string, WeatherDataPoint[]> = {};
    weeklyData.forEach(point => {
      const d = point.time.split('T')[0];
      if (!days[d]) days[d] = [];
      days[d].push(point);
    });

    return Object.keys(days).sort().map(date => {
      const points = days[date];
      const representativeCode = points[12]?.weather_code ?? points[0]?.weather_code ?? 0;
      return {
        date,
        maxTemp: Math.max(...points.map(p => p.temperature_2m)),
        minTemp: Math.min(...points.map(p => p.temperature_2m)),
        precipitation: points.reduce((sum, p) => sum + p.precipitation, 0),
        weatherCode: representativeCode,
      };
    });
  }, [weeklyData]);

  const hourlyDetailForDay = useMemo(() => {
    return weeklyData.filter(d => d.time.startsWith(selectedDate));
  }, [weeklyData, selectedDate]);

  const handleAiAnalyze = async () => {
    if (hourlyDetailForDay.length === 0) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeWeatherWithAI(selectedCity, selectedDate, hourlyDetailForDay);
      setAiAnalysis(analysis);
    } catch (err) {
      setAiAnalysis("AI分析中にエラーが発生しました。");
    } finally {
      setAnalyzing(false);
    }
  };

  const daySummary = dailyStats.find(s => s.date === selectedDate);
  const isFuture = new Date(selectedDate) > new Date();

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Japan Weather Archive</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCity.name}
              onChange={(e) => {
                const city = JAPANESE_CITIES.find(c => c.name === e.target.value);
                if (city) setSelectedCity(city);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[160px] cursor-pointer hover:bg-white transition-colors"
            >
              {JAPANESE_CITIES.map(city => (
                <option key={city.name} value={city.name}>{city.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 cursor-pointer hover:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              </div>
            </div>
            <p className="text-slate-500 font-bold text-xl tracking-tight">気象データを構築中...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 shadow-xl p-12 rounded-[2rem] text-center max-w-2xl mx-auto mt-12">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-2xl font-black text-slate-800 mb-4">エラーが発生しました</p>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              {error.includes("range") ? "指定された日付は予報の範囲外（最大16日後まで）またはアーカイブの範囲外です。別の日付を選択してください。" : error}
            </p>
            <button onClick={loadWeather} className="px-10 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200">
              再読み込み
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Day Summary Highlights */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-10 flex flex-col md:flex-row items-center gap-10 transition-all hover:shadow-2xl hover:-translate-y-1 duration-500">
              <div className="flex-shrink-0 flex flex-col items-center gap-2 border-r border-slate-100 pr-10">
                <WeatherIcon code={daySummary?.weatherCode ?? 0} size="lg" />
                {isFuture && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md tracking-tighter uppercase">予報</span>}
              </div>
              
              <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">LOCATION & DATE</p>
                  <p className="text-2xl font-black text-slate-800 leading-none">{selectedCity.label}</p>
                  <p className="text-sm text-slate-400 font-bold">{selectedDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">MAX TEMP</p>
                  <p className="text-4xl font-black text-orange-600 leading-none tabular-nums">
                    {daySummary ? daySummary.maxTemp.toFixed(1) : '--.-'}<span className="text-xl font-bold ml-1">°C</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">MIN TEMP</p>
                  <p className="text-4xl font-black text-blue-600 leading-none tabular-nums">
                    {daySummary ? daySummary.minTemp.toFixed(1) : '--.-'}<span className="text-xl font-bold ml-1">°C</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-1">PRECIPITATION</p>
                  <p className="text-4xl font-black text-sky-600 leading-none tabular-nums">
                    {daySummary ? daySummary.precipitation.toFixed(1) : '-.-'}<span className="text-xl font-bold ml-1">mm</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Main Hourly Chart with Toggles */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-3 uppercase tracking-wider">
                  <span className="w-4 h-1 rounded-full bg-blue-600"></span>
                  Hourly Detail Breakdown
                </h3>
              </div>
              <WeatherChart data={hourlyDetailForDay} />
            </div>

            {/* Weekly Summary Chart */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-3 uppercase tracking-wider">
                  <span className="w-4 h-1 rounded-full bg-orange-500"></span>
                  Weekly Summary Analysis
                </h3>
              </div>
              <WeeklySummaryChart data={dailyStats} />
            </div>

            {/* AI Insights Section */}
            <section className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-900 rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400 opacity-10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
              </div>

              <div className="relative z-10 p-10 md:p-16 text-white">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-12">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <span className="text-[10px] font-black tracking-widest uppercase">Powered by Gemini AI</span>
                    </div>
                    <h2 className="text-4xl font-black mb-4 leading-tight">
                      Climate Insights Report
                    </h2>
                    <p className="text-blue-100/80 text-lg font-medium max-w-xl">
                      {isFuture 
                        ? "予報データに基づき、来週の気候傾向と推奨される準備についてAIがアドバイスします。" 
                        : "アーカイブデータを分析し、この日の気候が当時の日常生活や社会に与えた影響を独自の視点で解説します。"
                      }
                    </p>
                  </div>
                  
                  <button
                    onClick={handleAiAnalyze}
                    disabled={analyzing}
                    className={`group px-10 py-6 rounded-3xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-4 min-w-[280px] ${
                      analyzing 
                        ? 'bg-blue-400 cursor-not-allowed opacity-75' 
                        : 'bg-white text-blue-900 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900"></div>
                        分析を生成中...
                      </>
                    ) : aiAnalysis ? 'インサイトを更新' : 'AI分析レポートを生成'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                
                {aiAnalysis && (
                  <div className="bg-black/20 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 text-xl leading-relaxed border border-white/5 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-12 duration-1000 shadow-inner">
                    <div className="prose prose-invert max-w-none text-blue-50 font-medium">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
                
                {!aiAnalysis && !analyzing && (
                  <div className="text-center py-24 border-4 border-dashed border-white/10 rounded-[2.5rem] bg-white/5 group hover:bg-white/10 transition-colors cursor-pointer" onClick={handleAiAnalyze}>
                    <p className="text-blue-200/50 text-2xl font-black tracking-tight group-hover:text-blue-100 transition-colors">
                      READY FOR ANALYSIS. CLICK BUTTON TO PROCEED.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="mt-32 border-t border-slate-200 py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM14.243 16.95a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 18a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zM5.757 16.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm.757-4.243a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 5a5 5 0 100 10 5 5 0 000-10z" /></svg>
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tighter">Japanese Historical Weather Explorer</span>
          </div>
          <p className="text-slate-400 text-sm mb-6 font-bold uppercase tracking-[0.3em]">© 2024-2025 Archive Systems Inc.</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
            <a href="https://open-meteo.com" target="_blank" className="hover:text-blue-500 transition-colors">Open-Meteo Data Source</a>
            <span className="hidden sm:inline opacity-30">|</span>
            <a href="https://ai.google.dev" target="_blank" className="hover:text-blue-500 transition-colors">Gemini 3 Flash Analysis</a>
            <span className="hidden sm:inline opacity-30">|</span>
            <span className="text-slate-200">Global Climate Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
