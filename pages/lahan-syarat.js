// lahan-syarat.js - Lahan Syarat Page Controller
window.lahanSyaratPage = {
    currentQuestionIndex: 0,
    questions: [
        {
            question: "Apa yang dimaksud dengan titik sudut pada bangun ruang?",
            options: [
                "Titik pertemuan dua sisi pada bidang datar",
                "Titik pertemuan tiga atau lebih sisi pada bangun ruang",
                "Garis lurus yang menghubungkan dua titik",
                "Bidang yang terbentuk dari tiga titik"
            ],
            correct: 1,
            explanation: "Titik sudut adalah titik pertemuan tiga atau lebih sisi pada bangun ruang."
        },
        {
            question: "Berapa jumlah titik sudut pada kubus?",
            options: ["6", "8", "12", "24"],
            correct: 1,
            explanation: "Kubus memiliki 8 titik sudut."
        },
        {
            question: "Apa yang dimaksud dengan rusuk pada bangun ruang?",
            options: [
                "Titik pertemuan sisi-sisi",
                "Garis lurus yang menghubungkan dua titik sudut",
                "Bidang yang membatasi bangun ruang",
                "Ruang di dalam bangun ruang"
            ],
            correct: 1,
            explanation: "Rusuk adalah garis lurus yang menghubungkan dua titik sudut pada bangun ruang."
        },
        {
            question: "Berapa jumlah rusuk pada balok?",
            options: ["8", "12", "16", "24"],
            correct: 1,
            explanation: "Balok memiliki 12 rusuk."
        },
        {
            question: "Apa yang dimaksud dengan diagonal bidang pada kubus?",
            options: [
                "Garis yang menghubungkan dua titik sudut yang berseberangan pada satu sisi",
                "Garis yang menghubungkan dua titik sudut yang tidak berseberangan pada satu sisi",
                "Garis yang menghubungkan titik sudut atas dan bawah",
                "Garis yang membentuk sisi kubus"
            ],
            correct: 0,
            explanation: "Diagonal bidang adalah garis yang menghubungkan dua titik sudut yang berseberangan pada satu sisi kubus."
        }
    ],
    answers: [],
    score: 0,

    init: function() {
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.score = 0;
        this.showQuestion();
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        const questionContainer = document.getElementById('question-container');
        const nextBtn = document.getElementById('next-btn');

        // Use event delegation for option clicks
        questionContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option')) {
                this.selectOption(e.target);
            }
        });

        nextBtn.addEventListener('click', () => {
            this.nextQuestion();
        });
    },

    showQuestion: function() {
        const question = this.questions[this.currentQuestionIndex];
        const questionContainer = document.getElementById('question-container');
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');

        // Update progress
        progressText.textContent = `Soal ${this.currentQuestionIndex + 1} dari ${this.questions.length}`;
        progressFill.style.width = `${((this.currentQuestionIndex + 1) / this.questions.length) * 100}%`;

        // Create question HTML
        let html = `
            <div class="question">
                <p>${question.question}</p>
                <div class="options">
        `;

        question.options.forEach((option, index) => {
            html += `<div class="option" data-index="${index}">${option}</div>`;
        });

        html += `
                </div>
            </div>
        `;

        questionContainer.innerHTML = html;

        // Hide next button and feedback
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('feedback-container').style.display = 'none';
    },

    selectOption: function(optionElement) {
        const selectedIndex = parseInt(optionElement.getAttribute('data-index'));
        const question = this.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');

        // Remove previous selections
        options.forEach(opt => opt.classList.remove('correct', 'incorrect'));

        // Mark selected option
        if (selectedIndex === question.correct) {
            optionElement.classList.add('correct');
            this.score++;
        } else {
            optionElement.classList.add('incorrect');
            // Also highlight correct answer
            options[question.correct].classList.add('correct');
        }

        // Store answer
        this.answers.push(selectedIndex);

        // Show feedback
        this.showFeedback(selectedIndex === question.correct, question.explanation);

        // Show next button
        document.getElementById('next-btn').style.display = 'block';
    },

    showFeedback: function(isCorrect, explanation) {
        const feedbackContainer = document.getElementById('feedback-container');

        feedbackContainer.innerHTML = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                ${isCorrect ? '✅ Benar!' : '❌ Salah!'} ${explanation}
            </div>
        `;

        feedbackContainer.style.display = 'block';
    },

    nextQuestion: function() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    },

    showResults: function() {
        const percentage = Math.round((this.score / this.questions.length) * 100);
        const questionContainer = document.getElementById('question-container');
        const nextBtn = document.getElementById('next-btn');

        questionContainer.innerHTML = `
            <div class="results">
                <h3>Hasil Tes Prasyarat</h3>
                <p>Skor Anda: ${this.score}/${this.questions.length} (${percentage}%)</p>
                <p>${percentage >= 80 ? 'Selamat! Anda lulus tes prasyarat.' : 'Anda perlu mempelajari lebih lanjut materi geometri dasar.'}</p>
                <a href="peta-konstruksi.html" class="back-to-main" style="display: inline-block; margin-top: 20px;">Kembali ke Peta Konstruksi</a>
            </div>
        `;

        nextBtn.style.display = 'none';
        document.getElementById('feedback-container').style.display = 'none';
    },

    cleanup: function() {
        // Cleanup if needed
    }
};