# BVH Export Implementation Notes

## What Was Fixed

### Original Issue
The initial BVH export was creating files where bones stayed in T-pose because rotation data wasn't being properly extracted from the Kalidokit motion capture data structure.

### Solution Implemented

1. **Proper Data Extraction**
   - Added `extractRotation()` method to handle nested `rotation` properties
   - Added `extractPosition()` method for position data
   - Handles both direct properties (e.g., `{x, y, z}`) and nested properties (e.g., `{rotation: {x, y, z}}`)

2. **Correct BVH Format**
   - Uses ZXY rotation order (standard for BVH)
   - Converts radians to degrees
   - Outputs 6 channels for Hips (position + rotation)
   - Outputs 3 channels for all other joints (rotation only)

3. **Debug Logging**
   - Logs first captured frame to console
   - Shows available bones and data structure on export
   - Helps developers verify motion data is being captured

## Data Structure

### Kalidokit Output Structure
```javascript
riggedPose: {
    Hips: {
        position: { x, y, z },    // in meters
        rotation: { x, y, z }     // in radians
    },
    Spine: {
        rotation: { x, y, z }
    },
    // ... other bones
}

riggedFace: {
    head: {
        rotation: { x, y, z }
    }
}

riggedLeftHand: {
    LeftWrist: { x, y, z }        // direct properties
}
```

### BVH Output Format
```
MOTION
Frames: [count]
Frame Time: 0.033333

[frame 1]: posX posY posZ rotZ rotX rotY [joint rotations...]
[frame 2]: posX posY posZ rotZ rotX rotY [joint rotations...]
...
```

## Bone Mapping

| BVH Joint | Source Data | Channels | Notes |
|-----------|-------------|----------|-------|
| Hips | riggedPose.Hips | 6 (XYZ pos + ZXY rot) | Root with position |
| Spine | riggedPose.Spine | 3 (ZXY rot) | |
| Chest | riggedPose.Chest | 3 (ZXY rot) | |
| Neck | riggedFace.head | 3 (ZXY rot) | |
| Head | N/A | 3 (ZXY rot) | Placeholder (zeros) |
| LeftShoulder | N/A | 3 (ZXY rot) | Placeholder |
| LeftUpperArm | riggedPose.LeftUpperArm | 3 (ZXY rot) | |
| LeftLowerArm | riggedPose.LeftLowerArm | 3 (ZXY rot) | |
| LeftHand | riggedPose.LeftHand + riggedLeftHand.LeftWrist | 3 (ZXY rot) | Combined |
| RightShoulder | N/A | 3 (ZXY rot) | Placeholder |
| RightUpperArm | riggedPose.RightUpperArm | 3 (ZXY rot) | |
| RightLowerArm | riggedPose.RightLowerArm | 3 (ZXY rot) | |
| RightHand | riggedPose.RightHand + riggedRightHand.RightWrist | 3 (ZXY rot) | Combined |
| LeftUpperLeg | riggedPose.LeftUpperLeg | 3 (ZXY rot) | |
| LeftLowerLeg | riggedPose.LeftLowerLeg | 3 (ZXY rot) | |
| LeftFoot | riggedPose.LeftFoot | 3 (ZXY rot) | |
| RightUpperLeg | riggedPose.RightUpperLeg | 3 (ZXY rot) | |
| RightLowerLeg | riggedPose.RightLowerLeg | 3 (ZXY rot) | |
| RightFoot | riggedPose.RightFoot | 3 (ZXY rot) | |

Total: 57 channels per frame

## Testing

### Unit Test Results
```bash
✓ BVH Export Test Successful!
✓ Hip Position (cm): 0 100 0
✓ Hip Rotation (deg): 1.15 5.73 2.86
✓ Spine Rotation (deg): 0.00 2.86 0.00
✓ SUCCESS: Animation data contains movement!
```

### Verification Steps
1. Open Developer Tools (F12) in the Electron app
2. Start BVH recording (press B)
3. Check console for "First frame captured" message
4. Stop recording (press B)
5. Export BVH (press E)
6. Check console for "BVH Export - Sample frame structure"
7. Verify bones list and sample rotation values

### Import Verification (Blender)
1. Import BVH file (File → Import → Motion Capture)
2. Set scale to 0.01
3. Play animation
4. Bones should move from T-pose to captured motion
5. Check Graph Editor for rotation curves

## Files Modified

1. **`utils/exporters/BVHSerializer.js`** (NEW)
   - Complete BVH exporter implementation
   - Handles nested data structures
   - Proper unit conversions (radians→degrees, meters→centimeters)

2. **`mocaprender/script.js`**
   - Import BVHSerializer
   - Added BVH recording state variables
   - Frame capture during motion tracking
   - Keyboard shortcuts (B, E)
   - Button visibility management
   - Debug logging

3. **`mocaprender/render.html`**
   - Added BVH control buttons
   - Material Design styling

4. **`BVH_EXPORT_GUIDE.md`** (NEW)
   - User documentation
   - Troubleshooting guide
   - Import instructions

5. **`BVH_IMPLEMENTATION_NOTES.md`** (THIS FILE)
   - Technical documentation
   - Developer reference

## Known Issues & Limitations

1. **Finger Animations**: Not included (BVH typically doesn't support detailed hand animation)
2. **Face Blendshapes**: Not supported in BVH format
3. **Foot IK**: No inverse kinematics data
4. **Root Motion**: Hip position is relative, not world-space

## Future Improvements

1. Add frame rate configuration UI
2. Support for exporting to other formats (FBX, USD)
3. Preview animation before export
4. Retargeting options for different skeleton structures
5. Compression/optimization options
6. Batch export multiple takes

## References

- [BVH File Format Specification](http://www.dcs.shef.ac.uk/intranet/research/public/resmes/CS0111.pdf)
- [Kalidokit Documentation](https://github.com/yeemachine/kalidokit)
- [Three.js VRM](https://github.com/pixiv/three-vrm)
