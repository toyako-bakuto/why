// ============================================================
// WHY WEB - SCRIPT.JS (FULL WORKING VERSION)
// ============================================================

const API_URL = 'save-data.php';

// State
let currentAnswerId = null;
let currentEditId = null;
let currentFilter = 'all';
let allQuestions = [];

// ============================================================
// DOM Elements
// ============================================================

const elements = {
    openModalBtn: document.getElementById('openModalBtn'),
    questionModal: document.getElementById('questionModal'),
    answerModal: document.getElementById('answerModal'),
    editModal: document.getElementById('editModal'),
    saveQuestionBtn: document.getElementById('saveQuestionBtn'),
    submitAnswerBtn: document.getElementById('submitAnswerBtn'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    modalQuestion: document.getElementById('modalQuestion'),
    modalCategory: document.getElementById('modalCategory'),
    modalAnswer: document.getElementById('modalAnswer'),
    answerInput: document.getElementById('answerInput'),
    answerQuestionDisplay: document.getElementById('answerQuestionDisplay'),
    editQuestion: document.getElementById('editQuestion'),
    editCategory: document.getElementById('editCategory'),
    editAnswer: document.getElementById('editAnswer'),
    questionsGrid: document.getElementById('questionsGrid'),
    categoryFilters: document.getElementById('categoryFilters'),
    clearFilterBtn: document.getElementById('clearFilterBtn'),
    totalQuestions: document.getElementById('totalQuestions'),
    toast: document.getElementById('toast')
};

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Why Web started!');
    initEventListeners();
    loadAllQuestions();
});

// ============================================================
// Event Listeners
// ============================================================

function initEventListeners() {
    console.log('📌 Initializing event listeners...');

    // Open modal
    if (elements.openModalBtn) {
        elements.openModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetModalForm();
            openModal(elements.questionModal);
        });
    }

    // Close modals
    document.querySelectorAll('.close, .close-answer, .close-edit, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = this.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });

    // Close on outside click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal(this);
        });
    });

    // Close on ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Save question
    if (elements.saveQuestionBtn) {
        elements.saveQuestionBtn.addEventListener('click', handleSaveQuestion);
    }

    // Submit answer
    if (elements.submitAnswerBtn) {
        elements.submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
    }

    // Save edit
    if (elements.saveEditBtn) {
        elements.saveEditBtn.addEventListener('click', handleSaveEdit);
    }

    // Clear filter
    if (elements.clearFilterBtn) {
        elements.clearFilterBtn.addEventListener('click', function() {
            setFilter('all');
        });
    }

    console.log('✅ Event listeners ready!');
}

// ============================================================
// Modal Functions
// ============================================================

function openModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('📂 Modal opened:', modal.id);
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        console.log('📂 Modal closed:', modal.id);
    }
}

function closeAllModals() {
    closeModal(elements.questionModal);
    closeModal(elements.answerModal);
    closeModal(elements.editModal);
}

function resetModalForm() {
    if (elements.modalQuestion) elements.modalQuestion.value = '';
    if (elements.modalCategory) elements.modalCategory.value = '';
    if (elements.modalAnswer) elements.modalAnswer.value = '';
}

// ============================================================
// API Functions
// ============================================================

async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        
        if (!text || text.trim() === '') {
            throw new Error('Response kosong');
        }

        return JSON.parse(text);
    } catch (error) {
        console.error('❌ Fetch error:', error);
        showToast('Error: ' + error.message, 'error');
        throw error;
    }
}

// ============================================================
// CRUD Handlers
// ============================================================

async function handleSaveQuestion() {
    console.log('💾 Saving question...');
    
    const question = elements.modalQuestion?.value.trim() || '';
    const category = elements.modalCategory?.value || '';
    const answer = elements.modalAnswer?.value.trim() || '';

    if (!question) {
        showToast('Pertanyaan tidak boleh kosong!', 'error');
        if (elements.modalQuestion) elements.modalQuestion.focus();
        return;
    }

    if (!category) {
        showToast('Silakan pilih kategori!', 'error');
        if (elements.modalCategory) elements.modalCategory.focus();
        return;
    }

    try {
        const result = await fetchAPI(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                question,
                category,
                answer,
                timestamp: new Date().toISOString(),
                status: answer ? 'answered' : 'unanswered'
            })
        });

        if (result.success) {
            showToast('✅ Pertanyaan berhasil disimpan!', 'success');
            closeModal(elements.questionModal);
            loadAllQuestions();
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
    }
}

async function handleSubmitAnswer() {
    console.log('💾 Submitting answer...');
    
    const answer = elements.answerInput?.value.trim() || '';

    if (!answer) {
        showToast('Jawaban tidak boleh kosong!', 'error');
        if (elements.answerInput) elements.answerInput.focus();
        return;
    }

    try {
        const result = await fetchAPI(API_URL, {
            method: 'PUT',
            body: JSON.stringify({
                id: currentAnswerId,
                answer: answer,
                timestamp: new Date().toISOString()
            })
        });

        if (result.success) {
            showToast('✅ Jawaban berhasil disimpan!', 'success');
            closeModal(elements.answerModal);
            loadAllQuestions();
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
    }
}

async function handleSaveEdit() {
    console.log('💾 Saving edit...');
    
    const question = elements.editQuestion?.value.trim() || '';
    const category = elements.editCategory?.value || '';
    const answer = elements.editAnswer?.value.trim() || '';

    if (!question) {
        showToast('Pertanyaan tidak boleh kosong!', 'error');
        if (elements.editQuestion) elements.editQuestion.focus();
        return;
    }

    if (!category) {
        showToast('Silakan pilih kategori!', 'error');
        if (elements.editCategory) elements.editCategory.focus();
        return;
    }

    try {
        const result = await fetchAPI(API_URL, {
            method: 'PUT',
            body: JSON.stringify({
                id: currentEditId,
                question,
                category,
                answer,
                timestamp: new Date().toISOString()
            })
        });

        if (result.success) {
            showToast('✅ Pertanyaan berhasil diupdate!', 'success');
            closeModal(elements.editModal);
            loadAllQuestions();
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
    }
}

// ============================================================
// Delete Question
// ============================================================

async function deleteQuestion(id, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    console.log('🗑️ Deleting question:', id);
    
    if (!confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) {
        return;
    }

    try {
        const result = await fetchAPI(API_URL, {
            method: 'DELETE',
            body: JSON.stringify({ id })
        });

        if (result.success) {
            showToast('✅ Pertanyaan berhasil dihapus!', 'success');
            loadAllQuestions();
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    } catch (error) {
        showToast('❌ Error: ' + error.message, 'error');
    }
}

// ============================================================
// Load Questions
// ============================================================

async function loadAllQuestions() {
    console.log('📥 Loading questions...');
    
    try {
        showLoading(true);
        const result = await fetchAPI(API_URL + '?action=getAll');

        if (result.success) {
            allQuestions = result.data || [];
            console.log(`✅ Loaded ${allQuestions.length} questions`);
            updateCategoryFilters();
            applyFilter();
        } else {
            showToast('❌ ' + result.message, 'error');
            allQuestions = [];
            applyFilter();
        }
    } catch (error) {
        console.error('❌ Load error:', error);
        allQuestions = [];
        applyFilter();
    } finally {
        showLoading(false);
    }
}

// ============================================================
// Category Filters
// ============================================================

function updateCategoryFilters() {
    if (!elements.categoryFilters) return;
    
    const categories = new Set(['all']);
    allQuestions.forEach(q => {
        if (q.category) categories.add(q.category);
    });

    const sortedCategories = Array.from(categories).sort();
    const categoryMap = {
        'all': '📋 Semua',
        'Programming': '💻 Programming',
        'Design': '🎨 Design',
        'Business': '📊 Business',
        'Science': '🔬 Science',
        'Technology': '⚡ Technology',
        'Education': '📚 Education',
        'Health': '🏥 Health',
        'Lifestyle': '🌿 Lifestyle',
        'Other': '📌 Other'
    };

    elements.categoryFilters.innerHTML = sortedCategories.map(cat => {
        const label = categoryMap[cat] || cat;
        const active = currentFilter === cat ? 'active' : '';
        return `<button class="category-filter-btn ${active}" data-category="${cat}" onclick="window.setFilter('${cat}')">${label}</button>`;
    }).join('');
}

function setFilter(category) {
    console.log('🔍 Filter set to:', category);
    currentFilter = category;
    applyFilter();
    updateCategoryFilters();
}

// ============================================================
// Apply Filter & Display
// ============================================================

function applyFilter() {
    let filtered = allQuestions;
    
    if (currentFilter !== 'all') {
        filtered = allQuestions.filter(q => q.category === currentFilter);
    }

    const sortedData = [...filtered].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    displayQuestions(sortedData);
    updateStats();
}

function updateStats() {
    if (!elements.totalQuestions) return;
    
    const total = allQuestions.length;
    const filtered = currentFilter === 'all' ? total : allQuestions.filter(q => q.category === currentFilter).length;
    elements.totalQuestions.textContent = filtered;
    
    if (currentFilter !== 'all') {
        const categoryName = document.querySelector(`[data-category="${currentFilter}"]`)?.textContent || currentFilter;
        elements.totalQuestions.textContent = `${filtered} (dari ${total})`;
    }
}

// ============================================================
// Display Questions
// ============================================================

function displayQuestions(dataArray) {
    if (!elements.questionsGrid) return;
    
    if (!dataArray || dataArray.length === 0) {
        const message = currentFilter !== 'all' ? 'Tidak ada pertanyaan di kategori ini' : 'Belum ada pertanyaan';
        elements.questionsGrid.innerHTML = `
            <div class="empty-state">
                <span class="emoji">${currentFilter !== 'all' ? '🔍' : '📭'}</span>
                <h3>${message}</h3>
                <p>${currentFilter !== 'all' ? 'Coba pilih kategori lain' : 'Klik tombol "+ Tanya Baru" untuk mulai bertanya'}</p>
            </div>
        `;
        return;
    }

    elements.questionsGrid.innerHTML = '';
    
    dataArray.forEach(item => {
        const card = document.createElement('div');
        card.className = 'question-card';
        
        const date = new Date(item.timestamp);
        const formattedDate = !isNaN(date.getTime()) ? date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Tanggal tidak valid';
        
        const hasAnswer = item.answer && item.answer.trim() !== '';
        const statusText = hasAnswer ? '✓ Dijawab' : '○ Belum Dijawab';
        const statusClass = hasAnswer ? 'status-answered' : 'status-unanswered';
        
        const categoryEmoji = {
            'Programming': '💻', 'Design': '🎨', 'Business': '📊',
            'Science': '🔬', 'Technology': '⚡', 'Education': '📚',
            'Health': '🏥', 'Lifestyle': '🌿', 'Other': '📌'
        };
        const catEmoji = categoryEmoji[item.category] || '📌';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-left">
                    <div class="question-date">📅 ${formattedDate}</div>
                    <div class="question-category">${catEmoji} ${item.category || 'Uncategorized'}</div>
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="window.editQuestionCard(${item.id}, event)" title="Edit">✏️</button>
                    <button class="delete-card-btn" onclick="window.deleteQuestion(${item.id}, event)" title="Hapus">🗑️</button>
                </div>
            </div>
            <div class="question-text">${escapeHtml(item.question)}</div>
            <div class="answer-status ${statusClass}">${statusText}</div>
        `;
        
        card.addEventListener('click', function() {
            openAnswerModal(item);
        });
        
        elements.questionsGrid.appendChild(card);
    });
}

// ============================================================
// Open Answer Modal
// ============================================================

function openAnswerModal(item) {
    if (!item || !item.id) return;
    
    console.log('💬 Opening answer modal for:', item.id);
    
    currentAnswerId = item.id;
    
    const categoryEmoji = {
        'Programming': '💻', 'Design': '🎨', 'Business': '📊',
        'Science': '🔬', 'Technology': '⚡', 'Education': '📚',
        'Health': '🏥', 'Lifestyle': '🌿', 'Other': '📌'
    };
    const catEmoji = categoryEmoji[item.category] || '📌';
    
    if (elements.answerQuestionDisplay) {
        elements.answerQuestionDisplay.innerHTML = `
            <strong>Pertanyaan</strong>
            <div class="q-text">${escapeHtml(item.question)}</div>
            <div class="q-meta">
                <span class="q-category">${catEmoji} ${item.category || 'Uncategorized'}</span>
            </div>
        `;
    }
    
    if (elements.answerInput) {
        elements.answerInput.value = item.answer || '';
    }
    
    openModal(elements.answerModal);
}

// ============================================================
// Edit Question Card
// ============================================================

function editQuestionCard(id, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    console.log('✏️ Editing question:', id);
    
    fetchAPI(API_URL + '?action=getAll')
        .then(result => {
            if (result.success && result.data) {
                const item = result.data.find(q => q.id === id);
                if (item) {
                    currentEditId = id;
                    if (elements.editQuestion) elements.editQuestion.value = item.question || '';
                    if (elements.editCategory) elements.editCategory.value = item.category || '';
                    if (elements.editAnswer) elements.editAnswer.value = item.answer || '';
                    openModal(elements.editModal);
                } else {
                    showToast('Data tidak ditemukan', 'error');
                }
            }
        })
        .catch(error => {
            showToast('Error: ' + error.message, 'error');
        });
}

// ============================================================
// Utility Functions
// ============================================================

function showLoading(show) {
    if (!elements.questionsGrid) return;
    
    if (show) {
        elements.questionsGrid.innerHTML = `
            <div class="empty-state">
                <div class="spinner"></div>
                <h3>Memuat data...</h3>
            </div>
        `;
    }
}

function showToast(message, type = 'success') {
    const toast = elements.toast;
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type === 'success' ? 'toast-success' : 'toast-error');
    
    void toast.offsetWidth;
    toast.classList.add('show');
    
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// Expose to Global
// ============================================================

window.deleteQuestion = deleteQuestion;
window.editQuestionCard = editQuestionCard;
window.setFilter = setFilter;
window.openAnswerModal = openAnswerModal;
window.loadAllQuestions = loadAllQuestions;

console.log('✅ Why Web fully loaded!');
console.log('📌 Available functions:', {
    deleteQuestion: typeof window.deleteQuestion,
    editQuestionCard: typeof window.editQuestionCard,
    setFilter: typeof window.setFilter,
    openAnswerModal: typeof window.openAnswerModal,
    loadAllQuestions: typeof window.loadAllQuestions
});

// ============================================================
// Error Handlers
// ============================================================

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('❌ Global error:', msg);
    showToast('Error: ' + msg, 'error');
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled rejection:', event.reason);
    showToast('Error: ' + (event.reason?.message || 'Unknown error'), 'error');
});
