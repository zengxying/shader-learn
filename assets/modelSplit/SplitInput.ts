import { Camera, Component, EventTouch, geometry, Graphics, NodeEventType, PhysicsSystem, v2, v3, Vec2, Vec3, _decorator, Node, Color, view, find, Quat } from "cc";
import { SplitObject } from "./SplitObject";

const { ccclass, property } = _decorator;

@ccclass('SplitInput')
export class SplitInput extends Component {
    @property(Graphics)
    graphics: Graphics; // 绘图组件
    @property(Node)
    model: Node; // 绘图组件
    // @property(Node)
    // planeNode: Node = null;
    from: Vec3; // 射线起点
    to: Vec3; // 射线终点
    cam: Camera; // 相机
    uiFrom: Vec2;

    start() {
        // 获取相机组件
        if (!this.cam)
            this.cam = find("Main Camera").getComponent(Camera);

        // 初始化绘图组件
        if (this.graphics) {
            this.graphics.strokeColor = Color.RED; // 设置绘图颜色
            this.graphics.lineWidth = 5; // 设置绘图线宽
            let size = view.getVisibleSize();
            this.graphics.node.setPosition(-size.width / 2, -size.height / 2);
        }
        // 监听触摸开始事件
        this.node.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
            this.autoRandomSplit();
            let pos = event.getLocation();
            this.from = v3(pos.x, pos.y, 0);
            this.uiFrom = event.getUILocation();
        }, this);
        // 监听触摸移动事件
        this.node.on(NodeEventType.TOUCH_MOVE, (event: EventTouch) => {
            let pos = event.getLocation();
            this.to = v3(pos.x, pos.y, 0);
            this.OnPostRender(event.getUILocation()); // 绘制射线
        }, this);
        // 监听触摸结束事件
        this.node.on(NodeEventType.TOUCH_END, (event: EventTouch) => {
            this.onTouchEnd(event);
        }, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, (event: EventTouch) => {
            this.onTouchEnd(event);
        }, this);

        this.splitModels = [this.model]
    }
    //监听触摸结束事件
    onTouchEnd(event: EventTouch) {
        // this.graphics.clear(); // 清除绘图
        let pos = event.getLocation();
        this.to = v3(pos.x, pos.y, 0);
        this.SetSplitObject(this.from, this.to); // 设置分割对象
    }
    // 绘制射线
    OnPostRender(to) {
        this.graphics.clear();
        this.graphics.moveTo(this.uiFrom.x, this.uiFrom.y);
        this.graphics.lineTo(to.x, to.y);
        this.graphics.stroke();
    }

    // 设置分割对象
    SetSplitObject(from: Vec3, to: Vec3) {
        let splits: SplitObject[] = [];
        let planes: geometry.Plane[] = [];
        let line = Vec3.subtract(new Vec3(), this.cam.screenToWorld(this.to), this.cam.screenToWorld(this.from));
        let rayCount = 20;
        for (let i = 0; i <= rayCount; i++) {
            let pos = Vec3.lerp(new Vec3(), from, to, i / rayCount)
            // 进行射线检测
            let ray = this.cam.screenPointToRay(pos.x, pos.y);
            if (PhysicsSystem.instance.raycast(ray)) {
                const raycastResults = PhysicsSystem.instance.raycastResults;
                for (let i = 0; i < raycastResults.length; i++) {
                    const hit = raycastResults[i];
                    let split: SplitObject = hit.collider.node.getComponent(SplitObject);
                    if (split) {
                        if (splits.indexOf(split) == -1) {
                            splits.push(split);
                            //在平面内，两个向量的叉乘会得到一个垂直于该平面的向量。
                            let dir = Vec3.cross(new Vec3(), line, ray.d).normalize();
                            let plane = geometry.Plane.fromNormalAndPoint(new geometry.Plane(), dir, hit.hitPoint);
                            planes.push(plane);
                        }
                    }
                }
            }
        }
        for (let i = 0; i < splits.length; i++) {
            splits[i].Split(planes[i].n, planes[i].d);
        }
    }

    // private originModelPos;
    splitModels: Node[] = [];
    // 设置分割对象
    autoRandomSplit() {
        for (let index = this.splitModels.length - 1; index >= 0; index--) {
            const model = this.splitModels[index];

            let split: SplitObject = model.getComponent(SplitObject);
            if (split) {
                //在平面内，两个向量的叉乘会得到一个垂直于该平面的向量。
                let dir = new Vec3(1, 0, 0); // 切断面的朝向
                var wpos = model.getWorldPosition();
                // Vec3.random(dir);
                Vec3.rotateY(dir, dir, Vec3.UP, Math.random() * 360 / 180 * Math.PI);
                let plane = geometry.Plane.fromNormalAndPoint(new geometry.Plane(), dir, wpos); // 切割的朝向， 切割的点
                var newNode = split.Split(plane.n, plane.d);
                if (newNode.length > 0) {
                    this.splitModels.push(...newNode);
                    this.splitModels.splice(index, 1);
                }
            }
        }
    }
}
