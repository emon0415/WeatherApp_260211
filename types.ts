
export interface City {
  name: string;
  lat: number;
  lng: number;
  label: string;
}

export interface WeatherDataPoint {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  precipitation: number;
  relative_humidity_2m: number;
  surface_pressure: number;
  visibility: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  snowfall: number;
  precipitation_probability: number | null;
  uv_index: number | null;
  cape: number | null;
  snow_depth: number;
  weather_code: number;
}

export interface WeatherApiResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    relative_humidity_2m: number[];
    surface_pressure: number[];
    visibility: number[];
    cloud_cover: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    snowfall: number[];
    precipitation_probability?: number[];
    uv_index?: number[];
    cape?: number[];
    snow_depth: number[];
    weather_code: number[];
  };
}
