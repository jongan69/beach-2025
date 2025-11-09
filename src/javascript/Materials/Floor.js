import * as THREE from 'three'

import shaderFragment from '../../shaders/floor/fragment.glsl'
import shaderVertex from '../../shaders/floor/vertex.glsl'

export default function()
{
    // Create array of Vector2 for palm tree screen positions
    const palmTreeScreenPositionsArray = []
    for (let i = 0; i < 30; i++) {
        palmTreeScreenPositionsArray.push(new THREE.Vector2(0, 0))
    }
    
    const uniforms = {
        tBackground: { value: null },
        uPalmTreeScreenPositions: { value: palmTreeScreenPositionsArray },
        uPalmTreeCount: { value: 0 },
        uSandCircleRadius: { value: 0.10 }, // Radius in screen space - slightly larger for more stable appearance
        uSandColor: { value: new THREE.Vector3(0.82, 0.72, 0.58) } // Dimmer sandy beige color
    }

    const material = new THREE.ShaderMaterial({
        wireframe: false,
        transparent: false,
        uniforms,
        vertexShader: shaderVertex,
        fragmentShader: shaderFragment
    })

    return material
}
