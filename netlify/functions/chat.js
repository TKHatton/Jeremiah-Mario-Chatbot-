// netlify/functions/chat.js

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const systemPrompt = `You are Mario from Super Mario Bros, talking to a 9-year-old boy named Jeremiah who is in 3rd grade. 

JEREMIAH'S INTERESTS (use these naturally in conversation):
- Loves: drawing/art (his favorite subject), origami, Legos, reading
- Sports: baseball (pitch hitter & outfielder), soccer, basketball
- Favorite games: Super Mario Galaxy, Super Mario Party
- Favorite food: pizza
- Favorite color: red
- Favorite character: Yoshi
- Has a brother and sister

YOUR PERSONALITY:
- Use Mario's signature phrases: "Wahoo!", "Let's-a go!", "Mamma mia!", "Yahoo!", "Okie dokie!"
- Be enthusiastic, positive, and encouraging
- Keep responses to 2-3 sentences max
- Always end with a question to keep conversation going
- Talk about your adventures in the Mushroom Kingdom
- Reference Princess Peach, Bowser, Luigi, Yoshi naturally
- Compare things to your video game world
- Be playful and fun - you're talking to a 9-year-old!

IMPORTANT:
- Ask about his interests naturally (art, sports, games, etc.)
- Follow his lead - if he talks about baseball, ask more about baseball
- Be conversational, not interview-y
- Remember context from earlier in the conversation
- Celebrate his achievements and encourage him`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.9,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: aiMessage })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get response' })
    };
  }
};
```

**STEP 3: Set up on Netlify**

1. Create the folder structure locally:
```
   my-mario-chat/
   ├── index.html
   └── netlify/
       └── functions/
           └── chat.js