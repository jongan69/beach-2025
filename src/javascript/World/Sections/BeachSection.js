import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

export default class BeachSection
{
    constructor(_options)
    {
        // Options
        this.config = _options.config
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.walls = _options.walls
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y
        this.application = _options.application // Store application instance

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setStatic()
        this.setTiles()
        this.setCareerAreas()
        this.setGradTrackText()
    }

    setStatic()
    {
        this.objects.add({
            base: this.resources.items.introStaticBase.scene,
            collision: this.resources.items.introStaticCollision.scene,
            floorShadowTexture: this.resources.items.introStaticFloorShadowTexture,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
    }

    setTiles()
    {
        // Create beach paths with palm trees connecting to career areas
        // Path to Software Engineering (North)
        this.tiles.add({
            start: new THREE.Vector2(this.x, this.y - 4.5),
            delta: new THREE.Vector2(0, - 25)
        })

        // Path to Data Science (Northeast)
        this.tiles.add({
            start: new THREE.Vector2(this.x, this.y),
            delta: new THREE.Vector2(20, - 20)
        })

        // Path to Business (East)
        this.tiles.add({
            start: new THREE.Vector2(this.x + 4.5, this.y),
            delta: new THREE.Vector2(25, 0)
        })

        // Path to Design (Southeast)
        this.tiles.add({
            start: new THREE.Vector2(this.x, this.y),
            delta: new THREE.Vector2(20, 20)
        })

        // Path to Healthcare (South)
        this.tiles.add({
            start: new THREE.Vector2(this.x, this.y + 4.5),
            delta: new THREE.Vector2(0, 25)
        })

        // Path to Finance (Southwest)
        this.tiles.add({
            start: new THREE.Vector2(this.x, this.y),
            delta: new THREE.Vector2(- 20, 20)
        })

        // Path to Education (West)
        this.tiles.add({
            start: new THREE.Vector2(this.x - 4.5, this.y),
            delta: new THREE.Vector2(- 25, 0)
        })

        // Path to Engineering (Northwest)
        this.tiles.add({
            start: new THREE.Vector2(this.x, this.y),
            delta: new THREE.Vector2(- 20, - 20)
        })
    }

    setCareerAreas()
    {
        // Career areas configuration
        // Each area represents a different career path
        const careerAreas = [
            {
                name: 'Software Engineering',
                position: new THREE.Vector2(this.x, this.y - 30),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'software-engineering'
            },
            {
                name: 'Data Science',
                position: new THREE.Vector2(this.x + 20, this.y - 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'data-science'
            },
            {
                name: 'Business',
                position: new THREE.Vector2(this.x + 30, this.y),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'business'
            },
            {
                name: 'Design',
                position: new THREE.Vector2(this.x + 20, this.y + 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'design'
            },
            {
                name: 'Healthcare',
                position: new THREE.Vector2(this.x, this.y + 30),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'healthcare'
            },
            {
                name: 'Finance',
                position: new THREE.Vector2(this.x - 20, this.y + 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'finance'
            },
            {
                name: 'Education',
                position: new THREE.Vector2(this.x - 30, this.y),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'education'
            },
            {
                name: 'Engineering',
                position: new THREE.Vector2(this.x - 20, this.y - 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'engineering'
            }
        ]

        // Create areas for each career
        this.careerAreas = []
        for (const career of careerAreas) {
            const area = this.areas.add({
                position: career.position,
                halfExtents: career.halfExtents,
                hasKey: true,
                testCar: true,
                active: true
            })

            // Add interact handler to open chat with career context
            area.on('interact', async () => {
                console.log(`Opening chat for career: ${career.name}`)
                
                // Use application instance passed to BeachSection, or fallback to window.application
                const app = this.application || window.application
                
                console.log('BeachSection: Checking chat availability', {
                    application: !!app,
                    chat: !!app?.chat,
                    initialized: app?.chat?.initialized
                })
                
                // Wait for chat to be available with retry logic
                let retries = 0
                const maxRetries = 20 // Increased retries
                
                while (retries < maxRetries) {
                    if (app && app.chat) {
                        // Check if chat is initialized, if not try to reinitialize
                        if (!app.chat.initialized) {
                            console.log('BeachSection: Chat exists but not initialized, waiting...')
                            await new Promise(resolve => setTimeout(resolve, 100))
                            retries++
                            continue
                        }
                        
                        try {
                            await app.chat.openWithCareer(career.name, career.careerId)
                            return
                        } catch (error) {
                            console.error('Error opening chat:', error)
                            return
                        }
                    }
                    
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 100))
                    retries++
                }
                
                console.error('Chat instance not available after retries', {
                    application: !!app,
                    chat: !!app?.chat,
                    initialized: app?.chat?.initialized
                })
            })

            // Store career info for potential future use
            area.careerName = career.name
            area.careerId = career.careerId

            this.careerAreas.push(area)
        }
    }

    setGradTrackText()
    {
        // Create 3D text "Grad Track" with each letter as an independent physics object
        const loader = new FontLoader()
        
        // Use Three.js default font (helvetiker)
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const text = 'Grad Track'
            const letters = text.split('')
            const letterSpacing = 0.3 // Spacing between letters
            const baseX = this.x
            const baseY = this.y - 10
            const baseZ = 1
            
            // Calculate total width to center the text
            let totalWidth = 0
            const letterWidths = []
            
            // First pass: calculate widths
            for (let i = 0; i < letters.length; i++) {
                const letter = letters[i]
                if (letter === ' ') {
                    letterWidths.push(1) // Space width
                    totalWidth += 1
                } else {
                    const letterGeometry = new TextGeometry(letter, {
                        font: font,
                        size: 2,
                        height: 0.5,
                        curveSegments: 12,
                        bevelEnabled: true,
                        bevelThickness: 0.1,
                        bevelSize: 0.1,
                        bevelOffset: 0,
                        bevelSegments: 5
                    })
                    letterGeometry.computeBoundingBox()
                    const width = letterGeometry.boundingBox.max.x - letterGeometry.boundingBox.min.x
                    letterWidths.push(width)
                    totalWidth += width
                    if (i < letters.length - 1) {
                        totalWidth += letterSpacing
                    }
                }
            }
            
            // Calculate starting x position to center the text
            let currentX = -totalWidth / 2
            
            // Second pass: create each letter as a separate object
            for (let i = 0; i < letters.length; i++) {
                const letter = letters[i]
                
                if (letter === ' ') {
                    // Skip spaces but account for their width
                    currentX += letterWidths[i] + letterSpacing
                    continue
                }
                
                // Create geometry for this letter
                const letterGeometry = new TextGeometry(letter, {
                    font: font,
                    size: 2,
                    height: 0.5,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.1,
                    bevelSize: 0.1,
                    bevelOffset: 0,
                    bevelSegments: 5
                })
                
                // Center the letter geometry
                letterGeometry.computeBoundingBox()
                const center = new THREE.Vector3()
                letterGeometry.boundingBox.getCenter(center)
                letterGeometry.translate(-center.x, -center.y, -center.z)
                
                // Get bounding box dimensions for collision
                const size = new THREE.Vector3()
                letterGeometry.boundingBox.getSize(size)
                
                // Create visual mesh - use green material from the materials system
                const textMaterial = this.objects.materials.shades.items.green.clone()
                const letterMesh = new THREE.Mesh(letterGeometry, textMaterial)
                
                // Create collision mesh - use a box shape with proper naming for physics system
                const collisionBoxGeometry = new THREE.BoxGeometry(1, 1, 1)
                const collisionMesh = new THREE.Mesh(collisionBoxGeometry, new THREE.MeshBasicMaterial({ visible: false }))
                collisionMesh.name = 'cube' // Important: name must match physics system pattern
                collisionMesh.scale.set(size.x, size.y, size.z)
                
                // Create base scene for visual
                const baseScene = new THREE.Scene()
                baseScene.add(letterMesh)
                
                // Create collision scene
                const collisionScene = new THREE.Scene()
                collisionScene.add(collisionMesh)
                
                // Calculate position for this letter
                const letterX = baseX + currentX + letterWidths[i] / 2
                
                // Add letter to world with collision
                // Rotate 90 degrees on x-axis (Math.PI / 2 radians)
                // Use positive mass to make it movable by the boat
                this.objects.add({
                    base: baseScene,
                    collision: collisionScene,
                    offset: new THREE.Vector3(letterX, baseY, baseZ),
                    rotation: new THREE.Euler(Math.PI / 2, 0, 0), // 90 degrees on x-axis
                    mass: 2, // Dynamic object - can be moved by boat collisions
                    sleep: false, // Start awake so it can be moved immediately
                    soundName: 'car-hits' // Play sound on collision
                })
                
                // Move to next letter position
                currentX += letterWidths[i] + letterSpacing
            }
        })
    }
}
