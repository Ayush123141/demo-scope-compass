import { type SensorReading, isSensorReadingFresh } from "./iot-sensor";
import { type SatellitePass, isSatellitePassFresh } from "./satellite-service";
import { type SimulatedSignals } from "./simulated-engine";

export type DecisionAction = "irrigate_now" | "hold_off" | "protect_crop" | "no_action_needed";

export interface TrilingualReason {
  en: { title: string; reason: string };
  hi: { title: string; reason: string };
  mr: { title: string; reason: string };
}

export interface AgentRecommendation {
  id?: string;
  action: DecisionAction;
  confidencePercent: number; // 0-100%
  sourceLabel: "Live telemetry" | "Data unavailable";
  copy: TrilingualReason;
  createdAtMs: number;
  confirmed: boolean;
  confirmedAtMs?: number;
}

export const ACTION_DICTIONARY: Record<DecisionAction, TrilingualReason> = {
  irrigate_now: {
    en: {
      title: "Irrigate Now",
      reason: "Soil moisture is critically low with minimal rain forecast. Recommended: initiate standard root-zone irrigation.",
    },
    hi: {
      title: "अभी सिंचाई करें",
      reason: "मिट्टी में नमी कम है और बारिश का अनुमान नहीं है। सुझाव: जड़ क्षेत्र में मानक सिंचाई शुरू करें।",
    },
    mr: {
      title: "आता पाणी द्या",
      reason: "मातीमधील ओलावा कमी झाला आहे आणि पावसाचा अंदाज नाही. सल्ला: योग्य प्रमाणात पाणी द्या.",
    },
  },
  hold_off: {
    en: {
      title: "Hold Off Irrigation",
      reason: "Soil moisture is declining, but incoming rainfall is expected within 24 hours. Hold off to conserve water.",
    },
    hi: {
      title: "सिंचाई रोकें",
      reason: "मिट्टी में नमी कम हो रही है, लेकिन 24 घंटे में बारिश की संभावना है। पानी बचाने के लिए सिंचाई रोकें।",
    },
    mr: {
      title: "सिंचन थांबवा",
      reason: "मातीतील ओलावा कमी होत असला तरी २४ तासांत पावसाची शक्यता आहे. पाणी वाचवण्यासाठी सिंचन थांबवा.",
    },
  },
  protect_crop: {
    en: {
      title: "Protect Crop & Clear Drainage",
      reason: "Soil is already saturated and heavy rainfall is approaching. Ensure furrow drainage is clear to prevent root waterlogging.",
    },
    hi: {
      title: "फसल सुरक्षित करें",
      reason: "मिट्टी पहले से नम है और भारी बारिश का अनुमान है। जलभराव रोकने के लिए जल निकासी की नालियां साफ रखें।",
    },
    mr: {
      title: "पिकाचे रक्षण करा",
      reason: "मातीत आधीच ओलावा आहे आणि मुसळधार पाऊस संभवतो. मुळांना पाणी साचण्यापासून वाचवण्यासाठी चर मोकळे ठेवा.",
    },
  },
  no_action_needed: {
    en: {
      title: "Optimal Conditions",
      reason: "Soil moisture and weather conditions are steady in the favorable agronomic band. No intervention needed.",
    },
    hi: {
      title: "अनुकूल स्थिति",
      reason: "मिट्टी की नमी और मौसम की स्थिति फसल के लिए अनुकूल बनी हुई है। अभी किसी हस्तक्षेप की आवश्यकता नहीं है।",
    },
    mr: {
      title: "उत्तम परिस्थिती",
      reason: "मातीतील ओलावा आणि हवामान पिकासाठी अनुकूल आहे. सध्या कोणत्याही कृतीची आवश्यकता नाही.",
    },
  },
};

export const DATA_UNAVAILABLE_COPY: Record<"sensor_stale" | "satellite_missing" | "forecast_missing", TrilingualReason> = {
  sensor_stale: {
    en: {
      title: "Telemetry Stale / Sensor Offline",
      reason: "Fresh soil-moisture telemetry has not been received for >15 minutes. Mitti Sentinel is withholding recommendations until the sensor reconnects.",
    },
    hi: {
      title: "सेंसर डेटा उपलब्ध नहीं है",
      reason: "पिछले 15 मिनट से मिट्टी की नमी का ताज़ा डेटा नहीं मिला है। सुरक्षा कारणों से सिफारिश रोकी गई है।",
    },
    mr: {
      title: "सेन्सर डेटा अनुपलब्ध आहे",
      reason: "गेल्या १५ मिनिटांपासून मातीतील ओलाव्याची ताजी नोंद मिळालेली नाही. सेन्सर सुरू होण्याची वाट पाहा.",
    },
  },
  satellite_missing: {
    en: {
      title: "Satellite Imagery Unavailable",
      reason: "Recent satellite snapshot (>7 days) or cloudless imagery is missing. Ground verification required before confident decision.",
    },
    hi: {
      title: "उपग्रह चित्र उपलब्ध नहीं",
      reason: "हालिया उपग्रह दृश्य (>7 दिन) उपलब्ध नहीं है। कृपया खेत का प्रत्यक्ष निरीक्षण करें।",
    },
    mr: {
      title: "उपग्रह प्रतिमा अनुपलब्ध",
      reason: "मागील ७ दिवसांतील उपग्रह प्रतिमा उपलब्ध नाही. प्रत्यक्ष शेताची पाहणी करा.",
    },
  },
  forecast_missing: {
    en: {
      title: "Forecast Signal Missing",
      reason: "Weather forecast signal is currently unreachable. Autonomous recommendation withheld.",
    },
    hi: {
      title: "मौसम का अनुमान अनुपलब्ध",
      reason: "मौसम का पूर्वानुमान डेटा उपलब्ध नहीं है। सिफारिश रोकी गई है।",
    },
    mr: {
      title: "हवामान अंदाज अनुपलब्ध",
      reason: "हवामानाचा अंदाज मिळालेला नाही. शिफारस तात्पुरती थांबवली आहे.",
    },
  },
};

export interface DecisionAgentInputs {
  sensor: SensorReading | null;
  satellite: SatellitePass | null;
  forecast: SimulatedSignals | null;
  nowMs?: number;
}

/**
 * Mitti Sentinel Agent Core
 *
 * Evaluates real sensor telemetry + real satellite availability + simulated forecast.
 *
 * Honest Design Principles:
 * 1. Rule-based correlation logic, NOT an opaque black-box or certified agronomy ML model.
 * 2. Strict graceful degradation: when sensor or satellite telemetry is stale/missing,
 *    confidence drops to 0% and no autonomous guess is made.
 * 3. Never controls physical hardware directly; requires farmer confirmation.
 */
export function evaluateFieldConditions(inputs: DecisionAgentInputs): AgentRecommendation {
  const nowMs = inputs.nowMs ?? Date.now();
  const { sensor, satellite, forecast } = inputs;

  // 1. SAFEGUARD: Check Sensor Freshness (< 15 mins)
  if (!sensor || !isSensorReadingFresh(sensor, nowMs)) {
    return {
      action: "no_action_needed",
      confidencePercent: 0,
      sourceLabel: "Data unavailable",
      copy: DATA_UNAVAILABLE_COPY.sensor_stale,
      createdAtMs: nowMs,
      confirmed: false,
    };
  }

  // 2. SAFEGUARD: Check Satellite Pass Freshness (< 7 days)
  if (!satellite || !isSatellitePassFresh(satellite, nowMs)) {
    return {
      action: "no_action_needed",
      confidencePercent: 0,
      sourceLabel: "Data unavailable",
      copy: DATA_UNAVAILABLE_COPY.satellite_missing,
      createdAtMs: nowMs,
      confirmed: false,
    };
  }

  // 3. SAFEGUARD: Check Forecast Signal
  if (!forecast) {
    return {
      action: "no_action_needed",
      confidencePercent: 0,
      sourceLabel: "Data unavailable",
      copy: DATA_UNAVAILABLE_COPY.forecast_missing,
      createdAtMs: nowMs,
      confirmed: false,
    };
  }

  const moisture = sensor.moisture_percent;
  const rain24h = forecast.rainfallMm24h;

  // Rule A: Low moisture + little/no rain expected -> IRRIGATE NOW
  if (moisture < 35 && rain24h < 8) {
    const confidence = Math.min(95, Math.round(75 + (35 - moisture) * 1.2));
    return {
      action: "irrigate_now",
      confidencePercent: confidence,
      sourceLabel: "Live telemetry",
      copy: ACTION_DICTIONARY.irrigate_now,
      createdAtMs: nowMs,
      confirmed: false,
    };
  }

  // Rule B: Adequate/high moisture + heavy rain approaching -> PROTECT CROP & DRAINAGE
  if (moisture >= 40 && rain24h >= 12) {
    const confidence = Math.min(94, Math.round(70 + (rain24h - 12) * 1.5));
    return {
      action: "protect_crop",
      confidencePercent: confidence,
      sourceLabel: "Live telemetry",
      copy: ACTION_DICTIONARY.protect_crop,
      createdAtMs: nowMs,
      confirmed: false,
    };
  }

  // Rule C: Moisture dipping but rain is expected within 24h -> HOLD OFF
  if (moisture < 38 && rain24h >= 8 && rain24h < 18) {
    return {
      action: "hold_off",
      confidencePercent: 78,
      sourceLabel: "Live telemetry",
      copy: ACTION_DICTIONARY.hold_off,
      createdAtMs: nowMs,
      confirmed: false,
    };
  }

  // Rule D: Moisture is optimal (40% - 65%) with manageable weather -> NO ACTION
  return {
    action: "no_action_needed",
    confidencePercent: 88,
    sourceLabel: "Live telemetry",
    copy: ACTION_DICTIONARY.no_action_needed,
    createdAtMs: nowMs,
    confirmed: false,
  };
}
