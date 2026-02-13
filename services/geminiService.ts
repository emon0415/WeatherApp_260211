
import { GoogleGenAI } from "@google/genai";
import { WeatherDataPoint, City } from "../types";

export const analyzeWeatherWithAI = async (
  city: City,
  date: string,
  data: WeatherDataPoint[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (data.length === 0) return "分析対象のデータがありません。";

  // Detailed Aggregations for the statistics requested
  const temps = data.map(d => d.temperature_2m);
  const apparents = data.map(d => d.apparent_temperature);
  const humidities = data.map(d => d.relative_humidity_2m);
  const pressures = data.map(d => d.surface_pressure);
  const visibilities = data.map(d => d.visibility);
  const clouds = data.map(d => d.cloud_cover);
  const gusts = data.map(d => d.wind_gusts_10m);
  const windDirs = data.map(d => d.wind_direction_10m);
  const uvIndices = data.map(d => d.uv_index).filter(v => v !== null) as number[];
  const capes = data.map(d => d.cape).filter(v => v !== null) as number[];
  
  const totalRain = data.reduce((sum, d) => sum + d.precipitation, 0);
  const totalSnow = data.reduce((sum, d) => sum + d.snowfall, 0);
  const maxSnowDepth = Math.max(...data.map(d => d.snow_depth));
  const avgPrecipProb = data.some(d => d.precipitation_probability !== null) 
    ? (data.reduce((sum, d) => sum + (d.precipitation_probability || 0), 0) / data.length).toFixed(0) 
    : "データなし";

  // Create a robust JSON context for the AI
  const statsJson = JSON.stringify({
    location: {
      label: city.label,
      precise_coordinates: { latitude: city.lat, longitude: city.lng }
    },
    date: date,
    hourly_statistics: {
      temperature_c: { max: Math.max(...temps), min: Math.min(...temps), avg: (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) },
      apparent_temp_c: { max: Math.max(...apparents), min: Math.min(...apparents) },
      humidity_percent: { max: Math.max(...humidities), min: Math.min(...humidities), avg: (humidities.reduce((a,b)=>a+b,0)/humidities.length).toFixed(0) },
      surface_pressure_hpa: { max: Math.max(...pressures), min: Math.min(...pressures) },
      visibility_meters: { min: Math.min(...visibilities), avg: (visibilities.reduce((a,b)=>a+b,0)/visibilities.length).toFixed(0) },
      cloud_cover_percent: { avg: (clouds.reduce((a,b)=>a+b,0)/clouds.length).toFixed(0) },
      wind: { max_gust_ms: Math.max(...gusts), dominant_directions: windDirs },
      precipitation: { total_mm: totalRain.toFixed(1), probability_avg_percent: avgPrecipProb },
      snow: { total_cm: totalSnow.toFixed(1), max_depth_cm: maxSnowDepth },
      indices: {
        uv_index_max: uvIndices.length > 0 ? Math.max(...uvIndices) : "N/A",
        cape_max: capes.length > 0 ? Math.max(...capes) : "N/A"
      }
    }
  }, null, 2);

  const prompt = `
    あなたは日本の気象と地理に精通したエキスパートAIです。
    提供された詳細な気象データ（JSON形式）を解析し、この地点（緯度:${city.lat}, 経度:${city.lng}）のこの日ならではの分析を日本語で作成してください。

    【解析用データ】
    ${statsJson}
    
    【分析の要件】
    以下の4つの項目について、Markdown形式で見出し（###）を付けて回答してください。

    1. **地理・地型的な気象解説**:
       緯度経度からその場所の具体的な地形（例：〇〇盆地、〇〇海岸、標高が高いエリア、高層ビル群など）を特定し、その地形が気温の推移、風の通り方、霧の発生などにどう関与しているか考察してください。
    
    2. **大気コンディションと健康影響**:
       気圧の変化、CAPE（大気不安定度）、湿度、UV指数などを組み合わせ、熱中症リスク、雷雨の予兆、あるいは気圧変化による頭痛などの「気象病」リスクについて専門的なアドバイスをしてください。

    3. **生活・アクティビティへの提案**:
       視程、風速、体感温度に基づき、洗濯物の乾燥予測、車の運転の注意点（横風や視界不良）、服装のレイヤリング、屋外レジャーの適性を提案してください。

    4. **その地方ならではの天気TIPs（お楽しみ）**:
       分析の最後に、その地点や地方（東北、北陸、瀬戸内、沖縄など）ならではの、天気に関するちょっとした話題、ことわざ、または「地元の人が共感するあるあるネタ」を1つ追加してください。現地の人と共有できるような有益な豆知識が望ましいです。

    専門的な知見を含みつつも、読んだ人がその日の空気感をイメージできるような具体的で親しみやすい文章にしてください。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });

    return response.text || "AI分析の生成に失敗しました。";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "AIによる分析中にエラーが発生しました。データが複雑すぎるか、APIリクエストの制限に達した可能性があります。";
  }
};
