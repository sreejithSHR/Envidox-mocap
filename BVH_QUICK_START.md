# BVH Export - Quick Start

## Usage

### Keyboard Shortcuts
- **B** - Start/Stop recording
- **E** - Export to BVH file

### Buttons
- **Record BVH (B)** - Start capturing animation
- **Stop (B)** - Stop capturing
- **Export (E)** - Download BVH file

## Workflow

1. Load video in SysMocap
2. Start motion capture
3. Press **B** to start BVH recording
4. Let video play (capture motion)
5. Press **B** to stop recording
6. Press **E** to download BVH file
7. Import BVH into Blender/Maya/Unity

## Import Settings

### Blender
```
File → Import → Motion Capture (.bvh)
Scale: 0.01
Forward: -Z
Up: Y
```

### Unity
```
Drag and drop BVH into Assets folder
Auto-converts to animation clip
```

### Maya
```
File → Import
File Type: BVH
Scale: 1.0
```

## Troubleshooting

**Bones not moving?**
- Open Dev Tools (F12)
- Check console for rotation data
- Verify skeleton overlay shows during capture
- Try recording longer sequence (30+ frames)

**Wrong scale?**
- Blender: Use 0.01
- Maya: Use 1.0
- Unity: Auto-scales

**Rotations wrong?**
- BVH uses ZXY rotation order
- Check import axis settings

## Debug Mode

1. Press **F12** to open Developer Tools
2. Go to Console tab
3. Start recording
4. Look for "First frame captured" message
5. Check if rotation values are non-zero

## File Location

Exported files save to your Downloads folder:
```
mocap_YYYY-MM-DD_HH-MM-SS.bvh
```

## More Help

- See `BVH_EXPORT_GUIDE.md` for detailed instructions
- See `BVH_IMPLEMENTATION_NOTES.md` for technical details
