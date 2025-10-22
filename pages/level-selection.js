// pages/level-selection.js - Level Selection page controller
window.levelSelectionPage = {
    playerProgress: {
        completedLevels: [],
        bestScores: {},
        unlockedLevels: [1, 2, 3, 4, 5, 6]
    },
    challengeData: [
                {
                    id: 1,
                    title: "Titik Sudut Lantai",
                    targetType: "point",
                    targetIds: ["A", "B", "C", "D"],
                    description: "Temukan keempat titik sudut pada alas Balok (lantai bawah)",
                    timeLimit: 180,
                    componentIcon: "📍",
                    componentName: "Titik Sudut"
                },
                {
                    id: 2,
                    title: "Rusuk Tegak",
                    targetType: "edge",
                    targetIds: ["AE", "BF", "CG", "DH"],
                    description: "Temukan keempat rusuk yang menghubungkan alas dengan atap Balok",
                    timeLimit: 240,
                    componentIcon: "📏",
                    componentName: "Rusuk"
                },
                {
                    id: 3,
                    title: "Bidang Sisi Tegak",
                    targetType: "face",
                    targetIds: ["ABFE", "DCGH"],
                    description: "Temukan kedua bidang sisi tegak yang saling berhadapan pada Balok",
                    timeLimit: 180,
                    componentIcon: "⬜",
                    componentName: "Bidang"
                },
                {
                    id: 4,
                    title: "Diagonal Bidang Alas",
                    targetType: "face-diagonal",
                    targetIds: ["AC", "BD"],
                    description: "Temukan kedua diagonal yang menghubungkan sudut berseberangan pada alas Balok",
                    timeLimit: 180,
                    componentIcon: "↘️",
                    componentName: "Diagonal Bidang"
                },
                {
                    id: 5,
                    title: "Diagonal Ruang",
                    targetType: "space-diagonal",
                    targetIds: ["AG", "BH", "CE", "DF"],
                    description: "Temukan keempat diagonal ruang yang menghubungkan sudut berseberangan dalam ruang Balok",
                    timeLimit: 300,
                    componentIcon: "🔄",
                    componentName: "Diagonal Ruang"
                },
                {
                    id: 6,
                    title: "Bidang Diagonal Balok",
                    targetType: "face-diagonal",
                    targetIds: ["ACGE", "BDHF"],
                    description: "Temukan kedua bidang diagonal yang saling berpotongan di dalam Balok",
                    timeLimit: 240,
                    componentIcon: "🔺",
                    componentName: "Bidang Diagonal"
                }
            ],

    init: function() {
        this.loadPlayerProgress();
        this.renderLevelSelection();
        console.log('Level Selection page initialized');
    },

    cleanup: function() {
        // Clear level grid
        const levelGrid = document.getElementById('level-grid');
        if (levelGrid) {
            levelGrid.innerHTML = '';
        }
        console.log('Level Selection page cleaned up');
    },

    loadPlayerProgress: function() {
        try {
            const saved = localStorage.getItem('balokGameProgress');
            if (saved) {
                this.playerProgress = JSON.parse(saved);
                if (!this.playerProgress.completedLevels) this.playerProgress.completedLevels = [];
                if (!this.playerProgress.bestScores) this.playerProgress.bestScores = {};
                if (!this.playerProgress.unlockedLevels) this.playerProgress.unlockedLevels = [1, 2, 3, 4, 5, 6];
            }
        } catch (e) {
            console.error('Failed to load player progress:', e);
            this.playerProgress = {
                completedLevels: [],
                bestScores: {},
                unlockedLevels: [1, 2, 3, 4, 5, 6]
            };
        }
    },

    savePlayerProgress: function() {
        try {
            localStorage.setItem('balokGameProgress', JSON.stringify(this.playerProgress));
            return true;
        } catch (e) {
            console.error('Failed to save player progress:', e);
            return false;
        }
    },

    renderLevelSelection: function() {
        const levelGrid = document.getElementById('level-grid');
        levelGrid.innerHTML = '';

        this.challengeData.forEach(level => {
            const levelCard = document.createElement('div');
            levelCard.className = 'level-card';
            levelCard.dataset.levelId = level.id;

            const isCompleted = this.playerProgress.completedLevels.includes(level.id);

            if (isCompleted) {
                levelCard.classList.add('completed');
            }

            levelCard.innerHTML = `
                <div class="level-number">${level.id}</div>
                <div class="level-title">${level.title}</div>
                <div class="level-status">
                    ${isCompleted ? '✅' : '🎯'}
                </div>
                ${isCompleted && this.playerProgress.bestScores[level.id] ?
                    `<div class="level-best-score">Best: ${this.playerProgress.bestScores[level.id].accuracy}%</div>` :
                    ''}
            `;

            levelCard.addEventListener('click', () => this.startLevel(level.id));
            levelGrid.appendChild(levelCard);
        });
    },

    startLevel: function(levelId) {
        // Store level data in global state for game level page
        window.currentLevelData = this.challengeData.find(l => l.id === levelId);
        window.app.showPage('game-level');
    }
};