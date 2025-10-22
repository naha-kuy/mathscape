// pages/petunjuk-konstruksi.js - Petunjuk Konstruksi page controller
window.petunjukKonstruksiPage = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    balokGroup: null,
    points: {},
    edges: {},
    faces: {},
    faceDiagonals: {},
    spaceDiagonals: {},
    pointLabels: {},
    displayMode: 'default',

    init: function() {
        console.log('Petunjuk Konstruksi page initializing...');
        console.log('THREE object available:', typeof THREE);
        console.log('OrbitControls available:', typeof THREE.OrbitControls);

        // Initialize Three.js scene immediately
        if (!this.scene) {
            console.log('Scene not found, initializing Three.js immediately...');
            try {
                this.initThreeJS();
                this.setupCheckboxListeners();
                this.setupCollapsibleCategories();
                this.setupDisplayModeToggle();
                console.log('Three.js initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Three.js:', error);
                console.error('Error stack:', error.stack);
            }
        } else {
            console.log('Scene already exists');
        }

        console.log('Petunjuk Konstruksi page initialized');
    },

    cleanup: function() {
        // Dispose Three.js resources
        if (this.scene) {
            this.scene.traverse((object) => {
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
            this.renderer.dispose();
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.balokGroup = null;
            this.points = {};
            this.edges = {};
            this.faces = {};
            this.faceDiagonals = {};
            this.spaceDiagonals = {};
            this.pointLabels = {};
        }
        console.log('Petunjuk Konstruksi page cleaned up');
    },

    initThreeJS: function() {
        const canvas = document.getElementById('threejs-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        console.log('Initializing Three.js scene...');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Create Balok
        this.createBalok();

        // Animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('Three.js initialization completed');
    },

    onWindowResize: function() {
        const canvas = document.getElementById('threejs-canvas');
        if (!canvas || !this.camera || !this.renderer) return;

        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    },

    animate: function() {
        if (!this.scene || !this.renderer || !this.camera) {
            console.warn('Three.js components not initialized');
            return;
        }

        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    },

    createBalok: function() {
        console.log('Creating Balok 3D model...');
        this.balokGroup = new THREE.Group();
        this.scene.add(this.balokGroup);

        // Define vertices (A-H)
        const vertices = {
            A: new THREE.Vector3(-1, -1, -1),
            B: new THREE.Vector3(1, -1, -1),
            C: new THREE.Vector3(1, -1, 1),
            D: new THREE.Vector3(-1, -1, 1),
            E: new THREE.Vector3(-1, 1, -1),
            F: new THREE.Vector3(1, 1, -1),
            G: new THREE.Vector3(1, 1, 1),
            H: new THREE.Vector3(-1, 1, 1)
        };

        // Create points, edges, faces, and diagonals
        this.createPoints(vertices);
        this.createEdges(vertices);
        this.createFaces(vertices);
        this.createFaceDiagonals(vertices);
        this.createSpaceDiagonals(vertices);

        console.log('Balok 3D model created successfully');
    },

    createPoints: function(vertices) {
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
            this.balokGroup.add(point);
            this.points[key] = point;

            // Create label sprite
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;

            context.font = 'Bold 32px Arial';
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, 64, 64);
            context.fillStyle = '#ffff00';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(key, 32, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(vertices[key]);
            sprite.position.y += 0.15;
            sprite.scale.set(0.2, 0.2, 1);
            sprite.userData.id = key;
            sprite.userData.type = 'point-label';
            sprite.visible = false;
            sprite.renderOrder = 3;
            this.balokGroup.add(sprite);
            this.pointLabels[key] = sprite;
        });
    },

    createEdges: function(vertices) {
        const edgePairs = [
            ['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'],
            ['E', 'F'], ['F', 'G'], ['G', 'H'], ['H', 'E'],
            ['A', 'E'], ['B', 'F'], ['C', 'G'], ['D', 'H']
        ];

        edgePairs.forEach(([start, end]) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                vertices[start], vertices[end]
            ]);
            const material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
            const edge = new THREE.Line(geometry, material);
            edge.userData.id = start + end;
            edge.userData.type = 'edge';
            edge.userData.defaultColor = 0x444444;
            edge.userData.highlightColor = 0xff0000;
            edge.renderOrder = 2;
            this.balokGroup.add(edge);
            this.edges[start + end] = edge;
        });
    },

    createFaces: function(vertices) {
        const faceDefinitions = [
            { id: 'ABCD', vertices: ['A', 'B', 'C', 'D'], color: 0xcccccc },
            { id: 'EFGH', vertices: ['E', 'F', 'G', 'H'], color: 0xcccccc },
            { id: 'ABFE', vertices: ['A', 'B', 'F', 'E'], color: 0xdddddd },
            { id: 'DCGH', vertices: ['D', 'C', 'G', 'H'], color: 0xdddddd },
            { id: 'ADHE', vertices: ['A', 'D', 'H', 'E'], color: 0xeeeeee },
            { id: 'BCGF', vertices: ['B', 'C', 'G', 'F'], color: 0xeeeeee },
            // Diagonal faces for level 6
            { id: 'ACGE', vertices: ['A', 'C', 'G', 'E'], color: 0xcccccc },
            { id: 'BDHF', vertices: ['B', 'D', 'H', 'F'], color: 0xcccccc }
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
            this.balokGroup.add(face);
            this.faces[faceDef.id] = face;
        });
    },

    createFaceDiagonals: function(vertices) {
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
            this.balokGroup.add(diagonal);
            this.faceDiagonals[start + end] = diagonal;
        });
    },

    createSpaceDiagonals: function(vertices) {
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
            this.balokGroup.add(diagonal);
            this.spaceDiagonals[start + end] = diagonal;
        });
    },

    highlightElement: function(type, id, highlight) {
        let element;
        switch (type) {
            case 'point': element = this.points[id]; break;
            case 'edge': element = this.edges[id]; break;
            case 'face': element = this.faces[id]; break;
            case 'face-diagonal': element = this.faceDiagonals[id]; break;
            case 'space-diagonal': element = this.spaceDiagonals[id]; break;
        }

        if (element && element.material) {
            if (highlight) {
                element.material.color.setHex(element.userData.highlightColor);
                if (type === 'face') element.material.opacity = element.userData.highlightOpacity;
                if (type === 'face-diagonal') element.material.opacity = element.userData.highlightOpacity;
                element.visible = true;
            } else {
                if (this.displayMode === 'default') {
                    element.material.color.setHex(element.userData.defaultColor);
                    if (type === 'face') {
                        element.material.opacity = element.userData.defaultOpacity;
                        element.visible = false;
                    }
                    if (type === 'face-diagonal') {
                        element.material.opacity = 1.0;
                        element.visible = false;
                    }
                } else {
                    element.visible = false;
                }
            }
        } else if (highlight) {
            console.warn(`Element ${type}-${id} not found for highlighting`);
        }
    },

    updateVisibility: function() {
        const allElements = [
            ...Object.values(this.points), ...Object.values(this.edges),
            ...Object.values(this.faces), ...Object.values(this.faceDiagonals),
            ...Object.values(this.spaceDiagonals)
        ];

        if (this.displayMode === 'default') {
            allElements.forEach(element => {
                if (element.userData.type === 'point' || element.userData.type === 'edge' || element.userData.type === 'space-diagonal') {
                    element.visible = true;
                    element.material.color.setHex(element.userData.defaultColor);
                } else if (element.userData.type === 'face' || element.userData.type === 'face-diagonal') {
                    element.visible = false;
                }
            });
        } else if (this.displayMode === 'checked-only') {
            allElements.forEach(element => element.visible = false);
        }

        // Re-apply highlights for checked elements
        const checkboxes = document.querySelectorAll('#petunjuk-konstruksi-page input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const type = checkbox.getAttribute('data-type');
            const id = checkbox.getAttribute('data-id');
            this.highlightElement(type, id, true);
        });

        this.updatePointLabelVisibility();
    },

    updatePointLabelVisibility: function() {
        const checkedElements = new Set();
        const checkboxes = document.querySelectorAll('#petunjuk-konstruksi-page input[type="checkbox"]:checked');

        checkboxes.forEach(checkbox => {
            const type = checkbox.getAttribute('data-type');
            const id = checkbox.getAttribute('data-id');
            checkedElements.add(`${type}-${id}`);
        });

        // Define connections for each point
        const pointConnections = {
            A: ['point-A', 'edge-AB', 'edge-AD', 'edge-AE', 'face-ABCD', 'face-ABFE', 'face-ADHE', 'face-diagonal-AC', 'face-diagonal-AF', 'face-diagonal-AH', 'space-diagonal-AG'],
            B: ['point-B', 'edge-AB', 'edge-BC', 'edge-BF', 'face-ABCD', 'face-ABFE', 'face-BCGF', 'face-diagonal-BD', 'face-diagonal-BE', 'face-diagonal-BG', 'space-diagonal-BH'],
            C: ['point-C', 'edge-BC', 'edge-CD', 'edge-CG', 'face-ABCD', 'face-DCGH', 'face-BCGF', 'face-diagonal-AC', 'face-diagonal-CH', 'face-diagonal-CF', 'space-diagonal-CE'],
            D: ['point-D', 'edge-CD', 'edge-DA', 'edge-DH', 'face-ABCD', 'face-DCGH', 'face-ADHE', 'face-diagonal-BD', 'face-diagonal-DG', 'face-diagonal-DE', 'space-diagonal-DF'],
            E: ['point-E', 'edge-EF', 'edge-EH', 'edge-EA', 'face-EFGH', 'face-ABFE', 'face-ADHE', 'face-diagonal-EG', 'face-diagonal-BE', 'face-diagonal-DE', 'space-diagonal-CE'],
            F: ['point-F', 'edge-EF', 'edge-FG', 'edge-FB', 'face-EFGH', 'face-ABFE', 'face-BCGF', 'face-diagonal-FH', 'face-diagonal-AF', 'face-diagonal-CF', 'space-diagonal-DF'],
            G: ['point-G', 'edge-FG', 'edge-GH', 'edge-GC', 'face-EFGH', 'face-DCGH', 'face-BCGF', 'face-diagonal-EG', 'face-diagonal-FH', 'face-diagonal-BG', 'face-diagonal-CH', 'face-diagonal-DG', 'space-diagonal-AG'],
            H: ['point-H', 'edge-GH', 'edge-HE', 'edge-HD', 'face-EFGH', 'face-DCGH', 'face-ADHE', 'face-diagonal-FH', 'face-diagonal-AH', 'face-diagonal-DE', 'space-diagonal-BH']
        };

        Object.keys(this.pointLabels).forEach(pointId => {
            const label = this.pointLabels[pointId];
            const connections = pointConnections[pointId];
            const hasConnectedCheckedElement = connections.some(conn => checkedElements.has(conn));
            label.visible = hasConnectedCheckedElement;
        });
    },

    setupCheckboxListeners: function() {
        const checkboxes = document.querySelectorAll('#petunjuk-konstruksi-page input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const type = e.target.getAttribute('data-type');
                const id = e.target.getAttribute('data-id');
                this.highlightElement(type, id, e.target.checked);
                this.updatePointLabelVisibility();
            });
        });
    },

    setupDisplayModeToggle: function() {
        const displayModeBtn = document.getElementById('display-mode-btn');
        if (displayModeBtn) {
            displayModeBtn.addEventListener('click', () => {
                this.displayMode = this.displayMode === 'default' ? 'checked-only' : 'default';
                this.updateVisibility();
            });
        }
    },

    setupCollapsibleCategories: function() {
        const categoryHeaders = document.querySelectorAll('#petunjuk-konstruksi-page .category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const category = this.parentElement;
                const isExpanded = category.classList.contains('expanded');

                if (isExpanded) {
                    category.classList.remove('expanded');
                    header.classList.remove('expanded');
                    header.classList.add('collapsed');
                } else {
                    category.classList.add('expanded');
                    header.classList.remove('collapsed');
                    header.classList.add('expanded');
                }
            });
        });
    }
};