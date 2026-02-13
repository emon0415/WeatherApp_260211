
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { JAPANESE_CITIES } from './constants';
import { City, WeatherDataPoint } from './types';
import { fetchHistoricalWeather } from './services/weatherService';
import { analyzeWeatherWithAI } from './services/geminiService';
import WeatherChart from './components/WeatherChart';
import WeeklySummaryChart from './components/WeeklySummaryChart';
import WeatherIcon from './components/WeatherIcon';
import MapSelector from './components/MapSelector';
import { getWeekRange } from './utils/dateUtils';

const App: React.FC = () => {
  const [currentCity, setCurrentCity] = useState<City>(JAPANESE_CITIES[12]); // Default Tokyo
  const [lat, setLat] = useState<number>(JAPANESE_CITIES[12].lat);
  const [lng, setLng] = useState<number>(JAPANESE_CITIES[12].lng);
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
      const data = await fetchHistoricalWeather(lat, lng, start, end);
      setWeeklyData(data);
    } catch (err: any) {
      setError(err.message || 'データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, selectedDate]);

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

  const handleCitySelect = (cityName: string) => {
    const city = JAPANESE_CITIES.find(c => c.name === cityName);
    if (city) {
      setCurrentCity(city);
      setLat(city.lat);
      setLng(city.lng);
    }
  };

  const handleMapLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    const closestCity = JAPANESE_CITIES.find(c => 
      Math.abs(c.lat - newLat) < 0.1 && Math.abs(c.lng - newLng) < 0.1
    );
    if (closestCity) {
      setCurrentCity(closestCity);
    } else {
      setCurrentCity({
        name: 'Custom',
        label: `指定地点 (${newLat.toFixed(2)}, ${newLng.toFixed(2)})`,
        lat: newLat,
        lng: newLng
      });
    }
  };

  const handleAiAnalyze = async () => {
    if (hourlyDetailForDay.length === 0) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeWeatherWithAI(currentCity, selectedDate, hourlyDetailForDay);
      setAiAnalysis(analysis);
    } catch (err) {
      setAiAnalysis("AI分析中にエラーが発生しました。");
    } finally {
      setAnalyzing(false);
    }
  };

  const daySummary = dailyStats.find(s => s.date === selectedDate);
  
  // Date status checks
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDateObj = new Date(selectedDate);
  const isFuture = selectedDateObj > today;
  const maxForecastDate = new Date(today);
  maxForecastDate.setDate(today.getDate() + 16);
  const isTooFarFuture = selectedDateObj > maxForecastDate;

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[2000] shadow-sm">
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
              value={currentCity.name === 'Custom' ? 'Custom' : currentCity.name}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[180px] cursor-pointer shadow-sm hover:border-blue-400 transition-all"
            >
              {JAPANESE_CITIES.map(city => (
                <option key={city.name} value={city.name}>{city.label}</option>
              ))}
              {currentCity.name === 'Custom' && (
                <option value="Custom">{currentCity.label}</option>
              )}
            </select>
            <div className="relative group">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`bg-white border text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 cursor-pointer shadow-sm hover:border-blue-400 transition-all ${isTooFarFuture ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
              />
              {isTooFarFuture && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-amber-800 text-white text-[10px] p-2 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
                  16日より先の予報データは現在取得できません。
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-10">
        <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden h-[450px] relative transition-all hover:shadow-2xl duration-500">
           <MapSelector lat={lat} lng={lng} onLocationChange={handleMapLocationChange} />
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              </div>
            </div>
            <p className="text-slate-500 font-bold text-xl tracking-tight">気象情報を取得中...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 shadow-xl p-12 rounded-[2rem] text-center max-w-2xl mx-auto">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-2xl font-black text-slate-800 mb-4">エラーが発生しました</p>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">{error}</p>
            <button onClick={loadWeather} className="px-10 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all">再読み込み</button>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-700">
            {isTooFarFuture && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4 text-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold">
                  選択された日付（{selectedDate}）は16日より先の未来のため、予報データがまだ生成されていません。
                  16日以内の日付を選択してください。
                </p>
              </div>
            )}

            {/* Day Summary Highlights */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-shrink-0 flex flex-col items-center gap-2 border-r border-slate-100 pr-10 min-w-[120px]">
                {daySummary ? (
                  <>
                    <WeatherIcon code={daySummary.weatherCode} size="lg" />
                    {isFuture && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md tracking-tighter uppercase">予報</span>}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                    <span className="text-xs font-bold uppercase tracking-widest mt-2">No Data</span>
                  </div>
                )}
              </div>
              
              <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-8 w-full text-center md:text-left">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">LOCATION & DATE</p>
                  <p className="text-xl font-black text-slate-800 leading-tight">{currentCity.label}</p>
                  <p className="text-xs text-slate-400 font-bold">{selectedDate}</p>
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

            {hourlyDetailForDay.length > 0 ? (
              <WeatherChart data={hourlyDetailForDay} />
            ) : !isTooFarFuture && (
              <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 font-medium">
                この日の詳細データは見つかりませんでした。
              </div>
            )}

            {dailyStats.length > 0 && (
              <WeeklySummaryChart data={dailyStats} />
            )}

            {/* AI Insights Section */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-[3rem] shadow-2xl"></div>
              <div className="relative z-10 p-10 md:p-16 text-white">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-12">
                  <div className="max-w-3xl">
                    <h2 className="text-4xl font-black mb-4 leading-tight">Climate Intelligence Report</h2>
                    <p className="text-blue-100/80 text-lg font-medium">
                      {currentCity.label} の気象データをAIが分析し、この地点特有の気候や生活への影響を解説します。
                    </p>
                  </div>
                  <button
                    onClick={handleAiAnalyze}
                    disabled={analyzing || hourlyDetailForDay.length === 0}
                    className={`group px-10 py-6 rounded-3xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-4 min-w-[280px] ${
                      analyzing || hourlyDetailForDay.length === 0 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-white text-blue-900 hover:scale-105'
                    }`}
                  >
                    {analyzing ? '生成中...' : aiAnalysis ? '分析を更新' : 'AI分析を実行'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
                {aiAnalysis && (
                  <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 text-xl leading-relaxed border border-white/10 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="prose prose-invert max-w-none text-blue-50">{aiAnalysis}</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="mt-32 border-t border-slate-200 py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <p className="text-slate-400 text-sm font-black tracking-[0.3em] uppercase">© 2024 Japan Weather Archive Explorer</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
