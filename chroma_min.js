import*as e from"./three.module.js";class ChromaticAberration{constructor(){this.fractalCanvas=null,this.scene=null,this.camera=null,this.renderer=null,this.chromaticMesh=null,this.backgroundTexture=null,this.lensMaterial=null,this.chromaticEnabled=!0,this.fisheyeStrength=0,this.fisheyeBreathStartTime=null,this.hasBeenToggled=!1,window.chromaticEnabled=!0,this.init()}init(){this.waitForFractalCanvas()}waitForFractalCanvas(){let e=()=>{this.fractalCanvas=document.getElementById("fractal-canvas"),this.fractalCanvas?this.setupChromaticEffect():setTimeout(e,10)};e()}setupChromaticEffect(){this.createThreeJsScene(),this.createChromaticMaterial(),this.createChromaticMesh(),this.syncWithFadeState(),this.startRenderLoop(),this.addKeyboardShortcut()}createThreeJsScene(){this.scene=new e.Scene,this.camera=new e.OrthographicCamera(-1,1,1,-1,0,1),this.renderer=new e.WebGLRenderer({alpha:!0,antialias:!0}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.domElement.style.position="fixed",this.renderer.domElement.style.top="0",this.renderer.domElement.style.left="0",this.renderer.domElement.style.pointerEvents="none",this.renderer.domElement.style.zIndex="10",this.renderer.domElement.style.transition="opacity 3s ease-in-out",this.renderer.domElement.style.opacity=1,document.body.appendChild(this.renderer.domElement),window.addEventListener("resize",()=>{this.renderer.setSize(window.innerWidth,window.innerHeight),this.updateBackgroundTexture()})}createChromaticMaterial(){let t=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,r=`
    uniform sampler2D backgroundTexture;
    uniform vec2 resolution;
    uniform bool chromaticEnabled;
    uniform float fisheyeStrength;
    varying vec2 vUv;

    vec2 applyFisheye(vec2 coord, float strength) {
        vec2 center = vec2(0.5, 0.5);
        vec2 offset = coord - center;
        float distance = length(offset);
        
        if (distance == 0.0) return coord;
        
        // Apply fisheye distortion - stronger curve creates more pronounced effect
        float distortedDistance = pow(distance, 1.0 + strength * 0.5);
        
        // Normalize and apply the distorted distance
        vec2 direction = normalize(offset);
        vec2 distortedCoord = center + direction * distortedDistance;
        
        // Clamp to valid texture coordinates
        return clamp(distortedCoord, 0.0, 1.0);
    }

    void main() {
        vec2 coord = gl_FragCoord.xy / resolution.xy;
        
        if (chromaticEnabled) {
            // Apply fisheye distortion to coordinates
            vec2 fisheyeCoord = applyFisheye(coord, fisheyeStrength);
            
            // Full-screen chromatic aberration mode with fisheye-distorted coordinates
            vec2 center = vec2(0.5, 0.5);
            vec2 offset = fisheyeCoord - center;
            
            // Enhanced intensity for stronger RGB separation
            vec2 aberrationOffset = offset * 0.03; // Increased for more pronounced effect
            
            // Sample with fisheye-distorted coordinates
            float r = texture2D(backgroundTexture, applyFisheye(coord + aberrationOffset * 0.5, fisheyeStrength)).r;
            float g = texture2D(backgroundTexture, fisheyeCoord).g;
            float b = texture2D(backgroundTexture, applyFisheye(coord - aberrationOffset * 0.5, fisheyeStrength)).b;
            
            // Construct color with proper clamping
            vec3 color = vec3(r, g, b);
            
            // Simple tone mapping for bright areas
            float luminance = dot(color, vec3(0.299, 0.587, 0.114));
            if (luminance > 0.85) {
                float compressionFactor = 0.85 / luminance;
                color = color * compressionFactor;
            }
            
            // Very subtle enhancement
            float centerDistance = length(offset);
            color = color * (1.0 + centerDistance * 0.02);
            
            // Hard clamp to prevent oversaturation
            color = clamp(color, 0.0, 1.0);
            
            gl_FragColor = vec4(color, 1.0);
        } else {
            // Transparent when chromatic aberration is disabled
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
    }
`;this.backgroundTexture=new e.Texture,this.backgroundTexture.flipY=!1,this.updateBackgroundTexture(),this.lensMaterial=new e.ShaderMaterial({uniforms:{backgroundTexture:{value:this.backgroundTexture},resolution:{value:new e.Vector2(window.innerWidth,window.innerHeight)},chromaticEnabled:{value:this.chromaticEnabled},fisheyeStrength:{value:0}},vertexShader:t,fragmentShader:r,transparent:!0,blending:e.NormalBlending})}createChromaticMesh(){let t=new e.PlaneGeometry(2,2);this.chromaticMesh=new e.Mesh(t,this.lensMaterial),this.scene.add(this.chromaticMesh)}updateBackgroundTexture(){this.fractalCanvas&&this.backgroundTexture&&(this.backgroundTexture.image=this.fractalCanvas,this.backgroundTexture.needsUpdate=!0,this.lensMaterial&&this.lensMaterial.uniforms.resolution.value.set(window.innerWidth,window.innerHeight))}startRenderLoop(){let e=t=>{this.chromaticEnabled&&this.renderer&&(this.updateFisheyeBreathing(t),this.updateBackgroundTexture(),this.renderer.render(this.scene,this.camera)),requestAnimationFrame(e)};e()}updateFisheyeBreathing(e){if(!this.chromaticEnabled)return;if(!this.fisheyeBreathStartTime){this.fisheyeBreathStartTime=e+2e3,this.fisheyeStrength=0,this.lensMaterial&&(this.lensMaterial.uniforms.fisheyeStrength.value=this.fisheyeStrength);return}if(e<this.fisheyeBreathStartTime){this.fisheyeStrength=0,this.lensMaterial&&(this.lensMaterial.uniforms.fisheyeStrength.value=this.fisheyeStrength);return}let t=e-this.fisheyeBreathStartTime;this.fisheyeStrength=0+.02*((Math.sin(t%8e3/8e3*Math.PI*2-Math.PI/2)+1)/2),this.lensMaterial&&(this.lensMaterial.uniforms.fisheyeStrength.value=this.fisheyeStrength)}syncWithFadeState(){this.chromaticEnabled=void 0===window.fadeEnabled||window.fadeEnabled,window.chromaticEnabled=this.chromaticEnabled,this.updateChromaticMode()}addKeyboardShortcut(){document.addEventListener("keydown",e=>{if("c"===e.key.toLowerCase()&&!["INPUT","TEXTAREA"].includes(e.target.tagName)&&"true"!==e.target.getAttribute("contenteditable")){window.fadeEnabled=!window.fadeEnabled,this.chromaticEnabled=window.fadeEnabled,this.hasBeenToggled=!0;let t=document.getElementById("fadeToggle");t&&(t.checked=window.fadeEnabled),window.chromaticEnabled=this.chromaticEnabled,this.updateChromaticMode(),window.triggerCanvasClick&&window.triggerCanvasClick()}})}updateChromaticMode(){if(this.lensMaterial){this.lensMaterial.uniforms.chromaticEnabled.value=this.chromaticEnabled;let e=this.chromaticEnabled?this.fisheyeStrength:0;this.lensMaterial.uniforms.fisheyeStrength.value=e}this.chromaticEnabled?this.fisheyeBreathStartTime=null:(this.fisheyeBreathStartTime=null,this.fisheyeStrength=0),window.chromaticEnabled=this.chromaticEnabled,this.updateRenderVisibility()}updateRenderVisibility(){if(this.renderer){this.renderer.domElement.style.display=this.chromaticEnabled?"block":"none";let e=document.getElementById("canvasOpacity"),t=document.getElementById("fractal-canvas");if(t&&(t.style.transition="opacity 3s ease-in-out"),this.chromaticEnabled)this.renderer.domElement.style.opacity=1,t&&(t.style.opacity=1),e&&(e.hasAttribute("data-stored-value")||e.setAttribute("data-stored-value",e.value),e.value=100,e.disabled=!0,e.style.opacity="0.5");else if(e){let r=e.disabled,i=e.getAttribute("data-stored-value");if(i&&(e.value=i,e.removeAttribute("data-stored-value")),r&&(e.disabled=!1,e.style.opacity="1"),r||this.hasBeenToggled){let a=parseInt(e.value)/100;t&&(t.style.opacity=a)}}}}}window.addEventListener("load",()=>{setTimeout(()=>{window.chromaticAberration=new ChromaticAberration},2e3)});