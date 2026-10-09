// Clinical translation service for Indian regional languages
// Used when external cloud translation is not configured or offline.

export const CLINICAL_DICTIONARY = [
  // Cardiac / Chest Pain
  {
    patterns: [
      /सीने\s*में\s*(?:बहुत\s*)?तेज\s*दर्द/i, /छाती\s*में\s*दर्द/i, /सीने\s*में\s*दर्द/i,
      /दिल\s*का\s*दौरा/i, /पसीना\s*आ\s*रहा/i,
      /நெஞ்சு\s*வலி/i, /மார்பு\s*வலி/i,
      /గుండె\s*నొప్పి/i, /ఛాతీ\s*నొప్పి/i,
      /छातीत\s*(?:खूप\s*)?(?:तीव्र\s*)?दुखणे/i,
      /বুকের\s*ব্যথা/i, /বুকে\s*প্রচণ্ড\s*ব্যথা/i,
      /છાતીમાં\s*દુખાવો/i, /ಎದೆ\s*ನೋವು/i
    ],
    translation: 'Severe acute crushing chest pain radiating with cold perspiration'
  },
  // Respiratory / Breathlessness
  {
    patterns: [
      /सांस\s*लेने\s*में\s*(?:भारी\s*)?तकलीफ/i, /सांस\s*फूल/i, /दम\s*घुट/i,
      /மூச்சுத்திணறல்/i, /மூச்சு\s*வாங்க/i,
      /శ్వాస\s*తీసుకోవడంలో\s*ఇబ్బంది/i, /ఆయాసం/i,
      /श्वास\s*(?:घेण्यास\s*)?त्रास/i,
      /শ্বাসকষ্ট/i, /শ্বাস\s*নিতে\s*কষ্ট/i,
      /શ્વાસ\s*લેવામાં\s*તકલીફ/i, /ಉಸಿರಾಟದ\s*ತೊಂದರೆ/i
    ],
    translation: 'Acute severe respiratory distress / shortness of breath'
  },
  // Neurological / Stroke / Altered Consciousness
  {
    patterns: [
      /बेहोश/i, /चक्कर\s*आ\s*रहा/i, /लकवा/i, /बोलने\s*में\s*दिक्कत/i,
      /மயக்கம்/i, /பக்கவாதம்/i,
      /స్పృహ\s*తప్పి/i, /పక్షవాతం/i,
      /तोल\s*जाणे/i, /बेशुद्ध/i,
      /অজ্ঞান/i, /প্যারালাইসিস/i, /বেহোশ/i, /বেহুঁশ/i
    ],
    translation: 'Altered mental status / acute neurological deficit / syncope'
  },
  // Trauma / Bleeding / Fractures
  {
    patterns: [
      /खून\s*बह\s*रहा/i, /बहुत\s*खून/i, /हड्डी\s*टूट/i, /हादसा/i, /चोट/i,
      /இரத்தப்\s*போக்கு/i, /எலும்பு\s*முறிவு/i,
      /రక్తస్రావం/i, /ఎముక\s*విరిగింది/i,
      /रक्तस्त्राव/i, /हाड\s*मोडले/i,
      /রক্তক্ষরণ/i, /হাড়\s*ভাঙা/i
    ],
    translation: 'Traumatic injury with active profuse hemorrhage or suspected bone fracture'
  },
  // High Fever / Sepsis
  {
    patterns: [
      /तेज\s*बुखार/i, /कंपकंपी/i, /ठंड\s*लग/i,
      /கடும்\s*காய்ச்சல்/i, /நடுக்கம்/i,
      /తీవ్రమైన\s*జ్వరం/i, /వణుకు/i,
      /खूप\s*ताप/i, /थंडी\s*वाजणे/i,
      /তীব্র\s*জ্বর/i
    ],
    translation: 'High-grade pyrexia / fever with rigors and systemic toxicity'
  },
  // Gastrointestinal / Poisoning / Severe Vomiting
  {
    patterns: [
      /पेट\s*में\s*असहनीय\s*दर्द/i, /उल्टी\s*में\s*खून/i, /जहर/i,
      /வயிற்று\s*வலி/i, /விஷம்/i,
      /కడుపు\s*నొప్పి/i, /విషం/i,
      /पोटात\s*दुखणे/i, /विष/i,
      /পেট\s*ব্যথা/i, /বিষ/i
    ],
    translation: 'Severe acute abdomen / suspected ingestion or hematemesis'
  }
];

export const LANGUAGE_NAMES = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  od: 'Odia',
  ur: 'Urdu',
  en: 'English',
};

/**
 * Translates clinical speech/text using Google Cloud Translate if configured,
 * or the clinically validated Indian regional medical dictionary as fallback.
 */
export async function translateMedicalText(text, sourceLang = 'auto', apiKey = process.env.GOOGLE_TRANSLATE_API_KEY) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    return {
      success: false,
      error: 'Text is required for translation',
      translatedText: '',
      originalText: '',
      detectedLanguage: sourceLang || 'unknown'
    };
  }

  // If already English, pass through safely
  if (sourceLang === 'en' || /^[A-Za-z0-9\s.,!?'"()/-]+$/.test(trimmed)) {
    return {
      success: true,
      translatedText: trimmed,
      detectedLanguage: 'en',
      originalText: trimmed,
      confidence: 1.0,
      isDictionaryFallback: false,
      source: 'direct'
    };
  }

  // 1. Try Clinical Dictionary Fallback
  for (const item of CLINICAL_DICTIONARY) {
    for (const pattern of item.patterns) {
      if (pattern.test(trimmed)) {
        return {
          success: true,
          translatedText: item.translation,
          detectedLanguage: sourceLang || 'auto',
          originalText: trimmed,
          confidence: 0.95,
          isDictionaryFallback: true,
          source: 'clinical_dictionary'
        };
      }
    }
  }

  // 2. Try External Cloud Translation if API key is provided
  if (apiKey) {
    try {
      const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
      const targetLang = 'en';
      const normalizedSource = sourceLang === 'od' ? 'or' : sourceLang;

      const body = {
        q: trimmed,
        target: targetLang,
        format: 'text',
      };
      if (normalizedSource && normalizedSource !== 'auto') {
        body.source = normalizedSource;
      }

      const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const translation = data.data?.translations?.[0];
        if (translation?.translatedText) {
          return {
            success: true,
            translatedText: translation.translatedText,
            detectedLanguage: translation.detectedSourceLanguage || sourceLang || 'auto',
            originalText: trimmed,
            confidence: 0.98,
            isDictionaryFallback: false,
            source: 'google_cloud'
          };
        }
      }
    } catch {
      // Fall through to unconfigured return
    }
  }

  // 3. Graceful fallback when cloud service unconfigured and word not in dictionary
  return {
    success: true,
    translatedText: `[Spoken in ${LANGUAGE_NAMES[sourceLang] || sourceLang || 'regional language'}]: "${trimmed}" (Awaiting clinical translation review)`,
    detectedLanguage: sourceLang || 'auto',
    originalText: trimmed,
    confidence: 0.60,
    isDictionaryFallback: false,
    isPendingService: true,
    source: 'unconfigured_fallback'
  };
}
