import * as THREE from 'three'

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

        this.setStatic()
        this.setTiles()
        this.setCareerAreas()
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
}
