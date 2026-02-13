
import { GoogleGenAI } from "@google/genai";
import { WeatherDataPoint, City } from "../types";

export const analyzeWeatherWithAI = async (
  city: City,
  date: string,
  data: WeatherDataPoint[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (data.length === 0) return "分析対象のデータがありません。";

  // Detailed Aggregations
  const temps = data.map(d => d.temperature_2m);
  const apparents = data.map(d => d.apparent_temperature);
  const humidities = data.map(d => d.relative_humidity_2m);
  const pressures = data.map(d => d.surface_pressure);
  const visibilities = data.map(d => d.visibility);
  const clouds = data.map(d => d.cloud_cover);
  const gusts = data.map(d => d.wind_gusts_10m);
  const uvIndices = data.map(d => d.uv_index).filter(v => v !== null) as number[];
  const capes = data.map(d => d.cape).filter(v => v !== null) as number[];
  
  const totalRain = data.reduce((sum, d) => sum + d.precipitation, 0);
  const totalSnow = data.reduce((sum, d) => sum + d.snowfall, 0);
  const maxSnowDepth = Math.max(...data.map(d => d.snow_depth));
  const avgPrecipProb = data.some(d => d.precipitation_probability !== null) 
    ? (data.reduce((sum, d) => sum + (d.precipitation_probability || 0), 0) / data.length).toFixed(0) 
    : "取得不可";

  const statsJson = JSON.stringify({
    location: {
      label: city.label,
      latitude: city.lat,
      longitude: city.lng
    },
    date: date,
    metrics: {
      temperature: { max: Math.max(...temps), min: Math.min(...temps), avg: (temps.reduce((a,b)=>a+b,0)/temps.length) },
      apparent_temperature: { max: Math.max(...apparents), min: Math.min(...apparents) },
      humidity: { max: Math.max(...humidities), min: Math.min(...humidities), avg: (humidities.reduce((a,b)=>a+b,0)/humidities.length) },
      pressure: { max: Math.max(...pressures), min: Math.min(...pressures) },
      visibility: { min: Math.min(...visibilities), avg: (visibilities.reduce((a,b)=>a+b,0)/visibilities.length) },
      cloud_cover: { avg: (clouds.reduce((a,b)=>a+b,0)/clouds.length) },
      wind_gust_max: Math.max(...gusts),
      precipitation: { total_mm: totalRain, prob_avg: avgPrecipProb },
      snow: { total_cm: totalSnow, max_depth_cm: maxSnowDepth },
      uv_index_max: uvIndices.length > 0 ? Math.max(...uvIndices) : "N/A",
      cape_max: capes.length > 0 ? Math.max(...capes) : "N/A"
    }
  }, null, 2);

  const prompt = `
    あなたはプロの気象予報士かつ、日本の地理に精通したデータアナリストです。
    以下の詳細な気象データ（JSON形式）を読み取り、この地点・この日ならではの深い分析を日本語で提供してください。

    【解析用データ】
    ${statsJson}
    
    【分析の要件・ポイント】
    1. **地理的・地型的考察**: 
       緯度・経度（${city.lat}, ${city.lng}）から、この地点特有の地形（海沿い、盆地、標高、都市部など）がこの日の気象（特に風向や放射冷却、体感温度など）にどう影響したか推察してください。
    2. **大気の状態とリスク**: 
       CAPE（大気不安定度）や気圧、UV指数、風速から、雷雨の可能性、熱中症リスク、または気圧変化による体調への影響（気象病など）について専門的に触れてください。
    3. **生活・レジャーへの具体的なアドバイス**: 
       視程や降雪、体感温度に基づき、洗濯物の乾きやすさ、車の運転（視界不良）、最適な服装、屋外活動の推奨度を提案してください。
    4. **エネルギー・環境**: 
       全雲量や日射、風速から、太陽光発電や風力エネルギーへの影響にも軽く触れてください。

    回答は、親しみやすさを保ちつつ、データに基づいた「なるほど」と思わせる洞察を含めてください。
    Markdown形式で、見出し（###）を使って構造化してください。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "AI分析の生成に失敗しました。";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "AIによる分析中にエラーが発生しました。詳細なデータが多すぎるか、リクエストが制限された可能性があります。";
  }
};
