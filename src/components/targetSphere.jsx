import * as THREE from 'three';
import anime from 'animejs';

// import shaders
import vertexSource from '../shader/fish2rect.vert';
import fragmentSource from '../shader/fish2rect.frag';
import { DoubleSide } from 'three';

export default class TargetSphere extends THREE.Mesh {
    constructor(name, pos, invert) {
        // create sphere
        const geom = new THREE.SphereGeometry(1.5, 30, 30);
        geom.scale(-1, 1, 1); // inside out
        const mat = new THREE.MeshBasicMaterial({color: 0xffffff, depthWrite: false});
        super(geom, mat);
        if (invert) this.rotation.x = Math.PI;

        // set property
        this.name = name;
        this.position.set(pos.x, pos.y, pos.z);
        this.isViewing = false;
        this.isPrepared = false;

        // set video texture
        const video = document.getElementById(`videoTexture-${name}`);
        video.onloadedmetadata = () => {
            const texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBFormat;

            const uniforms = {
                uTex: {type: "t", value: texture},
                _FOV: {type: "f", value: 200},
                _CenterShiftX: {type: "f", value: 0},
                _CenterShiftY: {type: "f", value: 0},
                _TextureSizeW: {type: "f", value: 3008},
                _TextureSizeH: {type: "f", value: 1504},
                _RotA: {type: "f", value: 0},
                _RotB: {type: "f", value: 0},
                _FisheyeDiameterOnTextureInPixel: {type: "f", value: 1504},
                _SigmoidCoef: {type: "f", value: 30},
                _opacity: {type: "f", value: 0.0}
            };

            const material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexSource,
                fragmentShader: fragmentSource,
                transparent: true,
                depthWrite: false
            });

            this.material = material;
            this.isPrepared = true;
        }
    }

    toggleViewing(viewing) {
        if (!this.isPrepared) return;

        this.isViewing = viewing === this.name ? true : false;
        if (this.isViewing) {
            anime({
                targets: this.material.uniforms._opacity,
                value: 1.0,
                duration: 600,
                delay: 400,
            });
        } else {
            anime({
                targets: this.material.uniforms._opacity,
                value: 0.0,
                duration: 600,
                delay: 400,
            });
        }
    }
};