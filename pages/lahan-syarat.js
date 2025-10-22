// pages/lahan-syarat.js - Lahan Syarat page controller
window.lahanSyaratPage = {
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: [],
    questions: [
        {
            question: "Berapa jumlah sisi yang dimiliki oleh segitiga?",
            options: ["2", "3", "4", "5"],
            correct: 1,
            explanation: "Segitiga memiliki 3 sisi."
        },
        {
            question: "Apa rumus luas persegi panjang?",
            options: ["p × l", "s × s", "πr²", "½ × a × t"],
            correct: 0,
            explanation: "Luas persegi panjang = panjang × lebar."
        },
        {
            question: "Bangun ruang apa yang memiliki 6 sisi yang sama besar?",
            options: ["Balok", "Kubus", "Prisma", "Limas"],
            correct: 1,
            explanation: "Kubus memiliki 6 sisi berbentuk persegi yang sama besar."
        },
        {
            question: "Sudut yang memiliki besar 90° disebut sudut...",
            options: ["Lancip", "Tumpul", "Siku-siku", "Runcing"],
            correct: 2,
            explanation: "Sudut siku-siku memiliki besar tepat 90°."
        },
        {
            question: "Manakah rumus keliling lingkaran yang benar?",
            options: ["πr", "2πr", "πd", "Keduanya benar (2πr dan πd)"],
            correct: 3,
            explanation: "Keliling lingkaran = 2πr atau πd (dimana d = diameter)."
        }
    ],

    init() {
        this.resetQuiz();
        this.showQuestion();
        this.setupEventListeners();
        console.log('Lahan Syarat page initialized');
    },

    cleanup() {
        // Reset quiz state
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        console.log('Lahan Syarat page cleaned up');
    },

    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
    },

    setupEventListeners() {
        // Option click handlers
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', (e) => {
                const selectedIndex = parseInt(e.target.getAttribute('data-index'));
                this.checkAnswer(selectedIndex);
            });
        });

        // Next button handler
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextQuestion();
            });
        }
    },

    showQuestion() {
        const questionContainer = document.getElementById('question-container');
        const feedbackContainer = document.getElementById('feedback-container');
        const nextBtn = document.getElementById('next-btn');

        // Hide feedback and next button
        if (feedbackContainer) feedbackContainer.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';

        const question = this.questions[this.currentQuestionIndex];

        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="question">
                    <p>${question.question}</p>
                    <div class="options">
                        ${question.options.map((option, index) => `
                            <div class="option" data-index="${index}">${option}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Update progress
        this.updateProgress();

        // Re-setup event listeners for new options
        this.setupEventListeners();
    },

    updateProgress() {
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');

        const current = this.currentQuestionIndex + 1;
        const total = this.questions.length;
        const percentage = (current / total) * 100;

        if (progressText) progressText.textContent = `Soal ${current} dari ${total}`;
        if (progressFill) progressFill.style.width = `${percentage}%`;
    },

    checkAnswer(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');
        const feedbackContainer = document.getElementById('feedback-container');
        const nextBtn = document.getElementById('next-btn');

        this.userAnswers.push(selectedIndex);

        // Show feedback
        options.forEach((option, index) => {
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === selectedIndex && index !== question.correct) {
                option.classList.add('incorrect');
            }
        });

        const isCorrect = selectedIndex === question.correct;
        if (isCorrect) {
            this.score++;
        }

        if (feedbackContainer) {
            feedbackContainer.innerHTML = `
                <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                    <p>${isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah!'}</p>
                    <p>${question.explanation}</p>
                </div>
            `;
            feedbackContainer.style.display = 'block';
        }

        // Show next button
        if (nextBtn) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = this.currentQuestionIndex < this.questions.length - 1 ? 'SOAL BERIKUTNYA →' : 'LIHAT HASIL →';
        }
    },

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    },

    showResults() {
        const questionContainer = document.getElementById('question-container');
        const feedbackContainer = document.getElementById('feedback-container');
        const nextBtn = document.getElementById('next-btn');

        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="results">
                    <h3>Hasil Tes Prasyarat</h3>
                    <p>Skor Anda: ${this.score} dari ${this.questions.length}</p>
                    <p>Persentase: ${Math.round((this.score / this.questions.length) * 100)}%</p>
                    <p>${this.score >= 3 ? 'Selamat! Anda lulus tes prasyarat.' : 'Silakan pelajari kembali materi geometri dasar.'}</p>
                </div>
            `;
        }

        if (feedbackContainer) feedbackContainer.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
};