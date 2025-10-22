/**
 * BVH (Biovision Hierarchy) Serializer
 * Exports motion capture data to BVH format
 *
 * A part of SysMocap, open sourced under Mozilla Public License 2.0
 */

export class BVHSerializer {
    constructor() {
        this.frames = [];
        this.frameTime = 1 / 30; // 30 FPS default
    }

    addFrame(riggedPose, riggedLeftHand, riggedRightHand, riggedFace) {
        this.frames.push({
            riggedPose,
            riggedLeftHand,
            riggedRightHand,
            riggedFace,
            timestamp: Date.now()
        });
    }

    clear() {
        this.frames = [];
    }

    getBoneHierarchy() {
        return `HIERARCHY
ROOT Hips
{
    OFFSET 0.00 0.00 0.00
    CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
    JOINT Spine
    {
        OFFSET 0.00 6.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT Chest
        {
            OFFSET 0.00 6.00 0.00
            CHANNELS 3 Zrotation Xrotation Yrotation
            JOINT Neck
            {
                OFFSET 0.00 6.00 0.00
                CHANNELS 3 Zrotation Xrotation Yrotation
                JOINT Head
                {
                    OFFSET 0.00 3.00 0.00
                    CHANNELS 3 Zrotation Xrotation Yrotation
                    End Site
                    {
                        OFFSET 0.00 3.00 0.00
                    }
                }
            }
            JOINT LeftShoulder
            {
                OFFSET 3.00 4.00 0.00
                CHANNELS 3 Zrotation Xrotation Yrotation
                JOINT LeftUpperArm
                {
                    OFFSET 3.00 0.00 0.00
                    CHANNELS 3 Zrotation Xrotation Yrotation
                    JOINT LeftLowerArm
                    {
                        OFFSET 9.00 0.00 0.00
                        CHANNELS 3 Zrotation Xrotation Yrotation
                        JOINT LeftHand
                        {
                            OFFSET 9.00 0.00 0.00
                            CHANNELS 3 Zrotation Xrotation Yrotation
                            End Site
                            {
                                OFFSET 3.00 0.00 0.00
                            }
                        }
                    }
                }
            }
            JOINT RightShoulder
            {
                OFFSET -3.00 4.00 0.00
                CHANNELS 3 Zrotation Xrotation Yrotation
                JOINT RightUpperArm
                {
                    OFFSET -3.00 0.00 0.00
                    CHANNELS 3 Zrotation Xrotation Yrotation
                    JOINT RightLowerArm
                    {
                        OFFSET -9.00 0.00 0.00
                        CHANNELS 3 Zrotation Xrotation Yrotation
                        JOINT RightHand
                        {
                            OFFSET -9.00 0.00 0.00
                            CHANNELS 3 Zrotation Xrotation Yrotation
                            End Site
                            {
                                OFFSET -3.00 0.00 0.00
                            }
                        }
                    }
                }
            }
        }
    }
    JOINT LeftUpperLeg
    {
        OFFSET 3.00 0.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT LeftLowerLeg
        {
            OFFSET 0.00 -15.00 0.00
            CHANNELS 3 Zrotation Xrotation Yrotation
            JOINT LeftFoot
            {
                OFFSET 0.00 -15.00 0.00
                CHANNELS 3 Zrotation Xrotation Yrotation
                End Site
                {
                    OFFSET 0.00 -3.00 3.00
                }
            }
        }
    }
    JOINT RightUpperLeg
    {
        OFFSET -3.00 0.00 0.00
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT RightLowerLeg
        {
            OFFSET 0.00 -15.00 0.00
            CHANNELS 3 Zrotation Xrotation Yrotation
            JOINT RightFoot
            {
                OFFSET 0.00 -15.00 0.00
                CHANNELS 3 Zrotation Xrotation Yrotation
                End Site
                {
                    OFFSET 0.00 -3.00 3.00
                }
            }
        }
    }
}`;
    }

    radToDeg(rad) {
        return rad * (180 / Math.PI);
    }

    // Extract rotation from bone data - handles nested rotation property
    extractRotation(bone) {
        if (!bone) {
            return { x: 0, y: 0, z: 0 };
        }

        // Check if bone has a rotation property
        if (bone.rotation) {
            return {
                x: bone.rotation.x || 0,
                y: bone.rotation.y || 0,
                z: bone.rotation.z || 0
            };
        }

        // Otherwise use direct properties
        return {
            x: bone.x || 0,
            y: bone.y || 0,
            z: bone.z || 0
        };
    }

    // Extract position from bone data
    extractPosition(bone) {
        if (!bone) {
            return { x: 0, y: 0, z: 0 };
        }

        if (bone.position) {
            return {
                x: bone.position.x || 0,
                y: bone.position.y || 0,
                z: bone.position.z || 0
            };
        }

        return { x: 0, y: 0, z: 0 };
    }

    // Convert rotation to BVH format (ZXY order, in degrees)
    getRotationValues(bone) {
        const rot = this.extractRotation(bone);
        return [
            this.radToDeg(rot.z).toFixed(6),
            this.radToDeg(rot.x).toFixed(6),
            this.radToDeg(rot.y).toFixed(6)
        ];
    }

    getFrameData(frame) {
        const values = [];

        // Hips position and rotation (6 channels: X Y Z positions, then Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.Hips) {
            const pos = this.extractPosition(frame.riggedPose.Hips);
            const rot = this.extractRotation(frame.riggedPose.Hips);

            // Position in centimeters
            values.push(
                (pos.x * 100).toFixed(6),
                (pos.y * 100).toFixed(6),
                (pos.z * 100).toFixed(6)
            );

            // Rotation in degrees (ZXY order)
            values.push(
                this.radToDeg(rot.z).toFixed(6),
                this.radToDeg(rot.x).toFixed(6),
                this.radToDeg(rot.y).toFixed(6)
            );
        } else {
            values.push('0.000000', '0.000000', '0.000000', '0.000000', '0.000000', '0.000000');
        }

        // Spine (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.Spine) {
            values.push(...this.getRotationValues(frame.riggedPose.Spine));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Chest (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.Chest) {
            values.push(...this.getRotationValues(frame.riggedPose.Chest));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Neck (3 channels: Z X Y rotations)
        if (frame.riggedFace && frame.riggedFace.head) {
            values.push(...this.getRotationValues(frame.riggedFace.head));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Head (3 channels: Z X Y rotations)
        values.push('0.000000', '0.000000', '0.000000');

        // LeftShoulder (3 channels: Z X Y rotations)
        values.push('0.000000', '0.000000', '0.000000');

        // LeftUpperArm (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.LeftUpperArm) {
            values.push(...this.getRotationValues(frame.riggedPose.LeftUpperArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // LeftLowerArm (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.LeftLowerArm) {
            values.push(...this.getRotationValues(frame.riggedPose.LeftLowerArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // LeftHand (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.LeftHand) {
            const rot = this.extractRotation(frame.riggedPose.LeftHand);
            // Combine hand rotation with wrist if available
            if (frame.riggedLeftHand && frame.riggedLeftHand.LeftWrist) {
                const wristRot = this.extractRotation(frame.riggedLeftHand.LeftWrist);
                values.push(
                    this.radToDeg(rot.z).toFixed(6),
                    this.radToDeg(wristRot.x).toFixed(6),
                    this.radToDeg(wristRot.y).toFixed(6)
                );
            } else {
                values.push(...this.getRotationValues(frame.riggedPose.LeftHand));
            }
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // RightShoulder (3 channels: Z X Y rotations)
        values.push('0.000000', '0.000000', '0.000000');

        // RightUpperArm (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.RightUpperArm) {
            values.push(...this.getRotationValues(frame.riggedPose.RightUpperArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // RightLowerArm (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.RightLowerArm) {
            values.push(...this.getRotationValues(frame.riggedPose.RightLowerArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // RightHand (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.RightHand) {
            const rot = this.extractRotation(frame.riggedPose.RightHand);
            // Combine hand rotation with wrist if available
            if (frame.riggedRightHand && frame.riggedRightHand.RightWrist) {
                const wristRot = this.extractRotation(frame.riggedRightHand.RightWrist);
                values.push(
                    this.radToDeg(rot.z).toFixed(6),
                    this.radToDeg(wristRot.x).toFixed(6),
                    this.radToDeg(wristRot.y).toFixed(6)
                );
            } else {
                values.push(...this.getRotationValues(frame.riggedPose.RightHand));
            }
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // LeftUpperLeg (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.LeftUpperLeg) {
            values.push(...this.getRotationValues(frame.riggedPose.LeftUpperLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // LeftLowerLeg (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.LeftLowerLeg) {
            values.push(...this.getRotationValues(frame.riggedPose.LeftLowerLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // LeftFoot (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.LeftFoot) {
            values.push(...this.getRotationValues(frame.riggedPose.LeftFoot));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // RightUpperLeg (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.RightUpperLeg) {
            values.push(...this.getRotationValues(frame.riggedPose.RightUpperLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // RightLowerLeg (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.RightLowerLeg) {
            values.push(...this.getRotationValues(frame.riggedPose.RightLowerLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // RightFoot (3 channels: Z X Y rotations)
        if (frame.riggedPose && frame.riggedPose.RightFoot) {
            values.push(...this.getRotationValues(frame.riggedPose.RightFoot));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        return values.join(' ');
    }

    serialize() {
        if (this.frames.length === 0) {
            throw new Error('No frames to export');
        }

        // Debug log sample frame data
        if (this.frames.length > 0) {
            const sampleFrame = this.frames[0];
            console.log("BVH Export - Sample frame structure:");
            if (sampleFrame.riggedPose) {
                console.log("Available bones:", Object.keys(sampleFrame.riggedPose));
                if (sampleFrame.riggedPose.Hips) {
                    console.log("Hips data:", sampleFrame.riggedPose.Hips);
                }
            }
        }

        let bvh = this.getBoneHierarchy();

        bvh += `\nMOTION\n`;
        bvh += `Frames: ${this.frames.length}\n`;
        bvh += `Frame Time: ${this.frameTime}\n`;

        for (const frame of this.frames) {
            bvh += this.getFrameData(frame) + '\n';
        }

        return bvh;
    }

    exportToFile(filename = 'animation.bvh') {
        const bvhData = this.serialize();
        const blob = new Blob([bvhData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
}
