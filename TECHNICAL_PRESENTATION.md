# GradTrack - Technical Presentation Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Core Systems](#core-systems)
4. [3D Rendering Pipeline](#3d-rendering-pipeline)
5. [Physics System](#physics-system)
6. [AI Integration](#ai-integration)
7. [User Interface & Interactions](#user-interface--interactions)
8. [Performance Optimization](#performance-optimization)
9. [Build & Deployment](#build--deployment)
10. [Key Technical Decisions](#key-technical-decisions)
11. [Challenges & Solutions](#challenges--solutions)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

**GradTrack** is an immersive 3D web application that transforms academic course planning into an interactive exploration experience. Users navigate a beach environment in a boat, discovering eight career paths and generating personalized course plans through AI-powered conversations.

### Key Features
- **3D Navigation**: Physics-based boat/car controls with WASD or arrow keys
- **8 Career Areas**: Software Engineering, Data Science, Business, Design, Healthcare, Finance, Education, Engineering
- **AI-Powered Chat**: Google Gemini integration with function calling for structured course plan generation
- **Text-to-Speech**: Eleven Labs API for reading course plans aloud
- **PDF Export**: Downloadable course plans with visual flowcharts
- **Post-Processing Effects**: Custom shaders for blur and glow effects
- **Mobile Support**: Touch controls and optimized rendering

---

## Architecture & Technology Stack

### Frontend Framework
- **Build Tool**: Vite 5.2.11
- **Package Manager**: Bun
- **Module System**: ES6 Modules

### Core Libraries

#### 3D Rendering
- **Three.js 0.164.1**: Core 3D rendering engine
  - WebGL renderer with high-performance settings
  - Scene graph management
  - GLB/GLTF model loading
  - Post-processing pipeline (EffectComposer)

#### Physics
- **Cannon.js 0.6.2**: Physics simulation engine
  - Vehicle dynamics (boat/car movement)
  - Collision detection
  - Material interactions
  - Gravity and force simulation

#### Animation & UI
- **GSAP 3.12.5**: Smooth animations and transitions
- **dat.GUI 0.7.9**: Debug interface (development mode)

#### Audio
- **Howler.js 2.2.4**: Spatial audio and sound effects
  - Engine sounds
  - Collision sounds
  - UI feedback sounds

#### AI Services
- **@google/genai 0.2.0**: Google Gemini API integration
  - Function calling for structured responses
  - Chat completion with system instructions
  - Google Search integration for real-time data
- **@elevenlabs/elevenlabs-js 2.22.0**: Text-to-speech service

### Build Tools & Plugins
- **vite-plugin-glsl 1.3.0**: GLSL shader support
- **vite-plugin-restart 0.4.0**: Development server auto-restart

### External Services
- **College Financial API**: Degree cost calculations (`college-financial-api.gradtrack.workers.dev`)
- **Articulation Vector DB API**: College articulation document search (`articulation-vector-db-api.onrender.com`)

---

## Core Systems

### Application Architecture

The application follows a modular, event-driven architecture:

```
Application (Main Entry Point)
├── Time (Event Emitter for frame timing)
├── Sizes (Viewport management)
├── Resources (Asset loading)
├── Camera (3D camera controls)
├── Renderer (WebGL renderer)
├── Passes (Post-processing pipeline)
├── Chat (AI chat interface)
├── World (3D world container)
│   ├── Physics (Cannon.js simulation)
│   ├── Controls (Input handling)
│   ├── Car/Boat (Vehicle model)
│   ├── Areas (Interactive zones)
│   ├── Sections (BeachSection, etc.)
│   ├── Materials (Shader materials)
│   ├── Shadows (Dynamic shadows)
│   ├── Sounds (Audio management)
│   └── Objects (3D object management)
└── ThreejsJourney (Easter egg system)
```

### 1. Application Class (`Application.js`)

**Purpose**: Main application orchestrator

**Key Responsibilities**:
- Initialize all subsystems
- Manage render loop
- Coordinate between systems
- Handle resize events
- Set up post-processing pipeline

**Key Methods**:
- `setRenderer()`: Creates WebGL renderer with high-performance settings
- `setCamera()`: Initializes camera with orbit controls
- `setPasses()`: Sets up post-processing pipeline (blur, glows)
- `setWorld()`: Creates 3D world container
- `setChat()`: Initializes AI chat system

**Configuration**:
- Debug mode: `#debug` hash in URL
- Touch detection: Automatic mobile detection
- Performance: Pixel ratio capped at 2, high-performance GPU preference

### 2. World System (`World/index.js`)

**Purpose**: Container for all 3D world elements

**Key Components**:
- **Physics**: Cannon.js world simulation
- **Controls**: Input handling (keyboard/touch)
- **Car/Boat**: Vehicle physics and rendering
- **Areas**: Interactive zones for career paths
- **Sections**: Modular world sections (BeachSection)
- **Materials**: Shader material management
- **Shadows**: Dynamic shadow rendering
- **Sounds**: Spatial audio system

**Initialization Flow**:
1. Create container and basic systems
2. Load resources (models, textures)
3. Set up physics world
4. Create vehicle
5. Set up interactive areas
6. Initialize sections
7. Start reveal animation

### 3. Resources System (`Resources.js`)

**Purpose**: Centralized asset loading and management

**Features**:
- GLB/GLTF model loading
- Texture loading
- Progress tracking
- Event-driven loading completion
- Automatic tree-to-palm-tree conversion for beach scene

**Asset Categories**:
- Matcaps (14 different materials)
- Vehicle models (boat, car variants)
- Environment models (palm trees, static objects)
- UI elements (area indicators, labels)
- Project assets (trophy models, distinction awards)

**Loading Strategy**:
- Sequential loading with progress events
- Automatic texture conversion
- Scene cleanup (removes unwanted objects)

### 4. Camera System (`Camera.js`)

**Purpose**: 3D camera management and controls

**Features**:
- Perspective camera (40° FOV)
- Smooth target following with easing
- Zoom controls (mouse wheel, touch pinch)
- Pan controls (mouse drag, touch drag)
- Orbit controls (debug mode)
- Multiple camera angles (default, projects)

**Camera Behavior**:
- Follows vehicle position with easing
- Adjusts zoom based on user input
- Supports panning for exploration
- Responsive to viewport changes

---

## 3D Rendering Pipeline

### Rendering Flow

```
Scene Rendering
    ↓
RenderPass (Base scene)
    ↓
HorizontalBlurPass (Custom shader)
    ↓
VerticalBlurPass (Custom shader)
    ↓
GlowsPass (Custom shader)
    ↓
Final Output
```

### Post-Processing Passes

#### 1. Blur Pass (`Passes/Blur.js`)

**Purpose**: Depth-of-field effect using dual-pass blur

**Shader**: `shaders/blur/fragment.glsl`
- Uses 9-tap Gaussian blur
- Horizontal and vertical passes for efficiency
- Sinusoidal strength distribution (stronger at edges)
- Configurable strength via uniforms

**Uniforms**:
- `uResolution`: Viewport dimensions
- `uStrength`: Blur strength (Vector2 for direction)

**Optimization**:
- Disabled on touch devices (performance)
- Can be toggled per-pass
- Efficient 9-tap kernel

#### 2. Glows Pass (`Passes/Glows.js`)

**Purpose**: Atmospheric glow effect

**Shader**: `shaders/glows/fragment.glsl`
- Radial distance-based glow
- Color mixing with scene
- Configurable position, radius, color, alpha

**Uniforms**:
- `uPosition`: Glow center (Vector2)
- `uRadius`: Glow radius (float)
- `uColor`: Glow color (Vector3)
- `uAlpha`: Glow intensity (float)

**Default Settings**:
- Position: (0, 0.25)
- Radius: 0.7
- Color: #ffcfe0 (pink)
- Alpha: 0.55

### Custom Shaders

#### Matcap Shader (`shaders/matcap/`)
- Material capture rendering
- Reveal animation support
- Multiple matcap textures
- Per-object material assignment

#### Floor Shader (`shaders/floor/`)
- Procedural floor generation
- Sand circle effects (palm tree shadows)
- UV-based patterns
- Dynamic updates

#### Area Shaders (`shaders/areaFence/`, `shaders/areaFloorBorder/`)
- Interactive area indicators
- Progress animations
- Border effects
- Loading state visualization

#### Shadow Shader (`shaders/shadow/`)
- Dynamic shadow rendering
- Soft shadows
- Alpha-based fading
- Performance-optimized

### Material System (`Materials.js`)

**Purpose**: Centralized material management

**Material Types**:
- **Shades**: Matcap-based materials with reveal animation
- **Floor**: Procedural floor materials
- **Area**: Interactive area materials
- **Project Board**: Project display materials

**Features**:
- Automatic material assignment
- Reveal animation coordination
- Texture management
- Debug controls

---

## Physics System

### Cannon.js Integration (`Physics.js`)

**World Configuration**:
- Gravity: -13 (Z-axis down)
- Allow sleep: Enabled (performance)
- Default friction: 0
- Default restitution: 0.2

**Vehicle Physics** (`Physics.setCar()`):

**Chassis**:
- Dimensions: 1.02 × 1.16 × 2.03 (width × height × depth)
- Mass: 40 kg
- Offset: (0, 0, 0.41)

**Wheels** (if car mode):
- Radius: 0.25
- Height: 0.24
- Suspension stiffness: 50
- Suspension rest length: 0.1
- Friction slip: 10
- Damping relaxation: 1.8
- Damping compression: 1.5
- Max suspension force: 100000
- Roll influence: 0.01
- Max suspension travel: 0.3

**Controls**:
- Steering speed: 0.015
- Max steering angle: ~30° (0.17π radians)
- Acceleration max speed: ~0.01 (normal), ~0.02 (boost)
- Acceleration speed: 16 (normal), 28 (boost)
- Brake strength: 1.35

**Physics Update Loop**:
```javascript
time.on('tick', () => {
    world.step(time.delta / 1000) // Fixed timestep
})
```

**Vehicle State Tracking**:
- Speed calculation (position delta)
- Forward direction vector
- Angle calculation (atan2)
- Forward speed (dot product)
- Upside-down detection

### Material Interactions

**Contact Materials**:
- `floorDummy`: Friction 0.05, Restitution 0.3
- `dummyDummy`: Friction 0.5, Restitution 0.3
- `floorWheel`: Friction 0.3, Restitution 0

**Collision Detection**:
- Broadphase: Default (no SAP)
- Contact materials for realistic interactions
- Sleep system for inactive objects

---

## AI Integration

### Chat System (`Chat.js`)

**Purpose**: User-facing chat interface with AI backend

**Key Features**:
- Message history management
- Loading states
- Function call orchestration
- PDF generation
- Text-to-speech integration
- Flowchart rendering

**Initialization**:
- DOM element detection with retry logic
- AI chat initialization
- Event listener setup
- Error handling

**Message Flow**:
1. User sends message
2. Display user message in UI
3. Set loading state
4. Send to AI (`sendMessageToAI`)
5. Handle function calls if present
6. Display AI response
7. Clear loading state

**Function Call Handling**:
- Sequential processing
- Recursive handling (max depth: 5)
- Error recovery
- Timeout protection (60 seconds)

### Gemini Service (`services/gemini.js`)

**Initialization** (`initializeChat()`):
- Model: `gemini-2.5-flash`
- System instruction: Career advisor persona
- Tools: 10 function declarations
- Google Search integration

**Function Tools**:

1. **generate_study_flowchart**
   - Generates 2-year or 4-year course plans
   - Returns structured JSON with timeline
   - Includes extracurriculars

2. **offer_pdf_export**
   - Triggers PDF generation
   - Uses html2canvas and jsPDF

3. **analyze_career_potential**
   - Analyzes interests, skills, resume
   - Suggests career paths

4. **get_tuition_estimate**
   - Estimates tuition costs
   - Uses Google Search for current data

5. **get_course_summary**
   - Provides course details
   - Prerequisites, topics, difficulty

6. **get_teacher_reviews**
   - Fetches Rate My Professor data
   - Summarizes reviews

7. **find_teachers**
   - Finds teachers by criteria
   - Sorted by rating/reviews

8. **get_transfer_options**
   - Transfer program information
   - Articulation agreements

9. **calculate_degree_cost**
   - Uses College Financial API
   - Single or comparison queries

10. **search_college_articulation_docs**
    - Vector database search
    - PDF document retrieval

**Message Sending** (`sendMessageToAI()`):
- Handles text messages
- Handles function responses
- Extracts function calls
- Extracts text (avoiding SDK warnings)
- Returns structured response

**Flowchart Generation** (`getFlowchartData()`):
- Model: `gemini-2.5-flash` (more capable)
- Google Search enabled
- Structured JSON output
- Validation and error handling
- Markdown code block extraction

### Eleven Labs Service (`services/eleven.js`)

**Purpose**: Text-to-speech conversion

**Features**:
- Voice ID: `bajNon13EdhNMndG3z05`
- Model: `eleven_multilingual_v2`
- Retry logic (max 2 retries)
- Timeout: 60 seconds
- Browser audio playback

**Audio Playback**:
- Converts ReadableStream to ArrayBuffer
- Creates Blob with audio/mpeg type
- Uses HTML5 Audio API
- Automatic cleanup on completion

**Error Handling**:
- Graceful degradation (no API key)
- Console warnings (non-blocking)
- Error propagation

---

## User Interface & Interactions

### Chat Widget (`index.html`)

**HTML Structure**:
- Header with title and close button
- Messages container (scrollable)
- Input container with text input and send button
- Toggle button (floating)

**CSS Classes**:
- `.chat-widget`: Main container
- `.chat-widget__header`: Header section
- `.chat-widget__messages`: Messages area
- `.chat-widget__input-container`: Input section
- `.chat-widget__toggle`: Floating toggle button

**Interactions**:
- Click toggle to open/close
- Enter key to send message
- Escape key to blur input
- Arrow keys/WASD blocked when input focused

### Career Area Interaction (`BeachSection.js`)

**Area Configuration**:
- 8 career areas positioned around center
- Each area: 3×3 unit size
- Has key indicator
- Tests car collision
- Active by default

**Interaction Flow**:
1. User drives boat to area
2. Area detects collision
3. Shows "Press Enter" indicator
4. User presses Enter
5. Chat opens with career context
6. Pre-filled message sent automatically
7. AI generates course plan

**Retry Logic**:
- Checks chat initialization
- Retries up to 20 times (200ms intervals)
- Reinitializes if needed
- Error handling and logging

### Flowchart Rendering (`Chat.js`)

**HTML Generation** (`createFlowchartHTML()`):
- Career title header
- Download PDF button
- Institution sections
- Term-by-term timeline
- Course lists
- Extracurriculars section
- Visual arrows between terms

**Styling**:
- CSS classes for each element
- Responsive design
- Scrollable container
- Visual hierarchy

**PDF Generation** (`generatePDF()`):
- Uses html2canvas for rendering
- Uses jsPDF for PDF creation
- Multi-page support
- Proper scaling and margins
- Filename: `study-plan-{career}.pdf`

---

## Performance Optimization

### Rendering Optimizations

1. **Pixel Ratio Capping**:
   - Capped at 2 (prevents excessive rendering on high-DPI displays)
   - Balance between quality and performance

2. **Frustum Culling**:
   - Three.js automatic culling
   - Objects outside view frustum not rendered

3. **Object Sleep System**:
   - Cannon.js sleep for inactive objects
   - Reduces physics calculations

4. **Shader Optimization**:
   - Efficient blur kernels (9-tap)
   - Conditional shader passes (disabled on mobile)
   - Minimal uniform updates

5. **Texture Optimization**:
   - Appropriate texture sizes
   - Nearest/Linear filtering where appropriate
   - Texture reuse

### Mobile Optimizations

1. **Touch Detection**:
   - Automatic detection on first touch
   - Disables blur passes (performance)
   - Adjusts controls

2. **Touch Controls**:
   - On-screen joystick
   - Virtual buttons
   - Optimized rendering

3. **Performance Monitoring**:
   - Frame rate tracking
   - Adaptive quality (if implemented)

### Asset Loading

1. **Progressive Loading**:
   - Progress indicators
   - Event-driven completion
   - Non-blocking initialization

2. **Resource Management**:
   - Centralized loading
   - Proper disposal
   - Memory cleanup

---

## Build & Deployment

### Build Configuration (`vite.config.js`)

**Key Settings**:
- Root: `src/`
- Public directory: `../static/`
- Output: `../dist/`
- Source maps: Enabled
- Server: Host true, auto-open

**Plugins**:
- `vite-plugin-glsl`: GLSL shader import
- `vite-plugin-restart`: Auto-restart on static file changes

**Environment Variables**:
- `GEMINI_API_KEY`: Google Gemini API key
- `ELEVENLABS_API_KEY`: Eleven Labs API key
- Exposed via `import.meta.env`

### Build Process

```bash
# Development
bun run dev

# Production
bun run build
```

**Build Output**:
- `dist/`: Production build
- `dist/assets/`: Bundled assets
- `dist/models/`: Static model files
- `dist/sounds/`: Audio files
- `dist/index.html`: Entry point

### Environment Setup

**Required Environment Variables**:
```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

**Optional Configuration**:
- Debug mode: `#debug` URL hash
- Touch mode: Automatic detection
- Cyber truck: Disabled (boat mode default)

---

## Key Technical Decisions

### 1. Three.js + Cannon.js Architecture

**Decision**: Separate physics and rendering systems

**Rationale**:
- Three.js for rendering, Cannon.js for physics
- Synchronization via position/rotation copying
- Allows independent optimization
- Industry-standard approach

**Implementation**:
- Physics updates in fixed timestep
- Visual updates follow physics
- Offset handling for model alignment

### 2. Custom Shader Pipeline

**Decision**: Custom GLSL shaders for post-processing

**Rationale**:
- Full control over visual effects
- Performance optimization
- Unique aesthetic
- Reusable shader components

**Benefits**:
- Custom blur effects
- Atmospheric glows
- Material reveal animations
- Performance control

### 3. Function Calling Architecture

**Decision**: Google Gemini function calling for structured responses

**Rationale**:
- Structured data extraction
- Reliable course plan generation
- Extensible tool system
- Error handling

**Implementation**:
- 10 specialized functions
- Recursive call handling
- Timeout protection
- Error recovery

### 4. Event-Driven Architecture

**Decision**: Custom EventEmitter for system communication

**Rationale**:
- Loose coupling
- Easy debugging
- Flexible event handling
- Standard pattern

**Usage**:
- Time tick events
- Resource loading events
- Area interaction events
- Resize events

### 5. Modular Section System

**Decision**: Separate sections (BeachSection, etc.)

**Rationale**:
- Code organization
- Reusability
- Easy expansion
- Isolated functionality

**Structure**:
- Each section manages its own areas
- Shared resources and systems
- Independent initialization

---

## Challenges & Solutions

### Challenge 1: Physics-Rendering Synchronization

**Problem**: Keeping Cannon.js physics in sync with Three.js rendering

**Solution**:
- Fixed timestep physics updates
- Position/rotation copying in render loop
- Offset vectors for model alignment
- Quaternion handling for boat rotation

**Code Pattern**:
```javascript
time.on('tick', () => {
    world.step(time.delta / 1000)
    // Then copy positions
    object.position.copy(physicsBody.position)
})
```

### Challenge 2: AI Function Call Nesting

**Problem**: Handling nested function calls without infinite loops

**Solution**:
- Recursion depth limit (5 levels)
- Sequential processing
- Proper error handling
- Timeout protection

**Implementation**:
```javascript
async handleFunctionCalls(functionCalls, depth = 0) {
    if (depth > MAX_DEPTH) return
    // Process sequentially
    // Recursive call with depth + 1
}
```

### Challenge 3: Chat Initialization Timing

**Problem**: Chat widget not ready when career area interacted

**Solution**:
- Retry logic with exponential backoff
- DOM readiness checks
- Reinitialization capability
- Comprehensive error logging

**Pattern**:
```javascript
let retries = 0
while (retries < maxRetries) {
    if (chat.initialized) break
    await sleep(200)
    retries++
}
```

### Challenge 4: Mobile Performance

**Problem**: Complex 3D scene too slow on mobile devices

**Solution**:
- Disable blur passes on touch devices
- Optimized shader passes
- Reduced pixel ratio
- Touch-specific controls

**Detection**:
```javascript
window.addEventListener('touchstart', () => {
    config.touch = true
    blurPass.strength = 0
}, { once: true })
```

### Challenge 5: PDF Generation

**Problem**: Generating PDFs from dynamic HTML content

**Solution**:
- html2canvas for rendering
- jsPDF for PDF creation
- Multi-page support
- Proper scaling

**Implementation**:
- Temporary DOM container
- Canvas rendering
- PDF page calculation
- Automatic download

### Challenge 6: Asset Loading Performance

**Problem**: Large number of 3D models causing slow loading

**Solution**:
- Progressive loading with progress indicators
- Event-driven completion
- Resource reuse
- Automatic cleanup

**Features**:
- Progress events
- Ready event
- Centralized management
- Memory optimization

---

## Future Enhancements

### Technical Improvements

1. **Web Workers for Physics**
   - Move Cannon.js to Web Worker
   - Offload main thread
   - Better performance

2. **Level of Detail (LOD)**
   - Multiple model resolutions
   - Distance-based switching
   - Performance optimization

3. **Asset Streaming**
   - Progressive model loading
   - On-demand loading
   - Reduced initial load time

4. **Caching Strategy**
   - Service Worker for assets
   - API response caching
   - Offline support

5. **Performance Monitoring**
   - FPS tracking
   - Memory usage monitoring
   - Adaptive quality

### Feature Enhancements

1. **Enhanced Career Paths**
   - More career options
   - Specialized fields
   - Emerging industries

2. **Social Features**
   - Share course plans
   - Compare with peers
   - Community recommendations

3. **Progress Tracking**
   - Academic progress visualization
   - Completion status
   - Milestone tracking

4. **Integration with Student Portals**
   - Real-time course availability
   - Registration integration
   - Grade tracking

5. **Advanced AI Features**
   - Resume analysis
   - Personality-based matching
   - Personalized recommendations

6. **3D Visualizations**
   - Prerequisite trees
   - Degree pathway visualization
   - Interactive course maps

7. **Multiplayer Mode**
   - Collaborative exploration
   - Shared planning sessions
   - Real-time collaboration

8. **VR/AR Support**
   - WebXR integration
   - Immersive exploration
   - Hand tracking

9. **Analytics Dashboard**
   - Popular career paths
   - Completion rates
   - Success metrics

10. **Mobile App**
    - Native iOS/Android
    - Push notifications
    - Offline support

---

## Technical Specifications

### Browser Requirements

**Minimum**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features**:
- WebGL 2.0
- ES6 Modules
- Fetch API
- Audio API
- Canvas API

### Performance Targets

- **Frame Rate**: 60 FPS (desktop), 30 FPS (mobile)
- **Initial Load**: < 5 seconds
- **Time to Interactive**: < 3 seconds
- **Memory Usage**: < 500 MB

### API Requirements

**Google Gemini**:
- API key required
- Function calling enabled
- Google Search integration

**Eleven Labs**:
- API key required
- Voice ID: `bajNon13EdhNMndG3z05`
- Model: `eleven_multilingual_v2`

**External APIs**:
- College Financial API (Cloudflare Worker)
- Articulation Vector DB API (Render.com)

---

## Code Organization

### Directory Structure

```
src/
├── javascript/
│   ├── Application.js          # Main app orchestrator
│   ├── Camera.js                # Camera system
│   ├── Chat.js                  # Chat UI and logic
│   ├── Resources.js             # Asset loading
│   ├── ThreejsJourney.js        # Easter eggs
│   ├── Utils/                   # Utility classes
│   │   ├── EventEmitter.js
│   │   ├── Loader.js
│   │   ├── Sizes.js
│   │   └── Time.js
│   ├── Materials/               # Material definitions
│   ├── Geometries/              # Geometry utilities
│   ├── Passes/                  # Post-processing passes
│   │   ├── Blur.js
│   │   └── Glows.js
│   └── World/                   # 3D world systems
│       ├── index.js
│       ├── Physics.js
│       ├── Controls.js
│       ├── Car.js
│       ├── Areas.js
│       ├── Sections/
│       │   └── BeachSection.js
│       └── ...
├── services/
│   ├── gemini.js                # Gemini AI service
│   └── eleven.js                # Eleven Labs TTS service
├── shaders/                     # GLSL shaders
│   ├── blur/
│   ├── glows/
│   ├── matcap/
│   └── ...
├── style/
│   └── main.css                 # Main stylesheet
└── index.html                   # Entry HTML
```

### Code Patterns

**Event-Driven**:
- Custom EventEmitter class
- `on()` / `off()` / `trigger()` methods
- Loose coupling between systems

**Class-Based**:
- ES6 classes throughout
- Constructor dependency injection
- Clear separation of concerns

**Async/Await**:
- Modern async patterns
- Proper error handling
- Promise-based APIs

**Modular Design**:
- Single responsibility principle
- Reusable components
- Clear interfaces

---

## Security Considerations

### API Key Management

- Environment variables only
- Never committed to repository
- Vite environment variable handling
- Client-side exposure (necessary for browser)

### Input Sanitization

- HTML escaping in chat messages
- XSS prevention
- Safe DOM manipulation

### CORS Configuration

- External API CORS handling
- Proper headers
- Secure requests

---

## Testing Considerations

### Manual Testing Checklist

- [ ] All 8 career areas functional
- [ ] Chat initialization works
- [ ] PDF generation works
- [ ] Text-to-speech works
- [ ] Mobile controls work
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] API failures handled gracefully

### Performance Testing

- Frame rate monitoring
- Memory leak detection
- Load time measurement
- Network request optimization

### Browser Testing

- Chrome (desktop/mobile)
- Firefox (desktop/mobile)
- Safari (desktop/mobile)
- Edge

---

## Conclusion

GradTrack represents a sophisticated integration of modern web technologies, combining 3D graphics, physics simulation, and AI services to create an engaging educational experience. The architecture is modular, performant, and extensible, providing a solid foundation for future enhancements.

**Key Strengths**:
- Clean, modular architecture
- Performance optimizations
- Robust error handling
- Extensible design
- Modern technology stack

**Areas for Growth**:
- Automated testing
- Performance monitoring
- Enhanced mobile experience
- Additional career paths
- Social features

This technical document provides a comprehensive overview of the GradTrack codebase, suitable for technical presentations, onboarding new developers, or planning future enhancements.

