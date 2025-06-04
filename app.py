from flask import Flask, render_template, jsonify, request
import json
import os
from flask_cors import CORS # Import CORS

app = Flask(__name__)

# Initialize CORS for your app
# IMPORTANT: Replace 'https://your-shopify-store.myshopify.com' with your actual Shopify store URL.
# This allows requests from your Shopify store to your Render backend.
CORS(app, resources={r"/*": {"origins": "https://your-shopify-store.myshopify.com"}})


app.secret_key = os.getenv("SECRET_KEY")

FAQ_JSON = 'faq.json'
SUGGESTIONS_FILE = 'suggestions.json'  # To save suggestions (optional)


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


if __name__ == '__main__':
    app.run(debug=True)
