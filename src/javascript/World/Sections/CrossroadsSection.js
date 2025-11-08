import * as THREE from 'three'

export default class CrossroadsSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setStatic()
        this.setTiles()
    }

    setStatic()
    {
        // Clone the base scene to avoid modifying the original
        const baseSceneClone = this.resources.items.crossroadsStaticBase.scene.clone()
        const collisionSceneClone = this.resources.items.crossroadsStaticCollision.scene.clone()

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
            floorShadowTexture: this.resources.items.crossroadsStaticFloorShadowTexture,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
    }

    setTiles()
    {
        // To intro
        this.tiles.add({
            start: new THREE.Vector2(this.x, - 10),
            delta: new THREE.Vector2(0, this.y + 14)
        })

        // To projects
        this.tiles.add({
            start: new THREE.Vector2(this.x + 12.5, this.y),
            delta: new THREE.Vector2(7.5, 0)
        })

        // To projects
        this.tiles.add({
            start: new THREE.Vector2(this.x - 13, this.y),
            delta: new THREE.Vector2(- 6, 0)
        })
    }
}
