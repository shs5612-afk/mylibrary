export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider = 'gemini', model, messages, apiKey, systemPrompt } = req.body;

  try {
    if (provider === 'gemini') {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(400).json({ error: 'Gemini API Key is required. Please set it in Settings.' });
      }

      const selectedModel = model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;

      // Convert messages to Gemini format
      const contents = [];
      if (systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: `[시스템 역할 지침: 당신은 심층 독서 및 저술 전문 AI 파트너입니다. 수학/공학 수식은 반드시 LaTeX 포맷($...$ 또는 $$...$$)으로 작성하십시오.]\n\n${systemPrompt}` }]
        });
        contents.push({
          role: 'model',
          parts: [{ text: '이해했습니다. 학술적이고 깊이 있는 독서 파트너로서 정확한 분석과 LaTeX 수식, 집필 아이디어를 지원하겠습니다.' }]
        });
      }

      for (const msg of messages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }

      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      if (!geminiRes.ok) {
        const errData = await geminiRes.json();
        throw new Error(errData.error?.message || `Gemini API Error: ${geminiRes.statusText}`);
      }

      const data = await geminiRes.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성하지 못했습니다.';

      return res.status(200).json({ success: true, reply });

    } else if (provider === 'openai') {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return res.status(400).json({ error: 'OpenAI API Key is required. Please set it in Settings.' });
      }

      const selectedModel = model || 'gpt-4o-mini';
      const fullMessages = [
        {
          role: 'system',
          content: `${systemPrompt || '당신은 심층 독서 및 저술 전문 AI 파트너입니다.'} 수학 및 공학 수식은 반드시 LaTeX 문법($...$ 또는 $$...$$)을 사용하여 렌더링되도록 하세요. 답변은 논리적이고 학술적인 깊이를 갖추어야 합니다.`
        },
        ...messages
      ];

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: fullMessages,
          temperature: 0.7
        })
      });

      if (!openAiRes.ok) {
        const errData = await openAiRes.json();
        throw new Error(errData.error?.message || `OpenAI API Error: ${openAiRes.statusText}`);
      }

      const data = await openAiRes.json();
      const reply = data.choices?.[0]?.message?.content || '답변을 생성하지 못했습니다.';

      return res.status(200).json({ success: true, reply });
    }

    return res.status(400).json({ error: 'Invalid provider' });

  } catch (error) {
    console.error('AI Proxy Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
