import { NextResponse } from 'next/server';
import { translateUsingClinicalDictionary } from '@/lib/translation-dictionary';

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const SOURCE_LANGUAGE_ALIASES = { od: 'or' };

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 });
  }

  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const requestedLanguage = typeof body?.sourceLanguage === 'string'
    ? body.sourceLanguage.trim()
    : '';
  const isValidLanguageCode = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(requestedLanguage);
  const languageBase = requestedLanguage.split('-')[0].toLowerCase();
  const sourceLanguage = isValidLanguageCode
    ? `${SOURCE_LANGUAGE_ALIASES[languageBase] || languageBase}${requestedLanguage.includes('-') ? requestedLanguage.slice(requestedLanguage.indexOf('-')) : ''}`
    : null;

  if (!text || text.length > 5000 || !sourceLanguage) {
    return NextResponse.json({ error: 'A supported language and transcript of 1-5000 characters are required.' }, { status: 400 });
  }

  // If already English, return directly as verified English
  if (sourceLanguage === 'en' || sourceLanguage.startsWith('en-')) {
    return NextResponse.json({
      translatedText: text,
      sourceLanguage: 'en',
      translationSource: 'ORIGINAL_ENGLISH',
      verified: true
    });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  // 1. Try Google Cloud Translation API if API key is provided
  if (apiKey) {
    try {
      const response = await fetch(GOOGLE_TRANSLATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({ q: text, source: sourceLanguage, target: 'en', format: 'text' }),
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        const translatedText = result.data?.translations?.[0]?.translatedText;
        if (typeof translatedText === 'string' && translatedText.trim()) {
          return NextResponse.json({
            translatedText: translatedText.trim(),
            sourceLanguage,
            translationSource: 'GOOGLE_CLOUD_TRANSLATE',
            verified: true,
          });
        }
      }
    } catch {
      // Fall through to clinical dictionary fallback
    }
  }

  // 2. Clinical Dictionary Fallback for Indian healthcare terminology
  const clinicalTranslation = translateUsingClinicalDictionary(text);
  if (clinicalTranslation) {
    return NextResponse.json({
      translatedText: clinicalTranslation,
      sourceLanguage,
      translationSource: 'CLINICAL_DICTIONARY_FALLBACK',
      verified: true,
      note: 'Translated via built-in Indian clinical dictionary.',
    });
  }

  // 3. Graceful fallback when cloud translation API key is not configured and terms are outside dictionary
  return NextResponse.json({
    translatedText: null,
    translationAvailable: false,
    sourceLanguage,
    error: 'Voice translation is not configured (requires GOOGLE_TRANSLATE_API_KEY). Original spoken text preserved.',
    code: 'VOICE_TRANSLATION_NOT_CONFIGURED',
  }, { status: 200 });
}