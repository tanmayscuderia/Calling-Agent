import { getInteractionTranscript } from '../src/sarvam/sarvamClient';
(async () => {
  const d = await getInteractionTranscript('20260908/e99ee615-14:32:35-bb9ea932');
  console.log('top-level type:', typeof d, Array.isArray(d) ? 'array' : '');
  const obj: any = d;
  if (obj && typeof obj === 'object') {
    console.log('keys:', Object.keys(obj).join(', '));
    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      console.log(k, '→', Array.isArray(v) ? `array[${v.length}]` : typeof v, String(JSON.stringify(v)).slice(0, 200));
    }
  }
  process.exit(0);
})().catch((e) => { console.error('ERR', e?.message || e); process.exit(1); });
