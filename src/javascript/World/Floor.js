import * as THREE from 'three'
import FloorMaterial from '../Materials/Floor.js'

export default class Floor
{
    constructor(_options)
    {
        // Options
        this.debug = _options.debug

        // Container
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        // Geometry
        this.geometry = new THREE.PlaneGeometry(2, 2, 10, 10)

        // Colors
        this.colors = {}
        this.colors.topLeft = '#f5883c'
        this.colors.topRight = '#ff9043'
        this.colors.bottomRight = '#fccf92'
        this.colors.bottomLeft = '#f5aa58'

        // Material
        this.material = new FloorMaterial()

        this.updateMaterial = () =>
        {
            const topLeft = new THREE.Color(this.colors.topLeft)
            const topRight = new THREE.Color(this.colors.topRight)
            const bottomRight = new THREE.Color(this.colors.bottomRight)
            const bottomLeft = new THREE.Color(this.colors.bottomLeft)

            topLeft.convertLinearToSRGB()
            topRight.convertLinearToSRGB()
            bottomRight.convertLinearToSRGB()
            bottomLeft.convertLinearToSRGB()

            const data = new Uint8Array([
                Math.round(bottomLeft.r * 255), Math.round(bottomLeft.g * 255), Math.round(bottomLeft.b * 255), 255,
                Math.round(bottomRight.r * 255), Math.round(bottomRight.g * 255), Math.round(bottomRight.b * 255), 255,
                Math.round(topLeft.r * 255), Math.round(topLeft.g * 255), Math.round(topLeft.b * 255), 255,
                Math.round(topRight.r * 255), Math.round(topRight.g * 255), Math.round(topRight.b * 255), 255
            ])

            this.backgroundTexture = new THREE.DataTexture(data, 2, 2)
            this.backgroundTexture.magFilter = THREE.LinearFilter
            this.backgroundTexture.needsUpdate = true

            this.material.uniforms.tBackground.value = this.backgroundTexture
        }

        this.updateMaterial()

        // Mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.frustumCulled = false
        this.mesh.matrixAutoUpdate = false
        this.mesh.updateMatrix()
        this.container.add(this.mesh)

        // Debug
        if(this.debug)
        {
            const folder = this.debug.addFolder('floor')
            // folder.open()

            folder.addColor(this.colors, 'topLeft').onChange(this.updateMaterial)
            folder.addColor(this.colors, 'topRight').onChange(this.updateMaterial)
            folder.addColor(this.colors, 'bottomRight').onChange(this.updateMaterial)
            folder.addColor(this.colors, 'bottomLeft').onChange(this.updateMaterial)
            
            // Sand circle debug controls
            const sandColor = { 
                r: this.material.uniforms.uSandColor.value.x * 255,
                g: this.material.uniforms.uSandColor.value.y * 255,
                b: this.material.uniforms.uSandColor.value.z * 255
            }
            folder.add(this.material.uniforms.uSandCircleRadius, 'value', 0.01, 0.3, 0.01).name('Sand Radius')
            folder.addColor(sandColor, 'r', 0, 255).name('Sand R').onChange((val) => {
                this.material.uniforms.uSandColor.value.x = val / 255
            })
            folder.addColor(sandColor, 'g', 0, 255).name('Sand G').onChange((val) => {
                this.material.uniforms.uSandColor.value.y = val / 255
            })
            folder.addColor(sandColor, 'b', 0, 255).name('Sand B').onChange((val) => {
                this.material.uniforms.uSandColor.value.z = val / 255
            })
        }
    }
    
    /**
     * Update palm tree positions for sand circles
     * @param {Array} positions - Array of {x, y} positions in world coordinates
     */
    setPalmTreePositions(positions)
    {
        if (!positions || positions.length === 0) {
            console.warn('Floor: No palm tree positions provided')
            return
        }
        
        console.log(`Floor: Setting ${positions.length} palm tree positions for sand circles`)
        
        // Store world positions for projection each frame
        this.palmTreeWorldPositions = positions
        
        // Update the count
        this.material.uniforms.uPalmTreeCount.value = Math.min(positions.length, 30)
        
        console.log('Floor: Palm tree positions stored:', this.material.uniforms.uPalmTreeCount.value)
    }
    
    /**
     * Update palm tree screen positions based on camera
     * Called every frame from World
     */
    updatePalmTreeScreenPositions(camera)
    {
        if (!this.palmTreeWorldPositions || this.palmTreeWorldPositions.length === 0) {
            return
        }
        
        // Create a temporary vector for projection
        const worldPos = new THREE.Vector3()
        const screenPos = new THREE.Vector3()
        
        this.palmTreeWorldPositions.forEach((pos, index) => {
            if (index < 30) {
                // Set world position (palm trees are on the ground, z=0)
                worldPos.set(pos.x, pos.y, 0)
                
                // Project to screen space
                screenPos.copy(worldPos)
                screenPos.project(camera.instance)
                
                // Convert from NDC (-1 to 1) to UV space (0 to 1)
                const screenX = (screenPos.x + 1) / 2
                const screenY = (screenPos.y + 1) / 2
                
                // Update uniform
                this.material.uniforms.uPalmTreeScreenPositions.value[index].set(screenX, screenY)
            }
        })
    }
}
