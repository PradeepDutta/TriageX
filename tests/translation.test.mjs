import test from 'node:test';
import assert from 'node:assert/strict';
import { translateMedicalText } from '../lib/translation-service.js';
import { translateUsingClinicalDictionary } from '../lib/translation-dictionary.js';

test('Translation Service: Preserves English input without alteration', async () => {
  const result = await translateMedicalText('Patient has severe chest pain and dizziness', 'en');

  assert.equal(result.success, true);
  assert.equal(result.translatedText, 'Patient has severe chest pain and dizziness');
  assert.equal(result.originalText, 'Patient has severe chest pain and dizziness');
  assert.equal(result.detectedLanguage, 'en');
});

test('Translation Dictionary: Matches regional Indian emergency terms via clinical fallback dictionary', () => {
  const testCases = [
    { text: 'छाती में दर्द', expectedKeyword: 'chest pain' },
    { text: 'सीने में बहुत तेज दर्द और पसीना आ रहा', expectedKeyword: 'chest pain' },
    { text: 'सांस लेने में भारी तकलीफ और दम घुट रहा है', expectedKeyword: 'breathing' },
    { text: 'நெஞ்சு வலி', expectedKeyword: 'chest pain' },
    { text: 'மூச்சுத்திணறல்', expectedKeyword: 'breathing' },
    { text: 'ఛాతీ నొప్పి', expectedKeyword: 'chest pain' },
    { text: 'छातीत दुखणे', expectedKeyword: 'chest pain' },
    { text: 'বুকে তীব্র ব্যথা', expectedKeyword: 'chest pain' },
    { text: 'বেহোশ হয়ে গেছে', expectedKeyword: 'consciousness' },
  ];

  for (const tc of testCases) {
    const translation = translateUsingClinicalDictionary(tc.text);
    assert.ok(translation, `Translation must exist for: ${tc.text}`);
    assert.ok(
      translation.toLowerCase().includes(tc.expectedKeyword.toLowerCase()),
      `Expected "${translation}" to contain "${tc.expectedKeyword}" for input "${tc.text}"`
    );
  }
});

test('Translation Service: Handles empty text gracefully with error response', async () => {
  const result = await translateMedicalText('   ');
  assert.equal(result.success, false);
  assert.ok(result.error);
});

test('Translation Service: Never claims false English translation for unmapped regional words when API key is missing', async () => {
  const text = 'काहीतरी वेगळे लक्षण जे शब्दकोषात नाही';
  const result = await translateMedicalText(text, 'mr', null);

  assert.equal(result.success, true);
  assert.equal(result.originalText, text);
  // Must explicitly state pending review instead of generating hallucinated translation
  assert.ok(result.isPendingService, 'Must flag that external service is pending');
  assert.ok(result.translatedText.includes('Awaiting clinical translation review'));
});
