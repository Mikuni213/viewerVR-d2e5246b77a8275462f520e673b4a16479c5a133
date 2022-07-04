import * as THREE from 'three';

export default class TargetCircle extends THREE.Mesh {
    constructor(name, pos, cameraPos) {
        super();

        // color info
        const colors = {"normal": new THREE.Color(0, 1, 0), "active": new THREE.Color(1, 0, 0)};

        // center sphere
        const centerGeo = new THREE.SphereGeometry(0.01, 10, 10);
        const centerMat = new THREE.MeshBasicMaterial({color: colors.normal});
        const centerMesh = new THREE.Mesh(centerGeo, centerMat);
        this.add(centerMesh);

        // peripheral spheres
        for (let i = 0; i < 12; i++) {
            const geo = new THREE.SphereGeometry(0.01, 10, 10);
            const mat = new THREE.MeshBasicMaterial({color: colors.normal});
            const star = new THREE.Mesh(geo, mat);
            const r = 0.06;
            const x = r * Math.sin(i * Math.PI / 6.0);
            const z = r * Math.cos(i * Math.PI / 6.0);
            star.position.set(x, 0, z);
            this.add(star);
        }

        // set position & name
        this.name = name;
        this.worldPos = pos;
        const localPos = pos.clone()
            .sub(cameraPos)
            .normalize()
            .add(cameraPos);
        this.localPos = localPos;
        this.position.set(localPos.x, localPos.y, localPos.z);
        this.viewing = false;
        this.visible = true;
    }

    animate() {
        this.rotateX(0.035);
        this.rotateY(0.06);
        this.rotateZ(0.035);
    }

    targeting(camera) {
        const projected = new THREE.Vector3();
        projected.copy(this.worldPos);
        projected.project(camera);
        const xThresh = 0.16;
        const yThresh = 0.16;

        // whether this target is on the center of viewer's sight or not
        const onSight = (
            -xThresh < projected.x && projected.x < xThresh
            && -yThresh < projected.y && projected.y < yThresh
            && projected.z < 1.00
        ) ? true : false;
        
        if (!this.viewing && onSight) {
            if (-xThresh < projected.x && projected.x < xThresh
            && -yThresh < projected.y && projected.y < yThresh
            && projected.z < 1.00) {
                this.children.forEach(mesh => {
                    mesh.material.color.set(new THREE.Color(1, 0, 0));
                });
                this.viewing = true;
            }
        } else if (this.viewing && !onSight) {
            this.children.forEach(mesh => {
                mesh.material.color.set(new THREE.Color(0, 1, 0));
            });
            this.viewing = false;
        }
    }

    toggleVisible(viewing) {
        const visible = viewing === this.name ? false : true;
        if (visible) this.visible = true;
        else this.visible = false;
    }

    changeLocalPos(cameraPos) {
        const localPos = this.worldPos.clone()
            .sub(cameraPos)
            .normalize()
            .add(cameraPos);
        this.position.set(localPos.x, localPos.y, localPos.z);
        this.localPos = localPos;
    }

    isViewing() {
        console.log(this.viewing);
        return this.viewing;
    }
};