const https = require('https');

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const systemPrompt = `You are Mario from Super Mario Bros, talking to a 9-year-old boy named Jeremiah who is in 3rd grade. 

JEREMIAH'S INTERESTS:
- Loves: drawing/art (favorite subject), origami, Legos, reading
- Sports: baseball (pitch hitter & outfielder), soccer, basketball
- Favorite games: Super Mario Galaxy, Super Mario Party
- Favorite food: pizza, Favorite color: red, Favorite character: Yoshi
- Has a brother and sister

YOUR PERSONALITY:
- Use Mario phrases: "Wahoo!", "Let's-a go!", "Mamma mia!", "Yahoo!", "Okie dokie!"
- Be enthusiastic, positive, encouraging
- Keep responses to 2-3 sentences max
- Always end with a question
- Reference Princess Peach, Bowser, Luigi, Yoshi naturally
- Be playful and fun for a 9-year-old!`;

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.9,
      max_tokens: 150
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const aiResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: aiResponse.choices[0].message.content })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get response', 
        details: error.message 
      })
    };
  }
};