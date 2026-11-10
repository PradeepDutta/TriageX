import { NextResponse } from 'next/server';
import { createTriageAssessmentRow, insertTriageAssessment } from '@/lib/triage-assessments';
import { getAuthenticatedContext, requireTriageAssessmentAccess } from '@/lib/supabase/server';

function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export async function POST(request) {
  const access = await getAuthenticatedContext();
  if (!access.configured) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (access.error) {
    return NextResponse.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  if (!access.user) {
    return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'A valid JSON request payload is required.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const hasHospitalId = body.hospitalId !== undefined && body.hospitalId !== null && body.hospitalId !== '';
    const hasDepartmentId = body.departmentId !== undefined && body.departmentId !== null && body.departmentId !== '';
    if (hasHospitalId !== hasDepartmentId) {
      return NextResponse.json(
        { error: 'Both an authorized hospital and department assignment are required for a clinical queue case.' },
        { status: 400 }
      );
    }
    if (!hasHospitalId && access.role !== 'patient') {
      return NextResponse.json(
        { error: 'A clinician account must select an authorized hospital and department.' },
        { status: 403 }
      );
    }

    let hospital = null;
    let departmentId = null;
    let ownerUserId = access.user.id;
    if (hasHospitalId) {
      const tenantAccess = await requireTriageAssessmentAccess(
        body.hospitalId,
        body.departmentId,
        { create: true, context: access }
      );
      if (tenantAccess.response) return tenantAccess.response;

      const { data: authorizedHospital, error: hospitalError } = await access.supabase
        .from('hospitals')
        .select('id, name')
        .eq('id', body.hospitalId)
        .eq('status', 'active')
        .maybeSingle();

      if (hospitalError) {
        console.error('Unable to verify triage hospital details:', {
          code: hospitalError.code || null,
          status: hospitalError.status || null,
          message: hospitalError.message || 'No error message was provided.',
        });
        return NextResponse.json({ error: 'Unable to verify the selected hospital.' }, { status: 503 });
      }
      if (!authorizedHospital) {
        return NextResponse.json({ error: 'The selected hospital is unavailable to this account.' }, { status: 403 });
      }

      hospital = authorizedHospital;
      departmentId = body.departmentId;
      ownerUserId = null;
    }

    // 1. Demographics Validation
    const patientName = sanitizeString(body.patientName, 100);
    if (!patientName) {
      return NextResponse.json({ error: 'Patient name is required.' }, { status: 400 });
    }

    const ageNum = Number(body.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
      return NextResponse.json({ error: 'A valid patient age between 0 and 130 is required.' }, { status: 400 });
    }

    const validGenders = ['Male', 'Female', 'Other', 'Unspecified'];
    const gender = validGenders.includes(body.gender) ? body.gender : 'Unspecified';
    const contact = sanitizeString(body.contact, 30);
    const language = sanitizeString(body.language || 'en', 10);

    // 2. Multimodal Inputs Validation
    const symptomText = sanitizeString(body.symptomText, 5000);
    const reportText = sanitizeString(body.reportText, 10000);
    const voiceTranscripts = Array.isArray(body.voiceTranscripts)
      ? body.voiceTranscripts.map((entry) => ({
          sourceText: sanitizeString(entry?.sourceText, 2000),
          englishText: sanitizeString(entry?.englishText, 2000),
          languageCode: sanitizeString(entry?.languageCode, 10),
          languageName: sanitizeString(entry?.languageName, 50),
        }))
      : [];

    // 3. Vitals Validation & Sanitization
    const rawVitals = body.vitals || {};
    const sanitizedVitals = {};

    if (rawVitals.spo2 !== undefined && rawVitals.spo2 !== null && rawVitals.spo2 !== '') {
      const s = Number(rawVitals.spo2);
      if (isNaN(s) || s < 1 || s > 100) {
        return NextResponse.json({ error: 'SpO2 must be a valid number between 1% and 100%.' }, { status: 400 });
      }
      sanitizedVitals.spo2 = s;
    }

    if (rawVitals.pulse !== undefined && rawVitals.pulse !== null && rawVitals.pulse !== '') {
      const p = Number(rawVitals.pulse);
      if (isNaN(p) || p < 20 || p > 300) {
        return NextResponse.json({ error: 'Pulse rate must be a valid number between 20 and 300 bpm.' }, { status: 400 });
      }
      sanitizedVitals.pulse = p;
    }

    if (rawVitals.systolicBP !== undefined && rawVitals.systolicBP !== null && rawVitals.systolicBP !== '') {
      const sys = Number(rawVitals.systolicBP);
      if (isNaN(sys) || sys < 40 || sys > 300) {
        return NextResponse.json({ error: 'Systolic BP must be between 40 and 300 mmHg.' }, { status: 400 });
      }
      sanitizedVitals.systolicBP = sys;
    }

    if (rawVitals.diastolicBP !== undefined && rawVitals.diastolicBP !== null && rawVitals.diastolicBP !== '') {
      const dia = Number(rawVitals.diastolicBP);
      if (isNaN(dia) || dia < 20 || dia > 200) {
        return NextResponse.json({ error: 'Diastolic BP must be between 20 and 200 mmHg.' }, { status: 400 });
      }
      sanitizedVitals.diastolicBP = dia;
    }

    if (sanitizedVitals.systolicBP && sanitizedVitals.diastolicBP && sanitizedVitals.diastolicBP >= sanitizedVitals.systolicBP) {
      return NextResponse.json({ error: 'Diastolic BP must be lower than Systolic BP.' }, { status: 400 });
    }

    if (rawVitals.temperature !== undefined && rawVitals.temperature !== null && rawVitals.temperature !== '') {
      const t = Number(rawVitals.temperature);
      if (isNaN(t) || t < 70 || t > 115) {
        return NextResponse.json({ error: 'Temperature must be between 70°F and 115°F.' }, { status: 400 });
      }
      sanitizedVitals.temperature = t;
    }

    if (rawVitals.respirationRate !== undefined && rawVitals.respirationRate !== null && rawVitals.respirationRate !== '') {
      const r = Number(rawVitals.respirationRate);
      if (isNaN(r) || r < 4 || r > 80) {
        return NextResponse.json({ error: 'Respiration rate must be between 4 and 80 /min.' }, { status: 400 });
      }
      sanitizedVitals.respirationRate = r;
    }

    const hasVitals = Object.keys(sanitizedVitals).length > 0;
    const hasImage = Boolean(body.imageInput && typeof body.imageInput === 'object');
    const imageInput = hasImage
      ? {
          fileName: sanitizeString(body.imageInput.fileName, 100),
          tag: sanitizeString(body.imageInput.tag, 50),
          description: sanitizeString(body.imageInput.description, 500),
        }
      : null;

    if (!symptomText && !hasVitals && !hasImage && !reportText) {
      return NextResponse.json(
        { error: 'At least one multimodal clinical input (symptom description, vitals, image, or lab report) is required.' },
        { status: 400 }
      );
    }

    const assessment = createTriageAssessmentRow({
      actorUserId: access.user.id,
      ownerUserId,
      hospital,
      departmentId,
      isSimulated: false,
      intakeData: {
      patientName,
      age: Math.round(ageNum),
      gender,
      contact,
      language,
      symptomText,
      voiceTranscripts,
      vitals: sanitizedVitals,
      imageInput,
      reportText,
      },
    });

    const { data: patientRecord, error: insertError } = await insertTriageAssessment(
      access.supabase,
      assessment
    );
    if (insertError) {
      console.error('Unable to persist triage assessment:', {
        code: insertError.code || null,
        status: insertError.status || null,
        message: insertError.message || 'No error message was provided.',
      });
      return NextResponse.json(
        { error: insertError.code === '42501'
          ? 'This account cannot create an assessment for the selected assignment.'
          : 'Unable to save the triage assessment. Please try again later.' },
        { status: insertError.code === '42501' ? 403 : 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Patient triage intake successfully processed.',
      data: patientRecord
    }, { status: 201 });

  } catch (err) {
    console.error('Server error processing triage intake:', err?.message || err);
    return NextResponse.json({ error: 'Unable to process the triage assessment.' }, { status: 500 });
  }
}
