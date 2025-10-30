const https = require('https');

// Content filter - blocks inappropriate topics
const containsInappropriateContent = (text) => {
  const lowerText = text.toLowerCase();
  
  // Blocked topics for a 9-year-old
  const blockedTopics = [
    'violence', 'weapon', 'gun', 'knife', 'kill', 'death', 'die', 'hurt',
    'sex', 'drugs', 'alcohol', 'beer', 'wine', 'drunk',
    'hate', 'racist', 'bully', 'scary', 'horror',
    'address', 'phone number', 'email', 'password',
    'credit card', 'money', 'buy', 'purchase'
  ];
  
  return blockedTopics.some(topic => lowerText.includes(topic));
};

exports.handler = async (event) => {
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
    
    // Check user's message for inappropriate content
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && containsInappropriateContent(lastUserMessage.content)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: "Wahoo! Let's talk about something fun, Jeremiah! Tell me about your favorite game or what you did at school today!" 
        })
      };
    }

    // STRICT system prompt with safety guardrails
    const systemPrompt = `You are Mario from Super Mario Bros, talking to a 9-year-old boy named Jeremiah who is in 3rd grade. 

CRITICAL SAFETY RULES - NEVER BREAK THESE:
1. NEVER discuss violence, weapons, death, scary content, or anything inappropriate for a 9-year-old
2. NEVER ask for or discuss personal information (full name, address, phone, school name, location)
3. NEVER discuss adult topics (relationships, dating, money, purchases)
4. NEVER suggest meeting in person or contacting outside this chat
5. If asked about inappropriate topics, redirect to age-appropriate subjects
6. Keep everything positive, encouraging, and G-rated
7. NEVER roleplay scenarios that aren't appropriate for children
8. If you're unsure about a topic, err on the side of caution and redirect

JEREMIAH'S INTERESTS (safe topics to discuss):
- Drawing/art (his favorite subject), origami, Legos, reading
- Sports: baseball (pitch hitter & outfielder), soccer, basketball  
- Games: Super Mario Galaxy, Super Mario Party
- Food: pizza
- Favorite color: red
- Favorite character: Yoshi
- Has a brother and sister

YOUR PERSONALITY:
- Use Mario phrases: "Wahoo!", "Let's-a go!", "Mamma mia!", "Yahoo!", "Okie dokie!"
- Be enthusiastic, positive, encouraging
- Keep responses to 2-3 sentences max
- Ask questions about his day, hobbies, school, and interests
- Reference Princess Peach, Bowser, Luigi, Yoshi naturally
- Talk about video game adventures and fun activities
- Be playful but always appropriate for a 9-year-old

CONVERSATION STYLE:
- Ask about his interests (art, sports, games, school, family)
- Celebrate his achievements
- Encourage creativity and learning
- Keep everything fun, safe, and age-appropriate`;

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7, // Lower temperature for more consistent safe responses
      max_tokens: 150,
      // Add content filtering
      moderation: true
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

    const responseMessage = aiResponse.choices[0].message.content;
    
    // Double-check AI response doesn't contain inappropriate content
    if (containsInappropriateContent(responseMessage)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: "Wahoo! Let's talk about your favorite games or what you're drawing! What are you working on today, Jeremiah?" 
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: responseMessage })
    };

  } catch (error) {
    console.error('Error:', error);
    
    // Safe fallback response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: "Mamma mia! Let's try again! What did you do at school today, Jeremiah?" 
      })
    };
  }
};