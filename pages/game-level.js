// pages/game-level.js - Game Level page controller
window.gameLevelPage = {
    levelGameState: {
        currentLevel: null,
        levelData: null,
        startTime: null,
        hintsUsed: 0,
        attempts: 0,
        correctAttempts: 0,
        foundTargets: new Set(),
        isComplete: false,
        gameScene: null,
        gameCamera: null,
        gameRenderer: null,
        gameControls: null,
        gameBalokGroup: null,
        gamePoints: {},
        gameEdges: {},
        gameFaces: {},
        gameFaceDiagonals: {},
        gameSpaceDiagonals: {},
        draggedComponent: null,
        raycaster: null,
        mouse: null
    },
    playerProgress: {
        completedLevels: [],
        bestScores: {},
        unlockedLevels: [1, 2, 3, 4, 5, 6]
    },

    init: function() {
        // Get level data from global state
        if (window.currentLevelData) {
            this.levelGameState.levelData = window.currentLevelData;
            this.levelGameState.currentLevel = window.currentLevelData.id;
        }

        this.loadPlayerProgress();
        this.initializeLevel();
        this.setupEventListeners();
        console.log('Game Level page initialized');
    },

    cleanup: function() {
        this.disposeThreeJSResources();
        this.resetLevelState();
        console.log('Game Level page cleaned up');
    },

    loadPlayerProgress: function() {
        try {
            const saved = localStorage.getItem('balokGameProgress');
            if (saved) {
                this.playerProgress = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load player progress:', e);
        }
    },

    savePlayerProgress: function() {
        try {
            localStorage.setItem('balokGameProgress', JSON.stringify(this.playerProgress));
        } catch (e) {
            console.error('Failed to save player progress:', e);
        }
    },

    initializeLevel: function() {
        // Initialize level game state
        this.levelGameState.startTime = Date.now();
        this.levelGameState.hintsUsed = 0;
        this.levelGameState.attempts = 0;
        this.levelGameState.correctAttempts = 0;
        this.levelGameState.foundTargets = new Set();
        this.levelGameState.isComplete = false;

        // Update UI
        document.getElementById('level-title').textContent = `LEVEL ${this.levelGameState.currentLevel}`;
        document.getElementById('mission-title').textContent = this.levelGameState.levelData.title;
        document.getElementById('mission-description').textContent = this.levelGameState.levelData.description;
        document.getElementById('toolbox-title').textContent = `TOOLBOX - ${this.levelGameState.levelData.componentName.toUpperCase()}`;

        this.updateLevelStats();
        this.initLevelThreeJS();
        this.renderLevelComponents();
    },

    setupEventListeners: function() {
        const hintBtn = document.getElementById('hint-btn');
        const levelBackBtn = document.getElementById('level-back-btn');

        if (hintBtn) {
            hintBtn.textContent = `💡 PETUNJUK (${this.levelGameState.hintsUsed}/2)`;
            hintBtn.disabled = this.levelGameState.hintsUsed >= 2;
            hintBtn.addEventListener('click', () => this.useHint());
        }

        if (levelBackBtn) {
            levelBackBtn.addEventListener('click', () => {
                if (confirm('Yakin ingin keluar dari level? Progress akan hilang.')) {
                    window.app.showPage('level-selection');
                }
            });
        }

        // Canvas event listeners
        const canvas = document.getElementById('game-threejs-canvas');
        if (canvas) {
            canvas.addEventListener('dragover', (e) => this.handleLevelDragOver(e));
            canvas.addEventListener('drop', (e) => this.handleLevelDrop(e));
            canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        }
    },

    updateLevelStats: function() {
        const accuracy = this.levelGameState.attempts > 0 ?
            Math.round((this.levelGameState.correctAttempts / this.levelGameState.attempts) * 100) : 0;

        const accuracyStat = document.getElementById('accuracy-stat');
        const hintsStat = document.getElementById('hints-stat');
        const timeStat = document.getElementById('time-stat');

        if (accuracyStat) accuracyStat.textContent = `${this.levelGameState.correctAttempts}/${this.levelGameState.attempts} (${accuracy}%)`;
        if (hintsStat) hintsStat.textContent = `${this.levelGameState.hintsUsed}/2`;

        const elapsed = Math.floor((Date.now() - this.levelGameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        if (timeStat) timeStat.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    renderLevelComponents: function() {
        const componentsContainer = document.getElementById('game-components');
        if (!componentsContainer) return;

        componentsContainer.innerHTML = '';

        const componentCard = document.createElement('div');
        componentCard.className = 'game-component';
        componentCard.dataset.type = this.levelGameState.levelData.targetType;
        componentCard.draggable = true;

        componentCard.innerHTML = `
            <div class="component-icon">${this.levelGameState.levelData.componentIcon}</div>
            <div class="component-name">${this.levelGameState.levelData.componentName}</div>
        `;

        componentCard.addEventListener('dragstart', (e) => this.handleLevelDragStart(e));
        componentCard.addEventListener('dragend', (e) => this.handleLevelDragEnd(e));

        componentsContainer.appendChild(componentCard);
    },

    initLevelThreeJS: function() {
        const canvas = document.getElementById('game-threejs-canvas');
        if (!canvas) return;

        // Clean up previous scene
        if (this.levelGameState.gameScene) {
            this.levelGameState.gameRenderer.dispose();
        }

        // Scene setup
        this.levelGameState.gameScene = new THREE.Scene();
        this.levelGameState.gameScene.background = new THREE.Color(0xf0f0f0);

        // Camera
        this.levelGameState.gameCamera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.levelGameState.gameCamera.position.set(5, 5, 5);

        // Renderer
        this.levelGameState.gameRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.levelGameState.gameRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.levelGameState.gameRenderer.setPixelRatio(window.devicePixelRatio);

        // Controls
        this.levelGameState.gameControls = new THREE.OrbitControls(this.levelGameState.gameCamera, canvas);
        this.levelGameState.gameControls.enableDamping = true;
        this.levelGameState.gameControls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.levelGameState.gameScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.levelGameState.gameScene.add(directionalLight);

        // Create level Balok
        this.createLevelBalok();

        // Raycaster
        this.levelGameState.raycaster = new THREE.Raycaster();
        this.levelGameState.mouse = new THREE.Vector2();

        // Animation loop
        this.animateLevel();
    },

    createLevelBalok: function() {
        this.levelGameState.gameBalokGroup = new THREE.Group();
        this.levelGameState.gameScene.add(this.levelGameState.gameBalokGroup);

        const vertices = {
            A: new THREE.Vector3(-1, -1, -1), B: new THREE.Vector3(1, -1, -1),
            C: new THREE.Vector3(1, -1, 1), D: new THREE.Vector3(-1, -1, 1),
            E: new THREE.Vector3(-1, 1, -1), F: new THREE.Vector3(1, 1, -1),
            G: new THREE.Vector3(1, 1, 1), H: new THREE.Vector3(-1, 1, 1)
        };

        // Create points, edges, faces, and diagonals (similar to original implementation)
        this.createLevelPoints(vertices);
        this.createLevelEdges(vertices);
        this.createLevelFaces(vertices);
        this.createLevelFaceDiagonals(vertices);
        this.createLevelSpaceDiagonals(vertices);
    },

    createLevelPoints: function(vertices) {
        Object.keys(vertices).forEach(key => {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
            const point = new THREE.Mesh(geometry, material);
            point.position.copy(vertices[key]);
            point.userData.id = key;
            point.userData.type = 'point';
            point.userData.defaultColor = 0x444444;
            point.userData.highlightColor = 0xffff00;
            point.renderOrder = 2;
            this.levelGameState.gameBalokGroup.add(point);
            this.levelGameState.gamePoints[key] = point;
        });
    },

    createLevelEdges: function(vertices) {
        const edgePairs = [
            ['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'],
            ['E', 'F'], ['F', 'G'], ['G', 'H'], ['H', 'E'],
            ['A', 'E'], ['B', 'F'], ['C', 'G'], ['D', 'H']
        ];

        edgePairs.forEach(([start, end]) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([vertices[start], vertices[end]]);
            const material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
            const edge = new THREE.Line(geometry, material);
            edge.userData.id = start + end;
            edge.userData.type = 'edge';
            edge.userData.defaultColor = 0x444444;
            edge.userData.highlightColor = 0xff0000;
            edge.renderOrder = 2;
            this.levelGameState.gameBalokGroup.add(edge);
            this.levelGameState.gameEdges[start + end] = edge;
        });
    },

    createLevelFaces: function(vertices) {
        const faceDefinitions = [
            { id: 'ABCD', vertices: ['A', 'B', 'C', 'D'] },
            { id: 'EFGH', vertices: ['E', 'F', 'G', 'H'] },
            { id: 'ABFE', vertices: ['A', 'B', 'F', 'E'] },
            { id: 'DCGH', vertices: ['D', 'C', 'G', 'H'] },
            { id: 'ADHE', vertices: ['A', 'D', 'H', 'E'] },
            { id: 'BCGF', vertices: ['B', 'C', 'G', 'F'] },
            // Diagonal faces for level 6
            { id: 'ACGE', vertices: ['A', 'C', 'G', 'E'] },
            { id: 'BDHF', vertices: ['B', 'D', 'H', 'F'] }
        ];

        faceDefinitions.forEach(faceDef => {
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            faceDef.vertices.forEach(v => positions.push(vertices[v].x, vertices[v].y, vertices[v].z));
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setIndex([0, 1, 2, 0, 2, 3]);

            const material = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const face = new THREE.Mesh(geometry, material);
            face.userData.id = faceDef.id;
            face.userData.type = 'face';
            face.userData.defaultColor = 0x444444;
            face.userData.defaultOpacity = 0.1;
            face.userData.highlightColor = 0x1e90ff;
            face.userData.highlightOpacity = 0.4;
            face.renderOrder = 1;
            face.visible = false;
            this.levelGameState.gameBalokGroup.add(face);
            this.levelGameState.gameFaces[faceDef.id] = face;
        });
    },

    createLevelFaceDiagonals: function(vertices) {
        const faceDiagonalPairs = [
            ['A', 'C'], ['B', 'D'], ['E', 'G'], ['F', 'H'],
            ['A', 'F'], ['B', 'E'], ['D', 'G'], ['C', 'H'],
            ['A', 'H'], ['D', 'E'], ['B', 'G'], ['C', 'F'],
            // Additional diagonals for diagonal faces
            ['A', 'G'], ['C', 'E'], // ACGE face diagonals
            ['B', 'H'], ['D', 'F']  // BDHF face diagonals
        ];

        faceDiagonalPairs.forEach(([start, end]) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([vertices[start], vertices[end]]);
            const material = new THREE.LineBasicMaterial({
                color: 0x444444, linewidth: 1, transparent: true, opacity: 1.0
            });
            const diagonal = new THREE.Line(geometry, material);
            diagonal.userData.id = start + end;
            diagonal.userData.type = 'face-diagonal';
            diagonal.userData.defaultColor = 0x444444;
            diagonal.userData.highlightColor = 0x00ffff;
            diagonal.userData.highlightOpacity = 0.4;
            diagonal.renderOrder = 2;
            diagonal.visible = false;
            this.levelGameState.gameBalokGroup.add(diagonal);
            this.levelGameState.gameFaceDiagonals[start + end] = diagonal;
        });
    },

    createLevelSpaceDiagonals: function(vertices) {
        const spaceDiagonalPairs = [['A', 'G'], ['B', 'H'], ['C', 'E'], ['D', 'F']];

        spaceDiagonalPairs.forEach(([start, end]) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([vertices[start], vertices[end]]);
            const material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
            const diagonal = new THREE.Line(geometry, material);
            diagonal.userData.id = start + end;
            diagonal.userData.type = 'space-diagonal';
            diagonal.userData.defaultColor = 0x444444;
            diagonal.userData.highlightColor = 0x9932cc;
            diagonal.renderOrder = 2;
            this.levelGameState.gameBalokGroup.add(diagonal);
            this.levelGameState.gameSpaceDiagonals[start + end] = diagonal;
        });
    },

    animateLevel: function() {
        if (!this.levelGameState.gameScene) return;

        requestAnimationFrame(() => this.animateLevel());
        this.levelGameState.gameControls.update();
        this.levelGameState.gameRenderer.render(this.levelGameState.gameScene, this.levelGameState.gameCamera);
    },

    handleLevelDragStart: function(e) {
        this.levelGameState.draggedComponent = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', this.levelGameState.levelData.targetType);
    },

    handleLevelDragEnd: function(e) {
        if (this.levelGameState.draggedComponent) {
            this.levelGameState.draggedComponent.classList.remove('dragging');
            this.levelGameState.draggedComponent = null;
        }
        this.clearHoverEffects();
    },

    handleLevelDragOver: function(e) {
        e.preventDefault();
        if (!this.levelGameState.draggedComponent) return;

        const canvas = document.getElementById('game-threejs-canvas');
        const rect = canvas.getBoundingClientRect();

        this.levelGameState.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.levelGameState.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.levelGameState.raycaster.setFromCamera(this.levelGameState.mouse, this.levelGameState.gameCamera);

        const interactiveObjects = [
            ...Object.values(this.levelGameState.gamePoints),
            ...Object.values(this.levelGameState.gameEdges),
            ...Object.values(this.levelGameState.gameFaces),
            ...Object.values(this.levelGameState.gameFaceDiagonals),
            ...Object.values(this.levelGameState.gameSpaceDiagonals)
        ];

        const intersects = this.getEnhancedIntersections(this.levelGameState.raycaster, interactiveObjects, 0.08);
        this.clearHoverEffects();

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            this.applyHoverGlow(intersectedObject, intersectedObject.userData.type);
        }
    },

    handleLevelDrop: function(e) {
        e.preventDefault();
        if (!this.levelGameState.draggedComponent) return;

        const canvas = document.getElementById('game-threejs-canvas');
        const rect = canvas.getBoundingClientRect();

        this.levelGameState.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.levelGameState.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.levelGameState.raycaster.setFromCamera(this.levelGameState.mouse, this.levelGameState.gameCamera);

        const interactiveObjects = [
            ...Object.values(this.levelGameState.gamePoints),
            ...Object.values(this.levelGameState.gameEdges),
            ...Object.values(this.levelGameState.gameFaces),
            ...Object.values(this.levelGameState.gameFaceDiagonals),
            ...Object.values(this.levelGameState.gameSpaceDiagonals)
        ];

        const intersects = this.getEnhancedIntersections(this.levelGameState.raycaster, interactiveObjects, 0.08);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            const elementId = intersectedObject.userData.id;
            const elementType = intersectedObject.userData.type;

            this.levelGameState.attempts++;

            const isCorrect = this.levelGameState.levelData.targetIds.includes(elementId) &&
                              elementType === this.levelGameState.levelData.targetType;

            if (isCorrect && !this.levelGameState.foundTargets.has(elementId)) {
                this.levelGameState.correctAttempts++;
                this.levelGameState.foundTargets.add(elementId);
                this.highlightLevelElement(elementType, elementId, true);
                this.showLevelFeedback(true, '+100 Akurasi!');

                if (this.levelGameState.foundTargets.size === this.levelGameState.levelData.targetIds.length) {
                    setTimeout(() => this.completeLevel(), 1000);
                }
            } else if (!isCorrect) {
                this.showLevelFeedback(false, `GAGAL! Ini adalah ${this.getElementDisplayName(elementType, elementId)}, bukan yang dicari.`);
            } else {
                this.showLevelFeedback(false, 'Elemen ini sudah ditemukan!');
            }

            this.updateLevelStats();
        } else {
            this.showLevelFeedback(false, 'GAGAL! Pastikan Anda meletakkan pada elemen geometri yang benar.');
            this.levelGameState.attempts++;
            this.updateLevelStats();
        }
    },

    handleTouchStart: function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const fakeEvent = {
            target: e.target.closest('.game-component'),
            clientX: touch.clientX,
            clientY: touch.clientY,
            dataTransfer: { setData: () => {} }
        };
        this.handleLevelDragStart(fakeEvent);
    },

    handleTouchMove: function(e) {
        e.preventDefault();
        if (!this.levelGameState.draggedComponent) return;

        const touch = e.touches[0];
        const fakeEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => {}
        };
        this.handleLevelDragOver(fakeEvent);
    },

    handleTouchEnd: function(e) {
        e.preventDefault();
        if (!this.levelGameState.draggedComponent) return;

        const fakeEvent = {
            clientX: e.changedTouches[0].clientX,
            clientY: e.changedTouches[0].clientY,
            preventDefault: () => {}
        };
        this.handleLevelDrop(fakeEvent);
    },

    clearHoverEffects: function() {
        Object.values(this.levelGameState.gamePoints).forEach(point => {
            if (!this.levelGameState.foundTargets.has(point.userData.id)) {
                point.material.color.setHex(point.userData.defaultColor);
            }
        });

        Object.values(this.levelGameState.gameEdges).forEach(edge => {
            if (!this.levelGameState.foundTargets.has(edge.userData.id)) {
                edge.material.color.setHex(edge.userData.defaultColor);
            }
        });

        Object.values(this.levelGameState.gameFaces).forEach(face => {
            if (!this.levelGameState.foundTargets.has(face.userData.id)) {
                face.material.color.setHex(face.userData.defaultColor);
                face.material.opacity = face.userData.defaultOpacity;
            }
        });

        Object.values(this.levelGameState.gameFaceDiagonals).forEach(diagonal => {
            if (!this.levelGameState.foundTargets.has(diagonal.userData.id)) {
                diagonal.material.color.setHex(diagonal.userData.defaultColor);
                diagonal.material.opacity = 1.0;
            }
        });

        Object.values(this.levelGameState.gameSpaceDiagonals).forEach(diagonal => {
            if (!this.levelGameState.foundTargets.has(diagonal.userData.id)) {
                diagonal.material.color.setHex(diagonal.userData.defaultColor);
            }
        });
    },

    applyHoverGlow: function(object, elementType) {
        if (this.levelGameState.foundTargets.has(object.userData.id)) return;

        object.material.color.setHex(0xffffff);

        if (elementType === 'face') {
            object.material.opacity = 0.8;
        } else if (elementType === 'face-diagonal') {
            object.material.opacity = 0.8;
        }
    },

    highlightLevelElement: function(type, id, highlight) {
        let element;
        switch (type) {
            case 'point': element = this.levelGameState.gamePoints[id]; break;
            case 'edge': element = this.levelGameState.gameEdges[id]; break;
            case 'face': element = this.levelGameState.gameFaces[id]; break;
            case 'face-diagonal': element = this.levelGameState.gameFaceDiagonals[id]; break;
            case 'space-diagonal': element = this.levelGameState.gameSpaceDiagonals[id]; break;
        }

        if (element && element.material) {
            if (highlight) {
                element.material.color.setHex(element.userData.highlightColor);
                if (type === 'face') element.material.opacity = element.userData.highlightOpacity;
                if (type === 'face-diagonal') element.material.opacity = element.userData.highlightOpacity;
                element.visible = true;
            }
        }
    },

    getElementDisplayName: function(type, id) {
        const typeNames = {
            'point': 'Titik Sudut',
            'edge': 'Rusuk',
            'face': 'Bidang',
            'face-diagonal': 'Diagonal Bidang',
            'space-diagonal': 'Diagonal Ruang'
        };
        return `${typeNames[type]} ${id}`;
    },

    showLevelFeedback: function(isSuccess, message) {
        const feedback = document.createElement('div');
        feedback.className = `feedback-popup ${isSuccess ? 'success' : 'error'}`;
        feedback.innerHTML = `
            <div class="feedback-icon">${isSuccess ? '✅' : '❌'}</div>
            <h3>${isSuccess ? 'Benar!' : 'Salah!'}</h3>
            <p>${message}</p>
            <button class="feedback-btn">OK</button>
        `;

        document.body.appendChild(feedback);
        feedback.style.animation = 'slideUp 0.3s ease-out';

        feedback.querySelector('.feedback-btn').addEventListener('click', () => {
            feedback.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => feedback.remove(), 300);
        });

        const dismissTime = isSuccess ? 3000 : 5000;
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.style.animation = 'slideUp 0.3s ease-out reverse';
                setTimeout(() => feedback.remove(), 300);
            }
        }, dismissTime);
    },

    useHint: function() {
        if (this.levelGameState.hintsUsed >= 2) return;

        this.levelGameState.hintsUsed++;

        const hintBtn = document.getElementById('hint-btn');
        hintBtn.textContent = `💡 PETUNJUK (${this.levelGameState.hintsUsed}/2)`;
        hintBtn.disabled = this.levelGameState.hintsUsed >= 2;

        const targetsToHint = this.levelGameState.levelData.targetIds.filter(id => !this.levelGameState.foundTargets.has(id));

        targetsToHint.forEach(targetId => {
            let element;
            const targetType = this.levelGameState.levelData.targetType;

            switch (targetType) {
                case 'point': element = this.levelGameState.gamePoints[targetId]; break;
                case 'edge': element = this.levelGameState.gameEdges[targetId]; break;
                case 'face': element = this.levelGameState.gameFaces[targetId]; break;
                case 'face-diagonal': element = this.levelGameState.gameFaceDiagonals[targetId]; break;
                case 'space-diagonal': element = this.levelGameState.gameSpaceDiagonals[targetId]; break;
            }

            if (element) {
                element.classList.add('hint-animation');
                setTimeout(() => element.classList.remove('hint-animation'), 3000);
            }
        });

        this.updateLevelStats();
    },

    completeLevel: function() {
        this.levelGameState.isComplete = true;

        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - this.levelGameState.startTime) / 1000);
        const accuracy = Math.round((this.levelGameState.correctAttempts / this.levelGameState.attempts) * 100);
        const hintPenalty = this.levelGameState.hintsUsed * 10;
        const finalAccuracy = Math.max(0, accuracy - hintPenalty);

        if (!this.playerProgress.completedLevels.includes(this.levelGameState.currentLevel)) {
            this.playerProgress.completedLevels.push(this.levelGameState.currentLevel);
        }

        const currentBest = this.playerProgress.bestScores[this.levelGameState.currentLevel];
        if (!currentBest || finalAccuracy > currentBest.accuracy ||
            (finalAccuracy === currentBest.accuracy && timeTaken < currentBest.time)) {
            this.playerProgress.bestScores[this.levelGameState.currentLevel] = {
                accuracy: finalAccuracy,
                time: timeTaken,
                hints: this.levelGameState.hintsUsed
            };
        }

        this.savePlayerProgress();

        // Celebration animation
        Object.values(this.levelGameState.gamePoints).forEach(point => {
            if (this.levelGameState.foundTargets.has(point.userData.id)) {
                point.userData.originalScale = point.scale.clone();
                point.scale.multiplyScalar(1.2);
                setTimeout(() => {
                    if (point.userData.originalScale) {
                        point.scale.copy(point.userData.originalScale);
                    }
                }, 1000);
            }
        });

        Object.values(this.levelGameState.gameEdges).forEach(edge => {
            if (this.levelGameState.foundTargets.has(edge.userData.id)) {
                edge.userData.originalColor = edge.material.color.clone();
                edge.material.color.setHex(0xffffff);
                setTimeout(() => {
                    if (edge.userData.originalColor) {
                        edge.material.color.copy(edge.userData.originalColor);
                    }
                }, 1000);
            }
        });

        setTimeout(() => this.showLevelCompletion(finalAccuracy, timeTaken, this.levelGameState.hintsUsed), 1500);
    },

    showLevelCompletion: function(accuracy, time, hints) {
        document.getElementById('completion-title').textContent = `LEVEL ${this.levelGameState.currentLevel} SELESAI!`;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        document.getElementById('completion-time').textContent = this.formatTime(time);
        document.getElementById('hints-used').textContent = `${hints}/2`;

        document.getElementById('level-complete-overlay').classList.remove('hidden');

        document.getElementById('play-again-btn').onclick = () => {
            document.getElementById('level-complete-overlay').classList.add('hidden');
            this.initializeLevel();
        };

        document.getElementById('next-level-btn').onclick = () => {
            document.getElementById('level-complete-overlay').classList.add('hidden');
            if (this.levelGameState.currentLevel < 6) {
                window.currentLevelData = window.levelSelectionPage.challengeData.find(l => l.id === this.levelGameState.currentLevel + 1);
                window.app.showPage('game-level');
            } else {
                window.app.showPage('level-selection');
            }
        };
    },

    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    disposeThreeJSResources: function() {
        if (this.levelGameState.gameScene) {
            this.levelGameState.gameScene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => {
                            if (material.map) material.map.dispose();
                            material.dispose();
                        });
                    } else {
                        if (object.material.map) object.material.map.dispose();
                        object.material.dispose();
                    }
                }
            });
        }

        if (this.levelGameState.gameRenderer) {
            this.levelGameState.gameRenderer.dispose();
        }

        if (this.levelGameState.gameScene) {
            while (this.levelGameState.gameScene.children.length > 0) {
                this.levelGameState.gameScene.remove(this.levelGameState.gameScene.children[0]);
            }
        }
    },

    resetLevelState: function() {
        this.levelGameState = {
            currentLevel: null,
            levelData: null,
            startTime: null,
            hintsUsed: 0,
            attempts: 0,
            correctAttempts: 0,
            foundTargets: new Set(),
            isComplete: false,
            gameScene: null,
            gameCamera: null,
            gameRenderer: null,
            gameControls: null,
            gameBalokGroup: null,
            gamePoints: {},
            gameEdges: {},
            gameFaces: {},
            gameFaceDiagonals: {},
            gameSpaceDiagonals: {},
            draggedComponent: null,
            raycaster: null,
            mouse: null
        };

        // Reset UI elements
        document.getElementById('level-title').textContent = 'LEVEL 1';
        document.getElementById('mission-title').textContent = 'MISI LEVEL';
        document.getElementById('mission-description').textContent = 'Temukan semua titik sudut pada lantai Balok';
        document.getElementById('accuracy-stat').textContent = '0/0 (0%)';
        document.getElementById('hints-stat').textContent = '0/2';
        document.getElementById('time-stat').textContent = '00:00';
    },

    getEnhancedIntersections: function(raycaster, objects, tolerance = 0.05) {
        const intersections = [];

        objects.forEach(obj => {
            if (obj.userData.type === 'point') {
                const sphere = new THREE.Sphere(obj.position, 0.05);
                const intersection = raycaster.ray.intersectSphere(sphere);
                if (intersection) {
                    intersections.push({
                        distance: intersection.distance,
                        point: intersection,
                        object: obj
                    });
                }
            } else if (obj.userData.type === 'edge' || obj.userData.type === 'face-diagonal' || obj.userData.type === 'space-diagonal') {
                const lineIntersection = this.getLineIntersection(raycaster, obj, tolerance);
                if (lineIntersection) {
                    intersections.push(lineIntersection);
                }
            } else {
                const meshIntersects = raycaster.intersectObject(obj);
                if (meshIntersects.length > 0) {
                    intersections.push(meshIntersects[0]);
                }
            }
        });

        intersections.sort((a, b) => a.distance - b.distance);
        return intersections;
    },

    getLineIntersection: function(raycaster, lineObject, tolerance = 0.05) {
        const positions = lineObject.geometry.attributes.position.array;
        const start = new THREE.Vector3(positions[0], positions[1], positions[2]);
        const end = new THREE.Vector3(positions[3], positions[4], positions[5]);

        start.applyMatrix4(lineObject.matrixWorld);
        end.applyMatrix4(lineObject.matrixWorld);

        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const cameraPos = raycaster.ray.origin;
        const toCamera = new THREE.Vector3().subVectors(cameraPos, start);

        const normal = new THREE.Vector3().crossVectors(direction, toCamera).normalize();
        if (normal.length() === 0) {
            normal.crossVectors(direction, raycaster.ray.direction).normalize();
        }

        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, start);
        const intersectionPoint = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
            const lineLength = start.distanceTo(end);
            const distToStart = intersectionPoint.distanceTo(start);
            const distToEnd = intersectionPoint.distanceTo(end);

            if (distToStart + distToEnd <= lineLength + tolerance) {
                const rayToPoint = new THREE.Vector3().subVectors(intersectionPoint, cameraPos);
                const distance = rayToPoint.length() * Math.sin(raycaster.ray.direction.angleTo(rayToPoint.normalize()));

                if (distance <= tolerance) {
                    return {
                        distance: cameraPos.distanceTo(intersectionPoint),
                        point: intersectionPoint,
                        object: lineObject
                    };
                }
            }
        }

        return null;
    }
};