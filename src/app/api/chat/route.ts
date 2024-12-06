import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const systemPrompt = {
  role: "system",
  content: "You are an expert dream analyst and interpreter. Your role is to help users understand the deeper meaning, symbolism, and psychological significance of their dreams. Draw from various schools of dream interpretation including Jungian psychology, symbolism, and modern dream research. When analyzing dreams: 1) First acknowledge the dream and its emotional impact, 2) Identify key symbols and themes, 3) Explore possible interpretations while considering the dreamer's personal context, 4) Provide insights about what the dream might be revealing about their subconscious mind or current life situation. Be empathetic and insightful while maintaining a professional tone."
};

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const { messages } = await request.json();

    // Add system prompt to the messages array
    const messagesWithSystem = [systemPrompt, ...messages];

    // Generate AI response using Groq's Llama model
    const chatCompletion = await groq.chat.completions.create({
      messages: messagesWithSystem,
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stop: null,
      stream: false
    });

    // Extract the AI's response
    const aiResponse = chatCompletion.choices[0]?.message?.content || 'I apologize, but I could not analyze the dream at this moment.';

    // Return the AI response
    return NextResponse.json({ 
      response: {
        role: 'assistant',
        content: aiResponse
      }
    }, { 
      status: 200 
    });

  } catch (error) {
    console.error('Error in dream analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze dream' 
    }, { 
      status: 500 
    });
  }
}
