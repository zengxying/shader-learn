import { Vec3, geometry, PhysicsSystem, Camera, Node } from "cc";

export class Tool {
    static tmpV3: Vec3 = new Vec3();
    static ray: geometry.Ray = new geometry.Ray();

    static curHitNode: Node;
    static curHitPoint: Vec3;
    /**
     * @description 获取射线检测的目标,可以通过访问Tool.curHitPoint 获取到当前点击到的模型上的点
     * @param x 屏幕坐标x
     * @param y 屏幕坐标y
     * @returns hitNode
     */
    static getRayHit(camera: Camera, x: number, y: number, mask: number = 0xffffffff) {
        camera?.screenPointToRay(x, y, this.ray);
        this.curHitNode = null;
        this.curHitPoint = null;

        if (PhysicsSystem.instance.raycastClosest(this.ray, mask, 1000)) {
            const raycastClosestResult = PhysicsSystem.instance.raycastClosestResult;
            this.curHitPoint = raycastClosestResult.hitPoint;
            const hitNormal = raycastClosestResult.hitNormal;
            this.curHitNode = raycastClosestResult.collider.node;
            const distance = raycastClosestResult.distance;
            // log('ray hit :', this.curHitNode, distance);
        }

        return this.curHitNode;
    }
}