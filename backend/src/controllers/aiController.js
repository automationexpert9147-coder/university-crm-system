const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const callGroq = async (messages, options = {}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing in backend .env file');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Groq API request failed');
  }

  return data.choices?.[0]?.message?.content || '';
};

exports.askAI = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const systemPrompt = `You are an AI academic assistant for the University CRM System at the University of Agriculture Faisalabad (UAF).
Your role is to help students with:
- Explaining academic concepts and course material
- Study tips and learning strategies
- Academic guidance and career advice
- Understanding assignments and projects
- Quiz preparation and practice questions
- Performance improvement suggestions

Student context: ${context || 'General student query'}
User role: ${req.user.role}
User name: ${req.user.name}

Be concise, helpful, and academically appropriate. Use clear explanations with examples when needed.`;

    const aiText = await callGroq(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      { max_tokens: 1024 }
    );

    res.json({
      success: true,
      response: aiText,
    });
  } catch (err) {
    console.error('AI ask error:', err.message);
    res.status(500).json({
      success: false,
      message: 'AI service unavailable. ' + err.message,
    });
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty, numQuestions } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required',
      });
    }

    const prompt = `Generate ${numQuestions || 5} multiple choice quiz questions about "${topic}" at ${difficulty || 'medium'} difficulty level.

Format each question as JSON like this:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Return ONLY valid JSON, no extra text.`;

    const aiText = await callGroq(
      [{ role: 'user', content: prompt }],
      { max_tokens: 2048, temperature: 0.5 }
    );

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate quiz JSON',
      });
    }

    const quiz = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      quiz,
    });
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Quiz generation failed. ' + err.message,
    });
  }
};

exports.analyzePerformance = async (req, res) => {
  try {
    const { grades, attendance, submissions } = req.body;

    const prompt = `Analyze this student's academic performance and provide personalized recommendations:

Grades: ${JSON.stringify(grades)}
Attendance: ${JSON.stringify(attendance)}
Assignment Submissions: ${JSON.stringify(submissions)}

Provide:
1. Overall performance assessment
2. 3 specific strengths
3. 3 areas for improvement with actionable tips
4. Study plan recommendation
5. Motivational message

Keep the response concise and actionable.`;

    const aiText = await callGroq(
      [{ role: 'user', content: prompt }],
      { max_tokens: 1024 }
    );

    res.json({
      success: true,
      analysis: aiText,
    });
  } catch (err) {
    console.error('Performance analysis error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Performance analysis failed. ' + err.message,
    });
  }
};