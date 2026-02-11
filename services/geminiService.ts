
import { GoogleGenAI } from "@google/genai";
import { WeatherDataPoint, City } from "../types";

export const analyzeWeatherWithAI = async (
  city: City,
  date: string,
  data: WeatherDataPoint[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Calculate some simple stats to help the AI
  const temps = data.map(d => d.temperature_2m);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const totalRain = data.reduce((sum, d) => sum + d.precipitation, 0);

  const prompt = `
    以下の日本の都市の過去の気象データについて、分かりやすく親しみやすい日本語で分析してください。
    
    都市: ${city.label} (${city.name})
    日付: ${date}
    
    統計データ:
    - 最高気温: ${maxTemp.toFixed(1)}°C
    - 最低気温: ${minTemp.toFixed(1)}°C
    - 総降水量: ${totalRain.toFixed(1)}mm
    
    分析のポイント:
    1. この時期の平年値と比較してどのような特徴があるか（予測で構いません）。
    2. この日の天気が人々の生活や服装にどのような影響を与えたと考えられるか。
    3. この地域ならではの気候特性についての豆知識。
    
    回答は簡潔に、かつ興味深い内容にしてください。
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
    return "AIによる分析中にエラーが発生しました。しばらく経ってから再度お試しください。";
  }
};
