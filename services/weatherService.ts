
import { WeatherApiResponse, WeatherDataPoint } from '../types';

export const fetchHistoricalWeather = async (
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<WeatherDataPoint[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  // Archive API usually has a 2-day delay. If the end date is within the last 2 days or in the future, use the Forecast API.
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  const useForecastApi = end >= twoDaysAgo;
  const baseUrl = useForecastApi 
    ? 'https://api.open-meteo.com/v1/forecast' 
    : 'https://archive-api.open-meteo.com/v1/archive';

  const url = `${baseUrl}?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FTokyo`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.reason || `Weather API Error: ${response.statusText}`);
    }
    const data: WeatherApiResponse = await response.json();

    if (!data.hourly || !data.hourly.time) {
      return [];
    }

    return data.hourly.time.map((time, index) => ({
      time,
      temperature_2m: data.hourly.temperature_2m[index],
      precipitation: data.hourly.precipitation[index],
      relative_humidity_2m: data.hourly.relative_humidity_2m[index],
      wind_speed_10m: data.hourly.wind_speed_10m[index],
      weather_code: data.hourly.weather_code[index],
    }));
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
};
