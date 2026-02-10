// State management
let uploadedDocuments = [];
let queryCount = 0;

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUploadArea();
    initializeTextArea();
    loadDocuments();
});

// Upload Area Initialization
function initializeUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handleFileUpload(files[0]);
        } else {
            showUploadStatus('Please upload a valid PDF file', 'error');
        }
    });
}

// Handle file upload
async function handleFileUpload(file) {
    if (!file.type.includes('pdf')) {
        showUploadStatus('Please upload a PDF file', 'error');
        return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showUploadStatus('File size exceeds 50MB limit', 'error');
        return;
    }

    showUploadStatus('Uploading...', 'loading');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showUploadStatus('✓ Upload successful!', 'success');
            
            // Add document to list
            addDocument(file.name);
            
            // Clear file input
            document.getElementById('fileInput').value = '';
            
            // Hide status after 3 seconds
            setTimeout(() => {
                hideUploadStatus();
            }, 3000);
        } else {
            showUploadStatus('Upload failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showUploadStatus('Network error. Please try again.', 'error');
    }
}

// Show upload status
function showUploadStatus(message, type) {
    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = message;
    statusEl.className = `upload-status ${type}`;
}

// Hide upload status
function hideUploadStatus() {
    const statusEl = document.getElementById('uploadStatus');
    statusEl.classList.add('hidden');
}

// Add document to list
function addDocument(filename) {
    const document = {
        name: filename,
        date: new Date().toLocaleString()
    };

    uploadedDocuments.unshift(document);
    updateDocumentsList();
    updateStats();
}

// Update documents list
function updateDocumentsList() {
    const listEl = document.getElementById('documentsList');
    
    if (uploadedDocuments.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p>No documents uploaded yet</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = uploadedDocuments.map((doc, index) => `
        <div class="document-item ${index === 0 ? 'active' : ''}" onclick="selectDocument(${index})">
            <div class="document-name">${doc.name}</div>
            <div class="document-date">${doc.date}</div>
        </div>
    `).join('');
}

// Select document
function selectDocument(index) {
    const items = document.querySelectorAll('.document-item');
    items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Load documents (from localStorage or initial state)
function loadDocuments() {
    const saved = localStorage.getItem('uploadedDocuments');
    if (saved) {
        uploadedDocuments = JSON.parse(saved);
        updateDocumentsList();
    }
    
    const savedQueryCount = localStorage.getItem('queryCount');
    if (savedQueryCount) {
        queryCount = parseInt(savedQueryCount);
    }
    
    updateStats();
}

// Save documents to localStorage
function saveDocuments() {
    localStorage.setItem('uploadedDocuments', JSON.stringify(uploadedDocuments));
    localStorage.setItem('queryCount', queryCount.toString());
}

// Update statistics
function updateStats() {
    document.getElementById('docCount').textContent = uploadedDocuments.length;
    document.getElementById('queryCount').textContent = queryCount;
    saveDocuments();
}

// Initialize textarea auto-resize
function initializeTextArea() {
    const textarea = document.getElementById('questionInput');
    
    textarea.addEventListener('input', () => {
        autoResizeTextarea(textarea);
    });

    // Handle Enter key
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    });
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Set question in input
function setQuestion(question) {
    const input = document.getElementById('questionInput');
    input.value = question;
    autoResizeTextarea(input);
    input.focus();
}

// Clear chat
function clearChat() {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
            </div>
            <h2>Welcome to PDF RAG Assistant</h2>
            <p>Upload a PDF document and start asking questions. I'll help you find answers using advanced AI.</p>
            <div class="example-questions">
                <p class="example-title">Try asking:</p>
                <button class="example-btn" onclick="setQuestion('What is the main topic of this document?')">
                    What is the main topic of this document?
                </button>
                <button class="example-btn" onclick="setQuestion('Summarize the key points')">
                    Summarize the key points
                </button>
                <button class="example-btn" onclick="setQuestion('What are the main conclusions?')">
                    What are the main conclusions?
                </button>
            </div>
        </div>
    `;
}

// Add message to chat
function addMessage(text, sender) {
    const chatBox = document.getElementById('chatBox');
    
    // Remove welcome message if present
    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatarIcon = sender === 'user' 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${avatarIcon}
            </svg>
        </div>
        <div class="message-content">
            <div class="message-sender">${sender === 'user' ? 'You' : 'AI Assistant'}</div>
            <div class="message-text">${escapeHtml(text)}</div>
        </div>
    `;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Add loading indicator
function addLoadingIndicator() {
    const chatBox = document.getElementById('chatBox');
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot';
    loadingDiv.id = 'loading-message';
    
    loadingDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-sender">AI Assistant</div>
            <div class="message-text">
                <div class="loading-indicator">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Remove loading indicator
function removeLoadingIndicator() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// Ask question
async function askQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();
    const sendBtn = document.getElementById('sendBtn');

    if (!question) return;

    // Check if documents are uploaded
    if (uploadedDocuments.length === 0) {
        alert('Please upload a PDF document first.');
        return;
    }

    // Disable input and button
    input.disabled = true;
    sendBtn.disabled = true;

    // Add user message
    addMessage(question, 'user');
    
    // Clear input and reset height
    input.value = '';
    input.style.height = 'auto';

    // Show loading indicator
    addLoadingIndicator();

    try {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        removeLoadingIndicator();

        if (response.ok) {
            const data = await response.json();
            addMessage(data.answer, 'bot');
            
            // Update query count
            queryCount++;
            updateStats();
        } else {
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Query error:', error);
        removeLoadingIndicator();
        addMessage('Network error. Please check your connection and try again.', 'bot');
    } finally {
        // Re-enable input and button
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
