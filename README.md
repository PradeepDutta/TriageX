This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Multilingual voice transcription and translation

Voice recordings are captured as compressed Opus audio, limited to 30 seconds, then sent to Google Cloud Speech-to-Text v2 for automatic detection across the eight TriageX locales. The app compares one recognition pass per locale, so each recording makes up to eight speech requests. The chosen original transcript is translated to English and displayed first, followed by the original text and detected language; the English text feeds triage assessment.

Enable the Cloud Speech-to-Text and Cloud Translation APIs. In `TriageX/.env.local`, set `GOOGLE_CLOUD_PROJECT` and `GOOGLE_TRANSLATE_API_KEY`. For Speech-to-Text authentication, use one of these server-only options:

- `GOOGLE_APPLICATION_CREDENTIALS` set to an absolute path to a service-account JSON file stored outside the repository.
- `GOOGLE_CLOUD_CREDENTIALS_JSON` set to the service-account JSON contents.
- For local development, Application Default Credentials from `gcloud auth application-default login`.

In production, prefer an attached service identity with Speech-to-Text permissions. Keep all credentials server-side, restrict the Translation API key, and set quotas because speech recognition runs up to eight times per recording. Common service-account JSON filenames are ignored by Git; the browser must support `getUserMedia` and compressed `MediaRecorder` audio.
