/**
 * Google Gemini Crop Copilot Service for Mitti Sentinel
 * Model: gemini-2.5-flash / gemini-flash-latest
 */

export interface GeminiAdvisoryContext {
  plotName: string;
  latitude: number;
  longitude: number;
  cropType: string;
  moisturePercent: number;
  rainfallMm24h: number;
  currentAction: string;
  actionReason: string;
  satelliteDate: string;
  cloudCover: number;
  language: "en" | "hi" | "mr";
}

const GEMINI_API_KEY = typeof import.meta !== "undefined" ? import.meta.env?.VITE_GEMINI_API_KEY : "";

export const isGeminiConfigured = Boolean(
  GEMINI_API_KEY && !GEMINI_API_KEY.includes("your-gemini")
);

export async function askMittiAi(
  userQuery: string,
  context: GeminiAdvisoryContext
): Promise<string> {
  const languageInstructions = {
    en: "Respond in warm, clear, farmer-accessible English.",
    hi: "सरल, व्यावहारिक और आदरणीय ग्रामीण हिन्दी में उत्तर दें।",
    mr: "शेतकऱ्यांसाठी सोप्या, स्पष्ट आणि आदरयुक्त मराठीत उत्तर द्या.",
  };

  const systemInstruction = `
You are 'Mitti AI' (मिट्टी एआई), an intelligent and honest agronomic copilot for Indian farmers using the Mitti Sentinel platform.
You are grounded in REAL IoT telemetry and spaceborne Copernicus Sentinel-2 satellite observations.

Current Field Context:
- Active Farm Plot: ${context.plotName} (${context.latitude.toFixed(4)}°N, ${context.longitude.toFixed(4)}°E)
- Dominant Crop: ${context.cropType}
- Measured Root Soil Moisture: ${context.moisturePercent}% (Volumetric Water Content)
- Simulated 24h Rainfall Forecast: ${context.rainfallMm24h} mm
- Calculated Decision Action: ${context.currentAction} (${context.actionReason})
- Sentinel-2 Satellite Pass: ${context.satelliteDate} (${context.cloudCover}% cloud cover)

Instructions:
1. ${languageInstructions[context.language]}
2. Keep answers concise (2 to 4 sentences maximum) so it is quickly readable on a mobile screen in bright sunlight.
3. Be honest: recommend checking field conditions with their own eyes before turning on heavy pump motors.
4. Give specific, practical advice on irrigation timing, drainage, or soil aeration based on the exact numbers provided.
`;

  if (!isGeminiConfigured) {
    // Graceful offline fallback with helpful message
    if (context.language === "hi") {
      return `मिट्टी एआई (ऑफ़लाइन मोड): वर्तमान मिट्टी की नमी ${context.moisturePercent}% है और बारिश का अनुमान ${context.rainfallMm24h}mm है। सुझाव: ${context.actionReason}`;
    }
    if (context.language === "mr") {
      return `मिट्टी एआय (ऑफलाइन मोड): मातीतील ओलावा ${context.moisturePercent}% असून पावसाचा अंदाज ${context.rainfallMm24h}mm आहे. सल्ला: ${context.actionReason}`;
    }
    return `Mitti AI (Offline Demo Mode): Current root moisture is ${context.moisturePercent}% with ${context.rainfallMm24h}mm rain expected. Advisory: ${context.actionReason}`;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userQuery }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 300,
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Gemini API error:", res.status, errText);
      return `Mitti AI Advisory: Based on your current soil moisture (${context.moisturePercent}%) and rain outlook (${context.rainfallMm24h}mm), please proceed with caution and verify field moisture before irrigating.`;
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText?.trim() || "No response received from Mitti AI.";
  } catch (err) {
    console.error("Gemini network error:", err);
    return `Mitti AI Advisory: Soil moisture is at ${context.moisturePercent}%. Ensure root zone aeration.`;
  }
}
