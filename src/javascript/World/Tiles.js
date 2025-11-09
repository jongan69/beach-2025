import * as THREE from 'three'

export default class Tiles
{
    constructor(_options)
    {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug

        // Set up
        this.items = []
        this.interDistance = 0.5 // Very close spacing for concentrated shells
        this.tangentDistance = 0.25 // Tighter spread
        this.positionRandomess = 0.4 // Random but not too spread out
        this.rotationRandomess = 0.5 // More rotation variety

        this.setModels()
    }

    convertTreesToPalmTrees(_object)
    {
        // Traverse the object and its children recursively
        _object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const name = child.name.toLowerCase()
                
                // Get bounding box to understand the mesh's dimensions
                const box = new THREE.Box3().setFromObject(child)
                const size = box.getSize(new THREE.Vector3())
                const height = Math.max(size.x, size.y, size.z)
                const width = Math.min(size.x, size.y, size.z)
                const heightToWidthRatio = height > 0 ? height / Math.max(width, 0.1) : 0
                
                // Check if this mesh is a tree (by name or geometry characteristics)
                const isTreeByName = name.includes('tree') || 
                                    name.includes('trunk') || 
                                    name.includes('leaf') ||
                                    name.includes('foliage') ||
                                    name.includes('branch') ||
                                    name.includes('bush') ||
                                    name.includes('plant')
                
                // Check geometry characteristics: tall vertical objects are likely trees
                const isTreeByGeometry = heightToWidthRatio > 1.5 && height > 0.5 && 
                                        !name.includes('wall') && 
                                        !name.includes('floor') && 
                                        !name.includes('ground') &&
                                        !name.includes('building') &&
                                        !name.includes('house') &&
                                        !name.includes('car') &&
                                        !name.includes('road') &&
                                        !name.includes('boat')
                
                const isTree = isTreeByName || isTreeByGeometry
                
                if (isTree) {
                    // Transform to palm tree characteristics
                    if (name.includes('trunk') || name.includes('stem') || 
                        (isTreeByGeometry && !name.includes('leaf') && !name.includes('foliage'))) {
                        // Make trunk taller and thinner (palm tree style)
                        child.scale.y *= 1.5 // Make taller
                        child.scale.x *= 0.7  // Make thinner
                        child.scale.z *= 0.7  // Make thinner
                    } else if (name.includes('leaf') || name.includes('foliage') || name.includes('branch')) {
                        // Transform leaves into palm fronds
                        // Make them more horizontal and spread out
                        child.scale.y *= 0.8
                        child.scale.x *= 1.3
                        child.scale.z *= 1.3
                        // Rotate to be more horizontal (palm fronds)
                        child.rotation.x += Math.PI * 0.1
                    } else {
                        // Generic tree - transform to palm tree
                        // Make taller and thinner
                        child.scale.y *= 1.4
                        child.scale.x *= 0.75
                        child.scale.z *= 0.75
                    }
                }
            }
        })
    }

    setModels()
    {
        this.models = {}
        
        // Create shell geometries and materials
        this.createShellModels()

        const totalChances = this.models.items.reduce((_totalChances, _item) => _totalChances + _item.chances, 0)
        let chances = 0
        this.models.items = this.models.items.map((_item) =>
        {
            // Update chances
            _item.minChances = chances

            chances += _item.chances / totalChances
            _item.maxChances = chances

            // Update rotation
            _item.rotationIndex = 0

            return _item
        })

        this.models.pick = () =>
        {
            const random = Math.random()
            const model =  this.models.items.find((_item) => random >= _item.minChances && random <= _item.maxChances)
            model.rotationIndex++

            if(model.rotationIndex > 3)
            {
                model.rotationIndex = 0
            }

            return model
        }
    }
    
    createShellModels()
    {
        // Shell colors - various beachy shell colors
        const shellColors = [
            0xf5deb3, // Wheat - sandy shell
            0xffe4c4, // Bisque - light shell
            0xffdab9, // Peach - peachy shell
            0xfaf0e6, // Linen - white shell
            0xfff5ee, // Seashell - classic
            0xf0e68c, // Khaki - yellowish shell
        ]
        
        // Create different shell types
        this.models.items = []
        
        // Type 1: Spiral shell (cone-like)
        const spiralShell = new THREE.Group()
        const spiralGeometry = new THREE.ConeGeometry(0.15, 0.25, 8, 1)
        const spiralMaterial = new THREE.MeshStandardMaterial({ 
            color: shellColors[0],
            roughness: 0.6,
            metalness: 0.1
        })
        const spiralMesh = new THREE.Mesh(spiralGeometry, spiralMaterial)
        spiralMesh.rotation.x = Math.PI / 2
        spiralShell.add(spiralMesh)
        
        // Type 2: Clam shell (flatter)
        const clamShell = new THREE.Group()
        const clamGeometry = new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)
        const clamMaterial = new THREE.MeshStandardMaterial({ 
            color: shellColors[1],
            roughness: 0.7,
            metalness: 0.05
        })
        const clamMesh = new THREE.Mesh(clamGeometry, clamMaterial)
        clamMesh.rotation.x = Math.PI / 2
        clamShell.add(clamMesh)
        
        // Type 3: Round shell
        const roundShell = new THREE.Group()
        const roundGeometry = new THREE.SphereGeometry(0.1, 8, 8)
        roundGeometry.scale(1, 0.6, 1) // Flatten it
        const roundMaterial = new THREE.MeshStandardMaterial({ 
            color: shellColors[2],
            roughness: 0.5,
            metalness: 0.15
        })
        const roundMesh = new THREE.Mesh(roundGeometry, roundMaterial)
        roundMesh.rotation.x = Math.PI / 2
        roundShell.add(roundMesh)
        
        // Type 4: Starfish-like (flat star)
        const starShell = new THREE.Group()
        const starGeometry = new THREE.TorusGeometry(0.12, 0.04, 6, 5)
        const starMaterial = new THREE.MeshStandardMaterial({ 
            color: shellColors[3],
            roughness: 0.8,
            metalness: 0.05
        })
        const starMesh = new THREE.Mesh(starGeometry, starMaterial)
        starMesh.rotation.x = Math.PI / 2
        starShell.add(starMesh)
        
        // Type 5: Small pebble shell
        const pebbleShell = new THREE.Group()
        const pebbleGeometry = new THREE.DodecahedronGeometry(0.1, 0)
        pebbleGeometry.scale(1, 0.5, 0.8)
        const pebbleMaterial = new THREE.MeshStandardMaterial({ 
            color: shellColors[4],
            roughness: 0.7,
            metalness: 0.1
        })
        const pebbleMesh = new THREE.Mesh(pebbleGeometry, pebbleMaterial)
        pebbleMesh.rotation.x = Math.PI / 2
        pebbleShell.add(pebbleMesh)
        
        // Add all shell types to models array with different chances
        this.models.items = [
            { base: spiralShell, collision: null, chances: 6 },
            { base: clamShell, collision: null, chances: 8 },
            { base: roundShell, collision: null, chances: 5 },
            { base: starShell, collision: null, chances: 3 },
            { base: pebbleShell, collision: null, chances: 8 }
        ]
    }

    add(_options)
    {
        const tilePath = {}
        tilePath.start = _options.start
        tilePath.delta = _options.delta

        tilePath.distance = tilePath.delta.length()
        tilePath.count = Math.floor(tilePath.distance / this.interDistance)
        tilePath.directionVector = tilePath.delta.clone().normalize()
        tilePath.interVector = tilePath.directionVector.clone().multiplyScalar(this.interDistance)
        tilePath.centeringVector = tilePath.delta.clone().sub(tilePath.interVector.clone().multiplyScalar(tilePath.count))
        tilePath.tangentVector = tilePath.directionVector.clone().rotateAround(new THREE.Vector2(0, 0), Math.PI * 0.5).multiplyScalar(this.tangentDistance)
        tilePath.angle = tilePath.directionVector.angle()

        // Create shells - add multiple rows for more concentrated pathways
        const shellsPerPosition = 2 // Add 2 shells per position for density
        
        for(let i = 0; i < tilePath.count; i++)
        {
            // Add multiple shells at each position for more concentration
            for(let j = 0; j < shellsPerPosition; j++)
            {
                // Model
                const model = this.models.pick()

                // Position
                const position = tilePath.start.clone().add(tilePath.interVector.clone().multiplyScalar(i)).add(tilePath.centeringVector)
                position.x += (Math.random() - 0.5) * this.positionRandomess
                position.y += (Math.random() - 0.5) * this.positionRandomess

                const tangent = tilePath.tangentVector.clone()

                // Alternate sides for each shell in the pair
                if((i + j) % 2 === 0)
                {
                    tangent.negate()
                }

                position.add(tangent)

                // Rotation
                let rotation = tilePath.angle
                rotation += (Math.random() - 0.5) * this.rotationRandomess
                rotation += model.rotationIndex / 4 * Math.PI * 2

                // Shell (or tile)
                // Clone the shell geometry since we're reusing it
                const shellClone = model.base.clone()
                
                // Add some size variation for more natural look
                const sizeVariation = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
                shellClone.scale.multiplyScalar(sizeVariation)
                
                this.objects.add({
                    base: shellClone,
                    collision: model.collision, // null for shells, that's okay
                    offset: new THREE.Vector3(position.x, position.y, 0.05), // Slightly raised so they sit on top of floor
                    rotation: new THREE.Euler(0, 0, rotation),
                    duplicated: true,
                    mass: 0,
                    shadows: false // Shells don't need shadows
                })
            }
        }
    }
}
