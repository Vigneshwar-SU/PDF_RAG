// State Management
class AppState {
    constructor() {
        this.documents = new Map();
        this.currentDocumentId = null;
        this.chatSessions = new Map();
        this.currentChatId = null;
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        this.applyTheme();
        this.loadFromStorage();
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
    }
    
    addDocument(file) {
        const id = Date.now().toString();
        const doc = {
            id,
            name: file.name,
            size: file.size,
            file,
            addedAt: new Date()
        };
        this.documents.set(id, doc);
        this.saveToStorage();
        return doc;
    }
    
    removeDocument(id) {
        this.documents.delete(id);
        if (this.currentDocumentId === id) {
            this.currentDocumentId = null;
        }
        this.saveToStorage();
    }
    
    setCurrentDocument(id) {
        this.currentDocumentId = id;
    }
    
    createChatSession() {
        const id = Date.now().toString();
        const session = {
            id,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            documentId: this.currentDocumentId
        };
        this.chatSessions.set(id, session);
        this.currentChatId = id;
        this.saveToStorage();
        return session;
    }
    
    addMessage(message, type) {
        const currentChat = this.chatSessions.get(this.currentChatId);
        if (currentChat) {
            const msg = {
                id: Date.now().toString(),
                text: message,
                type,
                timestamp: new Date()
            };
            currentChat.messages.push(msg);
            
            // Update chat title from first message
            if (currentChat.messages.length === 1 && type === 'user') {
                currentChat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            }
            
            this.saveToStorage();
            return msg;
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('chatSessions', JSON.stringify(Array.from(this.chatSessions.entries())));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const sessions = localStorage.getItem('chatSessions');
            if (sessions) {
                const parsed = JSON.parse(sessions);
                this.chatSessions = new Map(parsed);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    }
}

// Initialize app state
const appState = new AppState();

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const addPdfBtn = document.getElementById('addPdfBtn');
const uploadArea = document.getElementById('uploadArea');
const pdfInput = document.getElementById('pdfInput');
const documentsList = document.getElementById('documentsList');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const chatHeader = document.getElementById('chatHeader');
const welcomeContent = document.getElementById('welcomeContent');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const quickUpload = document.getElementById('quickUpload');

// Event Listeners
themeToggle.addEventListener('click', () => {
    appState.toggleTheme();
});

addPdfBtn.addEventListener('click', toggleUploadArea);
quickUpload.addEventListener('click', () => pdfInput.click());
pdfInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('click', () => pdfInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

newChatBtn.addEventListener('click', createNewChat);
messageInput.addEventListener('input', handleInputChange);
messageInput.addEventListener('keydown', handleKeydown);
sendBtn.addEventListener('click', sendMessage);

// Functions
function toggleUploadArea() {
    const isVisible = uploadArea.style.display !== 'none';
    uploadArea.style.display = isVisible ? 'none' : 'block';
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent)';
    uploadArea.style.background = 'rgba(0, 122, 255, 0.1)';
}

function handleDragLeave(e) {
    if (!uploadArea.contains(e.relatedTarget)) {
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.background = 'transparent';
    }
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'transparent';
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    files.forEach(addDocument);
    uploadArea.style.display = 'none';
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    files.forEach(addDocument);
    uploadArea.style.display = 'none';
    e.target.value = '';
}

function addDocument(file) {
    const doc = appState.addDocument(file);
    renderDocuments();
    selectDocument(doc.id);
}

function renderDocuments() {
    documentsList.innerHTML = '';
    
    appState.documents.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'document-item';
        if (doc.id === appState.currentDocumentId) {
            item.classList.add('selected');
        }
        
        // Add tooltip with full filename
        item.setAttribute('data-tooltip', doc.name);
        
        item.innerHTML = `
            <svg class="document-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <div class="document-info">
                <div class="document-name">${doc.name}</div>
                <div class="document-size">${formatFileSize(doc.size)}</div>
            </div>
            <button class="document-remove" onclick="removeDocument('${doc.id}')" data-tooltip="Remove document">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.document-remove')) {
                selectDocument(doc.id);
            }
        });
        
        documentsList.appendChild(item);
    });
}

function selectDocument(id) {
    appState.setCurrentDocument(id);
    renderDocuments();
    updateChatHeader();
    enableInput();
}

function removeDocument(id) {
    appState.removeDocument(id);
    renderDocuments();
    
    if (appState.documents.size === 0) {
        disableInput();
        showWelcome();
    }
}

// Make removeDocument globally accessible
window.removeDocument = removeDocument;

function createNewChat() {
    if (!appState.currentDocumentId) {
        alert('Please select a document first');
        return;
    }
    
    const session = appState.createChatSession();
    renderChatHistory();
    selectChat(session.id);
}

function renderChatHistory() {
    chatHistory.innerHTML = '';
    
    const sortedSessions = Array.from(appState.chatSessions.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    sortedSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'chat-history-item';
        if (session.id === appState.currentChatId) {
            item.classList.add('active');
        }
        
        // Add tooltip with full title
        item.setAttribute('data-tooltip', session.title);
        
        item.innerHTML = `
            <div class="chat-title">${session.title}</div>
            <div class="chat-time">${formatTime(session.createdAt)}</div>
        `;
        
        item.addEventListener('click', () => selectChat(session.id));
        chatHistory.appendChild(item);
    });
}

function selectChat(id) {
    appState.currentChatId = id;
    renderChatHistory();
    renderMessages();
    hideWelcome();
}

function renderMessages() {
    messages.innerHTML = '';
    const session = appState.chatSessions.get(appState.currentChatId);
    
    if (session && session.messages.length > 0) {
        session.messages.forEach(msg => {
            addMessageToDOM(msg.text, msg.type);
        });
    }
}

function updateChatHeader() {
    const doc = appState.documents.get(appState.currentDocumentId);
    if (doc) {
        chatHeader.innerHTML = `
            <h2>${doc.name}</h2>
            <p>Ask questions about this document</p>
        `;
    }
}

function enableInput() {
    messageInput.disabled = false;
    messageInput.placeholder = 'Ask about your documents...';
    updateSendButton();
}

function disableInput() {
    messageInput.disabled = true;
    messageInput.placeholder = 'Upload a PDF to start asking questions...';
    sendBtn.disabled = true;
}

function showWelcome() {
    welcomeContent.style.display = 'block';
    messages.style.display = 'none';
}

function hideWelcome() {
    welcomeContent.style.display = 'none';
    messages.style.display = 'block';
}

function handleInputChange() {
    autoResize(messageInput);
    updateSendButton();
}

function updateSendButton() {
    sendBtn.disabled = !appState.currentDocumentId || !messageInput.value.trim();
}

function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !appState.currentDocumentId) return;
    
    // Create new chat session if none exists
    if (!appState.currentChatId) {
        createNewChat();
    }
    
    // Add user message
    appState.addMessage(message, 'user');
    addMessageToDOM(message, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    updateSendButton();
    hideWelcome();
    
    // Add typing indicator
    const typingElement = addTypingIndicator();
    
    try {
        // Get current document
        const doc = appState.documents.get(appState.currentDocumentId);
        
        // Prepare form data
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('question', message);
        
        // Send request
        const response = await fetch('http://127.0.0.1:8000/upload-ask', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response from server');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingElement);
        
        // Add assistant response
        const answer = data.answer || 'Sorry, I could not find an answer.';
        appState.addMessage(answer, 'assistant');
        addMessageToDOM(answer, 'assistant');
        
        // Update chat history
        renderChatHistory();
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator(typingElement);
        
        const errorMsg = 'Sorry, there was an error processing your question. Please try again.';
        appState.addMessage(errorMsg, 'assistant');
        addMessageToDOM(errorMsg, 'assistant');
    }
}

function addMessageToDOM(text, type) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type} slideUp`;
    
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = text;
    
    messageEl.appendChild(contentEl);
    messages.appendChild(messageEl);
    
    // Scroll to bottom
    messages.scrollTop = messages.scrollHeight;
}

function addTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;
    
    return typingEl;
}

function removeTypingIndicator(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
}

// Initialize the app
function initApp() {
    renderDocuments();
    renderChatHistory();
    disableInput();
    
    if (appState.documents.size === 0) {
        showWelcome();
    }
}

// Start the app
initApp();
