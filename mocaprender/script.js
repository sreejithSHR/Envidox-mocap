/**
 *  Video-based Motion Capture and 3D Model Render Part
 *
 *  A part of SysMocap, open sourced under Mozilla Public License 2.0
 *
 *  https://github.com/xianfei/SysMocap
 *
 *  xianfei 2022.3, last modified 2024.7
 */

// import setting utils
const globalSettings = window.parent.window.sysmocapApp.settings;

const { languages } = require("../utils/language.js");

var hipRotationOffset = 0.0

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { BVHSerializer } from "../utils/exporters/BVHSerializer.js";

// set theme
document.body.setAttribute(
    "class",
    "mdui-theme-layout-auto mdui-theme-primary-" +
        globalSettings.ui.themeColor +
        " mdui-theme-accent-" +
        globalSettings.ui.themeColor
);

// import mocap web server
var my_server = null;
var ipcRenderer = null;
if (globalSettings.forward.enableForwarding)
    ipcRenderer = require("electron").ipcRenderer;
// my_server = require("../webserv/server.js");

// import Helper Functions from Kalidokit
const remap = Kalidokit.Utils.remap;
const clamp = Kalidokit.Utils.clamp;
const lerp = Kalidokit.Vector.lerp;

// VRM object
let currentVrm = null;

// Whether mediapipe ready
var started = false;

// renderer
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: globalSettings.output.antialias,
});
renderer.setSize(
    document.querySelector("#model").clientWidth,
    (document.querySelector("#model").clientWidth / 16) * 9
);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector("#model").appendChild(renderer.domElement);

window.addEventListener(
    "resize",
    function () {
        orbitCamera.aspect = 16 / 9;
        orbitCamera.updateProjectionMatrix();
        renderer.setSize(
            document.querySelector("#model").clientWidth,
            (document.querySelector("#model").clientWidth / 16) * 9
        );
    },
    false
);

// camera
const orbitCamera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 1000);
orbitCamera.position.set(0.0, 1.4, 0.7);

// controls
const orbitControls = new OrbitControls(orbitCamera, renderer.domElement);
orbitControls.screenSpacePanning = true;
orbitControls.target.set(0.0, 1.4, 0.0);
orbitControls.update();

// scene
const scene = new THREE.Scene();

// stats

const statsContainer = document.getElementById("status");

if (!globalSettings.output.showFPS) {
    statsContainer.style.display = "none";
}

const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.top = "26px";
stats.domElement.style.left = "10px";
statsContainer.appendChild(stats.dom);

const stats2 = new Stats();
stats2.domElement.style.position = "absolute";
stats2.domElement.style.top = "26px";
stats2.domElement.style.left = "100px";
statsContainer.appendChild(stats2.dom);

// Main Render Loop
const clock = new THREE.Clock();

var isRecordingStarted = false;
var isBVHRecordingStarted = false;
var bvhSerializer = new BVHSerializer();

function animate() {
    requestAnimationFrame(animate);

    stats.update();

    if (currentVrm) {
        // Update model to render physics
        currentVrm.update(clock.getDelta());
    }
    renderer.render(scene, orbitCamera);

    if(isRecordingStarted)html2canvas(elementToRecord).then(function (canvas) {
        context.clearRect(0, 0, canvas2d.width, canvas2d.height);
        context.drawImage(canvas, 0, 0, canvas2d.width, canvas2d.height);
    });
}
animate();

var modelObj = JSON.parse(localStorage.getItem("modelInfo"));
var modelPath = modelObj.path;

var fileType = modelPath
    .substring(modelPath.lastIndexOf(".") + 1)
    .toLowerCase();

var skeletonHelper = null;

// init server
if (ipcRenderer)
    ipcRenderer.send(
        "startWebServer",
        parseInt(globalSettings.forward.port),
        JSON.stringify(modelObj),
        globalSettings.forward.supportForWebXR
    );
// my_server.startServer(parseInt(globalSettings.forward.port), modelPath);

// light
var light0 = new THREE.DirectionalLight(0xffffff, Math.PI);
light0.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light0);

if (fileType !== "vrm") {
    const light = new THREE.AmbientLight(0xffffff, 0.8);
    light.position.set(10.0, 10.0, -10.0).normalize();
    scene.add(light);
    var light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(0, 3, -2);
    light2.castShadow = true;
    scene.add(light2);
}


var initRotation = {};

// Import model from URL, add your own model here
var loader = null;
if (fileType == "fbx") {
    loader = new FBXLoader();
} else {
    loader = new GLTFLoader();
    loader.register((parser) => {
        return new VRMLoaderPlugin(parser);
    });
}
// Import Character
loader.crossOrigin = "anonymous";
loader.load(
    modelPath,

    (gltf) => {
        var model = null;
        if (fileType == "fbx") {
            model = gltf;
            gltf.scale.set(0.01, 0.01, 0.01);
        } else {
            model = gltf.scene;
        }

        if (fileType == "vrm") {
            // calling these functions greatly improves the performance
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.removeUnnecessaryJoints(gltf.scene);
            const vrm = gltf.userData.vrm;
            scene.add(vrm.scene);
            if (vrm.meta.metaVersion === "0") {
                vrm.scene.rotation.y = Math.PI; // Rotate model 180deg to face camera
            }
            currentVrm = vrm;
            window.currentVrm = currentVrm;
        } else {
            skeletonHelper = new THREE.SkeletonHelper(model);
            skeletonHelper.visible = false;
            scene.add(skeletonHelper);
            // for glb files
            scene.add(model);
            model.rotation.y = Math.PI; // Rotate model 180deg to face camera
            var rot = {
                x: 0,
                y: 0,
                z: -3.1129221599796764,
            };
            for (var i in rot) orbitCamera.rotation[i] = rot[i];
            var pos = {
                x: -0,
                y: 0.5922529898344698,
                z: -1.4448572419883419,
            };
            for (var i in pos) orbitCamera.position[i] = pos[i];

            orbitControls.target.y = 0.5;
            orbitControls.update();

            if (modelObj.cameraTarget) {
                orbitControls.target.set(
                    modelObj.cameraTarget.x,
                    modelObj.cameraTarget.y,
                    modelObj.cameraTarget.z
                );
                orbitControls.update();
            }
            if (modelObj.cameraPosition) {
                for (var i in modelObj.cameraPosition)
                    orbitCamera.position[i] = modelObj.cameraPosition[i];
            }
            if (modelObj.cameraRotation) {
                for (var i in modelObj.cameraRotation)
                    orbitCamera.rotation[i] = modelObj.cameraRotation[i];
            }

            if (modelObj.init) {
                initRotation = modelObj.init;
            }
        }
    },

    (progress) =>
        console.log(
            "Loading model...",
            100.0 * (progress.loaded / progress.total),
            "%"
        ),

    (error) => console.error(error)
);

function capitalizeFirstLetterToLowerCase(str) {
    if (str.length === 0) {
        return str;
    }
    return str.charAt(0).toLowerCase() + str.slice(1);
}

// Animate Rotation Helper function
const rigRotation = (
    name,
    rotation = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
) => {
    if (currentVrm) {
        const Part = currentVrm.humanoid.getNormalizedBoneNode(
            capitalizeFirstLetterToLowerCase(name)
        );
        if (!Part) {
            return;
        }
        let euler = new THREE.Euler(
            (currentVrm.meta.metaVersion === "1" ? -1 : 1) * rotation.x * dampener,
            rotation.y * dampener,
            (currentVrm.meta.metaVersion === "1" ? -1 : 1) *
                rotation.z *
                dampener,
            rotation.rotationOrder || "XYZ"
        );
        let quaternion = new THREE.Quaternion().setFromEuler(euler);
        Part.quaternion.slerp(quaternion, lerpAmount); // interpolate
    } else if (skeletonHelper) {
        var skname = modelObj.binding[name].name; // convert name with model json binding info
        if (skname == "None") {
            return;
        }
        // find bone in bones by name
        var b = skeletonHelper.bones.find((bone) => bone.name == skname);

        if (b) {
            if (!initRotation[name]) {
                initRotation[name] = {
                    x: b.rotation.x,
                    y: b.rotation.y,
                    z: b.rotation.z,
                };
            }
            const bindingFunc = modelObj.binding[name].func;
            const order = modelObj.binding[name].order?.toUpperCase();
            const x = rotation.x * dampener;
            const y = rotation.y * dampener;
            const z = rotation.z * dampener;

            // console.log("rotation.rotationOrder ",rotation.rotationOrder )

            let euler = new THREE.Euler(
                initRotation[name].x + eval(bindingFunc.fx),
                initRotation[name].y + eval(bindingFunc.fy),
                initRotation[name].z + eval(bindingFunc.fz),
                order || rotation.rotationOrder || "XYZ"
            );
            let quaternion = new THREE.Quaternion().setFromEuler(euler);
            b.quaternion.slerp(quaternion, lerpAmount); // interpolate
        } else {
            console.log("Can not found bone " + name);
        }
    }
};

// Animate Position Helper Function
const rigPosition = (
    name,
    position = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
) => {
    if (currentVrm) {
        const Part = currentVrm.humanoid.getNormalizedBoneNode(
            capitalizeFirstLetterToLowerCase(name)
        );
        if (!Part) {
            return;
        }
        let vector = new THREE.Vector3(
            position.x * dampener,
            position.y * dampener,
            position.z * dampener
        );
        Part.position.lerp(vector, lerpAmount); // interpolate
    } else if (skeletonHelper) {
        name = modelObj.binding[name].name; // convert name with model json binding info
        // find bone in bones by name
        var b = skeletonHelper.bones.find((bone) => bone.name == name);
        if (b) {
            if (fileType == "fbx") {
                dampener *= 100;
            }
            let vector = new THREE.Vector3(
                position.x * dampener,
                position.y * dampener,
                -position.z * dampener
            );
            if (fileType == "fbx") {
                vector.y -= 1.2 * dampener;
            }
            b.position.lerp(vector, lerpAmount); // interpolate
        } else {
            console.log("Can not found bone " + name);
        }
    }
};

let oldLookTarget = new THREE.Euler();
const rigFace = (riggedFace) => {
    if (!currentVrm) {
        return; // face motion only support VRM Now
    }

    // Blendshapes and Preset Name Schema
    const Blendshape = currentVrm.expressionManager;
    const PresetName = {
        A: "aa",
        Angry: "angry",
        Blink: "blink",
        BlinkL: "blinkLeft",
        BlinkR: "blinkRight",
        E: "ee",
        Fun: "happy",
        I: "ih",
        Joy: "relaxed",
        Lookdown: "lookDown",
        Lookleft: "lookLeft",
        Lookright: "lookRight",
        Lookup: "lookUp",
        Neutral: "neutral",
        O: "oh",
        Sorrow: "sad",
        U: "ou",
        Unknown: "unknown",
    };

    // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with `Kalidokit` helper function.
    // for VRM, 1 is closed, 0 is open.
    riggedFace.eye.l = lerp(
        clamp(1 - riggedFace.eye.l, 0, 1),
        Blendshape.getValue(PresetName.Blink),
        0.4
    );
    riggedFace.eye.r = lerp(
        clamp(1 - riggedFace.eye.r, 0, 1),
        Blendshape.getValue(PresetName.Blink),
        0.4
    );
    // riggedFace.eye.l = Kalidokit.Face.stabilizeBlink(
    //     {l:riggedFace.eye.l,r:riggedFace.eye.l},
    //     riggedFace.head.y
    // ).l;
    // riggedFace.eye.r = Kalidokit.Face.stabilizeBlink(
    //     {l:riggedFace.eye.r,r:riggedFace.eye.r},
    //     riggedFace.head.y
    // ).r;
    riggedFace.eye.l /= 0.8;
    riggedFace.eye.r /= 0.8;
    Blendshape.setValue(PresetName.BlinkL, riggedFace.eye.l);
    Blendshape.setValue(PresetName.BlinkR, riggedFace.eye.r);

    // Interpolate and set mouth blendshapes
    Blendshape.setValue(
        PresetName.I,
        lerp(
            riggedFace.mouth.shape.I / 0.8,
            Blendshape.getValue(PresetName.I),
            0.3
        )
    );
    Blendshape.setValue(
        PresetName.A,
        lerp(
            riggedFace.mouth.shape.A / 0.8,
            Blendshape.getValue(PresetName.A),
            0.3
        )
    );
    Blendshape.setValue(
        PresetName.E,
        lerp(
            riggedFace.mouth.shape.E / 0.8,
            Blendshape.getValue(PresetName.E),
            0.3
        )
    );
    Blendshape.setValue(
        PresetName.O,
        lerp(
            riggedFace.mouth.shape.O / 0.8,
            Blendshape.getValue(PresetName.O),
            0.3
        )
    );
    Blendshape.setValue(
        PresetName.U,
        lerp(
            riggedFace.mouth.shape.U / 0.8,
            Blendshape.getValue(PresetName.U),
            0.3
        )
    );

    //PUPILS
    //interpolate pupil and keep a copy of the value
    let lookTarget = new THREE.Euler(
        lerp(oldLookTarget.x, riggedFace.pupil.y, 0.4),
        lerp(oldLookTarget.y, riggedFace.pupil.x, 0.4),
        0,
        "XYZ"
    );
    oldLookTarget.copy(lookTarget);
    currentVrm.lookAt.applier.applyYawPitch(lookTarget.y, lookTarget.x);
};

var positionOffset = {
    x: 0,
    y: 1,
    z: 0,
};

/* VRM Character Animator */
const animateVRM = (vrm, results) => {
    if (!vrm && !skeletonHelper) {
        return;
    }
    // Take the results from `Holistic` and animate character based on its Face, Pose, and Hand Keypoints.
    let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

    const faceLandmarks = results.faceLandmarks;
    // Pose 3D Landmarks are with respect to Hip distance in meters
    const pose3DLandmarks = results.za;
    // Pose 2D landmarks are with respect to videoWidth and videoHeight
    const pose2DLandmarks = results.poseLandmarks;
    // Be careful, hand landmarks may be reversed
    const leftHandLandmarks = results.rightHandLandmarks;
    const rightHandLandmarks = results.leftHandLandmarks;

    if (faceLandmarks) {
        riggedFace = Kalidokit.Face.solve(faceLandmarks, {
            runtime: "mediapipe",
            video: videoElement,
        });
    }

    if (pose2DLandmarks && pose3DLandmarks) {
        riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
            runtime: "mediapipe",
            video: videoElement,
        });
    }

    if (leftHandLandmarks) {
        riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, "Left");
    }

    if (rightHandLandmarks && fileType == "vrm") {
        riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
    }

    // Record BVH frame data if recording is active
    if (isBVHRecordingStarted) {
        bvhSerializer.addFrame(riggedPose, riggedLeftHand, riggedRightHand, riggedFace);

        // Debug log first frame to console
        if (bvhSerializer.frames.length === 1) {
            console.log("First frame captured - Sample data structure:");
            console.log("riggedPose.Hips:", riggedPose?.Hips);
            console.log("riggedPose.LeftUpperArm:", riggedPose?.LeftUpperArm);
            console.log("riggedPose.RightUpperArm:", riggedPose?.RightUpperArm);
        }
    }

    if (ipcRenderer)
        ipcRenderer.send("sendBoradcast", {
            type: "xf-sysmocap-data",
            riggedPose: riggedPose,
            riggedLeftHand: riggedLeftHand,
            riggedRightHand: riggedRightHand,
            riggedFace: riggedFace,
        });

    // Animate Face
    if (faceLandmarks) {
        rigRotation("Neck", riggedFace.head, 0.7);
        if (fileType == "vrm") rigFace(riggedFace);
    }

    // Animate Pose
    if (pose2DLandmarks && pose3DLandmarks) {
        rigRotation("Hips", {
            x: riggedPose.Hips.rotation.x ,
            y: riggedPose.Hips.rotation.y ,
            z: riggedPose.Hips.rotation.z + hipRotationOffset,
        }, 0.7);
        rigPosition(
            "Hips",
            {
                x: riggedPose.Hips.position.x + positionOffset.x, // Reverse direction
                y: riggedPose.Hips.position.y + positionOffset.y, // Add a bit of height
                z: -riggedPose.Hips.position.z + positionOffset.z, // Reverse direction
            },
            1,
            0.07
        );

        rigRotation("Chest", riggedPose.Chest, 0.25, 0.3);
        rigRotation("Spine", riggedPose.Spine, 0.45, 0.3);

        rigRotation("RightUpperArm", riggedPose.RightUpperArm);
        rigRotation("RightLowerArm", riggedPose.RightLowerArm);
        rigRotation("LeftUpperArm", riggedPose.LeftUpperArm);
        rigRotation("LeftLowerArm", riggedPose.LeftLowerArm);

        rigRotation("LeftUpperLeg", riggedPose.LeftUpperLeg);
        rigRotation("LeftLowerLeg", riggedPose.LeftLowerLeg);
        rigRotation("RightUpperLeg", riggedPose.RightUpperLeg);
        rigRotation("RightLowerLeg", riggedPose.RightLowerLeg);
    }

    // Animate Hands
    if (leftHandLandmarks && fileType == "vrm") {
        rigRotation("LeftHand", {
            // Combine pose rotation Z and hand rotation X Y
            z: riggedPose.LeftHand.z,
            y: riggedLeftHand.LeftWrist.y,
            x: riggedLeftHand.LeftWrist.x,
        });
        rigRotation("LeftRingProximal", riggedLeftHand.LeftRingProximal);
        rigRotation(
            "LeftRingIntermediate",
            riggedLeftHand.LeftRingIntermediate
        );
        rigRotation("LeftRingDistal", riggedLeftHand.LeftRingDistal);
        rigRotation("LeftIndexProximal", riggedLeftHand.LeftIndexProximal);
        rigRotation(
            "LeftIndexIntermediate",
            riggedLeftHand.LeftIndexIntermediate
        );
        rigRotation("LeftIndexDistal", riggedLeftHand.LeftIndexDistal);
        rigRotation("LeftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
        rigRotation(
            "LeftMiddleIntermediate",
            riggedLeftHand.LeftMiddleIntermediate
        );
        rigRotation("LeftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
        rigRotation("LeftThumbProximal", riggedLeftHand.LeftThumbProximal);
        rigRotation(
            "LeftThumbIntermediate",
            riggedLeftHand.LeftThumbIntermediate
        );
        rigRotation("LeftThumbDistal", riggedLeftHand.LeftThumbDistal);
        rigRotation("LeftLittleProximal", riggedLeftHand.LeftLittleProximal);
        rigRotation(
            "LeftLittleIntermediate",
            riggedLeftHand.LeftLittleIntermediate
        );
        rigRotation("LeftLittleDistal", riggedLeftHand.LeftLittleDistal);
    }
    if (rightHandLandmarks && fileType == "vrm") {
        // riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
        rigRotation("RightHand", {
            // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
            z: riggedPose.RightHand.z,
            y: riggedRightHand.RightWrist.y,
            x: riggedRightHand.RightWrist.x,
        });
        rigRotation("RightRingProximal", riggedRightHand.RightRingProximal);
        rigRotation(
            "RightRingIntermediate",
            riggedRightHand.RightRingIntermediate
        );
        rigRotation("RightRingDistal", riggedRightHand.RightRingDistal);
        rigRotation("RightIndexProximal", riggedRightHand.RightIndexProximal);
        rigRotation(
            "RightIndexIntermediate",
            riggedRightHand.RightIndexIntermediate
        );
        rigRotation("RightIndexDistal", riggedRightHand.RightIndexDistal);
        rigRotation("RightMiddleProximal", riggedRightHand.RightMiddleProximal);
        rigRotation(
            "RightMiddleIntermediate",
            riggedRightHand.RightMiddleIntermediate
        );
        rigRotation("RightMiddleDistal", riggedRightHand.RightMiddleDistal);
        rigRotation("RightThumbProximal", riggedRightHand.RightThumbProximal);
        rigRotation(
            "RightThumbIntermediate",
            riggedRightHand.RightThumbIntermediate
        );
        rigRotation("RightThumbDistal", riggedRightHand.RightThumbDistal);
        rigRotation("RightLittleProximal", riggedRightHand.RightLittleProximal);
        rigRotation(
            "RightLittleIntermediate",
            riggedRightHand.RightLittleIntermediate
        );
        rigRotation("RightLittleDistal", riggedRightHand.RightLittleDistal);
    }

    // if (my_server)
    //     my_server.sendBoradcast(
    //         JSON.stringify({
    //             type: "xf-sysmocap-data",
    //             riggedPose: riggedPose,
    //             riggedLeftHand: riggedLeftHand,
    //             riggedRightHand: riggedRightHand,
    //             riggedFace: riggedFace,
    //         })
    //     );
};

let videoElement = document.querySelector(".input_video"),
    guideCanvas = document.querySelector("canvas.guides");

const onResults = (results) => {
    stats2.update();
    // Draw landmark guides
    if (globalSettings.preview.showSketelonOnInput) drawResults(results);
    // Animate model
    animateVRM(currentVrm, results);
    if (!started) {
        document.getElementById("loading").remove();
        if (localStorage.getItem("useCamera") == "file") videoElement.play();
        started = true;
    }
};

const holistic = new Holistic({
    locateFile: (file) => {
        if (typeof require != "undefined")
            return __dirname + `/../node_modules/@mediapipe/holistic/${file}`;
        else return `../node_modules/@mediapipe/holistic/${file}`;
    },
});

holistic.setOptions({
    modelComplexity: parseInt(globalSettings.mediapipe.modelComplexity),
    smoothLandmarks: globalSettings.mediapipe.smoothLandmarks,
    minDetectionConfidence: parseFloat(
        globalSettings.mediapipe.minDetectionConfidence
    ),
    minTrackingConfidence: parseFloat(
        globalSettings.mediapipe.minTrackingConfidence
    ),
    refineFaceLandmarks: globalSettings.mediapipe.refineFaceLandmarks,
});
// Pass holistic a callback function
holistic.onResults(onResults);

const drawResults = (results) => {
    guideCanvas.width = videoElement.videoWidth;
    guideCanvas.height = videoElement.videoHeight;
    let canvasCtx = guideCanvas.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    // Use `Mediapipe` drawing functions
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00cff7",
        lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#ff0364",
        lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
        color: "#C0C0C070",
        lineWidth: 1,
    });
    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
        //draw pupils
        drawLandmarks(
            canvasCtx,
            [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
            {
                color: "#ffe603",
                lineWidth: 2,
            }
        );
    }
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
        color: "#eb1064",
        lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
        color: "#00cff7",
        lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
        color: "#22c3e3",
        lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
        color: "#ff0364",
        lineWidth: 2,
    });
};

// switch use camera or video file
if (localStorage.getItem("useCamera") == "camera") {
    navigator.mediaDevices
        .getUserMedia({
            video: {
                deviceId: localStorage.getItem("cameraId"),
                width: 1280,
                height: 720,
            },
        })
        .then(function (stream) {
            videoElement.srcObject = stream;
            videoElement.play();
            var videoFrameCallback = async () => {
                // videoElement.pause()
                await holistic.send({ image: videoElement });
                videoElement.requestVideoFrameCallback(videoFrameCallback);
                // videoElement.play()
            };

            videoElement.requestVideoFrameCallback(videoFrameCallback);
        })
        .catch(function (err0r) {
            alert(err0r);
        });
} else {
    // path of video file
    videoElement.src = localStorage.getItem("videoFile");
    videoElement.loop = true;
    videoElement.controls = true;

    document.querySelector("#model").style.transform = "scale(-1, 1)";

    videoElement.style.transform = "";
    guideCanvas.style.transform = "";

    var videoFrameCallback = async () => {
        // videoElement.pause()
        await holistic.send({ image: videoElement });
        videoElement.requestVideoFrameCallback(videoFrameCallback);
        // videoElement.play()
    };

    videoElement.requestVideoFrameCallback(videoFrameCallback);
}

var app = new Vue({
    el: "#vue0",
    data: {
        target: "face",
        languages: languages[globalSettings.ui.language],
    },
});

function changeTarget(target) {
    var zRe = 1;
    if(currentVrm){
        zRe = currentVrm.meta.metaVersion === "1" ? -1 : 1;
    }
    app.target = target;
    if (target == "face") {
        positionOffset = { x: 0.0, y: 1.0, z: 0.0 };
    } else if (target == "half") {
        positionOffset = {
            x: 0.0,
            y: 1.1,
            z: zRe * 1,
        };
    } else if (target == "full") {
        positionOffset = {
            x: 0.0,
            y: 1.4,
            z: zRe * 2,
        };
    }
}

window.changeTarget = changeTarget;

// keyborad control camera position
document.addEventListener("keydown", (event) => {
    var step = 0.1;
    switch (event.key) {
        case "d":
        case "ArrowRight":
            positionOffset.x -= step;
            break;
        case "a":
        case "ArrowLeft":
            positionOffset.x += step;
            break;
        case "w":
        case "ArrowUp":
            positionOffset.y += step;
            break;
        case "s":
        case "ArrowDown":
            positionOffset.y -= step;
            break;
        case "r":
            if (isRecordingStarted) {
                stopRecording();
                document.getElementById("recording").style.display = "none";
            } else {
                startRecording();
                document.getElementById("recording").style.display = "";
            }
            break;
        case "b":
            if (isBVHRecordingStarted) {
                stopBVHRecording();
            } else {
                startBVHRecording();
            }
            break;
        case "e":
            if (bvhSerializer.frames.length > 0) {
                exportBVH();
            }
            break;
    }
});

var contentDom = document.querySelector("#model");

//阻止相关事件默认行为
contentDom.ondragcenter =
    contentDom.ondragover =
    contentDom.ondragleave =
        () => {
            return false;
        };

//对拖动释放事件进行处理
contentDom.ondrop = (e) => {
    //console.log(e);
    var filePath = e.dataTransfer.files[0].path.replaceAll("\\", "/");
    console.log(filePath);
    contentDom.style.backgroundImage = `url(${filePath})`;
    contentDom.style.backgroundSize = "cover";
    contentDom.style.backgroundPosition = "center";
    contentDom.style.backgroundRepeat = "no-repeat";
};

var elementToRecord = contentDom;
var canvas2d = document.getElementById("background-canvas");
var context = canvas2d.getContext("2d");

canvas2d.width = elementToRecord.clientWidth;
canvas2d.height = elementToRecord.clientHeight;

var recorder = new RecordRTC(canvas2d, {
    type: "canvas",
});

function startRecording() {
    // this.disabled = true;

    isRecordingStarted = true;

    recorder.startRecording();
}

function stopRecording() {
    // this.disabled = true;

    recorder.stopRecording(function () {
        isRecordingStarted = false;

        var blob = recorder.getBlob();

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "video.webm";

        link.dispatchEvent(
            new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            })
        );

        setTimeout(() => {
            window.URL.revokeObjectURL(blob);
            link.remove();
        }, 100);
    });
}

function startBVHRecording() {
    isBVHRecordingStarted = true;
    bvhSerializer.clear();
    console.log("BVH recording started. Press 'B' to stop, 'E' to export.");

    // Update button visibility
    document.getElementById("bvh-record-btn").style.display = "none";
    document.getElementById("bvh-stop-btn").style.display = "inline-block";
    document.getElementById("bvh-export-btn").style.display = "none";

    // Create UI indicator
    const indicator = document.createElement("div");
    indicator.id = "bvh-recording-indicator";
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #d32f2f;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    indicator.textContent = "BVH Recording... (Press B to stop)";
    document.body.appendChild(indicator);
}

function stopBVHRecording() {
    isBVHRecordingStarted = false;
    console.log(`BVH recording stopped. Captured ${bvhSerializer.frames.length} frames. Press 'E' to export.`);

    // Update button visibility
    document.getElementById("bvh-record-btn").style.display = "inline-block";
    document.getElementById("bvh-stop-btn").style.display = "none";
    if (bvhSerializer.frames.length > 0) {
        document.getElementById("bvh-export-btn").style.display = "inline-block";
    }

    const indicator = document.getElementById("bvh-recording-indicator");
    if (indicator) {
        indicator.style.backgroundColor = "#388e3c";
        indicator.textContent = `BVH Ready: ${bvhSerializer.frames.length} frames (Press E to export)`;
    }
}

function exportBVH() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `mocap_${timestamp}.bvh`;
        bvhSerializer.exportToFile(filename);
        console.log(`BVH exported as ${filename}`);

        // Update button visibility
        document.getElementById("bvh-export-btn").style.display = "none";

        const indicator = document.getElementById("bvh-recording-indicator");
        if (indicator) {
            indicator.remove();
        }
        bvhSerializer.clear();
    } catch (error) {
        console.error("Failed to export BVH:", error);
        alert("Failed to export BVH: " + error.message);
    }
}

window.startBVHRecording = startBVHRecording;
window.stopBVHRecording = stopBVHRecording;
window.exportBVH = exportBVH;
