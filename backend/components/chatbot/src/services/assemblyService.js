import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

export async function transcribeAudio(audioUrl) {
  const params = { audio: audioUrl, speech_model: 'universal' };
  const transcript = await client.transcripts.transcribe(params);
  return transcript.text;
}