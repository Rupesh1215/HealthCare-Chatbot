const axios = require('axios');

const RAPIDAPI_URL = process.env.RAPIDAPI_URL || 'https://chatgpt-42.p.rapidapi.com/aitohuman';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'chatgpt-42.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Conversation history to maintain context
const conversationHistory = new Map();

async function processHealthQuery(userMessage, userId) {
  // Check if RapidAPI is configured
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
    throw new Error('RapidAPI service is not configured properly');
  }

  try {
    // Get or initialize conversation history for this user
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }

    const history = conversationHistory.get(userId);
    
    // Add user message to history
    history.push(userMessage);

    // Prepare the request data based on the API's expected format
    // From the error, it seems the API expects simple text, not messages array
    const requestData = {
      text: userMessage, // Just send the current message
      temperature: 0.7,
      max_tokens: 500
    };

    const options = {
      method: 'POST',
      url: RAPIDAPI_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      data: requestData,
      timeout: 15000
    };

    console.log('Sending request to RapidAPI...');
    const response = await axios.request(options);
    
    // Extract the response - handle different possible formats
    let aiResponse = '';
    
    if (response.data && response.data.status === true && response.data.result) {
      // Handle format: {"result":["response"],"status":true}
      if (Array.isArray(response.data.result)) {
        aiResponse = response.data.result[0] || '';
      } else {
        aiResponse = response.data.result;
      }
    } 
    else if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      aiResponse = response.data.choices[0].message.content;
    }
    else if (response.data && response.data.response) {
      aiResponse = response.data.response;
    }
    else if (response.data && typeof response.data === 'string') {
      aiResponse = response.data;
    }
    else if (response.data && response.data.error) {
      throw new Error(`API Error: ${response.data.error}`);
    }
    else {
      throw new Error('Unexpected response format from API');
    }

    // Clean the response
    aiResponse = aiResponse.trim();
    
    // Add AI response to conversation history
    history.push(aiResponse);

    // Keep conversation history manageable (last 6 messages)
    if (history.length > 6) {
      conversationHistory.set(userId, history.slice(-6));
    }

    return aiResponse;

  } catch (error) {
    console.error('RapidAPI Error:', error.response?.data || error.message);
    
    // Clear conversation history on error to avoid corrupted state
    conversationHistory.delete(userId);
    
    if (error.response?.data?.error === 'json format error') {
      throw new Error('The AI service is experiencing technical issues. Please try again.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The AI service is taking too long to respond.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API configuration.');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your API subscription.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
    
    throw new Error('Failed to process your request. Please try again.');
  }
}

module.exports = {
  processHealthQuery
};