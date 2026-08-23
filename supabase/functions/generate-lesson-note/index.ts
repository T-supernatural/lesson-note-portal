const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LessonRequest = {
  subject: string;
  classLevel: string;
  topic: string;
  week: string;
  term?: string;
  duration: string;
  learningLevel: 'Simple' | 'Moderate' | 'Advanced';
  curriculumStyle: string;
  additionalInstructions?: string;
  generationMode?: 'short' | 'detailed';
};

const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
const fields = ['objectives', 'materials', 'introduction', 'teachers_presentation', 'main_content', 'evaluation', 'assignment'];

const isValidRequest = (value: unknown): value is LessonRequest => {
  if (!value || typeof value !== 'object') return false;
  const request = value as Record<string, unknown>;
  return ['subject', 'classLevel', 'topic', 'week', 'duration', 'curriculumStyle']
    .every((field) => typeof request[field] === 'string' && request[field].trim().length > 0);
};

const createPrompt = (params: LessonRequest) => {
  const mode = params.generationMode || 'short';
  const guidance = mode === 'short'
    ? 'Keep content concise. Each section should be 2-4 sentences max, except main_content.'
    : 'Provide comprehensive content with examples, activities, and assessment methods.';

  return `Generate a Nigerian curriculum lesson note for ${params.classLevel} - Topic: ${params.topic}.
Return only valid JSON matching the requested schema.
Required fields: objectives (4-6 outcomes), materials (bulleted resources), introduction (opening activity), teachers_presentation (key concepts), main_content (teaching steps and activities), evaluation (assessment), assignment (student task).
Use simple language appropriate for ${params.classLevel}. In main_content, use only <h2>, <h3>, <ul>, <li>, <table>, <tr>, <td>, and <th> HTML tags. ${guidance}
Subject: ${params.subject}
Class Level: ${params.classLevel}
Week: ${params.week}
${params.term ? `Term: ${params.term}` : ''}
Duration: ${params.duration}
Learning Level: ${params.learningLevel}
Curriculum Style: ${params.curriculumStyle}
${params.additionalInstructions ? `Special Instructions: ${params.additionalInstructions}` : ''}`;
};

const responseSchema = {
  type: 'OBJECT',
  properties: Object.fromEntries(fields.map((field) => [field, { type: 'STRING' }])),
  required: fields,
};

const generate = async (model: string, params: LessonRequest, apiKey: string) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You are an educational assistant. Return only valid JSON matching the schema.' }] },
      contents: [{ role: 'user', parts: [{ text: createPrompt(params) }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 4500,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') throw new Error('Gemini returned no lesson content.');

  const lesson = JSON.parse(text);
  if (!fields.every((field) => typeof lesson[field] === 'string')) {
    throw new Error('Gemini returned an incomplete lesson note.');
  }
  return lesson;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const body = await request.json();
    if (!isValidRequest(body)) {
      return new Response(JSON.stringify({ error: 'Invalid lesson generation request.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

    let lastError: unknown;
    for (const model of models) {
      try {
        const lesson = await generate(model, body, apiKey);
        return new Response(JSON.stringify(lesson), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('AI generation failed.');
  } catch (error) {
    console.error('Lesson generation error:', error);
    return new Response(JSON.stringify({ error: 'Unable to generate a lesson note right now.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
