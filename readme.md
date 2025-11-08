# GradTrack - Career Course Navigator

## Inspiration

GradTrack was inspired by the challenge of making academic planning more engaging and accessible. Traditional course planning tools are often dry, text-heavy, and difficult to navigate. We wanted to create an experience that feels more like exploration than paperwork—transforming the daunting task of choosing a career path and planning courses into an interactive, immersive journey. The beach theme represents the idea of "navigating your future" and finding your path through exploration, much like sailing across an ocean of possibilities.

## What it does

GradTrack is an interactive 3D web application that helps students explore career paths and generate personalized course plans for Miami Dade College. Users navigate a beautiful beach environment in a boat, discovering eight different career areas:

- **Software Engineering**
- **Data Science**
- **Business**
- **Design**
- **Healthcare**
- **Finance**
- **Education**
- **Engineering**

When users interact with a career area, an AI-powered chat assistant opens, powered by Google Gemini. The assistant can:
- Generate personalized 2-year Associate degree study plans
- Extend plans to 4-year Bachelor's degree paths with transfer options
- Provide course summaries and prerequisites
- Estimate tuition costs
- Find teacher reviews and ratings
- Analyze career potential based on interests and skills
- Offer PDF export functionality

The assistant also uses Eleven Labs text-to-speech to read course plans aloud, making the experience more accessible. The entire application runs in the browser with smooth 60fps performance, featuring custom shaders, physics-based movement, and beautiful post-processing effects.

## How we built it

**Frontend Architecture:**
- **Three.js** for 3D rendering and scene management
- **Cannon.js** for physics-based vehicle movement and collision detection
- **GSAP** for smooth animations and transitions
- **Custom GLSL shaders** for visual effects (blur, glows, matcaps, shadows)
- **Vite** as the build tool with GLSL plugin support
- **Howler.js** for spatial audio and sound effects

**AI Integration:**
- **Google Gemini API** with function calling for structured course plan generation
- **Eleven Labs API** for natural-sounding text-to-speech
- Custom chat widget with message handling and function call orchestration

**3D Assets:**
- GLB models for vehicles, environment objects, and UI elements
- Custom shader materials for floors, fences, and project boards
- Procedurally generated tiles and paths connecting career areas

**Key Features:**
- Physics-based boat/car controls (WASD or arrow keys)
- Interactive areas that trigger chat conversations
- Post-processing pipeline with blur and glow effects
- Responsive design with touch controls for mobile devices
- Real-time resource loading with progress indicators

## Challenges we ran into

**Performance Optimization:** Achieving smooth 60fps with complex 3D scenes, physics simulation, and post-processing effects required careful optimization. We implemented frustum culling, LOD (Level of Detail) systems, and efficient shader passes to maintain performance.

**AI Function Calling:** Integrating Google Gemini's function calling API was complex, especially handling nested function calls and error recovery. We implemented retry logic, timeout handling, and graceful error messages to ensure a smooth user experience.

**Physics Synchronization:** Keeping the physics simulation in sync with visual rendering while maintaining responsive controls was challenging. We had to fine-tune damping, friction, and force application to create natural-feeling movement.

**Chat Integration:** Ensuring the chat widget initializes correctly and integrates seamlessly with the 3D world required careful timing and state management. We implemented retry logic and proper DOM readiness checks to handle edge cases.

**Mobile Controls:** Adapting the desktop driving experience for touch devices required a complete redesign of the control scheme, including on-screen controls and adjusted camera behavior.

**Shader Complexity:** Creating custom shaders for various visual effects while maintaining performance required deep understanding of WebGL and careful optimization of uniform updates.

## Accomplishments that we're proud of

- **Seamless AI Integration:** Successfully integrated Google Gemini with function calling to generate structured, accurate course plans that students can actually use
- **Beautiful 3D Experience:** Created an immersive, visually stunning environment that makes academic planning feel like an adventure
- **Performance:** Achieved consistent 60fps performance even with complex scenes, physics, and post-processing
- **Accessibility:** Implemented text-to-speech functionality to make course plans accessible to users who prefer audio
- **User Experience:** Designed an intuitive interface where users can explore careers naturally through movement and interaction
- **Robust Error Handling:** Built comprehensive error handling and retry logic for API calls, ensuring the application remains functional even when services are temporarily unavailable
- **Mobile Support:** Successfully adapted the desktop experience for mobile devices with touch controls and optimized rendering

## What we learned

- **3D Web Development:** Deep dive into Three.js, WebGL shaders, and 3D asset optimization
- **Physics Simulation:** Understanding how to integrate physics engines (Cannon.js) with 3D rendering for realistic movement
- **AI API Integration:** Working with function calling APIs, handling async operations, and managing complex AI conversation flows
- **Performance Optimization:** Techniques for optimizing 3D web applications, including frustum culling, LOD systems, and efficient rendering pipelines
- **Post-Processing Effects:** Creating custom shader passes for visual effects like blur and glows
- **State Management:** Managing complex application state across 3D world, chat system, and AI interactions
- **Mobile Web Development:** Adapting desktop-first 3D experiences for touch devices
- **Error Handling:** Building resilient applications that gracefully handle API failures and edge cases

## What's next for GradTrack

- **Enhanced Career Paths:** Expand beyond 8 careers to include more specialized fields and emerging industries
- **Social Features:** Allow users to share their course plans and compare paths with peers
- **Progress Tracking:** Add features to track academic progress and visualize completion status
- **Integration with Student Portals:** Connect directly with Miami Dade College's student information system for real-time course availability and registration
- **Advanced AI Features:** Implement resume analysis, career matching based on personality tests, and personalized course recommendations
- **3D Visualizations:** Add interactive 3D visualizations of course prerequisites and degree pathways
- **Multiplayer Mode:** Allow multiple users to explore together and collaborate on course planning
- **VR/AR Support:** Extend the experience to virtual and augmented reality platforms for even more immersive exploration
- **Analytics Dashboard:** Provide insights into popular career paths, course completion rates, and student success metrics
- **Mobile App:** Develop native iOS and Android applications for on-the-go course planning

## Setup

Download [Node.js](https://nodejs.org/en/download/).
Run these commands:

```bash
# Install dependencies
bun install

# Serve at localhost:5173
bun run dev

# Build for production in the dist/ directory
bun run build
```

**Environment Variables:**
Create a `.env` file with:
```
VITE_API_KEY=your_gemini_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```
