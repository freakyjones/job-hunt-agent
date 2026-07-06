export const fetchBaseResume = async (supabase: any, userId: string) => {
  const { data: baseResume, error: resumeError } = await supabase
    .from('base_resumes')
    .select('extracted_content')
    .eq('user_id', userId)
    .single();

  if (resumeError || !baseResume?.extracted_content) {
    throw new Error('No base resume found for this user.');
  }

  return baseResume;
};

export const fetchJobContext = async (supabase: any, userId: string, jobId?: string) => {
  let jobDescription = '';
  let roleName = 'Senior Software Engineer';
  let existingQuestionsText = '';

  if (jobId) {
    const { data: jobInfo } = await supabase
      .from('jobs')
      .select('description, role, company')
      .eq('id', jobId)
      .single();
    if (jobInfo) {
      roleName = jobInfo.role || roleName;
      jobDescription = `Role: ${jobInfo.role} at ${jobInfo.company}\nDescription: ${jobInfo.description}`;
    }

    const existingExamsQuery = supabase.from('exams').select('id').eq('user_id', userId);

    existingExamsQuery.eq('job_id', jobId);

    const { data: existingExams } = await existingExamsQuery;

    if (existingExams && existingExams.length > 0) {
      const examIds = existingExams.map((e: any) => e.id);
      const { data: previousQuestions } = await supabase
        .from('exam_questions')
        .select('question_text')
        .in('exam_id', examIds);

      if (previousQuestions && previousQuestions.length > 0) {
        existingQuestionsText = previousQuestions.map((q: any) => q.question_text).join('\n- ');
      }
    }
  }

  return { jobDescription, roleName, existingQuestionsText };
};

export const generateExamQuestions = async (
  apiKey: string,
  baseResume: any,
  jobContext: any,
  jobId?: string
) => {
  const { jobDescription, roleName, existingQuestionsText } = jobContext;

  const focusAreas = [
    'System Design and Scale Frameworks',
    'Under-the-hood performance optimization and memory bottlenecks',
    'Hard behavioral scenarios and conflict resolution in engineering teams',
    'Security vulnerabilities, edge-case debugging, and data integrity',
  ];

  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % focusAreas.length;
  const randomFocus = focusAreas[randomIndex];

  let prompt = '';
  if (jobId) {
    prompt = `You are a Principal Technical Assessor and expert interviewer evaluating candidates for a ${roleName} role.

TARGET JOB CONTEXT:
---
${jobDescription || 'Focus on advanced, industry-standard technical requirements and challenges for this specific role.'}
---

${baseResume?.extracted_content ? `CANDIDATE CONTEXT:\n${baseResume.extracted_content}\n` : ''}

TASK:
Generate exactly 5 advanced, scenario-based multiple-choice questions. 
Base the scenarios heavily on the TARGET JOB CONTEXT to assess practical, on-the-job problem solving.

CRITICAL CONSTRAINT - FOCUS AREA: ${randomFocus}
Every question MUST strictly test deep technical knowledge, edge cases, or architectural trade-offs within this specific focus area.

${existingQuestionsText ? `ANTI-HISTORY EXCLUSION LIST:\nEnsure your new questions are semantically distinct and do NOT test the same concepts as these previously asked questions:\n- ${existingQuestionsText}\n\n` : ''}

FORMATTING REQUIREMENTS:
- Frame questions as real-world scenarios or code/architecture dilemmas rather than basic trivia.
- Output ONLY a valid JSON array of exactly 5 objects. Do not include markdown code blocks.`;
  } else {
    prompt = `You are a Principal Technical Assessor and expert interviewer evaluating a software engineering candidate.

CANDIDATE RESUME CONTEXT:
---
${baseResume?.extracted_content || 'Evaluate generic advanced software engineering concepts.'}
---

TASK:
Generate exactly 5 advanced, scenario-based multiple-choice questions. 
Base the scenarios heavily on the CANDIDATE RESUME CONTEXT to assess the depth of their actual experience and skills.

CRITICAL CONSTRAINT - FOCUS AREA: ${randomFocus}
Every question MUST strictly test deep technical knowledge, edge cases, or architectural trade-offs related to the technologies explicitly mentioned in the resume. Do not assume outside knowledge, but test advanced usage of the skills they list.

${existingQuestionsText ? `ANTI-HISTORY EXCLUSION LIST:\nEnsure your new questions are semantically distinct and do NOT test the same concepts as these previously asked questions:\n- ${existingQuestionsText}\n\n` : ''}

FORMATTING REQUIREMENTS:
- Frame questions as real-world scenarios or code/architecture dilemmas rather than basic trivia.
- Output ONLY a valid JSON array of exactly 5 objects. Do not include markdown code blocks.`;
  }

  const responseSchema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        question: { type: 'STRING' },
        options: { type: 'ARRAY', items: { type: 'STRING' } },
        correct_option: { type: 'STRING' },
        explanation: { type: 'STRING' },
      },
      required: ['question', 'options', 'correct_option', 'explanation'],
    },
  };

  const tryModel = async (modelName: string) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.85,
            topP: 0.95,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error('Empty response from model');

    const cleaned = textResponse
      .replaceAll(/```json/gi, '')
      .replaceAll(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  };

  let parsedQuestions: any[] = [];
  try {
    console.log('[Worker] Calling gemini-2.5-flash...');
    parsedQuestions = await tryModel('gemini-2.5-flash');
    console.log('[Worker] gemini-2.5-flash succeeded!');
  } catch (e) {
    console.warn('[Worker] Primary model failed, falling back to gemma-4-31b-it', e);
    console.log('[Worker] Calling gemma-4-31b-it...');
    parsedQuestions = await tryModel('gemma-4-31b-it');
    console.log('[Worker] gemma-4-31b-it succeeded!');
  }

  if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
    throw new Error('AI returned an empty or invalid questions array.');
  }

  return parsedQuestions;
};

export const saveExamToDatabase = async (
  supabase: any,
  userId: string,
  jobId: string | undefined,
  parsedQuestions: any[]
) => {
  console.log('[Worker] Starting DB inserts...');
  const { data: newExam, error: examError } = await supabase
    .from('exams')
    .insert({
      user_id: userId,
      job_id: jobId || null,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (examError || !newExam) {
    throw new Error(`Failed to create exam record: ${examError?.message}`);
  }

  const examId = newExam.id;

  for (const q of parsedQuestions) {
    const qText = q.question || q.Question || '';
    const qOpts = q.options || q.Options || q.choices || [];
    const qCorrect = q.correct_option || q.correctOption || q.answer || '';
    const qExpl = q.explanation || q.Explanation || '';

    const { data: questionData, error: qError } = await supabase
      .from('exam_questions')
      .insert({
        exam_id: examId,
        question_text: qText,
        options: qOpts,
      })
      .select('id')
      .single();

    if (qError || !questionData) {
      console.error('[Worker] Error inserting question', JSON.stringify(qError));
      continue;
    }

    const { error: aError } = await supabase.from('exam_answers').insert({
      question_id: questionData.id,
      correct_option: qCorrect,
      explanation: qExpl,
    });

    if (aError) {
      console.error('[Worker] Error inserting answer', JSON.stringify(aError));
    }
  }

  return examId;
};
