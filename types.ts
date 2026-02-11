
export interface City {
  name: string;
  lat: number;
  lng: number;
  label: string;
}

export interface WeatherDataPoint {
  time: string;
  temperature_2m: number;
  precipitation: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
}

export interface WeatherApiResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
}
