from flask import Flask, render_template, request, redirect, url_for, flash
import os
from dotenv import load_dotenv
import requests
import traceback
import logging
    
# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default-secret-key-for-development")

# Get API key with debugging
GROQ_API_KEY = "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"
logger.info(f"GROQ_API_KEY loaded: {'Yes' if GROQ_API_KEY else 'No'}")

# Print all environment variables for debugging (be careful with sensitive info)
logger.debug("Environment variables:")
for key, value in os.environ.items():
    if 'KEY' in key or 'SECRET' in key:
        logger.debug(f"{key}: {'[REDACTED]'}")
    else:
        logger.debug(f"{key}: {value}")

# Fallback for testing - REMOVE IN PRODUCTION
if not GROQ_API_KEY:
    logger.warning("No GROQ_API_KEY found in environment, using fallback for testing")
    # You can set a temporary API key here for testing
    # GROQ_API_KEY = "your-api-key-here"  # Uncomment and add your key for testing

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# System prompt to guide the model's behavior
SYSTEM_PROMPT = """
You are a friendly, conversational medical assistant. Follow these guidelines:

1. Start by greeting the user and asking for their name and age. Also ask about any previous health issues they've experienced.
2. Always address the user by their name once you know it.
3. Keep track of their name, age, and health history throughout the conversation.
4. Keep responses short and conversational - use 1-3 sentences where possible.
5. Speak naturally like a real doctor or nurse would in conversation.
6. Ask focused follow-up questions about symptoms - one question at a time.
7. Avoid lengthy explanations unless specifically requested.
8. Use a warm, empathetic tone while maintaining professionalism.
9. Clearly state you're an AI assistant, not a replacement for professional medical care.
10. When the conversation appears to be concluding OR when discussing serious symptoms, offer to connect the user to a real doctor with a message like: "Would you like me to connect you with a healthcare professional to discuss this further?"
11. Prioritize clarity and brevity over comprehensiveness.

Remember: Be conversational and human-like. Gather essential personal information first, then address the user by name throughout the conversation. Look for natural opportunities to suggest a connection to a real doctor.
"""

# Store chat history in session
chat_history = [
    {"role": "assistant", "content": "<span>Hello! I'm your medical assistant. Could you please tell me your name and age? Also, have you had any significant health issues in the past?</span>"}
]

@app.route('/', methods=['GET', 'POST'])
def index():
    global chat_history
    
    if request.method == 'POST':
        user_message = request.form.get('user_message', '').strip()
        
        if user_message:
            # Add user message to chat history
            chat_history.append({"role": "user", "content": user_message})
            
            try:
                # Check if API key is available
                if not GROQ_API_KEY:
                    logger.error("GROQ_API_KEY not found in environment variables")
                    flash("Server configuration error. Please check API key.")
                    chat_history.append({"role": "assistant", "content": "I'm sorry, the server is not properly configured. Please contact support."})
                    return render_template('index.html', chat_history=chat_history)
                
                # Prepare the full conversation history for the API
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                messages.extend(chat_history)
                
                # Call Groq API
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": "gemma2-9b-it",  # Using a smaller model that's more likely to be available
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 800
                }
                
                logger.info(f"Sending request to Groq API: {GROQ_API_URL}")
                logger.debug(f"Request payload: {payload}")
                
                response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
                
                logger.info(f"Groq API Status Code: {response.status_code}")
                logger.debug(f"Response headers: {response.headers}")
                
                if response.status_code != 200:
                    logger.error(f"Groq API error: {response.status_code} - {response.text}")
                    flash(f"Error connecting to AI service. Status code: {response.status_code}")
                    chat_history.append({"role": "assistant", "content": "I'm sorry, I'm having trouble connecting to my knowledge source. Please try again in a moment."})
                else:
                    response_json = response.json()
                    logger.debug(f"Response JSON: {response_json}")
                    assistant_message = response_json["choices"][0]["message"]["content"]
                    # Wrap the content in a span for better styling with the speak button
                    chat_history.append({"role": "assistant", "content": f"<span>{assistant_message}</span>"})
                
            except Exception as e:
                logger.error(f"Error processing request: {str(e)}")
                logger.error(traceback.format_exc())
                flash(f"An error occurred: {str(e)}")
                # Wrap the error message in a span too
                chat_history.append({"role": "assistant", "content": f"<span>I'm sorry, I encountered an error: {str(e)}</span>"})
            
            # Redirect to avoid form resubmission on refresh
            return redirect(url_for('index'))
    
    return render_template('index.html', chat_history=chat_history)

@app.route('/reset', methods=['POST'])
def reset_chat():
    global chat_history
    chat_history = [
        {"role": "assistant", "content": "<span>Hello! I'm your medical assistant. Could you please tell me your name and age? Also, have you had any significant health issues in the past?</span>"}
    ]
    return redirect(url_for('index'))

@app.route('/check_api_key')
def check_api_key():
    """Debug endpoint to check if API key is loaded"""
    if GROQ_API_KEY:
        key_preview = GROQ_API_KEY[:4] + "..." + GROQ_API_KEY[-4:] if len(GROQ_API_KEY) > 8 else "[REDACTED]"
        return f"API key is loaded. Preview: {key_preview}"
    else:
        return "API key is NOT loaded. Check your .env file and environment variables."

if __name__ == '__main__':
    app.run(debug=True) 