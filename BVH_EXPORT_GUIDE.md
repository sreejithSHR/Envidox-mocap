# BVH Animation Export Guide

## Overview

SysMocap now supports exporting motion capture data to BVH (Biovision Hierarchy) format, which is widely compatible with 3D animation software like Blender, Maya, MotionBuilder, and Unity.

## Features

- Real-time motion capture recording to BVH format
- Keyboard shortcuts for quick recording control
- Visual UI indicators for recording state
- Automatic timestamped filename generation
- Support for full-body motion capture including:
  - Hip position and rotation
  - Spine and chest
  - Head and neck
  - Arms and hands
  - Legs and feet

## How to Use

### Using Buttons

1. **Start Recording**: Click the "Record BVH (B)" button in the bottom-left corner
2. **Stop Recording**: Click the "Stop (B)" button when you want to stop capturing
3. **Export Animation**: Click the "Export (E)" button to download the BVH file

### Using Keyboard Shortcuts

- Press **B** to start/stop BVH recording
- Press **E** to export the recorded animation

### Visual Indicators

- **Red indicator** (top-right): BVH recording is active
- **Green indicator** (top-right): Recording stopped, ready to export
- The indicator shows the number of captured frames

## BVH File Format

The exported BVH file contains:
- Complete skeleton hierarchy
- Frame-by-frame motion data
- 30 FPS frame rate
- Full rotation data for all joints
- Hip position data (X, Y, Z)

## Supported Joints

The BVH export includes the following joints:
- Hips (root, with position)
- Spine
- Chest
- Neck
- Head
- Left/Right Shoulder
- Left/Right Upper Arm
- Left/Right Lower Arm
- Left/Right Hand
- Left/Right Upper Leg
- Left/Right Lower Leg
- Left/Right Foot

## Importing BVH Files

### Blender
1. File → Import → Motion Capture (.bvh)
2. Select your exported BVH file
3. Adjust scale if needed (typically 0.01)

### Unity
1. Drag and drop the BVH file into your Assets folder
2. Unity will automatically recognize it as an animation clip

### Maya
1. File → Import
2. Set file type to "BVH"
3. Select your exported file

## Tips

- Record video mocap data first to ensure good tracking
- Start recording after the model is properly tracking
- Keep movements smooth for better animation quality
- The longer the recording, the larger the file size
- BVH files are text-based and can be edited manually if needed

## Technical Details

- **Frame Rate**: 30 FPS (configurable in BVHSerializer)
- **File Format**: Standard BVH text format
- **Coordinate System**: Right-handed, Y-up
- **Rotation Order**: ZXY for most joints
- **Units**: Centimeters for position data, degrees for rotation

## Troubleshooting

**No frames captured?**
- Make sure motion capture is running
- Check that the model is tracking properly
- Try pressing B again to start recording

**Animation looks wrong in 3D software?**
- Try adjusting the scale (usually 0.01 or 100)
- Check if your software needs axis conversion
- Verify rotation order settings

**File not downloading?**
- Check browser's download settings
- Ensure you stopped recording before exporting
- Try a different browser if issues persist

## Known Limitations

- Face blendshapes are not included in BVH (BVH format limitation)
- Hand finger animations are simplified
- Best results with full-body tracking
- Large recordings may take time to process
