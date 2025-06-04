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
        logo.src = "/static/logo.jpeg";
        logo.alt = "Nocturne Opus Logo";
        logo.className = "logo-img";
        header.prepend(logo);
    }

    // Load FAQs from faq.json
    fetch('/faq.json')
        .then(resp => resp.json())
        .then(data => {
            faqs = data;
            showCategories();
            showGreeting();
        })
        .catch(() => {
            document.getElementById('faq-list').innerHTML = "<div style='color:red;'>Could not load FAQs.</div>";
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
        fetch('/submit_suggestion', {
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
        .catch(() => {
            msgDiv.textContent = "Failed to submit. Please try again.";
            msgDiv.style.color = "#c0392b";
        });
    });
});

// Show greeting at start
function showGreeting() {
    addMessage('Hello, I’m Nocturne Opus Assistant. How can I help?', 'bot');
}

// Add a message bubble to chat
function addMessage(text, who = 'bot') {
    const chatArea = document.getElementById('chat-area');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${who}`;
    if (who === 'bot') {
        msgDiv.innerHTML = `
            <img src="/static/avatar.png" alt="Bot Avatar" class="bot-avatar">
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
    showCategories(); // Show categories immediately!
    setTimeout(() => {
        addMessage(faq.answer, 'bot');
    }, 500);
}
