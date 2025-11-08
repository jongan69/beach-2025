import * as THREE from 'three'
import CANNON from 'cannon'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

export default class Car
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.controls = _options.controls
        this.sounds = _options.sounds
        this.renderer = _options.renderer
        this.camera = _options.camera
        this.debug = _options.debug
        this.config = _options.config
        this.scene = _options.scene

        // Set up
        this.container = new THREE.Object3D()
        this.position = new THREE.Vector3()
        
        // Set up lighting for boat
        this.setLights()

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('car')
            // this.debugFolder.open()
        }

        this.setModels()
        this.setMovement()
        this.setChassis()
        
        // Only set these if the models exist (for car, not boat)
        if(this.models.antena)
        {
            this.setAntena()
        }
        if(this.models.backLightsBrake)
        {
            this.setBackLights()
        }
        if(this.models.wheel)
        {
            this.setWheels()
        }
        
        this.setTransformControls()
        this.setShootingBall()
        this.setKlaxon()
    }

    setLights()
    {
        // Only set up lights if we're using the boat
        // We'll check this after setModels is called, so we'll set up lights in setChassis
        // But we need to initialize the lights here
        this.ambientLight = null
        this.directionalLight = null
    }

    setModels()
    {
        this.models = {}

        // Cyber truck
        if(this.config.cyberTruck)
        {
            this.models.chassis = this.resources.items.carCyberTruckChassis
            this.models.antena = this.resources.items.carCyberTruckAntena
            this.models.backLightsBrake = this.resources.items.carCyberTruckBackLightsBrake
            this.models.backLightsReverse = this.resources.items.carCyberTruckBackLightsReverse
            this.models.wheel = this.resources.items.carCyberTruckWheel
        }

        // Default - Boat
        else
        {
            // Debug: Check if boat resource exists
            if(!this.resources.items.boat)
            {
                console.error('Boat resource not found! Available resources:', Object.keys(this.resources.items))
                console.error('Make sure Resources.js is saved and browser is refreshed!')
                // Fallback to default car temporarily
                this.models.chassis = this.resources.items.carDefaultChassis
                this.models.antena = this.resources.items.carDefaultAntena
                this.models.backLightsBrake = this.resources.items.carDefaultBackLightsBrake
                this.models.backLightsReverse = this.resources.items.carDefaultBackLightsReverse
                this.models.wheel = this.resources.items.carDefaultWheel
            }
            else
            {
                this.models.chassis = this.resources.items.boat
                // Boat is a single asset, so we don't set the other parts
            }
        }
    }

    setMovement()
    {
        this.movement = {}
        this.movement.speed = new THREE.Vector3()
        this.movement.localSpeed = new THREE.Vector3()
        this.movement.acceleration = new THREE.Vector3()
        this.movement.localAcceleration = new THREE.Vector3()
        this.movement.lastScreech = 0

        // Time tick
        this.time.on('tick', () =>
        {
            // Safety check - ensure chassis is initialized
            if(!this.chassis || !this.chassis.object)
            {
                return
            }
            
            // Movement
            const movementSpeed = new THREE.Vector3()
            movementSpeed.copy(this.chassis.object.position).sub(this.chassis.oldPosition)
            movementSpeed.multiplyScalar(1 / this.time.delta * 17)
            this.movement.acceleration = movementSpeed.clone().sub(this.movement.speed)
            this.movement.speed.copy(movementSpeed)

            this.movement.localSpeed = this.movement.speed.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), - this.chassis.object.rotation.z)
            this.movement.localAcceleration = this.movement.acceleration.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), - this.chassis.object.rotation.z)

            // Sound
            this.sounds.engine.speed = this.movement.localSpeed.x
            this.sounds.engine.acceleration = this.controls.actions.up ? (this.controls.actions.boost ? 1 : 0.5) : 0

            if(this.movement.localAcceleration.x > 0.03 && this.time.elapsed - this.movement.lastScreech > 5000)
            {
                this.movement.lastScreech = this.time.elapsed
                this.sounds.play('screech')
            }
        })
    }

    setChassis()
    {
        this.chassis = {}
        this.chassis.offset = new THREE.Vector3(0, 0, - 0.28)
        
        // Safety check - ensure chassis model exists
        if(!this.models.chassis)
        {
            console.error('Chassis model is undefined! Check if resource loaded correctly.')
            return
        }
        
        // Safety check - ensure GLB loaded correctly (should have .scene property)
        if(!this.models.chassis.scene)
        {
            console.error('Chassis model does not have a scene property. Model structure:', this.models.chassis)
            console.error('This usually means the GLB file failed to load or has wrong format.')
            return
        }
        
        // Debug: Log the boat model structure
        console.log('Boat model scene:', this.models.chassis.scene)
        console.log('Boat scene children:', this.models.chassis.scene.children)
        console.log('Boat scene children count:', this.models.chassis.scene.children.length)
        
        // Check if children exist and log their types
        if(this.models.chassis.scene.children.length > 0)
        {
            this.models.chassis.scene.children.forEach((child, index) => {
                console.log(`Child ${index}:`, child.name, child.type, child)
                if(child.children && child.children.length > 0)
                {
                    console.log(`  - Has ${child.children.length} nested children`)
                    child.children.forEach((nested, nestedIndex) => {
                        console.log(`    Nested ${nestedIndex}:`, nested.name, nested.type)
                    })
                }
            })
        }
        
        this.chassis.object = this.objects.getConvertedMesh(this.models.chassis.scene.children)
        
        // Debug: Check if container was created and has children
        console.log('Chassis object created:', this.chassis.object)
        console.log('Chassis object children count:', this.chassis.object.children.length)
        
        // Check if we're using boat (single asset) vs car (multiple assets)
        this.chassis.isBoat = !this.config.cyberTruck && this.models.chassis === this.resources.items.boat
        
        // Set up lighting for boat if needed
        if(this.chassis.isBoat && !this.ambientLight)
        {
            // Ambient light for overall illumination - high intensity for vivid colors
            this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0)
            this.scene.add(this.ambientLight)
            
            // Directional light (like sunlight) - high intensity for vivid colors
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
            this.directionalLight.position.set(5, 10, 5)
            this.directionalLight.castShadow = false
            this.scene.add(this.directionalLight)
            
            console.log('Boat lighting set up: Ambient + Directional (high intensity)')
        }
        
        if(this.chassis.object.children.length === 0 || this.chassis.isBoat)
        {
            if(this.chassis.object.children.length === 0)
            {
                console.warn('WARNING: Chassis object has no children! The boat model might not be processing correctly.')
                console.warn('Trying to add the scene directly as fallback...')
            }
            
            // For boat: use scene directly and apply materials
            const sceneClone = this.models.chassis.scene.clone()
            
            // Traverse and ensure all meshes have proper materials that respond to lighting
            sceneClone.traverse((child) => {
                if(child instanceof THREE.Mesh)
                {
                    let material = null
                    
                    // Preserve original material if it exists and is valid
                    if(child.material && child.material.isMaterial)
                    {
                        // Material exists, convert it to a material that responds to lights
                        if(Array.isArray(child.material))
                        {
                            material = child.material[0]
                        }
                        else
                        {
                            material = child.material
                        }
                        
                        // Convert to MeshStandardMaterial to respond to lighting
                        if(material.type !== 'MeshStandardMaterial' && material.type !== 'MeshPhongMaterial')
                        {
                            // Extract color from original material
                            const color = material.color ? material.color : new THREE.Color(0xffffff)
                            const map = material.map ? material.map : null
                            
                            // Create new material that responds to lights
                            material = new THREE.MeshStandardMaterial({
                                color: color,
                                map: map,
                                metalness: 0.1,
                                roughness: 0.7
                            })
                        }
                    }
                    else
                    {
                        // No material - create a new material that responds to lights
                        material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.1,
                            roughness: 0.7
                        })
                    }
                    
                    // Apply the material
                    child.material = material
                    child.material.needsUpdate = true
                }
            })
            
            this.chassis.object = sceneClone
            console.log('Using scene clone directly. Children count:', this.chassis.object.children.length)
        }
        else
        {
            // For car models, also ensure materials are applied
            this.chassis.object.traverse((child) => {
                if(child instanceof THREE.Mesh && (!child.material || !child.material.isMaterial))
                {
                    child.material = this.materials.shades.items.white
                }
            })
        }
        
        // Fix rotation for boat - rotate to lie horizontally
        if(this.chassis.isBoat)
        {
            // Rotate boat to lie horizontally (rotate -90 degrees around X axis)
            // Then flip 180 degrees on Z axis, and rotate -90 degrees on Y axis
            this.chassis.boatRotation = new THREE.Euler(- Math.PI / 2, - Math.PI / 2, Math.PI)
            this.chassis.object.rotation.copy(this.chassis.boatRotation)
            console.log('Applied boat rotation:', this.chassis.object.rotation)
        }
        
        this.chassis.object.position.copy(this.physics.car.chassis.body.position)
        this.chassis.oldPosition = this.chassis.object.position.clone()
        this.container.add(this.chassis.object)

        this.shadows.add(this.chassis.object, { sizeX: 3, sizeY: 2, offsetZ: 0.2 })

        // Time tick
        this.time.on('tick', () =>
        {
            // Save old position for movement calculation
            this.chassis.oldPosition = this.chassis.object.position.clone()

            // Update if mode physics
            if(!this.transformControls.enabled)
            {
                this.chassis.object.position.copy(this.physics.car.chassis.body.position).add(this.chassis.offset)
                
                // For boat, combine physics rotation with boat's base rotation
                if(this.chassis.isBoat && this.chassis.boatRotation)
                {
                    // Apply physics rotation, then add boat's base rotation
                    this.chassis.object.quaternion.copy(this.physics.car.chassis.body.quaternion)
                    const boatQuaternion = new THREE.Quaternion().setFromEuler(this.chassis.boatRotation)
                    this.chassis.object.quaternion.multiplyQuaternions(this.chassis.object.quaternion, boatQuaternion)
                }
                else
                {
                    this.chassis.object.quaternion.copy(this.physics.car.chassis.body.quaternion)
                }
            }

            // Update position
            this.position.copy(this.chassis.object.position)
        })
    }

    setAntena()
    {
        this.antena = {}

        this.antena.speedStrength = 10
        this.antena.damping = 0.035
        this.antena.pullBackStrength = 0.02

        this.antena.object = this.objects.getConvertedMesh(this.models.antena.scene.children)
        this.chassis.object.add(this.antena.object)

        // this.antena.bunnyEarLeft = this.objects.getConvertedMesh(this.models.bunnyEarLeft.scene.children)
        // this.chassis.object.add(this.antena.bunnyEarLeft)

        // this.antena.bunnyEarRight = this.objects.getConvertedMesh(this.models.bunnyEarRight.scene.children)
        // this.chassis.object.add(this.antena.bunnyEarRight)

        this.antena.speed = new THREE.Vector2()
        this.antena.absolutePosition = new THREE.Vector2()
        this.antena.localPosition = new THREE.Vector2()

        // Time tick
        this.time.on('tick', () =>
        {
            const max = 1
            const accelerationX = Math.min(Math.max(this.movement.acceleration.x, - max), max)
            const accelerationY = Math.min(Math.max(this.movement.acceleration.y, - max), max)

            this.antena.speed.x -= accelerationX * this.antena.speedStrength
            this.antena.speed.y -= accelerationY * this.antena.speedStrength

            const position = this.antena.absolutePosition.clone()
            const pullBack = position.negate().multiplyScalar(position.length() * this.antena.pullBackStrength)
            this.antena.speed.add(pullBack)

            this.antena.speed.x *= 1 - this.antena.damping
            this.antena.speed.y *= 1 - this.antena.damping

            this.antena.absolutePosition.add(this.antena.speed)

            this.antena.localPosition.copy(this.antena.absolutePosition)
            this.antena.localPosition.rotateAround(new THREE.Vector2(), - this.chassis.object.rotation.z)

            this.antena.object.rotation.y = this.antena.localPosition.x * 0.1
            this.antena.object.rotation.x = this.antena.localPosition.y * 0.1

            // this.antena.bunnyEarLeft.rotation.y = this.antena.localPosition.x * 0.1
            // this.antena.bunnyEarLeft.rotation.x = this.antena.localPosition.y * 0.1

            // this.antena.bunnyEarRight.rotation.y = this.antena.localPosition.x * 0.1
            // this.antena.bunnyEarRight.rotation.x = this.antena.localPosition.y * 0.1
        })

        // Debug
        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('antena')
            folder.open()

            folder.add(this.antena, 'speedStrength').step(0.001).min(0).max(50)
            folder.add(this.antena, 'damping').step(0.0001).min(0).max(0.1)
            folder.add(this.antena, 'pullBackStrength').step(0.0001).min(0).max(0.1)
        }
    }

    setBackLights()
    {
        this.backLightsBrake = {}

        this.backLightsBrake.material = this.materials.pures.items.red.clone()
        this.backLightsBrake.material.transparent = true
        this.backLightsBrake.material.opacity = 0.5

        this.backLightsBrake.object = this.objects.getConvertedMesh(this.models.backLightsBrake.scene.children)
        for(const _child of this.backLightsBrake.object.children)
        {
            _child.material = this.backLightsBrake.material
        }

        this.chassis.object.add(this.backLightsBrake.object)

        // Back lights brake
        this.backLightsReverse = {}

        this.backLightsReverse.material = this.materials.pures.items.yellow.clone()
        this.backLightsReverse.material.transparent = true
        this.backLightsReverse.material.opacity = 0.5

        this.backLightsReverse.object = this.objects.getConvertedMesh(this.models.backLightsReverse.scene.children)
        for(const _child of this.backLightsReverse.object.children)
        {
            _child.material = this.backLightsReverse.material
        }

        this.chassis.object.add(this.backLightsReverse.object)

        // Time tick
        this.time.on('tick', () =>
        {
            this.backLightsBrake.material.opacity = this.physics.controls.actions.brake ? 1 : 0.5
            this.backLightsReverse.material.opacity = this.physics.controls.actions.down ? 1 : 0.5
        })
    }

    setWheels()
    {
        this.wheels = {}
        this.wheels.object = this.objects.getConvertedMesh(this.models.wheel.scene.children)
        this.wheels.items = []

        for(let i = 0; i < 4; i++)
        {
            const object = this.wheels.object.clone()

            this.wheels.items.push(object)
            this.container.add(object)
        }

        // Time tick
        this.time.on('tick', () =>
        {
            if(!this.transformControls.enabled)
            {
                for(const _wheelKey in this.physics.car.wheels.bodies)
                {
                    const wheelBody = this.physics.car.wheels.bodies[_wheelKey]
                    const wheelObject = this.wheels.items[_wheelKey]

                    wheelObject.position.copy(wheelBody.position)
                    wheelObject.quaternion.copy(wheelBody.quaternion)
                }
            }
        })
    }

    setTransformControls()
    {
        this.transformControls = new TransformControls(this.camera.instance, this.renderer.domElement)
        this.transformControls.size = 0.5
        this.transformControls.attach(this.chassis.object)
        this.transformControls.enabled = false
        this.transformControls.visible = this.transformControls.enabled

        document.addEventListener('keydown', (_event) =>
        {
            if(this.mode === 'transformControls')
            {
                if(_event.key === 'r')
                {
                    this.transformControls.setMode('rotate')
                }
                else if(_event.key === 'g')
                {
                    this.transformControls.setMode('translate')
                }
            }
        })

        this.transformControls.addEventListener('dragging-changed', (_event) =>
        {
            this.camera.orbitControls.enabled = !_event.value
        })

        this.container.add(this.transformControls)

        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('controls')
            folder.open()

            folder.add(this.transformControls, 'enabled').onChange(() =>
            {
                this.transformControls.visible = this.transformControls.enabled
            })
        }
    }

    setShootingBall()
    {
        if(!this.config.cyberTruck)
        {
            return
        }

        window.addEventListener('keydown', (_event) =>
        {
            if(_event.key === 'b')
            {
                const angle = Math.random() * Math.PI * 2
                const distance = 10
                const x = this.position.x + Math.cos(angle) * distance
                const y = this.position.y + Math.sin(angle) * distance
                const z = 2 + 2 * Math.random()
                const bowlingBall = this.objects.add({
                    base: this.resources.items.bowlingBallBase.scene,
                    collision: this.resources.items.bowlingBallCollision.scene,
                    offset: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(Math.PI * 0.5, 0, 0),
                    duplicated: true,
                    shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: - 0.15, alpha: 0.35 },
                    mass: 5,
                    soundName: 'bowlingBall',
                    sleep: false
                })

                const carPosition = new CANNON.Vec3(this.position.x, this.position.y, this.position.z + 1)
                let direction = carPosition.vsub(bowlingBall.collision.body.position)
                direction.normalize()
                direction = direction.scale(100)
                bowlingBall.collision.body.applyImpulse(direction, bowlingBall.collision.body.position)
            }
        })
    }

    setKlaxon()
    {
        this.klaxon = {}
        this.klaxon.lastTime = this.time.elapsed

        window.addEventListener('keydown', (_event) =>
        {
            // Play horn sound
            if(_event.code === 'KeyH')
            {
                if(this.time.elapsed - this.klaxon.lastTime > 400)
                {
                    this.physics.car.jump(false, 150)
                    this.klaxon.lastTime = this.time.elapsed
                }

                this.sounds.play(Math.random() < 0.002 ? 'carHorn2' : 'carHorn1')
            }

            // Rain horns
            if(_event.key === 'k')
            {
                const x = this.position.x + (Math.random() - 0.5) * 3
                const y = this.position.y + (Math.random() - 0.5) * 3
                const z = 6 + 2 * Math.random()

                this.objects.add({
                    base: this.resources.items.hornBase.scene,
                    collision: this.resources.items.hornCollision.scene,
                    offset: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
                    duplicated: true,
                    shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: - 0.15, alpha: 0.35 },
                    mass: 5,
                    soundName: 'horn',
                    sleep: false
                })
            }
        })
    }
}
