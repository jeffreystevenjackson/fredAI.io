from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

import os
# ... other imports ...

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY") # Get from environment variable


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
            except Exception:
                suggestions = []

    suggestions.append({'suggestion': suggestion})
    with open(SUGGESTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(suggestions, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True, 'message': 'Thank you! Your suggestion has been received.'})


if __name__ == '__main__':
    app.run(debug=True)
