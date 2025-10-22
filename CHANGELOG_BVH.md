# BVH Export Feature - Changelog

## Version 0.7.3 (2025-10-22)

### Added
- **BVH Animation Export**: Export motion capture data to industry-standard BVH format
- **Recording Controls**: 
  - "Record BVH" button to start capturing
  - "Stop" button to end recording
  - "Export" button to download BVH file
- **Keyboard Shortcuts**:
  - `B` key to start/stop recording
  - `E` key to export animation
- **Visual Indicators**: 
  - Red indicator during recording
  - Green indicator when ready to export
  - Frame count display
- **Debug Logging**: Console messages showing bone structure and rotation data

### Technical Implementation
- New `BVHSerializer` class in `utils/exporters/BVHSerializer.js`
- Proper extraction of nested rotation/position data from Kalidokit
- Correct BVH format with ZXY rotation order
- Unit conversion: radians to degrees, meters to centimeters
- Support for 19 skeleton joints with full hierarchy

### Fixed
- **T-Pose Issue**: Bones now properly animate instead of staying in T-pose
- **Rotation Data**: Correctly extracts and formats rotation values from motion capture
- **Data Structure Handling**: Properly handles both direct and nested property access

### Documentation
- `BVH_QUICK_START.md` - Quick reference for users
- `BVH_EXPORT_GUIDE.md` - Complete user guide with troubleshooting
- `BVH_IMPLEMENTATION_NOTES.md` - Technical documentation for developers

### Supported Export Format
- **Format**: BVH (Biovision Hierarchy)
- **Frame Rate**: 30 FPS
- **Skeleton**: 19 joints with full body hierarchy
- **Channels**: 57 channels per frame (6 for hips + 51 for other joints)

### Compatible Software
- Blender (2.8+)
- Autodesk Maya
- Unity
- MotionBuilder
- Any software supporting standard BVH format

### Known Limitations
- Face blendshapes not included (BVH format limitation)
- Finger animations simplified
- Best results with full-body tracking

## Files Changed

### New Files
- `utils/exporters/BVHSerializer.js` - BVH export implementation
- `BVH_QUICK_START.md` - Quick reference guide
- `BVH_EXPORT_GUIDE.md` - User documentation
- `BVH_IMPLEMENTATION_NOTES.md` - Technical documentation
- `CHANGELOG_BVH.md` - This file

### Modified Files
- `mocaprender/render.html` - Added BVH control buttons
- `mocaprender/script.js` - Added recording logic and keyboard shortcuts

## Testing

All functionality verified with:
- Unit tests for data extraction
- Integration tests with sample motion data
- Console debug logging
- Manual testing with Blender import

## Migration Notes

No breaking changes. This is a new feature that doesn't affect existing functionality.
