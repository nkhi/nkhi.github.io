import*as e from"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";class ChromaticAberration{constructor(){this.fractalCanvas=null,this.scene=null,this.camera=null,this.renderer=null,this.chromaticMesh=null,this.backgroundTexture=null,this.lensMaterial=null,this.chromaticEnabled=!1,this.hasBeenToggled=!1,window.chromaticEnabled=!1,this.init()}init(){this.waitForFractalCanvas()}waitForFractalCanvas(){let e=()=>{this.fractalCanvas=document.getElementById("fractal-canvas"),this.fractalCanvas?this.setupChromaticEffect():setTimeout(e,100)};e()}setupChromaticEffect(){this.createThreeJsScene(),this.createChromaticMaterial(),this.createChromaticMesh(),this.startRenderLoop(),this.addToggleControl()}createThreeJsScene(){this.scene=new e.Scene,this.camera=new e.OrthographicCamera(-1,1,1,-1,0,1),this.renderer=new e.WebGLRenderer({alpha:!0,antialias:!0}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.domElement.style.position="fixed",this.renderer.domElement.style.top="0",this.renderer.domElement.style.left="0",this.renderer.domElement.style.pointerEvents="none",this.renderer.domElement.style.zIndex="10",this.chromaticEnabled,this.renderer.domElement.style.opacity=1,document.body.appendChild(this.renderer.domElement),window.addEventListener("resize",()=>{this.renderer.setSize(window.innerWidth,window.innerHeight),this.updateBackgroundTexture()})}createChromaticMaterial(){let t=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,r=`
    uniform sampler2D backgroundTexture;
    uniform vec2 resolution;
    uniform bool chromaticEnabled;
    varying vec2 vUv;

    void main() {
        vec2 coord = gl_FragCoord.xy / resolution.xy;
        
        if (chromaticEnabled) {
            // Full-screen chromatic aberration mode
            vec2 center = vec2(0.5, 0.5);
            vec2 offset = coord - center;
            
            // Fixed optimal intensity for best visual result
            vec2 aberrationOffset = offset * 0.018; // Sweet spot intensity
            
            // Simple, consistent chromatic aberration sampling
            float r = texture2D(backgroundTexture, coord + aberrationOffset).r;
            float g = texture2D(backgroundTexture, coord).g;
            float b = texture2D(backgroundTexture, coord - aberrationOffset).b;
            
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
`;this.backgroundTexture=new e.Texture,this.backgroundTexture.flipY=!1,this.updateBackgroundTexture(),this.lensMaterial=new e.ShaderMaterial({uniforms:{backgroundTexture:{value:this.backgroundTexture},resolution:{value:new e.Vector2(window.innerWidth,window.innerHeight)},chromaticEnabled:{value:!1}},vertexShader:t,fragmentShader:r,transparent:!0,blending:e.NormalBlending})}createChromaticMesh(){let t=new e.PlaneGeometry(2,2);this.chromaticMesh=new e.Mesh(t,this.lensMaterial),this.scene.add(this.chromaticMesh)}updateBackgroundTexture(){this.fractalCanvas&&this.backgroundTexture&&(this.backgroundTexture.image=this.fractalCanvas,this.backgroundTexture.needsUpdate=!0,this.lensMaterial&&this.lensMaterial.uniforms.resolution.value.set(window.innerWidth,window.innerHeight))}startRenderLoop(){let e=()=>{this.chromaticEnabled&&this.renderer&&(this.updateBackgroundTexture(),this.renderer.render(this.scene,this.camera)),requestAnimationFrame(e)};e()}addToggleControl(){let e=()=>{let t=document.getElementById("animation-controls");t?this.addChromaticAberrationToggle(t):setTimeout(e,500)};e()}addChromaticAberrationToggle(e){let t=document.createElement("div");t.className="control-group",t.innerHTML=`
    <div class="checkbox-control">
        <div>
            <label>Chroma</label>
            <div class="control-description">VCR time</div>
        </div>
        <input type="checkbox" id="chromaticToggle" ${this.chromaticEnabled?"checked":""}>
    </div>
`;let r=e.querySelector("#fadeToggle").closest(".control-group");if(r&&r.nextSibling)e.insertBefore(t,r.nextSibling);else if(r)r.parentNode.insertBefore(t,r.nextSibling);else{let a=e.querySelector(".control-group");a?e.insertBefore(t,a):e.appendChild(t)}document.getElementById("chromaticToggle").addEventListener("change",e=>{this.chromaticEnabled=e.target.checked,this.hasBeenToggled=!0,this.updateChromaticMode()}),document.addEventListener("keydown",e=>{if("c"===e.key.toLowerCase()&&!["INPUT","TEXTAREA"].includes(e.target.tagName)&&"true"!==e.target.getAttribute("contenteditable")){this.chromaticEnabled=!this.chromaticEnabled,this.hasBeenToggled=!0,this.updateChromaticMode();let t=document.getElementById("chromaticToggle");t&&(t.checked=this.chromaticEnabled)}})}updateChromaticMode(){this.lensMaterial&&(this.lensMaterial.uniforms.chromaticEnabled.value=this.chromaticEnabled),window.chromaticEnabled=this.chromaticEnabled,this.updateRenderVisibility()}updateRenderVisibility(){if(this.renderer){this.renderer.domElement.style.display=this.chromaticEnabled?"block":"none";let e=document.getElementById("canvasOpacity"),t=document.getElementById("fractal-canvas");if(this.chromaticEnabled)this.renderer.domElement.style.opacity=1,t&&(t.style.opacity=1),e&&(e.hasAttribute("data-stored-value")||e.setAttribute("data-stored-value",e.value),e.value=100,e.disabled=!0,e.style.opacity="0.5");else if(e){let r=e.disabled,a=e.getAttribute("data-stored-value");if(a&&(e.value=a,e.removeAttribute("data-stored-value")),r&&(e.disabled=!1,e.style.opacity="1"),r||this.hasBeenToggled){let i=parseInt(e.value)/100;t&&(t.style.opacity=i)}}}}}window.addEventListener("load",()=>{setTimeout(()=>{window.chromaticAberration=new ChromaticAberration,console.log('Chroma effect initialized! Press "C" to toggle or use the checkbox in controls.')},2e3)});