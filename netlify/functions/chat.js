exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.9,
        max_tokens: 150
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: data.choices[0].message.content })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed' }) };
  }
};