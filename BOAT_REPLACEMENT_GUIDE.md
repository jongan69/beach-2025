# Guide: Replacing Car with Boat Models

## Overview
This project uses GLB 3D models loaded through Three.js. To replace the car with a boat, you have several options.

## Option 1: Simple File Replacement (Easiest)
**Best for:** Quick testing, if boat models match car structure

1. **Prepare your boat models** with these exact filenames:
   - `chassis.glb` (boat hull)
   - `wheel.glb` (propeller or omit if not needed)
   - `antena.glb` (mast/flag)
   - `backLightsBrake.glb` (boat lights)
   - `backLightsReverse.glb` (boat lights)

2. **Replace files** in `static/models/car/default/`:
   ```bash
   # Backup originals first!
   cp -r static/models/car/default static/models/car/default.backup
   
   # Replace with your boat models
   # (copy your boat GLB files to static/models/car/default/)
   ```

3. **No code changes needed** - the existing code will load your boat models automatically.

## Option 2: Add Boat as New Variant (Recommended)
**Best for:** Keeping car models, adding boat as alternative

### Step 1: Create Boat Model Directory
```bash
mkdir -p static/models/car/boat
```

Place your boat models in `static/models/car/boat/`:
- `chassis.glb`
- `wheel.glb` (or `propeller.glb`)
- `antena.glb` (or `mast.glb`)
- `backLightsBrake.glb`
- `backLightsReverse.glb`

### Step 2: Add Boat Models to Resources.js

Add after the cyberTruck models (around line 94):

```javascript
// Boat
{ name: 'carBoatChassis', source: './models/car/boat/chassis.glb' },
{ name: 'carBoatWheel', source: './models/car/boat/wheel.glb' },
{ name: 'carBoatBackLightsBrake', source: './models/car/boat/backLightsBrake.glb' },
{ name: 'carBoatBackLightsReverse', source: './models/car/boat/backLightsReverse.glb' },
{ name: 'carBoatAntena', source: './models/car/boat/antena.glb' },
```

### Step 3: Add Boat Option to Car.js

In `src/javascript/World/Car.js`, modify the `setModels()` method:

```javascript
setModels()
{
    this.models = {}

    // Boat
    if(this.config.boat)
    {
        this.models.chassis = this.resources.items.carBoatChassis
        this.models.antena = this.resources.items.carBoatAntena
        this.models.backLightsBrake = this.resources.items.carBoatBackLightsBrake
        this.models.backLightsReverse = this.resources.items.carBoatBackLightsReverse
        this.models.wheel = this.resources.items.carBoatWheel
    }
    // Cyber truck
    else if(this.config.cyberTruck)
    {
        this.models.chassis = this.resources.items.carCyberTruckChassis
        this.models.antena = this.resources.items.carCyberTruckAntena
        this.models.backLightsBrake = this.resources.items.carCyberTruckBackLightsBrake
        this.models.backLightsReverse = this.resources.items.carCyberTruckBackLightsReverse
        this.models.wheel = this.resources.items.carCyberTruckWheel
    }
    // Default
    else
    {
        this.models.chassis = this.resources.items.carDefaultChassis
        this.models.antena = this.resources.items.carDefaultAntena
        this.models.backLightsBrake = this.resources.items.carDefaultBackLightsBrake
        this.models.backLightsReverse = this.resources.items.carDefaultBackLightsReverse
        this.models.wheel = this.resources.items.carDefaultWheel
    }
}
```

### Step 4: Enable Boat in Config

Find where `config.cyberTruck` is set (likely in `Application.js` or config file) and add:

```javascript
config.boat = true  // Set to true to use boat instead of car
```

## Option 3: Programmatic Model Transformation
**Best for:** Modifying models at runtime without replacing files

You can transform models after loading, similar to how trees were converted to palm trees. Add to `Resources.js`:

```javascript
this.loader.on('end', () =>
{
    // Transform car to boat
    this.transformCarToBoat()
    
    this.trigger('ready')
})

transformCarToBoat()
{
    // Example: Scale chassis to be more boat-like
    if (this.items.carDefaultChassis && this.items.carDefaultChassis.scene) {
        this.items.carDefaultChassis.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Make it wider and flatter (boat shape)
                child.scale.x *= 1.5  // Wider
                child.scale.y *= 0.7  // Lower
                child.scale.z *= 1.2  // Longer
            }
        })
    }
}
```

## Model Requirements

### Required Parts:
1. **Chassis** - Main body (hull for boat)
2. **Wheel** - Used 4 times for wheels (propellers for boat)
3. **Antena** - Decorative element (mast for boat)
4. **BackLightsBrake** - Brake lights (boat lights)
5. **BackLightsReverse** - Reverse lights (boat lights)

### Model Structure:
- Models should be GLB format
- Each model should have a scene with meshes
- Meshes can be named (optional) - naming helps with programmatic modifications
- Collision meshes are separate (in `collision.glb` files)

### Model Naming Convention:
If you want to programmatically identify parts:
- Name meshes like: `hull`, `propeller`, `mast`, `light`, etc.
- Use consistent naming across models

## Tips for Creating/Editing Models

### Free 3D Modeling Tools:
1. **Blender** (Free, Open Source)
   - Export as GLB: File → Export → glTF 2.0 (.glb/.gltf)
   - Can import existing GLB files to modify

2. **Sketchfab** (Online viewer/downloader)
   - Search for free boat models
   - Download as GLB format

3. **Poly Haven** (Free 3D assets)
   - CC0 licensed models
   - Download and convert to GLB

### Model Optimization:
- Keep polygon count reasonable (< 10k per model)
- Use compressed textures
- GLB format is already optimized

## Testing Your Changes

1. **Start dev server:**
   ```bash
   bun run dev
   ```

2. **Check browser console** for loading errors

3. **Verify models load:**
   - Check Network tab for GLB files
   - Models should appear in the scene

## Troubleshooting

### Models not loading:
- Check file paths in `Resources.js`
- Verify GLB files are in correct directory
- Check browser console for 404 errors

### Models appear wrong:
- Verify model scale/orientation in Blender
- Check if models need rotation/scaling adjustments
- Models might need to be centered at origin (0,0,0)

### Physics not working:
- Ensure collision meshes exist
- Check physics setup in `Physics.js`
- Boat might need different physics parameters than car

## Example: Quick Boat Setup

```bash
# 1. Create directory
mkdir -p static/models/car/boat

# 2. Copy your boat GLB files:
#    boat_hull.glb → chassis.glb
#    boat_propeller.glb → wheel.glb
#    boat_mast.glb → antena.glb
#    boat_lights.glb → backLightsBrake.glb
#    boat_lights.glb → backLightsReverse.glb (or use same file)

# 3. Edit Resources.js to add boat models
# 4. Edit Car.js to add boat option
# 5. Set config.boat = true
```

## Next Steps

After replacing models, you might want to:
- Adjust physics parameters for boat movement
- Change sounds (engine → boat motor)
- Modify controls (steering → rudder)
- Update water/terrain if needed

