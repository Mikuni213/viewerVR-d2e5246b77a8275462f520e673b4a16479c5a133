import React, {useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import anime from 'animejs';

import styles from '../styles/viewRenderer.module.scss';

// import 3D components
import TargetCircle from './targetCircle.jsx';
import TargetSphere from './targetSphere.jsx';
import { Vector2 } from 'three';

// web VR
import WEBVR from '../lib/webVR';

/*--------------------------------
  Viewer Area
--------------------------------*/

const GL = {
    renderer: new THREE.WebGLRenderer({antialias: true}),
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(80, window.innerHeight / window.innerWidth, 0.01, 500),
    targets: new THREE.Group(),
    spheres: new THREE.Group(),
    human: new THREE.Object3D(),
    targetPos: {},
    phi: 0,
    theta: 0,
    prevAngle: 0,
};

const INVERT = false;

const ViewRenderer = (props) => {
    const [pointerLock, setPointerLock] = useState(false);

    useEffect(() => {
        setupThree();
        setupMouseEvent();
        document.addEventListener('click', handleJump);
    }, []);

    // node addition action
    useEffect(() => {
        if (props.newNode !== "") {
            const pos = new THREE.Vector3(
                (2 * Math.random() - 1) * 3.0,
                (2 * Math.random() - 1) * 3.0,
                (2 * Math.random() - 1) * 3.0,
            );

            const newSphere = new TargetSphere(props.newNode, pos, INVERT);
            GL.spheres.add(newSphere);

            const newTarget = new TargetCircle(props.newNode, pos, GL.camera.position);
            GL.targets.add(newTarget);
            GL.targetPos[props.newNode] = pos;
        }
    }, [props.newNode]);

    // viewing node change action
    useEffect(() => {
        if (props.viewing !== "") jump(props.viewing, true);
    }, [props.viewing]);

    const jump = (targetName, heading) => {
        const posTo = GL.targetPos[targetName];

        GL.spheres.children.forEach(sphere => {
            sphere.toggleViewing(targetName);
        });

        GL.targets.children.forEach(circle => {
            circle.toggleVisible(targetName);
            circle.changeLocalPos(posTo);
        });

        // const cameraDirection = new THREE.Vector3()
        //     .subVectors(GL.camera.getWorldDirection(new THREE.Vector3()), GL.camera.position)
        //     .normalize();
        // const targetDirection = new THREE.Vector3()
        //     .subVectors(posTo, GL.camera.position)
        //     .normalize();
        // const phi = Math.acos(
        //     new Vector2(cameraDirection.x, cameraDirection.z)
        //         .dot(new Vector2(targetDirection.x, targetDirection.z))
        // );
        // const theta = Math.acos(
        //     new Vector2(cameraDirection.x, cameraDirection.y)
        //         .dot(new Vector2(targetDirection.x, targetDirection.y))
        // );

        if (heading) GL.camera.lookAt(posTo.x, posTo.y, posTo.z);
        // const currentTheta = GL.camera.rotation.x;
        // const currentPhi =  GL.camera.rotation.y;
        // GL.camera.rotateX(theta);
        // GL.camera.rotateY(phi);
        // anime({
        //     targets: GL.camera.rotation,
        //     x: currentTheta + theta,
        //     y: currentPhi + phi,
        //     duration: 600,
        //     easing: "easeInOutCubic"
        // });
        anime({
            targets: GL.human.position,
            x: posTo.x,
            y: posTo.y,
            z: posTo.z,
            duration: 600,
            // delay: 1000,
            easing: "easeInOutCubic",
        });

        props.handleJump(targetName);
    };

    const handleJump = () => {
        console.log('jump trigger');
        GL.targets.children.forEach(target => {
            if (target.viewing) {
                jump(target.name, false);
            }
        });
    };

    const setupMouseEvent = () => {
        document.addEventListener('mousemove', (e) => {
            const phi = -e.movementX * 0.003;
            const theta = -e.movementY * 0.003;
            GL.phi += phi;
            GL.theta += theta;
            if (GL.theta < -Math.PI / 2) GL.theta = -Math.PI / 2;
            else if (GL.theta > Math.PI / 2) GL.theta = Math.PI / 2;
            if (GL.phi > 2 * Math.PI) GL.phi = GL.phi - 2 * Math.PI;
            else if (GL.phi < 0) GL.phi = GL.phi + 2 * Math.PI;

            GL.camera.rotation.y = GL.phi;
            GL.camera.rotation.x = GL.theta;

            // send rotate info to websocket
            const angle = Math.floor(180 * GL.camera.rotation.y / Math.PI);
            // save the amount of data by omitting angles less than 10 degree
            if (Math.abs(angle - GL.prevAngle) > 10) {
                props.socket.emit('rotate', JSON.stringify({'angle': angle}));
                GL.prevAngle = angle;
            }
        });
    };

    const handlePointerLock = (e) => {
        if (e.key === 'p') {
            if(pointerLock) document.exitPointerLock();
            else document.body.requestPointerLock();
            setPointerLock(!pointerLock);
        }
    };

    const setupThree = () => {
        console.log('setup three');
        // make scene objects
        const container = document.getElementById('viewer');
        const light = new THREE.DirectionalLight(0xffffff);

        // scene setting
        light.position.set(1, 1, 1).normalize();
        GL.camera.rotation.order = "YXZ";
        GL.scene.add(light);
        GL.scene.add(GL.spheres);
        GL.scene.add(GL.targets);
        GL.human.add(GL.camera);
        GL.scene.add(GL.human);
        GL.renderer.setPixelRatio(container.clientWidth / container.clientHeight);
        GL.renderer.setSize(container.clientWidth, container.clientHeight);
        GL.renderer.xr.enabled = true;

        // add renderer
        container.appendChild(GL.renderer.domElement);

        // add VR launcher
        if (navigator.getVRDisplays !== undefined) {
            container.appendChild(WEBVR.createButton(GL.renderer));
        }
    
        window.addEventListener('resize', handleWindowResize, false);
        handleWindowResize(); // initialize
    
        // render loop
        GL.renderer.setAnimationLoop(glRender);
    };

    const handleWindowResize = () => {
        const container = document.getElementById('viewer');

        GL.camera.aspect = container.clientWidth / container.clientHeight;
        GL.camera.updateProjectionMatrix();
        GL.renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const glRender = () => {
        GL.camera.position.set(-GL.camera.position.x, -GL.camera.position.y, -GL.camera.position.z);
        // sendAngle();

        GL.targets.children.forEach(target => {
            target.animate();
            target.targeting(GL.camera);
        });

        // checkHmdMove();
        // const delta = this.state.clock.getDelta() * 60;
        GL.renderer.render(GL.scene, GL.camera);
    };

    return (
        <div className={`${styles.view}`} id="viewer" onKeyDown={handlePointerLock} tabIndex="0">
        </div>
    );
};

export default ViewRenderer;