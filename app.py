from flask import Flask, render_template, jsonify, request
import json
import os
from flask_cors import CORS # Import CORS
import requests # Import requests library for making HTTP calls

app = Flask(__name__)

# Initialize CORS for your app
# IMPORTANT: Temporarily allowing all origins (*) for debugging purposes.
# In production, consider explicitly listing all valid Shopify domains (e.g., "https://yourcustomdomain.com", "https://impactventurescologne.myshopify.com").
CORS(app, resources={r"/*": {"origins": "*"}})


app.secret_key = os.getenv("SECRET_KEY")

FAQ_JSON = 'faq.json'
SUGGESTIONS_FILE = 'suggestions.json'  # To save suggestions (optional)

# Gemini API configuration
# IMPORTANT: The API key should be provided via environment variables in production.
# For local development, you might set it directly or via a .env file.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/faq.json')
def faq():
    with open(FAQ_JSON, encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/submit_suggestion', methods=['POST'])
def submit_suggestion():
    data = request.json
    suggestion = data.get('suggestion', '').strip()
    if len(suggestion) < 4:
        return jsonify({'success': False, 'message': 'Please enter a longer suggestion.'}), 400

    # Optional: Save suggestions to a JSON file
    if not os.path.exists(SUGGESTIONS_FILE):
        suggestions = []
    else:
        with open(SUGGESTIONS_FILE, 'r', encoding='utf-8') as f:
            try:
                suggestions = json.load(f)
            except json.JSONDecodeError:
                # Handle case where file exists but is empty or not valid JSON
                suggestions = []
            except Exception:
                # Catch any other unexpected errors during file reading
                suggestions = []


    suggestions.append({'suggestion': suggestion})
    with open(SUGGESTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(suggestions, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True, 'message': 'Thank you! Your suggestion has been received.'})


@app.route('/chat_gemini', methods=['POST'])
def chat_gemini():
    """
    Handles open-ended questions from the chatbot frontend and sends them to the Gemini API.
    """
    user_message = request.json.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_message}]
                }
            ]
        }
        headers = {
            'Content-Type': 'application/json'
        }
        # Append API key to URL if it's provided, otherwise Canvas will inject it
        api_url_with_key = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}" if GEMINI_API_KEY else GEMINI_API_URL

        response = requests.post(api_url_with_key, headers=headers, json=payload)
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        gemini_response = response.json()

        # Extract the text from the Gemini API response
        if gemini_response and gemini_response.get('candidates'):
            first_candidate = gemini_response['candidates'][0]
            if first_candidate.get('content') and first_candidate['content'].get('parts'):
                first_part = first_candidate['content']['parts'][0]
                if first_part.get('text'):
                    return jsonify({'response': first_part['text']})
        
        return jsonify({'error': 'Could not get a valid response from Gemini API', 'details': gemini_response}), 500

    except requests.exceptions.RequestException as e:
        print(f"Request to Gemini API failed: {e}")
        return jsonify({'error': 'Failed to connect to AI service', 'details': str(e)}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

if __name__ == '__main__':
    app.run(debug=True)
