// Clinical translation dictionary and matching for Indian regional languages
// Provides high-accuracy medical translation for Indian public healthcare settings.

export const CLINICAL_DICTIONARY = [
  // Cardiac / Chest Pain
  {
    patterns: [
      /सीने\s*में\s*(?:बहुत\s*)?तेज\s*दर्द/i, /छाती\s*में\s*दर्द/i, /सीने\s*में\s*दर्द/i,
      /दिल\s*का\s*दौरा/i, /पसीना\s*आ\s*रहा/i,
      /நெஞ்சு\s*வலி/i, /மார்பு\s*வலி/i,
      /గుండె\s*నొప్పి/i, /ఛాతీ\s*నొప్పి/i,
      /छातीत\s*(?:खूप\s*)?(?:तीव्र\s*)?दुखणे/i,
      /বুকের\s*ব্যথা/i, /বুকে\s*(?:তীব্র|প্রচণ্ড)\s*ব্যথা/i,
      /છાતીમાં\s*દુખાવો/i, /ಎದೆ\s*ನೋವು/i
    ],
    translation: 'Severe acute crushing chest pain radiating with cold perspiration'
  },
  // Respiratory / Breathlessness
  {
    patterns: [
      /सांस\s*लेने\s*में\s*(?:भारी\s*)?तकलीफ/i, /सांस\s*फूल/i, /दम\s*घुट/i,
      /மூச்சுத்திணறல்/i, /மூச்சு\s*விட\s*சிரமம்/i,
      /శ్వాస\s*తీసుకోవడంలో\s*ఇబ్బంది/i, /ఆయాసం/i,
      /श्वास\s*घेण्यास\s*त्रास/i, /दम\s*लागणे/i,
      /শ্বাসকষ্ট/i, /শ্বাস\s*নিতে\s*কষ্ট/i,
      /શ્વાસ\s*લેવામાં\s*તકલીફ/i, /ಉಸಿರಾಟದ\s*ತೊಂದರೆ/i
    ],
    translation: 'Severe shortness of breath, acute respiratory distress, difficulty breathing'
  },
  // High Fever / Chills
  {
    patterns: [
      /तेज\s*बुखार/i, /कपकपी/i, /ठंड\s*लगकर\s*बुखार/i,
      /கடுமையான\s*காய்ச்சல்/i, /குளிர்\s*காய்ச்சல்/i,
      /తీవ్రమైన\s*జ్వరం/i, /చలి\s*జ్వరం/i,
      /खूप\s*तीव्र\s*ताप/i, /थंडी\s*वाजून\s*ताप/i,
      /প্রবল\s*জ্বর/i, /কাঁপানি\s*দিয়ে\s*জ্বর/i,
      /ઝીણો\s*તાવ/i
    ],
    translation: 'High persistent fever with chills and severe rigors'
  },
  // Abdominal Pain / Vomiting
  {
    patterns: [
      /पेट\s*में\s*(?:तेज\s*)?दर्द/i, /उल्टी/i, /खून\s*की\s*उल्टी/i, /दस्त/i,
      /வயிறு\s*வலி/i, /வாந்தி/i,
      /కడుపు\s*నొప్పి/i, /వాంతులు/i,
      /पोटात\s*(?:तीव्र\s*)?दुखणे/i, /उलटी/i,
      /পেটে\s*(?:প্রচণ্ড\s*)?ব্যথা/i, /বমি/i
    ],
    translation: 'Severe acute abdominal pain, nausea, and vomiting'
  },
  // Trauma / Fracture / Open Wound / Bleeding
  {
    patterns: [
      /हड्डी\s*टूटना/i, /गहरा\s*घाव/i, /तेज\s*खून/i, /चोट\s*लग/i, /कट\s*गया/i,
      /எலும்பு\s*முறிவு/i, /இரத்தப்போக்கு/i, /காயம்/i,
      /ఎముక\s*విరిగింది/i, /రక్తస్రావం/i, /గాయం/i,
      /हाड\s*मोडले/i, /रक्तस्त्राव/i, /जखम/i,
      /হাড়\s*ভাঙা/i, /রক্তপাত/i, /ক্ষত/i
    ],
    translation: 'Deep laceration / suspected bone fracture with active bleeding'
  },
  // Neurological / Dizziness / Seizures
  {
    patterns: [
      /बेहोश/i, /चक्कर/i, /दौरा/i, /सिर\s*में\s*तेज\s*दर्द/i, /लकवा/i,
      /மயக்கம்/i, /வலிப்பு/i, /பக்கவாதம்/i,
      /స్పృహ\s*తప్పి/i, /మూర్ఛ/i, /పక్షవాతం/i,
      /बेशुद्ध/i, /झटका/i, /अर्धांगवायू/i,
      /অজ্ঞান/i, /খিঁচুনি/i, /প্যারালাইসিস/i, /বেহোশ/i, /বেহুঁশ/i
    ],
    translation: 'Sudden loss of consciousness, seizure activity, or acute stroke symptoms'
  }
];

export function translateUsingClinicalDictionary(text) {
  if (typeof text !== 'string') return null;
  const matches = [];
  for (const entry of CLINICAL_DICTIONARY) {
    for (const pattern of entry.patterns) {
      if (pattern.test(text)) {
        matches.push(entry.translation);
        break;
      }
    }
  }

  if (matches.length > 0) {
    return matches.join('; ');
  }
  return null;
}
