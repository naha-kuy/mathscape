// pages/shared-three.js - Shared Three.js utilities
window.threeJSManager = {
    activeScenes: new Map(), // Track active scenes by canvas ID

    initScene: function(canvasId, options = {}) {
        console.log('Initializing Three.js scene for canvas:', canvasId);

        // Check if THREE is available, with fallback loading
        if (typeof THREE === 'undefined') {
            console.warn('THREE.js is not loaded. Attempting dynamic loading...');
            return this.loadThreeJS().then(() => this.initScene(canvasId, options));
        }

        // Check if OrbitControls is available, with fallback loading
        if (typeof OrbitControls === 'undefined') {
            console.warn('OrbitControls is not loaded. Attempting dynamic loading...');
            return this.loadOrbitControls().then(() => this.initScene(canvasId, options));
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

        // Renderer with mobile optimizations
        const pixelRatio = this._isMobileDevice() ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
        sceneData.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: options.antialias !== false && !this._isMobileDevice(), // Disable antialiasing on mobile for performance
            alpha: options.alpha || false,
            powerPreference: this._isMobileDevice() ? "low-power" : "high-performance" // Battery optimization for mobile
        });
        sceneData.renderer.setPixelRatio(pixelRatio);
        sceneData.renderer.setSize(size.width, size.height, false);

        // Mobile-specific renderer optimizations
        if (this._isMobileDevice()) {
            sceneData.renderer.shadowMap.enabled = false; // Disable shadows for performance
            sceneData.renderer.outputEncoding = THREE.sRGBEncoding; // Better color accuracy
        }

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

            // Mobile touch optimizations
            if (this._isMobileDevice()) {
                sceneData.controls.rotateSpeed *= 0.7; // Reduce rotation speed for mobile
                sceneData.controls.panSpeed *= 0.8; // Reduce pan speed for mobile
                sceneData.controls.zoomSpeed *= 0.8; // Reduce zoom speed for mobile
                sceneData.controls.enableDamping = true; // Ensure damping is enabled for smoother mobile experience
                sceneData.controls.dampingFactor = 0.08; // Slightly higher damping for mobile
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

        // Animation loop with mobile optimizations
        let lastTime = 0;
        const targetFPS = this._isMobileDevice() ? 30 : 60; // Reduce FPS on mobile for battery life
        const frameInterval = 1000 / targetFPS;

        const animate = (currentTime) => {
            sceneData.animationId = requestAnimationFrame(animate);

            // Throttle animation on mobile
            if (this._isMobileDevice() && currentTime - lastTime < frameInterval) {
                return;
            }
            lastTime = currentTime;

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

        // Optimize pixel ratio for mobile
        const pixelRatio = this._isMobileDevice() ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
        sceneData.renderer.setPixelRatio(pixelRatio);
        sceneData.renderer.setSize(size.width, size.height, false);
    },

    loadThreeJS: function() {
        return new Promise((resolve, reject) => {
            if (typeof THREE !== 'undefined') {
                resolve();
                return;
            }

            console.log('Dynamically loading Three.js...');

            const script = document.createElement('script');
            script.src = 'three.min.js';
            script.onload = () => {
                console.log('Three.js loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load Three.js');
                reject(new Error('Failed to load Three.js'));
            };

            document.head.appendChild(script);
        });
    },

    _isMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768 ||
               ('ontouchstart' in window);
    },

    loadOrbitControls: function() {
        return new Promise((resolve, reject) => {
            if (typeof OrbitControls !== 'undefined') {
                resolve();
                return;
            }

            console.log('Dynamically loading OrbitControls...');

            const script = document.createElement('script');
            script.src = 'OrbitControls.js';
            script.onload = () => {
                console.log('OrbitControls loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load OrbitControls');
                reject(new Error('Failed to load OrbitControls'));
            };

            document.head.appendChild(script);
        });
    }
};