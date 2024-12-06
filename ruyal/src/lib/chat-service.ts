export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function sendMessage(messages: Message[]) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
