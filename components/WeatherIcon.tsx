
import React from 'react';

interface Props {
  code: number;
  size?: 'sm' | 'lg';
}

const WeatherIcon: React.FC<Props> = ({ code, size = 'lg' }) => {
  const isLg = size === 'lg';
  const iconSize = isLg ? "w-16 h-16" : "w-8 h-8";
  
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs/historical-weather-api
  const getIcon = () => {
    if (code <= 1) { // Clear
      return (
        <svg className={`${iconSize} text-orange-400`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM14.243 16.95a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 18a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zM5.757 16.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm.757-4.243a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 5a5 5 0 100 10 5 5 0 000-10z" clipRule="evenodd" />
        </svg>
      );
    }
    if (code <= 3 || code === 45 || code === 48) { // Cloudy / Fog
      return (
        <svg className={`${iconSize} text-slate-400`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
        </svg>
      );
    }
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82) { // Rain / Drizzle
      return (
        <svg className={`${iconSize} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          <path d="M7 16v2m3-2v2m3-2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (code >= 71 && code <= 77 || code >= 85 && code <= 86) { // Snow
      return (
        <svg className={`${iconSize} text-sky-300`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.126l.754-.435a1 1 0 111 1.732l-.754.435 1.043.602a1 1 0 11-1 1.732l-1.043-.602V8.5a1 1 0 11-2 0V7.59l-1.043.602a1 1 0 01-1-1.732l1.043-.602-.754-.435a1 1 0 111-1.732l.754.435V3a1 1 0 011-1z" />
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
        </svg>
      );
    }
    return ( // Others / Thunder
      <svg className={`${iconSize} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 3a1 1 0 10-2 0v5.127l-2.862-.573a1 1 0 10-.392 1.961L8.138 10l-2.392.485a1 1 0 10.392 1.96l2.862-.572V17a1 1 0 102 0v-5.127l2.862.573a1 1 0 10.392-1.961L11.862 10l2.392-.485a1 1 0 10-.392-1.96l-2.862.572V3z" />
      </svg>
    );
  };

  const getLabel = () => {
    if (code === 0) return "快晴";
    if (code <= 3) return "曇り";
    if (code >= 51 && code <= 67) return "雨";
    if (code >= 71 && code <= 77) return "雪";
    if (code >= 80 && code <= 82) return "にわか雨";
    return "その他";
  };

  return (
    <div className="flex flex-col items-center">
      {getIcon()}
      {isLg && <span className="mt-2 text-lg font-bold text-slate-700">{getLabel()}</span>}
    </div>
  );
};

export default WeatherIcon;
