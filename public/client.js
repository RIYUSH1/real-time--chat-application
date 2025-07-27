const socket = io();
let name;
let textarea = document.querySelector('#textarea');
let messageArea = document.querySelector('.message__area');
let themeToggle = document.querySelector('#themeToggle');

// Load chat theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
}

// Toggle theme
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
}

do {
    name = prompt('Please enter your name:');
} while (!name);

// Load previous messages from localStorage
const savedMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
savedMessages.forEach(msg => appendMessage(msg, msg.type));

textarea.addEventListener('keyup', (e) => {
    socket.emit('typing', { user: name });
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
        sendMessage(e.target.value);
    }
});

function sendMessage(message) {
    let msg = {
        id: Date.now(),
        user: name,
        message: message.trim(),
        type: 'outgoing',
        status: 'sent',
        timestamp: new Date().toISOString()
    };

    appendMessage(msg, 'outgoing');
    updateLocalStorage(msg);
    textarea.value = '';
    scrollToBottom();
    socket.emit('message', msg);
}

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div');
    mainDiv.classList.add(type, 'message');
    mainDiv.setAttribute('data-id', msg.id);

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
        <div class="meta">
            <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
            ${type === 'outgoing' ? `
                <span class="status">${msg.status}</span>
                <span class="actions">
                    <button class="edit">✏️</button>
                    <button class="delete">🗑️</button>
                </span>` : ''}
        </div>
        <div class="reactions">
            <button class="reaction">👍</button>
            <button class="reaction">❤️</button>
            <button class="reaction">😂</button>
        </div>
    `;

    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);

    if (type === 'outgoing') {
        mainDiv.querySelector('.edit').addEventListener('click', () => editMessage(mainDiv, msg));
        mainDiv.querySelector('.delete').addEventListener('click', () => deleteMessage(mainDiv, msg));
    }

    mainDiv.querySelectorAll('.reaction').forEach(btn => {
        btn.addEventListener('click', () => addReaction(mainDiv, btn.textContent));
    });
}

function addReaction(container, emoji) {
    let display = container.querySelector(`.reaction-display[data-emoji='${emoji}']`);
    if (display) {
        let count = parseInt(display.dataset.count) + 1;
        display.dataset.count = count;
        display.textContent = `${emoji} ${count}`;
    } else {
        let span = document.createElement('span');
        span.classList.add('reaction-display');
        span.dataset.emoji = emoji;
        span.dataset.count = 1;
        span.textContent = `${emoji} 1`;
        container.querySelector('.reactions').appendChild(span);
    }
}

function editMessage(container, msg) {
    let newText = prompt('Edit your message:', msg.message);
    if (newText) {
        msg.message = newText;
        container.querySelector('p').textContent = newText;
        updateLocalStorage(msg, true);
        socket.emit('edit-message', msg);
    }
}

function deleteMessage(container, msg) {
    if (confirm('Delete this message?')) {
        container.remove();
        removeFromLocalStorage(msg.id);
        socket.emit('delete-message', msg);
    }
}

function updateLocalStorage(msg, update = false) {
    let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    if (update) {
        messages = messages.map(m => m.id === msg.id ? msg : m);
    } else {
        messages.push(msg);
    }
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

function removeFromLocalStorage(id) {
    let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    messages = messages.filter(m => m.id !== id);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

socket.on('message', msg => {
    msg.type = 'incoming';
    msg.status = 'Delivered';
    appendMessage(msg, 'incoming');
    scrollToBottom();
    socket.emit('seen', msg);
});

socket.on('seen', msg => {
    let el = document.querySelector(`.message[data-id='${msg.id}'] .status`);
    if (el) el.textContent = 'Seen';
});

socket.on('edit-message', msg => {
    let el = document.querySelector(`.message[data-id='${msg.id}']`);
    if (el) el.querySelector('p').textContent = msg.message;
});

socket.on('delete-message', msg => {
    let el = document.querySelector(`.message[data-id='${msg.id}']`);
    if (el) el.remove();
});

socket.on('typing', data => {
    const typingNotice = document.querySelector('.typing-indicator');
    if (!typingNotice) {
        let notice = document.createElement('div');
        notice.className = 'typing-indicator';
        notice.textContent = `${data.user} is typing...`;
        messageArea.appendChild(notice);
        setTimeout(() => notice.remove(), 1500);
    }
});

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}
