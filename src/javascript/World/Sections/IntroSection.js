import * as THREE from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'

export default class IntroSection
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

        this.setStatic()
        this.setInstructions()
        this.setOtherInstructions()
        this.setTitles()
        this.setTiles()
        this.setDikes()

        // Load font for text generation
        this.font = null
        this.titlesSet = false
        this.loadFont()
    }

    loadFont()
    {
        const loader = new FontLoader()
        // Using Three.js default font (helvetiker)
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            this.font = font
            // Set titles once font is loaded
            if(!this.titlesSet)
            {
                this.setTitles()
                this.titlesSet = true
            }
        })
    }

    createTextLetter(letter, materialName = 'shadeWhite')
    {
        if(!this.font)
        {
            console.warn('Font not loaded yet')
            return null
        }

        // Create base scene
        const baseScene = new THREE.Scene()
        
        // Create text geometry
        const textGeometry = new TextGeometry(letter, {
            font: this.font,
            size: 1,
            height: 0.3,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5
        })

        // Center the geometry
        textGeometry.computeBoundingBox()
        const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
        textGeometry.translate(centerOffset, 0, 0)

        // Create base mesh with proper naming for material parser
        const baseMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial())
        baseMesh.name = `${materialName}_0`
        baseScene.add(baseMesh)

        // Create collision scene (simplified box geometry)
        const collisionScene = new THREE.Scene()
        const boxWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
        const boxHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y
        const boxDepth = textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z
        
        // Create unit box and scale it (physics system uses mesh.scale)
        const box = new THREE.BoxGeometry(1, 1, 1)
        const collisionMesh = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ visible: false }))
        collisionMesh.name = 'box0' // Must match physics pattern: box, cube_, cylinder_, or sphere_
        collisionMesh.scale.set(boxWidth, boxHeight, boxDepth)
        collisionMesh.position.set(0, 0, 0)
        collisionScene.add(collisionMesh)

        return {
            base: baseScene,
            collision: collisionScene
        }
    }

    setStatic()
    {
        // Clone the base scene to avoid modifying the original
        const baseSceneClone = this.resources.items.introStaticBase.scene.clone()
        const collisionSceneClone = this.resources.items.introStaticCollision.scene.clone()

        // Debug: Log all objects in the scene to identify fake trees
        const logAllObjects = (object, sceneName) => {
            console.log(`\n=== ${sceneName} Scene Objects ===`)
            const allObjects = []
            object.traverse((child) => {
                if(child.name || child.type !== 'Scene')
                {
                    allObjects.push({
                        name: child.name || '(unnamed)',
                        type: child.type,
                        position: child.position ? { x: child.position.x, y: child.position.y, z: child.position.z } : null,
                        children: child.children ? child.children.length : 0,
                        hasGeometry: !!child.geometry,
                        hasMaterial: !!child.material
                    })
                }
            })
            console.table(allObjects)
            return allObjects
        }

        // Log objects for debugging (comment out after identifying trees)
        const baseObjects = logAllObjects(baseSceneClone, 'Base')
        
        // Remove all tree meshes from scenes
        // Trees are identified by their green and brown materials/shaders
        const removeTrees = (object) => {
            const toRemove = []
            object.traverse((child) => {
                const name = child.name ? child.name.toLowerCase() : ''
                
                // Check for various tree-related names
                if(name.includes('tree') || 
                   name.includes('fake') ||
                   name.includes('faketree') ||
                   name.includes('fake_tree') ||
                   name.includes('decoration') ||
                   name.includes('deco') ||
                   name.includes('prop') ||
                   name.includes('background') ||
                   name.includes('env') ||
                   name.includes('environment') ||
                   name.includes('foliage') ||
                   name.includes('plant') ||
                   name.includes('vegetation') ||
                   name.includes('bush') ||
                   name.includes('shrub'))
                {
                    toRemove.push(child)
                }
                
                // Check for green or brown materials (trees typically use these colors)
                if(child.material)
                {
                    const materials = Array.isArray(child.material) ? child.material : [child.material]
                    
                    for(const material of materials)
                    {
                        if(material.color)
                        {
                            const color = material.color
                            const r = color.r
                            const g = color.g
                            const b = color.b
                            
                            // Check for green colors (high green, lower red/blue)
                            const isGreen = g > 0.3 && g > r * 1.2 && g > b * 1.2
                            
                            // Check for brown colors (brown is typically a mix with more red/green than blue)
                            const isBrown = r > 0.2 && g > 0.15 && b < r * 0.8 && b < g * 0.8 && 
                                          (r + g) > b * 1.5 && r < 0.6 && g < 0.5
                            
                            if(isGreen || isBrown)
                            {
                                toRemove.push(child)
                                break // Found a match, no need to check other materials
                            }
                        }
                    }
                }
            })
            
            // Remove found trees (remove in reverse order to avoid index issues)
            for(let i = toRemove.length - 1; i >= 0; i--)
            {
                const item = toRemove[i]
                if(item.parent)
                {
                    console.log(`Removing object: ${item.name || '(unnamed)'} (${item.type})`)
                    item.parent.remove(item)
                    // Also dispose of geometry and materials if they exist
                    if(item.geometry) item.geometry.dispose()
                    if(item.material)
                    {
                        if(Array.isArray(item.material))
                        {
                            item.material.forEach(mat => mat.dispose())
                        }
                        else
                        {
                            item.material.dispose()
                        }
                    }
                }
            }
        }

        removeTrees(baseSceneClone)
        removeTrees(collisionSceneClone)

        this.objects.add({
            base: baseSceneClone,
            collision: collisionSceneClone,
            floorShadowTexture: this.resources.items.introStaticFloorShadowTexture,
            offset: new THREE.Vector3(0, 0, 0),
            mass: 0
        })
    }

    setInstructions()
    {
        this.instructions = {}

        /**
         * Arrows
         */
        this.instructions.arrows = {}

        // Label
        this.instructions.arrows.label = {}

        this.instructions.arrows.label.texture = this.config.touch ? this.resources.items.introInstructionsControlsTexture : this.resources.items.introInstructionsArrowsTexture
        this.instructions.arrows.label.texture.magFilter = THREE.NearestFilter
        this.instructions.arrows.label.texture.minFilter = THREE.LinearFilter

        this.instructions.arrows.label.material = new THREE.MeshBasicMaterial({ transparent: true, alphaMap: this.instructions.arrows.label.texture, color: 0xffffff, depthWrite: false, opacity: 0 })

        this.instructions.arrows.label.geometry = this.resources.items.introInstructionsLabels.scene.children.find((_mesh) => _mesh.name === 'arrows').geometry

        this.instructions.arrows.label.mesh = new THREE.Mesh(this.instructions.arrows.label.geometry, this.instructions.arrows.label.material)
        this.container.add(this.instructions.arrows.label.mesh)

        if(!this.config.touch)
        {
            // Keys
            this.instructions.arrows.up = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: new THREE.Vector3(0, 0, 0),
                rotation: new THREE.Euler(0, 0, 0),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
            this.instructions.arrows.down = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: new THREE.Vector3(0, - 0.8, 0),
                rotation: new THREE.Euler(0, 0, Math.PI),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
            this.instructions.arrows.left = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: new THREE.Vector3(- 0.8, - 0.8, 0),
                rotation: new THREE.Euler(0, 0, Math.PI * 0.5),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
            this.instructions.arrows.right = this.objects.add({
                base: this.resources.items.introArrowKeyBase.scene,
                collision: this.resources.items.introArrowKeyCollision.scene,
                offset: new THREE.Vector3(0.8, - 0.8, 0),
                rotation: new THREE.Euler(0, 0, - Math.PI * 0.5),
                duplicated: true,
                shadow: { sizeX: 1, sizeY: 1, offsetZ: - 0.2, alpha: 0.5 },
                mass: 1.5,
                soundName: 'brick'
            })
        }
    }

    setOtherInstructions()
    {
        if(this.config.touch)
        {
            return
        }

        this.otherInstructions = {}
        this.otherInstructions.x = 16
        this.otherInstructions.y = - 2

        // Container
        this.otherInstructions.container = new THREE.Object3D()
        this.otherInstructions.container.position.x = this.otherInstructions.x
        this.otherInstructions.container.position.y = this.otherInstructions.y
        this.otherInstructions.container.matrixAutoUpdate = false
        this.otherInstructions.container.updateMatrix()
        this.container.add(this.otherInstructions.container)

        // Label
        this.otherInstructions.label = {}

        this.otherInstructions.label.geometry = new THREE.PlaneGeometry(6, 6, 1, 1)

        this.otherInstructions.label.texture = this.resources.items.introInstructionsOtherTexture
        this.otherInstructions.label.texture.magFilter = THREE.NearestFilter
        this.otherInstructions.label.texture.minFilter = THREE.LinearFilter

        this.otherInstructions.label.material = new THREE.MeshBasicMaterial({ transparent: true, alphaMap: this.otherInstructions.label.texture, color: 0xffffff, depthWrite: false, opacity: 0 })

        this.otherInstructions.label.mesh = new THREE.Mesh(this.otherInstructions.label.geometry, this.otherInstructions.label.material)
        this.otherInstructions.label.mesh.matrixAutoUpdate = false
        this.otherInstructions.container.add(this.otherInstructions.label.mesh)

        // Horn
        this.otherInstructions.horn = this.objects.add({
            base: this.resources.items.hornBase.scene,
            collision: this.resources.items.hornCollision.scene,
            offset: new THREE.Vector3(this.otherInstructions.x + 1.25, this.otherInstructions.y - 2.75, 0.2),
            rotation: new THREE.Euler(0, 0, 0.5),
            duplicated: true,
            shadow: { sizeX: 1.65, sizeY: 0.75, offsetZ: - 0.1, alpha: 0.4 },
            mass: 1.5,
            soundName: 'horn',
            sleep: false
        })
    }

    setTitles()
    {
        // Title - GRAD TRACK
        // Only proceed if font is loaded
        if(!this.font || this.titlesSet)
        {
            return
        }

        // Letter spacing padding (additional space between letters)
        const letterPadding = 0.3
        let currentX = 0

        // Helper function to add a letter and return its width
        const addLetter = (letter, offsetX = null) => {
            const letterData = this.createTextLetter(letter, 'shadeWhite')
            if(letterData)
            {
                // Get the actual width of the letter from its geometry
                const baseMesh = letterData.base.children[0]
                if(baseMesh && baseMesh.geometry)
                {
                    baseMesh.geometry.computeBoundingBox()
                    const letterWidth = baseMesh.geometry.boundingBox.max.x - baseMesh.geometry.boundingBox.min.x
                    
                    const xOffset = offsetX !== null ? offsetX : currentX
                    this.objects.add({
                        base: letterData.base,
                        collision: letterData.collision,
                        offset: new THREE.Vector3(xOffset, 0, 0),
                        rotation: new THREE.Euler(Math.PI / 2, 0, 0), // Rotate 90 degrees on X axis
                        shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: - 0.6, alpha: 0.4 },
                        mass: 1.5,
                        soundName: 'brick'
                    })
                    
                    if(offsetX === null)
                    {
                        // Move to next position: current position + letter width + padding
                        currentX += letterWidth + letterPadding
                    }
                    
                    return letterWidth
                }
            }
            return 0
        }

        // GRAD
        addLetter('G')
        addLetter('R')
        addLetter('A')
        addLetter('D')

        // Space between words
        currentX += 0.5 // Additional space between words

        // TRACK
        const tWidth = addLetter('T', currentX) || 0
        currentX += tWidth + letterPadding
        const rWidth = addLetter('R', currentX) || 0
        currentX += rWidth + letterPadding
        const aWidth = addLetter('A', currentX) || 0
        currentX += aWidth + letterPadding
        const cWidth = addLetter('C', currentX) || 0
        currentX += cWidth + letterPadding
        addLetter('K', currentX)

        this.titlesSet = true
    }

    setTiles()
    {
        this.tiles.add({
            start: new THREE.Vector2(0, - 4.5),
            delta: new THREE.Vector2(0, - 4.5)
        })
    }

    setDikes()
    {
        this.dikes = {}
        this.dikes.brickOptions = {
            base: this.resources.items.brickBase.scene,
            collision: this.resources.items.brickCollision.scene,
            offset: new THREE.Vector3(0, 0, 0.1),
            rotation: new THREE.Euler(0, 0, 0),
            duplicated: true,
            shadow: { sizeX: 1.2, sizeY: 1.8, offsetZ: - 0.15, alpha: 0.35 },
            mass: 0.5,
            soundName: 'brick'
        }

        // this.walls.add({
        //     object:
        //     {
        //         ...this.dikes.brickOptions,
        //         rotation: new THREE.Euler(0, 0, Math.PI * 0.5)
        //     },
        //     shape:
        //     {
        //         type: 'brick',
        //         equilibrateLastLine: true,
        //         widthCount: 3,
        //         heightCount: 2,
        //         position: new THREE.Vector3(this.x + 0, this.y - 4, 0),
        //         offsetWidth: new THREE.Vector3(1.05, 0, 0),
        //         offsetHeight: new THREE.Vector3(0, 0, 0.45),
        //         randomOffset: new THREE.Vector3(0, 0, 0),
        //         randomRotation: new THREE.Vector3(0, 0, 0.2)
        //     }
        // })

        this.walls.add({
            object: this.dikes.brickOptions,
            shape:
            {
                type: 'brick',
                equilibrateLastLine: true,
                widthCount: 5,
                heightCount: 2,
                position: new THREE.Vector3(this.x - 12, this.y - 13, 0),
                offsetWidth: new THREE.Vector3(0, 1.05, 0),
                offsetHeight: new THREE.Vector3(0, 0, 0.45),
                randomOffset: new THREE.Vector3(0, 0, 0),
                randomRotation: new THREE.Vector3(0, 0, 0.2)
            }
        })

        this.walls.add({
            object:
            {
                ...this.dikes.brickOptions,
                rotation: new THREE.Euler(0, 0, Math.PI * 0.5)
            },
            shape:
            {
                type: 'brick',
                equilibrateLastLine: true,
                widthCount: 3,
                heightCount: 2,
                position: new THREE.Vector3(this.x + 8, this.y + 6, 0),
                offsetWidth: new THREE.Vector3(1.05, 0, 0),
                offsetHeight: new THREE.Vector3(0, 0, 0.45),
                randomOffset: new THREE.Vector3(0, 0, 0),
                randomRotation: new THREE.Vector3(0, 0, 0.2)
            }
        })

        this.walls.add({
            object: this.dikes.brickOptions,
            shape:
            {
                type: 'brick',
                equilibrateLastLine: false,
                widthCount: 3,
                heightCount: 2,
                position: new THREE.Vector3(this.x + 9.9, this.y + 4.7, 0),
                offsetWidth: new THREE.Vector3(0, - 1.05, 0),
                offsetHeight: new THREE.Vector3(0, 0, 0.45),
                randomOffset: new THREE.Vector3(0, 0, 0),
                randomRotation: new THREE.Vector3(0, 0, 0.2)
            }
        })

        this.walls.add({
            object:
            {
                ...this.dikes.brickOptions,
                rotation: new THREE.Euler(0, 0, Math.PI * 0.5)
            },
            shape:
            {
                type: 'brick',
                equilibrateLastLine: true,
                widthCount: 3,
                heightCount: 2,
                position: new THREE.Vector3(this.x - 14, this.y + 2, 0),
                offsetWidth: new THREE.Vector3(1.05, 0, 0),
                offsetHeight: new THREE.Vector3(0, 0, 0.45),
                randomOffset: new THREE.Vector3(0, 0, 0),
                randomRotation: new THREE.Vector3(0, 0, 0.2)
            }
        })

        this.walls.add({
            object: this.dikes.brickOptions,
            shape:
            {
                type: 'brick',
                equilibrateLastLine: false,
                widthCount: 3,
                heightCount: 2,
                position: new THREE.Vector3(this.x - 14.8, this.y + 0.7, 0),
                offsetWidth: new THREE.Vector3(0, - 1.05, 0),
                offsetHeight: new THREE.Vector3(0, 0, 0.45),
                randomOffset: new THREE.Vector3(0, 0, 0),
                randomRotation: new THREE.Vector3(0, 0, 0.2)
            }
        })

        this.walls.add({
            object: this.dikes.brickOptions,
            shape:
            {
                type: 'brick',
                equilibrateLastLine: true,
                widthCount: 3,
                heightCount: 2,
                position: new THREE.Vector3(this.x - 14.8, this.y - 3.5, 0),
                offsetWidth: new THREE.Vector3(0, - 1.05, 0),
                offsetHeight: new THREE.Vector3(0, 0, 0.45),
                randomOffset: new THREE.Vector3(0, 0, 0),
                randomRotation: new THREE.Vector3(0, 0, 0.2)
            }
        })

        if(!this.config.touch)
        {
            this.walls.add({
                object:
                {
                    ...this.dikes.brickOptions,
                    rotation: new THREE.Euler(0, 0, Math.PI * 0.5)
                },
                shape:
                {
                    type: 'brick',
                    equilibrateLastLine: true,
                    widthCount: 2,
                    heightCount: 2,
                    position: new THREE.Vector3(this.x + 18.5, this.y + 3, 0),
                    offsetWidth: new THREE.Vector3(1.05, 0, 0),
                    offsetHeight: new THREE.Vector3(0, 0, 0.45),
                    randomOffset: new THREE.Vector3(0, 0, 0),
                    randomRotation: new THREE.Vector3(0, 0, 0.2)
                }
            })

            this.walls.add({
                object: this.dikes.brickOptions,
                shape:
                {
                    type: 'brick',
                    equilibrateLastLine: false,
                    widthCount: 2,
                    heightCount: 2,
                    position: new THREE.Vector3(this.x + 19.9, this.y + 2.2, 0),
                    offsetWidth: new THREE.Vector3(0, - 1.05, 0),
                    offsetHeight: new THREE.Vector3(0, 0, 0.45),
                    randomOffset: new THREE.Vector3(0, 0, 0),
                    randomRotation: new THREE.Vector3(0, 0, 0.2)
                }
            })
        }
    }
}
