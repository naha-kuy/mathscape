// pages/shared-three.js - Shared Three.js utilities
window.threeJSManager = {
    activeScenes: new Map(), // Track active scenes by canvas ID

    initScene: function(canvasId, options = {}) {
        console.log('Initializing Three.js scene for canvas:', canvasId);

        // Check if THREE is available
        if (typeof THREE === 'undefined') {
            console.error('THREE.js is not loaded. Make sure three.min.js is included before shared-three.js');
            return null;
        }

        // Check if OrbitControls is available
        if (typeof OrbitControls === 'undefined') {
            console.error('OrbitControls is not loaded. Make sure OrbitControls.js is included before shared-three.js');
            return null;
        }

        // Clean up existing scene for this canvas
        this.cleanupScene(canvasId);

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas not found:', canvasId);
            return null;
        }

        const sceneData = {
            scene: new THREE.Scene(),
            camera: null,
            renderer: null,
            controls: null,
            canvas: canvas,
            animationId: null,
            resizeHandler: null
        };

        // Scene setup
        sceneData.scene.background = options.background || new THREE.Color(0xf0f0f0);

        // Camera
        const size = this._getCanvasSize(canvas);
        sceneData.camera = new THREE.PerspectiveCamera(
            options.fov || 75,
            size.width / size.height,
            options.near || 0.1,
            options.far || 1000
        );
        sceneData.camera.position.copy(options.cameraPosition || new THREE.Vector3(5, 5, 5));

        // Renderer
        sceneData.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: options.antialias !== false,
            alpha: options.alpha || false
        });
        sceneData.renderer.setPixelRatio(window.devicePixelRatio || 1);
        sceneData.renderer.setSize(size.width, size.height, false);

        // Ensure renderer.domElement is properly attached to DOM
        if (!canvas.parentElement) {
            console.warn('Canvas not attached to DOM, attaching to parent container');
            const container = document.querySelector('.canvas-container') || document.body;
            container.appendChild(sceneData.renderer.domElement);
        }

        // Controls
        if (typeof OrbitControls === 'function') {
            sceneData.controls = new OrbitControls(sceneData.camera, canvas);
            if (sceneData.controls.enableDamping) {
                sceneData.controls.enableDamping = true;
                sceneData.controls.dampingFactor = options.dampingFactor || 0.05;
            }
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(
            options.ambientColor || 0x404040,
            options.ambientIntensity || 0.6
        );
        sceneData.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(
            options.directionalColor || 0xffffff,
            options.directionalIntensity || 0.8
        );
        directionalLight.position.copy(options.directionalPosition || new THREE.Vector3(1, 1, 1));
        sceneData.scene.add(directionalLight);

        // Animation loop
        const animate = () => {
            sceneData.animationId = requestAnimationFrame(animate);
            if (sceneData.controls && typeof sceneData.controls.update === 'function') {
                sceneData.controls.update();
            }
            sceneData.renderer.render(sceneData.scene, sceneData.camera);
        };
        animate();

        // Resize handler
        sceneData.resizeHandler = () => this._onResize(canvasId);
        window.addEventListener('resize', sceneData.resizeHandler);

        // Store scene data
        this.activeScenes.set(canvasId, sceneData);

        console.log('Three.js scene initialized for:', canvasId);
        return sceneData;
    },

    cleanupScene: function(canvasId) {
        const sceneData = this.activeScenes.get(canvasId);
        if (!sceneData) return;

        console.log('Cleaning up Three.js scene for:', canvasId);

        // Cancel animation
        if (sceneData.animationId) {
            cancelAnimationFrame(sceneData.animationId);
        }

        // Remove resize listener
        if (sceneData.resizeHandler) {
            window.removeEventListener('resize', sceneData.resizeHandler);
        }

        // Dispose controls
        if (sceneData.controls && typeof sceneData.controls.dispose === 'function') {
            sceneData.controls.dispose();
        }

        // Dispose renderer
        if (sceneData.renderer) {
            sceneData.renderer.dispose();
        }

        // Clear scene
        if (sceneData.scene) {
            sceneData.scene.traverse((object) => {
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

        this.activeScenes.delete(canvasId);
    },

    getScene: function(canvasId) {
        return this.activeScenes.get(canvasId);
    },

    _getCanvasSize: function(canvas) {
        let width = canvas.clientWidth || canvas.offsetWidth || 300;
        let height = canvas.clientHeight || canvas.offsetHeight || 150;

        if ((!width || !height) || width === 0 || height === 0) {
            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, Math.round(rect.width)) || 300;
            height = Math.max(1, Math.round(rect.height)) || 150;
        }

        return { width, height };
    },

    _onResize: function(canvasId) {
        const sceneData = this.activeScenes.get(canvasId);
        if (!sceneData) return;

        const size = this._getCanvasSize(sceneData.canvas);

        sceneData.camera.aspect = size.width / size.height;
        sceneData.camera.updateProjectionMatrix();

        sceneData.renderer.setPixelRatio(window.devicePixelRatio || 1);
        sceneData.renderer.setSize(size.width, size.height, false);
    }
};