
import { WeatherApiResponse, WeatherDataPoint } from '../types';

export const fetchHistoricalWeather = async (
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<WeatherDataPoint[]> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxForecastDate = new Date(today);
  maxForecastDate.setDate(today.getDate() + 16);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > maxForecastDate) {
    return [];
  }

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const useForecastApi = end >= twoDaysAgo;
  
  let finalEndDate = endDate;
  if (useForecastApi && end > maxForecastDate) {
    finalEndDate = maxForecastDate.toISOString().split('T')[0];
  }

  const baseUrl = useForecastApi 
    ? 'https://api.open-meteo.com/v1/forecast' 
    : 'https://archive-api.open-meteo.com/v1/archive';

  // Comprehensive parameter list
  const params = [
    'temperature_2m',
    'apparent_temperature',
    'precipitation',
    'relative_humidity_2m',
    'surface_pressure',
    'visibility',
    'cloud_cover',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'snowfall',
    'snow_depth',
    'weather_code'
  ];

  // These are often only available in the forecast endpoint
  if (useForecastApi) {
    params.push('precipitation_probability', 'uv_index', 'cape');
  }

  const url = `${baseUrl}?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${finalEndDate}&hourly=${params.join(',')}&timezone=Asia%2FTokyo`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 400) return [];
      throw new Error(errorData.reason || `Weather API Error: ${response.statusText}`);
    }
    const data: WeatherApiResponse = await response.json();

    if (!data.hourly || !data.hourly.time) return [];

    return data.hourly.time.map((time, index) => ({
      time,
      temperature_2m: data.hourly.temperature_2m[index],
      apparent_temperature: data.hourly.apparent_temperature[index],
      precipitation: data.hourly.precipitation[index],
      relative_humidity_2m: data.hourly.relative_humidity_2m[index],
      surface_pressure: data.hourly.surface_pressure[index],
      visibility: data.hourly.visibility[index],
      cloud_cover: data.hourly.cloud_cover[index],
      wind_speed_10m: data.hourly.wind_speed_10m[index],
      wind_direction_10m: data.hourly.wind_direction_10m[index],
      wind_gusts_10m: data.hourly.wind_gusts_10m[index],
      snowfall: data.hourly.snowfall[index],
      snow_depth: data.hourly.snow_depth[index],
      weather_code: data.hourly.weather_code[index],
      precipitation_probability: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[index] : null,
      uv_index: data.hourly.uv_index ? data.hourly.uv_index[index] : null,
      cape: data.hourly.cape ? data.hourly.cape[index] : null,
    }));
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
};
