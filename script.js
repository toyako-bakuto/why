const API_URL = 'save-data.php';

let currentAnswerId = null;

// DOM Elements
const openModalBtn = document.getElementById('openModalBtn');
const questionModal = document.getElementById('questionModal');
const answerModal = document.getElementById('answerModal');
const saveQuestionBtn = document.getElementById('saveQuestionBtn');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const modalQuestion = document.getElementById('modalQuestion');
const modalAnswer = document.getElementById('modalAnswer');
const answerInput = document.getElementById('answerInput');
const answerQuestionDisplay = document.getElementById('answerQuestionDisplay');
const questionsGrid = document.getElementById('questionsGrid');

// Open modal for new question
openModalBtn.onclick = () => {
    modalQuestion.value = '';
    modalAnswer.value = '';
    questionModal.style.display = 'block';
};

// Close modals
function closeModals() {
    questionModal.style.display = 'none';
    answerModal.style.display = 'none';
}

document.querySelectorAll('.close, .close-answer, .btn-cancel').forEach(btn => {
    btn.onclick = closeModals;
});

// Close modal when clicking outside
window.onclick = (e) => {
    if (e.target === questionModal) questionModal.style.display = 'none';
    if (e.target === answerModal) answerModal.style.display = 'none';
};

// Save new question
saveQuestionBtn.onclick = async () => {
    const question = modalQuestion.value.trim();
    const answer = modalAnswer.value.trim();

    if (!question) {
        showToast('Pertanyaan tidak boleh kosong!', 'error');
        return;
    }

    const data = {
        question: question,
        answer: answer || '',
        timestamp: new Date().toISOString(),
        status: answer ? 'answered' : 'unanswered'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Pertanyaan berhasil disimpan!', 'success');
            closeModals();
            loadAllQuestions();
        } else {
            showToast('Gagal menyimpan: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
};

// Submit answer
submitAnswerBtn.onclick = async () => {
    const answer = answerInput.value.trim();

    if (!answer) {
        showToast('Jawaban tidak boleh kosong!', 'error');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentAnswerId,
                answer: answer,
                timestamp: new Date().toISOString(),
                status: 'answered'
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Jawaban berhasil disimpan!', 'success');
            closeModals();
            loadAllQuestions();
        } else {
            showToast('Gagal menyimpan jawaban', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
};

// Delete question
async function deleteQuestion(id, event) {
    event.stopPropagation(); // Mencegah card klik ketika klik tombol hapus
    
    if (confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) {
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Pertanyaan berhasil dihapus!', 'success');
                loadAllQuestions();
            } else {
                showToast('Gagal menghapus pertanyaan', 'error');
            }
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    }
}

// Load all questions
async function loadAllQuestions() {
    try {
        const response = await fetch(`${API_URL}?action=getAll`);
        const result = await response.json();

        if (result.success) {
            // Urutkan data dari yang baru ke lama (descending)
            const sortedData = result.data.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            displayQuestions(sortedData);
        } else {
            showToast('Gagal memuat data', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Display questions in grid
function displayQuestions(dataArray) {
    if (!dataArray || dataArray.length === 0) {
        questionsGrid.innerHTML = `
            <div class="empty-state">
                📭 Belum ada pertanyaan
                <p>Klik tombol "+ Tanya Baru" untuk mulai bertanya pada dirimu sendiri</p>
            </div>
        `;
        return;
    }

    questionsGrid.innerHTML = '';
    
    dataArray.forEach(item => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.onclick = () => openAnswerModal(item);
        
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusText = item.answer && item.answer.trim() !== '' ? '✓ Dijawab' : '○ Belum Dijawab';
        const statusClass = item.answer && item.answer.trim() !== '' ? 'status-answered' : 'status-unanswered';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="question-date">📅 ${formattedDate}</div>
                <button class="delete-card-btn" onclick="deleteQuestion(${item.id}, event)">🗑️</button>
            </div>
            <div class="question-text">${escapeHtml(item.question)}</div>
            <div class="answer-status ${statusClass}">${statusText}</div>
        `;
        
        questionsGrid.appendChild(card);
    });
}

// Open answer modal
function openAnswerModal(item) {
    currentAnswerId = item.id;
    answerQuestionDisplay.innerHTML = `<strong>Pertanyaan:</strong><br>${escapeHtml(item.question)}`;
    answerInput.value = item.answer || '';
    answerModal.style.display = 'block';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load data on page load
loadAllQuestions();