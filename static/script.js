// Base URL for your Flask application deployed on Render
const RENDER_BASE_URL = 'https://fredai-io.onrender.com';

let faqs = [];
let currentCategory = null;

document.addEventListener('DOMContentLoaded', function () {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            let activeTab = document.getElementById(this.dataset.tab + '-tab');
            activeTab.style.display = 'flex';
        });
    });

    // Add logo to header if not present
    const header = document.querySelector('.chatbot-header');
    if (!document.querySelector('.logo-img')) {
        const logo = document.createElement('img');
        // Updated to use absolute URL for logo.jpeg from Render
        logo.src = `${RENDER_BASE_URL}/static/logo.jpeg`;
        logo.alt = "Nocturne Opus Logo";
        logo.className = "logo-img";
        header.prepend(logo);
    }

    // Load FAQs from faq.json
    // Updated to use absolute URL for faq.json from Render
    fetch(`${RENDER_BASE_URL}/faq.json`)
        .then(resp => resp.json())
        .then(data => {
            faqs = data;
            showCategories();
            showGreeting();
        })
        .catch((error) => {
            console.error("Error loading FAQs:", error);
            document.getElementById('faq-list').innerHTML = "<div style='color:red;'>Could not load FAQs. Please try again later.</div>";
        });

    // Suggestion submit
    document.getElementById('suggestion-btn').addEventListener('click', function() {
        let val = document.getElementById('suggestion-input').value.trim();
        let msgDiv = document.getElementById('suggestion-message');
        msgDiv.textContent = "";
        if (val.length < 4) {
            msgDiv.textContent = "Please enter a longer suggestion.";
            msgDiv.style.color = "#c0392b";
            return;
        }
        // Updated to use absolute URL for submit_suggestion from Render
        fetch(`${RENDER_BASE_URL}/submit_suggestion`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({suggestion: val})
        })
        .then(res => res.json())
        .then(data => {
            msgDiv.textContent = data.message;
            msgDiv.style.color = "#0C483E";
            document.getElementById('suggestion-input').value = '';
        })
        .catch((error) => {
            console.error("Error submitting suggestion:", error);
            msgDiv.textContent = "Failed to submit. Please try again.";
            msgDiv.style.color = "#c0392b";
        });
    });

    // Event listeners for open-ended chat
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');

    sendChatBtn.addEventListener('click', sendOpenEndedMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendOpenEndedMessage();
        }
    });
});

// Function to send open-ended messages to Gemini API
async function sendOpenEndedMessage() {
    const chatInput = document.getElementById('chat-input');
    const userMessage = chatInput.value.trim();

    if (!userMessage) {
        return; // Don't send empty messages
    }

    addMessage(userMessage, 'user'); // Display user's message
    chatInput.value = ''; // Clear input field

    // Optionally add a loading indicator
    const loadingMessageId = 'loading-gemini-response';
    addMessage('Thinking...', 'bot', loadingMessageId); // Add a temporary loading message

    try {
        const response = await fetch(`${RENDER_BASE_URL}/chat_gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        // Remove loading message
        const loadingMsgDiv = document.getElementById(loadingMessageId);
        if (loadingMsgDiv) {
            loadingMsgDiv.remove();
        }

        if (response.ok) {
            addMessage(data.response, 'bot'); // Display Gemini's response
        } else {
            console.error("Error from Gemini API endpoint:", data.error || response.statusText);
            addMessage("Sorry, I couldn't process that. Please try again.", 'bot');
        }
    } catch (error) {
        console.error("Network or unexpected error calling Gemini API:", error);
        // Remove loading message
        const loadingMsgDiv = document.getElementById(loadingMessageId);
        if (loadingMsgDiv) {
            loadingMsgDiv.remove();
        }
        addMessage("It seems I'm having trouble connecting. Please check your internet or try again later.", 'bot');
    }
}


// Show greeting at start
function showGreeting() {
    addMessage('Hello, I’m Nocturne Opus Assistant. How can I help?', 'bot');
}

// Add a message bubble to chat
function addMessage(text, who = 'bot', id = null) {
    const chatArea = document.getElementById('chat-area');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${who}`;
    if (id) {
        msgDiv.id = id; // Set ID for loading message
    }
    if (who === 'bot') {
        msgDiv.innerHTML = `
            <!-- Updated to use absolute URL for avatar.png from Render -->
            <img src="${RENDER_BASE_URL}/static/avatar.png" alt="Bot Avatar" class="bot-avatar">
            <div class="bubble">${text}</div>
        `;
    } else {
        msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
    }
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}


// Show categories as buttons at the bottom
function showCategories() {
    currentCategory = null;
    const faqList = document.getElementById('faq-list');
    // Hide FAQ list if it's currently showing questions, to make room for chat input
    faqList.style.display = 'block'; // Ensure it's visible when showing categories
    faqList.innerHTML = `<div class="categories-container"></div>`;
    const container = faqList.querySelector('.categories-container');
    faqs.forEach(cat => {
        let btn = document.createElement('button');
        btn.className = "category-btn";
        btn.textContent = cat.category;
        btn.onclick = () => showQuestions(cat);
        container.appendChild(btn);
    });
}

// Show questions for a selected category
function showQuestions(categoryObj) {
    currentCategory = categoryObj.category;
    const faqList = document.getElementById('faq-list');
    faqList.innerHTML = `<div class="questions-container"></div>`;
    const container = faqList.querySelector('.questions-container');
    categoryObj.faqs.forEach(faq => {
        let btn = document.createElement('button');
        btn.className = "question-btn";
        btn.textContent = faq.question;
        btn.onclick = () => onUserSelectsQuestion(faq, categoryObj);
        container.appendChild(btn);
    });
    // Optionally add a back button to categories
    let backBtn = document.createElement('button');
    backBtn.className = "category-btn";
    backBtn.style.background = "var(--jolly-blue)";
    backBtn.style.color = "var(--white)";
    backBtn.textContent = "← Back to Categories";
    backBtn.onclick = showCategories;
    container.appendChild(backBtn);
}

// User selects a question
function onUserSelectsQuestion(faq, categoryObj) {
    addMessage(faq.question, 'user');
    // Display the answer immediately
    addMessage(faq.answer, 'bot');
    // Then show categories after a short delay
    setTimeout(() => {
        showCategories();
    }, 500);
}

