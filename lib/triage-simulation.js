const LEGACY_SIMULATED_PATIENTS = [
  { name: 'Kavita Sundaram', age: 48, gender: 'Female', symptomText: 'கடுமையான ஆஸ்துமா மூச்சுத் திணறல் (Severe asthmatic dyspnea, unable to complete sentence)' },
  { name: 'Vijay Shekhawat', age: 29, gender: 'Male', symptomText: 'बाइक से गिर गए, घुटने और सिर में कट गया है। (Bike accident, deep laceration on scalp and knee)' },
  { name: 'Priya Mukherjee', age: 34, gender: 'Female', symptomText: 'প্রবল জ্বর এবং পেটে প্রচণ্ড ব্যথা। (Severe fever 102F and right lower quadrant abdominal pain)' },
  { name: 'Srinivas Rao', age: 58, gender: 'Male', symptomText: 'అధిక రక్తపోటు మరియు కళ్ళు తిరగడం. (Hypertension emergency, extreme giddiness)' },
  { name: 'Deepak Thorat', age: 40, gender: 'Male', symptomText: 'हाताला गरम तेलाचा भाजला आहे. (Second degree scald burn on left hand)' },
];

const FIRST_NAMES = [
  { name: 'Aarav', gender: 'Male', language: 'hi' },
  { name: 'Aditi', gender: 'Female', language: 'hi' },
  { name: 'Arjun', gender: 'Male', language: 'mr' },
  { name: 'Ananya', gender: 'Female', language: 'bn' },
  { name: 'Dev', gender: 'Male', language: 'gu' },
  { name: 'Farah', gender: 'Female', language: 'ur' },
  { name: 'Ishaan', gender: 'Male', language: 'hi' },
  { name: 'Kavya', gender: 'Female', language: 'te' },
  { name: 'Kabir', gender: 'Male', language: 'mr' },
  { name: 'Meera', gender: 'Female', language: 'ta' },
  { name: 'Nikhil', gender: 'Male', language: 'kn' },
  { name: 'Sana', gender: 'Female', language: 'ur' },
  { name: 'Rohan', gender: 'Male', language: 'bn' },
  { name: 'Tara', gender: 'Female', language: 'ta' },
  { name: 'Vikram', gender: 'Male', language: 'mr' },
  { name: 'Zoya', gender: 'Female', language: 'ur' },
];

const LAST_NAMES = [
  'Bhatia', 'Chawla', 'Desai', 'Fernandes', 'Ghosh', 'Iyer', 'Jain', 'Kapoor',
  'Kulkarni', 'Menon', 'Naidu', 'Qureshi', 'Reddy', 'Saxena', 'Verma', 'Yadav',
];

const COMPLAINTS = [
  { language: 'ta', symptomText: 'மூச்சுத் திணறல் மற்றும் கடுமையான இருமல். (Shortness of breath with persistent cough)' },
  { language: 'hi', symptomText: 'तेज बुखार और शरीर में दर्द। (High fever with body aches and chills)' },
  { language: 'bn', symptomText: 'পেটে ব্যথা এবং বমি বমি ভাব। (Abdominal pain with nausea and vomiting)' },
  { language: 'mr', symptomText: 'छातीत दुखणे आणि घाम येणे. (Chest discomfort with sweating)' },
  { language: 'te', symptomText: 'తల తిరగడం మరియు బలహీనత. (Dizziness with generalized weakness)' },
];

export const SIMULATION_FACILITIES = [
  { name: 'PHC Rampur', type: 'Primary Health Center (PHC)' },
  { name: 'Camp Baramati - Rural Health Unit', type: 'Public Health Camp' },
  { name: 'Jamshedpur Industrial Health Center', type: 'Industrial Clinic' },
  { name: 'District Hospital Pune', type: 'Government Hospital' },
  { name: 'IIT Campus Health Center', type: 'Campus Health Center' },
];

function normalizeName(name = '') {
  return name.replace(/\s+\(\d+\)$/, '').trim().toLowerCase();
}

export function isSimulatedPatient(patient) {
  if (patient.isSimulated) return true;

  return LEGACY_SIMULATED_PATIENTS.some((sample) => (
    normalizeName(patient.patientName) === normalizeName(sample.name)
    && Number(patient.age) === sample.age
    && patient.gender?.toLowerCase() === sample.gender.toLowerCase()
    && patient.symptomText?.trim() === sample.symptomText
  ));
}

export function getSimulationIdentityKey(patient) {
  return JSON.stringify([
    normalizeName(patient.patientName),
    Number(patient.age),
    patient.gender?.trim().toLowerCase(),
  ]);
}

export function createSimulationProfile(patients, simulationCount) {
  const existingNames = new Set(patients.map((patient) => normalizeName(patient.patientName)));
  const nameCombinationCount = FIRST_NAMES.length * LAST_NAMES.length;

  for (let offset = 0; offset < nameCombinationCount; offset += 1) {
    const nameIndex = ((simulationCount + offset) * 9) % nameCombinationCount;
    const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
    const patientName = `${firstName.name} ${LAST_NAMES[Math.floor(nameIndex / FIRST_NAMES.length)]}`;
    if (existingNames.has(normalizeName(patientName))) continue;

    const complaint = COMPLAINTS[simulationCount % COMPLAINTS.length];
    const facility = SIMULATION_FACILITIES[simulationCount % SIMULATION_FACILITIES.length];

    return {
      patientName,
      age: 18 + ((simulationCount * 7 + offset * 3) % 62),
      gender: firstName.gender,
      language: complaint.language || firstName.language,
      symptomText: complaint.symptomText,
      facilityName: facility.name,
      facilityType: facility.type,
    };
  }

  throw new Error('No unique simulated patient names remain.');
}