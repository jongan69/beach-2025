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

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        // Font loader for 3D text
        this.fontLoader = new FontLoader()
        this.font = null
        this.fontLoadPromise = null

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
        // Frontend URL configuration
        // Set this to your frontend URL, or use window.FRONTEND_URL if set
        // const frontendBaseUrl = window.FRONTEND_URL || 'http://localhost:3000'
        const frontendBaseUrl = 'https://mdcgradtrack.netlify.app'

        // Career areas configuration
        // Each area represents a different career path
        const careerAreas = [
            {
                name: 'Software Engineering',
                position: new THREE.Vector2(this.x, this.y - 30),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'software-engineering',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Data Science',
                position: new THREE.Vector2(this.x + 20, this.y - 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'data-science',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Business',
                position: new THREE.Vector2(this.x + 30, this.y),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'business',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Design',
                position: new THREE.Vector2(this.x + 20, this.y + 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'design',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Healthcare',
                position: new THREE.Vector2(this.x, this.y + 30),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'healthcare',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Finance',
                position: new THREE.Vector2(this.x - 20, this.y + 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'finance',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Education',
                position: new THREE.Vector2(this.x - 30, this.y),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'education',
                frontendUrl: frontendBaseUrl
            },
            {
                name: 'Engineering',
                position: new THREE.Vector2(this.x - 20, this.y - 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'engineering',
                frontendUrl: frontendBaseUrl
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

            // Add interact handler to navigate to frontend with career parameter
            area.on('interact', () => {
                // const url = `${career.frontendUrl}/career/${career.careerId}`
                const url = `${career.frontendUrl}`
                console.log(`Navigating to career: ${career.name} at ${url}`)
                window.open(url, '_blank')
            })

            // Store career info for potential future use
            area.careerName = career.name
            area.careerId = career.careerId

            this.careerAreas.push(area)
        }
    }

    /**
     * Loads the font if not already loaded and returns a promise
     * @returns {Promise} Promise that resolves with the font
     */
    loadFont()
    {
        if (this.font) {
            return Promise.resolve(this.font)
        }
        
        if (this.fontLoadPromise) {
            return this.fontLoadPromise
        }
        
        this.fontLoadPromise = new Promise((resolve, reject) => {
            this.fontLoader.load(
                'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
                (font) => {
                    this.font = font
                    resolve(font)
                },
                undefined,
                (error) => {
                    reject(error)
                }
            )
        })
        
        return this.fontLoadPromise
    }

    /**
     * Creates 3D text at any position with independent positioning
     * @param {string} text - The text to display
     * @param {number} x - X position in world space
     * @param {number} y - Y position in world space
     * @param {number} z - Z position in world space (default: 1)
     * @param {Object} options - Optional configuration
     * @param {THREE.Material} options.material - Material to use (default: green material)
     * @param {number} options.size - Text size (default: 1.5)
     * @param {number} options.height - Text height/depth (default: 0.4)
     * @param {number} options.letterSpacing - Spacing between letters (default: 0.3)
     * @param {number} options.mass - Physics mass (default: 2)
     * @param {string} options.soundName - Sound to play on collision (default: 'car-hits')
     * @returns {Promise} Promise that resolves when text is created
     */
    async addText3D(text, x, y, z = 1, options = {})
    {
        // Load font if needed
        const font = await this.loadFont()
        
        // Default options
        const {
            material = this.objects.materials.shades.items.green,
            size = 1.5,
            height = 0.4,
            letterSpacing = 0.3,
            mass = 2,
            soundName = 'car-hits'
        } = options
        
        const letters = text.split('')
        
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
                    size: size,
                    height: height,
                    curveSegments: 16,
                    bevelEnabled: true,
                    bevelThickness: 0.15,
                    bevelSize: 0.12,
                    bevelOffset: 0,
                    bevelSegments: 8
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
                size: size,
                height: height,
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
            const sizeVec = new THREE.Vector3()
            letterGeometry.boundingBox.getSize(sizeVec)
            
            // Create visual mesh - use provided material
            const textMaterial = material.clone()
            const letterMesh = new THREE.Mesh(letterGeometry, textMaterial)
            
            // Create collision mesh - use a box shape with proper naming for physics system
            const collisionBoxGeometry = new THREE.BoxGeometry(1, 1, 1)
            const collisionMesh = new THREE.Mesh(collisionBoxGeometry, new THREE.MeshBasicMaterial({ visible: false }))
            collisionMesh.name = 'cube' // Important: name must match physics system pattern
            collisionMesh.scale.set(sizeVec.x, sizeVec.y, sizeVec.z)
            
            // Create base scene for visual
            const baseScene = new THREE.Scene()
            baseScene.add(letterMesh)
            
            // Create collision scene
            const collisionScene = new THREE.Scene()
            collisionScene.add(collisionMesh)
            
            // Calculate position for this letter
            const letterX = x + currentX + letterWidths[i] / 2
            
            // Add letter to world with collision
            // Rotate 90 degrees on x-axis (Math.PI / 2 radians)
            // Use positive mass to make it movable by the boat
            this.objects.add({
                base: baseScene,
                collision: collisionScene,
                offset: new THREE.Vector3(letterX, y, z),
                rotation: new THREE.Euler(Math.PI / 2, 0, 0), // 90 degrees on x-axis
                mass: mass, // Dynamic object - can be moved by boat collisions
                sleep: false, // Start awake so it can be moved immediately
                soundName: soundName // Play sound on collision
            })
            
            // Move to next letter position
            currentX += letterWidths[i] + letterSpacing
        }
    }

    setGradTrackText()
    {
        // Create "Grad Track" text at independent position
        this.addText3D('Grad Track', this.x, this.y - 14, 1)
        
        // Create "SharkByte Hackathon" text at independent position (moved 60 pixels/6 units forward from Grad Track)
        this.addText3D('SharkByte Hackathon', this.x, this.y - 3.5, 1)
    }
}
