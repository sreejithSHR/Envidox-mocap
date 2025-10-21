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

    getFrameData(frame) {
        const values = [];

        // Hips position and rotation
        if (frame.riggedPose && frame.riggedPose.Hips) {
            const pos = frame.riggedPose.Hips.position || { x: 0, y: 0, z: 0 };
            const rot = frame.riggedPose.Hips.rotation || { x: 0, y: 0, z: 0 };

            values.push(
                (pos.x * 100).toFixed(6),
                (pos.y * 100).toFixed(6),
                (pos.z * 100).toFixed(6),
                this.radToDeg(rot.z).toFixed(6),
                this.radToDeg(rot.x).toFixed(6),
                this.radToDeg(rot.y).toFixed(6)
            );
        } else {
            values.push('0.000000', '0.000000', '0.000000', '0.000000', '0.000000', '0.000000');
        }

        // Helper to get rotation values
        const getRot = (bone) => {
            if (bone && bone.rotation) {
                return [
                    this.radToDeg(bone.rotation.z).toFixed(6),
                    this.radToDeg(bone.rotation.x).toFixed(6),
                    this.radToDeg(bone.rotation.y).toFixed(6)
                ];
            }
            return ['0.000000', '0.000000', '0.000000'];
        };

        // Spine
        if (frame.riggedPose && frame.riggedPose.Spine) {
            values.push(...getRot(frame.riggedPose.Spine));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Chest
        if (frame.riggedPose && frame.riggedPose.Chest) {
            values.push(...getRot(frame.riggedPose.Chest));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Neck
        if (frame.riggedFace && frame.riggedFace.head) {
            values.push(...getRot(frame.riggedFace));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Head
        values.push('0.000000', '0.000000', '0.000000');

        // Left arm chain
        values.push('0.000000', '0.000000', '0.000000'); // LeftShoulder
        if (frame.riggedPose && frame.riggedPose.LeftUpperArm) {
            values.push(...getRot(frame.riggedPose.LeftUpperArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        if (frame.riggedPose && frame.riggedPose.LeftLowerArm) {
            values.push(...getRot(frame.riggedPose.LeftLowerArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        if (frame.riggedLeftHand && frame.riggedLeftHand.LeftWrist) {
            values.push(...getRot({ rotation: frame.riggedLeftHand.LeftWrist }));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Right arm chain
        values.push('0.000000', '0.000000', '0.000000'); // RightShoulder
        if (frame.riggedPose && frame.riggedPose.RightUpperArm) {
            values.push(...getRot(frame.riggedPose.RightUpperArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        if (frame.riggedPose && frame.riggedPose.RightLowerArm) {
            values.push(...getRot(frame.riggedPose.RightLowerArm));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        if (frame.riggedRightHand && frame.riggedRightHand.RightWrist) {
            values.push(...getRot({ rotation: frame.riggedRightHand.RightWrist }));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }

        // Left leg chain
        if (frame.riggedPose && frame.riggedPose.LeftUpperLeg) {
            values.push(...getRot(frame.riggedPose.LeftUpperLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        if (frame.riggedPose && frame.riggedPose.LeftLowerLeg) {
            values.push(...getRot(frame.riggedPose.LeftLowerLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        values.push('0.000000', '0.000000', '0.000000'); // LeftFoot

        // Right leg chain
        if (frame.riggedPose && frame.riggedPose.RightUpperLeg) {
            values.push(...getRot(frame.riggedPose.RightUpperLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        if (frame.riggedPose && frame.riggedPose.RightLowerLeg) {
            values.push(...getRot(frame.riggedPose.RightLowerLeg));
        } else {
            values.push('0.000000', '0.000000', '0.000000');
        }
        values.push('0.000000', '0.000000', '0.000000'); // RightFoot

        return values.join(' ');
    }

    serialize() {
        if (this.frames.length === 0) {
            throw new Error('No frames to export');
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
