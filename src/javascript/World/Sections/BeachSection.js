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
        this.floor = _options.floor // Floor for sand circle updates
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y
        this.application = _options.application // Store application instance
        this.physics = _options.physics // Physics system for collision

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
        this.setBeachDecorations()
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

    setBeachDecorations()
    {
        // Initialize all beach decorations
        // Create labels asynchronously (will wait for materials to be ready)
        this.setCareerAreaLabels().catch(err => {
            console.error('Error creating career area labels:', err)
        })
        this.setPalmTrees()
        this.setEasterEggCredits() // Easter egg credits
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
            delta: new THREE.Vector2(28, - 20)
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
            delta: new THREE.Vector2(- 28, - 20)
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
                position: new THREE.Vector2(this.x + 28, this.y - 20),
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
                position: new THREE.Vector2(this.x - 28, this.y - 20),
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

    async setCareerAreaLabels()
    {
        // Wait for materials to be available
        let retries = 0
        const maxRetries = 50
        while (retries < maxRetries) {
            if (this.objects && this.objects.materials && this.objects.materials.shades && this.objects.materials.shades.items) {
                break
            }
            await new Promise(resolve => setTimeout(resolve, 50))
            retries++
        }
        
        if (!this.objects || !this.objects.materials || !this.objects.materials.shades || !this.objects.materials.shades.items) {
            console.error('Materials not available after retries for career labels')
            return
        }

        // Career areas configuration with beach-themed colors
        const careerAreas = [
            {
                name: 'Software Engineering',
                position: new THREE.Vector2(this.x, this.y - 30),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'software-engineering',
                color: 'blue' // Ocean blue - tech waves
            },
            {
                name: 'Data Science',
                position: new THREE.Vector2(this.x + 28, this.y - 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'data-science',
                color: 'emeraldGreen' // Tropical emerald - vibrant data
            },
            {
                name: 'Business',
                position: new THREE.Vector2(this.x + 30, this.y),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'business',
                color: 'orange' // Sunset orange - golden hour business
            },
            {
                name: 'Design',
                position: new THREE.Vector2(this.x + 20, this.y + 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'design',
                color: 'purple' // Creative purple - tropical sunset
            },
            {
                name: 'Healthcare',
                position: new THREE.Vector2(this.x, this.y + 30),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'healthcare',
                color: 'red' // Coral red - medical care
            },
            {
                name: 'Finance',
                position: new THREE.Vector2(this.x - 20, this.y + 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'finance',
                color: 'yellow' // Golden yellow - sun & wealth
            },
            {
                name: 'Education',
                position: new THREE.Vector2(this.x - 30, this.y),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'education',
                color: 'beige' // Sand beige - beach learning
            },
            {
                name: 'Engineering',
                position: new THREE.Vector2(this.x - 28, this.y - 20),
                halfExtents: new THREE.Vector2(3, 3),
                careerId: 'engineering',
                color: 'metal' // Metal - technical precision
            }
        ]

        // Add labels for each career area with beach-themed colors
        for (const career of careerAreas) {
            // Position label above the area (z position slightly higher, y position offset upward)
            const labelY = career.position.y + career.halfExtents.y + 1.5
            const labelZ = 1.2
            
            // Get the beach-themed material for this career
            const material = this.objects.materials.shades.items[career.color] || 
                           this.objects.materials.shades.items.green // Fallback to green
            
            if (!material) {
                console.warn(`Material '${career.color}' not found for ${career.name}, skipping`)
                continue
            }
            
            // Use smaller text size for labels
            await this.addText3D(career.name, career.position.x, labelY, labelZ, {
                material: material,
                size: 0.8,
                height: 0.2,
                letterSpacing: 0.2,
                mass: 1, // Movable labels - can be pushed by the boat
                soundName: 'ui' // Quieter sound for labels
            })
        }
    }

    setPalmTrees()
    {
        // Check if palm tree model is available
        if (!this.resources.items.palmTree) {
            console.warn('Palm tree model not loaded')
            return
        }

        // Add palm trees around the beach area with natural distribution
        // Taller trees (increased by ~10 pixels/0.15-0.2 scale), avoiding text areas, with more trees in the background
        const palmTreePositions = [
            // Side palm trees - avoiding text area (SharkByte at y=-3.5, GradTrack at y=-14) - LARGE
            { x: this.x - 8, y: this.y - 8, rotation: Math.PI * 0.15, scale: 1.3 },
            { x: this.x + 8, y: this.y - 8, rotation: -Math.PI * 0.15, scale: 1.25 },
            { x: this.x - 8, y: this.y + 5, rotation: Math.PI * 0.12, scale: 1.35 },
            { x: this.x + 8, y: this.y + 5, rotation: -Math.PI * 0.12, scale: 1.28 },
            // Mid-range palm trees for depth - MEDIUM
            { x: this.x - 11, y: this.y - 10, rotation: Math.PI * 0.2, scale: 1.15 },
            { x: this.x + 11, y: this.y - 10, rotation: -Math.PI * 0.2, scale: 1.2 },
            { x: this.x - 11, y: this.y + 9, rotation: Math.PI * 0.18, scale: 1.18 },
            { x: this.x + 11, y: this.y + 9, rotation: -Math.PI * 0.18, scale: 1.22 },
            // Outer palm trees near career paths - MEDIUM
            { x: this.x - 14, y: this.y - 13, rotation: Math.PI * 0.1, scale: 1.1 },
            { x: this.x + 14, y: this.y - 13, rotation: -Math.PI * 0.1, scale: 1.12 },
            { x: this.x - 14, y: this.y + 12, rotation: Math.PI * 0.1, scale: 1.08 },
            { x: this.x + 14, y: this.y + 12, rotation: -Math.PI * 0.1, scale: 1.15 },
            // Background palm trees - create depth - SMALL
            { x: this.x - 16, y: this.y - 16, rotation: Math.PI * 0.08, scale: 1.0 },
            { x: this.x + 16, y: this.y - 16, rotation: -Math.PI * 0.08, scale: 0.97 },
            { x: this.x - 16, y: this.y + 16, rotation: Math.PI * 0.09, scale: 1.02 },
            { x: this.x + 16, y: this.y + 16, rotation: -Math.PI * 0.09, scale: 0.99 },
            { x: this.x, y: this.y - 18, rotation: 0, scale: 0.95 },
            { x: this.x, y: this.y + 18, rotation: 0, scale: 0.98 },
            // Additional background trees for fullness - SMALL
            { x: this.x - 19, y: this.y - 10, rotation: Math.PI * 0.12, scale: 0.93 },
            { x: this.x + 19, y: this.y - 10, rotation: -Math.PI * 0.12, scale: 0.91 },
            { x: this.x - 19, y: this.y + 10, rotation: Math.PI * 0.11, scale: 0.94 },
            { x: this.x + 19, y: this.y + 10, rotation: -Math.PI * 0.11, scale: 0.96 },
        ]

        palmTreePositions.forEach((pos, index) => {
            const palmTree = this.resources.items.palmTree.scene.clone()
            
            // Ensure all meshes are visible and have proper materials
            let meshCount = 0
            palmTree.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    meshCount++
                    // Ensure mesh is visible
                    child.visible = true
                    
                    // Fix materials to ensure they're visible and respond to lighting
                    if (child.material) {
                        // Handle material arrays
                        const materials = Array.isArray(child.material) ? child.material : [child.material]
                        
                        materials.forEach((material) => {
                            if (material) {
                                // Ensure material is visible
                                material.visible = true
                                material.transparent = false
                                
                                // If material doesn't respond to lights, convert it
                                if (material.type === 'MeshBasicMaterial') {
                                    const newMaterial = new THREE.MeshStandardMaterial({
                                        color: material.color || 0xffffff,
                                        map: material.map || null,
                                        metalness: 0.1,
                                        roughness: 0.7
                                    })
                                    if (Array.isArray(child.material)) {
                                        const matIndex = child.material.indexOf(material)
                                        child.material[matIndex] = newMaterial
                                    } else {
                                        child.material = newMaterial
                                    }
                                }
                                
                                // Ensure material updates
                                material.needsUpdate = true
                            }
                        })
                    } else {
                        // No material - add a default visible material
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.1,
                            roughness: 0.7
                        })
                    }
                }
            })
            
            palmTree.position.set(pos.x, pos.y, 0)
            palmTree.rotation.x = Math.PI / 2 // Rotate 90 degrees on x axis
            
            // Limit tilt to prevent palm trees from being too tilted
            // Maximum tilt: 0.15 radians (approximately 8.6 degrees)
            const maxTilt = 0.15
            const clampedRotation = Math.max(-maxTilt, Math.min(maxTilt, pos.rotation))
            palmTree.rotation.z = clampedRotation
            
            // Use specified scale with slight variation for natural look
            const scale = (pos.scale || 0.8) + (Math.random() - 0.5) * 0.1
            palmTree.scale.set(scale, scale, scale)
            
            // Ensure the palm tree itself is visible
            palmTree.visible = true
            
            // Update matrix before calculating bounding box
            palmTree.updateMatrixWorld(true)
            
            // Add collision box around palm tree trunk only
            if (this.physics) {
                // Find trunk/pole meshes in the palm tree
                const trunkMeshes = []
                palmTree.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const name = child.name.toLowerCase()
                        
                        // Check if this is a trunk/pole by name
                        const isTrunkByName = name.includes('trunk') || 
                                            name.includes('pole') || 
                                            name.includes('stem') ||
                                            name.includes('log')
                        
                        // Check geometry characteristics: tall, narrow, vertical objects are likely trunks
                        const box = new THREE.Box3().setFromObject(child)
                        const size = box.getSize(new THREE.Vector3())
                        const height = Math.max(size.x, size.y, size.z)
                        const width = Math.min(size.x, size.y, size.z)
                        const heightToWidthRatio = height > 0 ? height / Math.max(width, 0.1) : 0
                        
                        // Trunk characteristics: tall and narrow (height/width ratio > 2), and not leaves/fronds
                        const isTrunkByGeometry = heightToWidthRatio > 2.0 && 
                                                 height > 0.3 && 
                                                 !name.includes('leaf') &&
                                                 !name.includes('frond') &&
                                                 !name.includes('palm') &&
                                                 !name.includes('crown')
                        
                        if (isTrunkByName || isTrunkByGeometry) {
                            trunkMeshes.push(child)
                        }
                    }
                })
                
                // Calculate bounding box only for trunk meshes
                let trunkBox = new THREE.Box3()
                if (trunkMeshes.length > 0) {
                    // Calculate bounding box for all trunk meshes combined
                    trunkMeshes.forEach(mesh => {
                        const meshBox = new THREE.Box3().setFromObject(mesh)
                        trunkBox.union(meshBox)
                    })
                } else {
                    // Fallback: if no trunk found, use a default small box at the base
                    trunkBox.setFromCenterAndSize(
                        new THREE.Vector3(0, 0, 0.5),
                        new THREE.Vector3(0.3, 0.3, 1.0)
                    )
                }
                
                const size = trunkBox.getSize(new THREE.Vector3())
                const center = trunkBox.getCenter(new THREE.Vector3())
                
                // Create collision box using physics system
                const collisionBoxGeometry = new THREE.BoxGeometry(1, 1, 1)
                const collisionMesh = new THREE.Mesh(collisionBoxGeometry, new THREE.MeshBasicMaterial({ visible: false }))
                collisionMesh.name = 'box'
                collisionMesh.scale.set(size.x, size.y, size.z)
                
                // Add collision using physics system
                this.physics.addObjectFromThree({
                    meshes: [collisionMesh],
                    offset: new THREE.Vector3(pos.x + center.x, pos.y + center.y, center.z),
                    rotation: new THREE.Euler(0, 0, clampedRotation),
                    mass: 0, // Static object - palm trees don't move
                    sleep: true
                })
            }
            
            this.container.add(palmTree)
        })
        
        // Pass palm tree positions to floor for sand circles
        if (this.floor && this.floor.setPalmTreePositions) {
            const positions = palmTreePositions.map(pos => ({ x: pos.x, y: pos.y }))
            this.floor.setPalmTreePositions(positions)
            console.log('BeachSection: Sent palm tree positions to floor for sand circles')
        } else {
            console.warn('BeachSection: Floor not available for sand circles')
        }
    }

    setShark()
    {
        console.log('🦈🦈🦈 SETSHARK CALLED - NEW VERSION 2.0 🦈🦈🦈')
        
        // Add the original shark
        this.addSharkModel()
        
        // Add sharky
        this.addSharkyModel()
    }
    
    addSharkModel()
    {
        // Check if shark model is available
        if (!this.resources.items.shark) {
            console.warn('Shark model not loaded')
            return
        }

        const shark = this.resources.items.shark.scene.clone()
        console.log('🦈 Shark cloned successfully')
        
        // Ensure all meshes are visible and have proper materials
        shark.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Ensure mesh is visible
                child.visible = true
                
                // Fix materials to ensure they're visible and respond to lighting
                if (child.material) {
                    // Handle material arrays
                    const materials = Array.isArray(child.material) ? child.material : [child.material]
                    
                    materials.forEach((material) => {
                        if (material) {
                            // Ensure material is visible
                            material.visible = true
                            
                            // Convert MeshBasicMaterial to MeshStandardMaterial for proper lighting
                            if (material.type === 'MeshBasicMaterial') {
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: material.color || 0x6ab8ff, // Brighter blue
                                    map: material.map || null,
                                    metalness: 0.5, // More metallic for brightness
                                    roughness: 0.3, // Less rough = more reflective/brighter
                                    emissive: material.color || 0x2a5580, // Subtle glow
                                    emissiveIntensity: 0.2 // Gentle emission for brightness
                                })
                                if (Array.isArray(child.material)) {
                                    const matIndex = child.material.indexOf(material)
                                    child.material[matIndex] = newMaterial
                                } else {
                                    child.material = newMaterial
                                }
                            } else {
                                // Enhance existing materials to be brighter
                                material.metalness = Math.max(material.metalness || 0, 0.5)
                                material.roughness = Math.min(material.roughness !== undefined ? material.roughness : 1, 0.3)
                                if (material.color) {
                                    // Add emissive glow for brightness
                                    material.emissive = material.color.clone().multiplyScalar(0.3)
                                    material.emissiveIntensity = 0.2
                                }
                            }
                            
                            // Ensure material updates
                            material.needsUpdate = true
                        }
                    })
                } else {
                    // No material - add a default bright visible material
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x6ab8ff, // Brighter blue
                        metalness: 0.5, // More reflective
                        roughness: 0.3, // Less rough = brighter
                        emissive: 0x2a5580, // Subtle glow
                        emissiveIntensity: 0.2
                    })
                }
            }
        })
        
        // Position shark to the left of the 'n' in "Hackathon"
        // SharkByte Hackathon is at y = -3.5
        // The 'n' in "Hackathon" is near the end at approximately x + 9
        const sharkX = this.x + 9
        const sharkY = this.y - 3.5
        const sharkZ = 0.8
        
        shark.position.set(sharkX, sharkY, sharkZ)
        
        // Rotate shark to face left (toward the 'n')
        shark.rotation.x = Math.PI / 2 // Lay flat
        shark.rotation.y = 0
        shark.rotation.z = Math.PI / 2 // Face left
        
        // Scale shark appropriately
        const scale = 0.8
        shark.scale.set(scale, scale, scale)
        
        // Ensure the shark itself is visible
        shark.visible = true
        
        // Force matrix update
        shark.updateMatrix()
        shark.updateMatrixWorld(true)
        
        // Add dedicated lighting for the shark
        const sharkLight1 = new THREE.PointLight(0xffffff, 2, 10) // Bright white light
        sharkLight1.position.set(sharkX, sharkY, sharkZ + 3) // Above shark
        this.container.add(sharkLight1)
        
        const sharkLight2 = new THREE.PointLight(0x6ab8ff, 1.5, 8) // Blue accent light
        sharkLight2.position.set(sharkX + 2, sharkY, sharkZ + 2) // Side light
        this.container.add(sharkLight2)
        
        // Add directional light for overall illumination
        const sharkDirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        sharkDirLight.position.set(sharkX + 5, sharkY + 5, 5)
        sharkDirLight.target.position.set(sharkX, sharkY, sharkZ)
        this.container.add(sharkDirLight)
        this.container.add(sharkDirLight.target)
        
        this.container.add(shark)
        
        console.log('Shark positioned:', { x: sharkX, y: sharkY, z: sharkZ })
        console.log('Shark rotation:', { 
            x: shark.rotation.x, 
            y: shark.rotation.y, 
            z: shark.rotation.z,
            xDegrees: (shark.rotation.x * 180 / Math.PI).toFixed(2),
            zDegrees: (shark.rotation.z * 180 / Math.PI).toFixed(2)
        })
        console.log('🦈 Original Shark added with dedicated lighting')
    }
    
    addSharkyModel()
    {
        console.log('🦈 Adding Sharky model')
        
        // Check if sharky model is available
        if (!this.resources.items.sharky) {
            console.warn('Sharky model not loaded')
            return
        }

        const sharky = this.resources.items.sharky.scene.clone()
        console.log('🦈 Sharky cloned successfully')
        
        // Ensure all meshes are visible and have proper materials
        sharky.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Ensure mesh is visible
                child.visible = true
                
                // Fix materials to ensure they're visible and respond to lighting
                if (child.material) {
                    // Handle material arrays
                    const materials = Array.isArray(child.material) ? child.material : [child.material]
                    
                    materials.forEach((material) => {
                        if (material) {
                            // Ensure material is visible
                            material.visible = true
                            
                            // Convert MeshBasicMaterial to MeshStandardMaterial for proper lighting
                            if (material.type === 'MeshBasicMaterial') {
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: material.color || 0x6ab8ff, // Brighter blue
                                    map: material.map || null,
                                    metalness: 0.5, // More metallic for brightness
                                    roughness: 0.3, // Less rough = more reflective/brighter
                                    emissive: material.color || 0x2a5580, // Subtle glow
                                    emissiveIntensity: 0.2 // Gentle emission for brightness
                                })
                                if (Array.isArray(child.material)) {
                                    const matIndex = child.material.indexOf(material)
                                    child.material[matIndex] = newMaterial
                                } else {
                                    child.material = newMaterial
                                }
                            } else {
                                // Enhance existing materials to be brighter
                                material.metalness = Math.max(material.metalness || 0, 0.5)
                                material.roughness = Math.min(material.roughness !== undefined ? material.roughness : 1, 0.3)
                                if (material.color) {
                                    // Add emissive glow for brightness
                                    material.emissive = material.color.clone().multiplyScalar(0.3)
                                    material.emissiveIntensity = 0.2
                                }
                            }
                            
                            // Ensure material updates
                            material.needsUpdate = true
                        }
                    })
                } else {
                    // No material - add a default bright visible material
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x6ab8ff, // Brighter blue
                        metalness: 0.5, // More reflective
                        roughness: 0.3, // Less rough = brighter
                        emissive: 0x2a5580, // Subtle glow
                        emissiveIntensity: 0.2
                    })
                }
            }
        })
        
        // Position sharky to the left of the 'S' in "SharkByte"
        // SharkByte Hackathon is at y = -3.5
        // The text is about 22 units wide, 'S' is at the start at approximately x - 11
        const sharkyX = this.x - 12
        const sharkyY = this.y - 3.5
        const sharkyZ = 0.8
        
        sharky.position.set(sharkyX, sharkyY, sharkyZ)
        
        // Rotate sharky to face right (toward the text)
        sharky.rotation.x = Math.PI / 2 // Lay flat
        sharky.rotation.y = 0
        sharky.rotation.z = -Math.PI / 2 // Face right toward the 'S'
        
        // Scale sharky appropriately
        const scale = 0.8
        sharky.scale.set(scale, scale, scale)
        
        // Ensure sharky itself is visible
        sharky.visible = true
        
        // Force matrix update
        sharky.updateMatrix()
        sharky.updateMatrixWorld(true)
        
        // Add dedicated lighting for sharky
        const sharkyLight1 = new THREE.PointLight(0xffffff, 2, 10) // Bright white light
        sharkyLight1.position.set(sharkyX, sharkyY, sharkyZ + 3) // Above sharky
        this.container.add(sharkyLight1)
        
        const sharkyLight2 = new THREE.PointLight(0x6ab8ff, 1.5, 8) // Blue accent light
        sharkyLight2.position.set(sharkyX - 2, sharkyY, sharkyZ + 2) // Side light
        this.container.add(sharkyLight2)
        
        // Add directional light for overall illumination
        const sharkyDirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        sharkyDirLight.position.set(sharkyX - 5, sharkyY - 5, 5)
        sharkyDirLight.target.position.set(sharkyX, sharkyY, sharkyZ)
        this.container.add(sharkyDirLight)
        this.container.add(sharkyDirLight.target)
        
        this.container.add(sharky)
        
        console.log('Sharky positioned:', { x: sharkyX, y: sharkyY, z: sharkyZ })
        console.log('Sharky rotation:', { 
            x: sharky.rotation.x, 
            y: sharky.rotation.y, 
            z: sharky.rotation.z,
            xDegrees: (sharky.rotation.x * 180 / Math.PI).toFixed(2),
            zDegrees: (sharky.rotation.z * 180 / Math.PI).toFixed(2)
        })
        console.log('🦈 Sharky added with dedicated lighting')
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
            
            // Name the mesh with shade pattern so the parser recognizes the material
            // The parser looks for names matching /^shade([a-z]+)_?[0-9]{0,3}?/i
            // Materials already have names like "shadeBlue", "shadeOrange", etc.
            // Use the material's name directly so the parser can apply the correct material
            letterMesh.name = material.name || 'shadeGreen'
            
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

    /**
     * Add clickable area that links to GradTrack website
     */
    setGradTrackLinkArea()
    {
        console.log('🔗 Adding GradTrack website link area')
        
        // Position the clickable area above/near the "Grad Track" text
        const linkArea = this.areas.add({
            position: new THREE.Vector2(this.x, this.y - 14), // Same Y as Grad Track text
            halfExtents: new THREE.Vector2(8, 2), // Wide enough to cover the text
            hasKey: true, // Shows "Press Enter" prompt
            testCar: true,
            active: true
        })

        // Add interact handler to open the website
        linkArea.on('interact', () => {
            console.log('🔗 Opening GradTrack team website')
            
            // Open the website in a new tab
            window.open('https://next-linktree-omega.vercel.app/', '_blank')
        })

        // Store reference for debugging
        this.gradTrackLinkArea = linkArea
        
        console.log('🔗 GradTrack link area created successfully')
    }

    async setGradTrackText()
    {
        // Wait for materials to be available
        let retries = 0
        const maxRetries = 50
        while (retries < maxRetries) {
            if (this.objects && this.objects.materials && this.objects.materials.shades && this.objects.materials.shades.items) {
                break
            }
            await new Promise(resolve => setTimeout(resolve, 50))
            retries++
        }
        
        if (!this.objects || !this.objects.materials || !this.objects.materials.shades || !this.objects.materials.shades.items) {
            console.error('Materials not available for Grad Track text')
            return
        }
        
        // Create "Grad Track" text at independent position - emerald green
        await this.addText3D('Grad Track', this.x, this.y - 14, 1, {
            material: this.objects.materials.shades.items.emeraldGreen
        })
        
        // Create "SharkByte Hackathon" text at independent position - ocean blue
        // Create a custom ocean blue material (lighter, more cyan-tinted blue)
        const oceanBlueMaterial = this.objects.materials.shades.items.blue.clone()
        oceanBlueMaterial.name = 'shadeOceanBlue'
        // Ocean blue is typically around #006994 or #4A90E2 - adjust diffuse color
        oceanBlueMaterial.uniforms.diffuse.value = new THREE.Color(0x4A90E2) // Ocean blue color
        
        await this.addText3D('SharkByte Hackathon', this.x, this.y - 3.5, 1, {
            material: oceanBlueMaterial
        })
        
        // After text is created, add the shark
        this.setShark()
    }
    
    /**
     * Easter egg - Credits for the team in small 3D text
     */
    async setEasterEggCredits()
    {
        console.log('🥚 Adding Easter Egg Credits')
        
        // Position much farther in front (positive Y = forward)
        const creditsX = this.x
        const creditsY = this.y + 60 // Much farther forward - requires exploration!
        const creditsZ = 0.3 // Slightly above ground
        
        // Team names
        const names = [
            'Yusuf Dirdis',
            'Jon Gan',
            'Paul Piotrowski',
            'Raphael Talon'
        ]
        
        // Readable text settings - larger and more defined
        const textSize = 0.6 // Larger for readability
        const textHeight = 0.3 // More depth for better definition
        const spacing = 1.8 // More space between names
        
        // Use a contrasting material for better visibility
        const material = this.objects.materials.shades.items.yellow || 
                        this.objects.materials.shades.items.orange ||
                        this.objects.materials.shades.items.white
        
        // Create each name with enhanced definition
        for (let i = 0; i < names.length; i++) {
            const name = names[i]
            const yOffset = i * spacing
            
            await this.addText3D(name, creditsX, creditsY + yOffset, creditsZ, {
                material: material,
                size: textSize,
                height: textHeight,
                letterSpacing: 0.2,
                mass: 1, // Movable - easter egg can be pushed around!
                soundName: 'ui',
                // Enhanced definition parameters
                curveSegments: 20, // More curve detail
                bevelThickness: 0.18,
                bevelSize: 0.15,
                bevelSegments: 10 // More bevel detail for crisp edges
            })
        }
        
        console.log('🥚 Easter Egg Credits added successfully at Y=' + creditsY)
        
        // Add clickable box around the names to open team linktree
        const creditsLinkArea = this.areas.add({
            position: new THREE.Vector2(creditsX, creditsY + 2), // Centered on the names
            halfExtents: new THREE.Vector2(6, 5), // Large enough to cover all 4 names
            hasKey: true, // Shows "Press Enter" prompt
            testCar: true,
            active: true
        })

        // Add interact handler to open the linktree
        creditsLinkArea.on('interact', () => {
            console.log('🔗 Opening GradTrack Team Linktree')
            
            // Open the linktree in a new tab
            window.open('https://next-linktree-omega.vercel.app/', '_blank')
        })

        console.log('🔗 Team names link area created successfully')
    }
}
