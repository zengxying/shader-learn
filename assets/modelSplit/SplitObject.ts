import { _decorator, Component, Vec3, Vec4, Vec2, v3, Rect, math, geometry, v2, MeshRenderer, instantiate, Mat4, v4, tween, MeshCollider, Node } from 'cc';
import { MeshInfo } from './MeshInfo';
const { ccclass } = _decorator;

@ccclass('SplitObject')
export class SplitObject extends Component {
    MeshInfo: MeshInfo; // 网格信息

    start() {
        // 如果网格信息为空，则创建网格信息对象
        if (this.MeshInfo == null) {
            this.MeshInfo = new MeshInfo(this.getComponent(MeshRenderer).mesh);
            // this.UpdateMesh([this.MeshInfo]);
        }
    }

    // 更新网格信息
    public UpdateMesh(info: MeshInfo[]) {
        for (let i = 1; i < info.length; i++) {
            let offset = info[0].positions.length;
            info[0].positions.push(...info[1].positions);
            info[0].uvs.push(...info[1].uvs);
            info[0].normals.push(...info[1].normals);
            info[0].tangents.push(...info[1].tangents);
            for (let j = 0; j < info[1].indices.length; j++) {
                const element = info[1].indices[j];
                info[0].indices.push(offset + element);
            }
        }
        // 创建网格
        let mesh = info[0].createMesh();
        // 设置新的网格
        this.getComponent(MeshRenderer).mesh = mesh;
        // 更新网格信息对象
        this.MeshInfo = new MeshInfo(mesh);
        this.MeshInfo.center = info[0].center;
        this.MeshInfo.size = info[0].size;
    }

    // 分割网格
    public Split(planen: Vec3, planed: number) {
        // 计算平面在本地坐标系中的点和法线
        let point = Vec3.transformMat4(new Vec3(), Vec3.multiplyScalar(v3(), planen, planed), Mat4.invert(new Mat4(), this.node.worldMatrix));
        let normal = Vec3.transformMat4(new Vec3(), planen, Mat4.invert(new Mat4(), this.node.getWorldRS()));
        normal.normalize();

        // 初始化两个 MeshInfo 对象
        let a = new MeshInfo();
        let b = new MeshInfo();
        //
        let above: boolean[] = [];
        let newindices: number[] = [];
        let length = this.MeshInfo.positions.length;
        // 根据顶点位置判断顶点在平面的上方还是下方，并根据判断结果将顶点添加到对应的 MeshInfo 对象中
        for (let i = 0; i < length; i++) {
            let vert = this.MeshInfo.positions[i];
            above[i] = Vec3.subtract(v3(), vert, point).dot(normal) >= 0;
            if (above[i]) {
                newindices[i] = a.positions.length;
                a.Add(vert, this.MeshInfo.uvs[i], this.MeshInfo.normals[i], this.MeshInfo.tangents[i]);
            }
            else {
                newindices[i] = b.positions.length;
                b.Add(vert, this.MeshInfo.uvs[i], this.MeshInfo.normals[i], this.MeshInfo.tangents[i]);
            }
        }

        let cutPoint: Vec3[] = [];
        let triangleCount = this.MeshInfo.indices.length / 3;
        // 根据三角形的顶点位置关系将三角形添加到对应的 MeshInfo 对象中，或者对三角形进行切割
        for (let i = 0; i < triangleCount; i++) {
            let _i0 = this.MeshInfo.indices[i * 3];
            let _i1 = this.MeshInfo.indices[i * 3 + 1];
            let _i2 = this.MeshInfo.indices[i * 3 + 2];

            let _a0 = above[_i0];
            let _a1 = above[_i1];
            let _a2 = above[_i2];
            if (_a0 && _a1 && _a2) {
                a.indices.push(newindices[_i0]);
                a.indices.push(newindices[_i1]);
                a.indices.push(newindices[_i2]);
            }
            else if (!_a0 && !_a1 && !_a2) {
                b.indices.push(newindices[_i0]);
                b.indices.push(newindices[_i1]);
                b.indices.push(newindices[_i2]);
            }
            else {
                let up, down0, down1;
                if (_a1 == _a2 && _a0 != _a1) {
                    up = _i0;
                    down0 = _i1;
                    down1 = _i2;
                }
                else if (_a2 == _a0 && _a1 != _a2) {
                    up = _i1;
                    down0 = _i2;
                    down1 = _i0;
                }
                else {
                    up = _i2;
                    down0 = _i0;
                    down1 = _i1;
                }
                let pos0, pos1;
                if (above[up]) {
                    let ret = this.SplitTriangle(a, b, point, normal, newindices, up, down0, down1);
                    pos0 = ret[0];
                    pos1 = ret[1];
                }
                else {
                    let ret = this.SplitTriangle(b, a, point, normal, newindices, up, down0, down1);
                    pos0 = ret[1];
                    pos1 = ret[0];
                }
                cutPoint.push(pos0);
                cutPoint.push(pos1);
            }
        }

        // 合并顶点并更新 MeshInfo 对象的中心点和大小
        a.Combinepositions(0.001);
        a.center = this.MeshInfo.center;
        a.size = this.MeshInfo.size;
        b.Combinepositions(0.001);
        b.center = this.MeshInfo.center;
        b.size = this.MeshInfo.size;

        var newNodes: Node[] = [];
        // 如果需要填充分割后的多边形，则进行填充操作
        if (cutPoint.length > 2) {
            let cut = this.FastFillCutEdges(cutPoint, point, normal);
            let newNode = instantiate(this.node);
            newNode.parent = this.node.parent;
            newNode.position = this.node.position;
            newNode.getComponent(SplitObject).UpdateMesh([b, cut]);
            newNode.getComponent(MeshCollider).mesh = newNode.getComponent(MeshRenderer).mesh;
            let newPos = newNode.worldPosition.clone().add(planen.clone().normalize().multiplyScalar(-0.1));
            tween(newNode).to(1, { worldPosition: newPos }).start();
            newNodes.push(newNode);
            cut.Reverse();
            newNode = instantiate(this.node);
            newNode.parent = this.node.parent;
            newNode.position = this.node.position;
            newNode.getComponent(SplitObject).UpdateMesh([a, cut]);
            newNode.getComponent(MeshCollider).mesh = newNode.getComponent(MeshRenderer).mesh;
            newPos = newNode.worldPosition.clone().add(planen.clone().normalize().multiplyScalar(0.1));
            tween(newNode).to(1, { worldPosition: newPos }).start();
            newNodes.push(newNode);
            this.node.destroy();
        }

        return newNodes;
        // else {
        //     instantiate(this.node).getComponent(SplitObject).UpdateMesh([a]);
        //     instantiate(this.node).getComponent(SplitObject).UpdateMesh([b]);
        // }
    }

    // 分割三角形
    SplitTriangle(top: MeshInfo, bottom: MeshInfo, point: Vec3, normal: Vec3, newindices: number[], up: number, down0: number, down1: number) {
        // 获取三角形的顶点和 UV 坐标
        let v0 = this.MeshInfo.positions[up];
        let v1 = this.MeshInfo.positions[down0];
        let v2 = this.MeshInfo.positions[down1];
        // 计算分割点在分割平面上的投影，并根据比例得到顶点位置
        let topDot_a: number = Vec3.subtract(v3(), v1, v0).dot(normal);
        let topDot_b: number = Vec3.subtract(v3(), v2, v0).dot(normal);
        let aScale: number = math.clamp01(Vec3.subtract(v3(), point, v0).dot(normal) / topDot_a);
        let bScale: number = math.clamp01(Vec3.subtract(v3(), point, v0).dot(normal) / topDot_b);
        let pos_a = Vec3.subtract(v3(), v1, v0).multiplyScalar(aScale).add(v0);
        let pos_b = Vec3.subtract(v3(), v2, v0).multiplyScalar(bScale).add(v0);

        // 获取三角形的 UV 坐标并根据比例得到分割点的 UV 坐标
        let u0 = this.MeshInfo.uvs[up];
        let u1 = this.MeshInfo.uvs[down0];
        let u2 = this.MeshInfo.uvs[down1];
        let uv_a = Vec2.subtract(new Vec2(), u1, u0).multiplyScalar(aScale).add(u0);
        let uv_b = Vec2.subtract(new Vec2(), u2, u0).multiplyScalar(bScale).add(u0);

        // 获取三角形的法线并根据比例得到分割点的法线
        let n0 = this.MeshInfo.normals[up];
        let n1 = this.MeshInfo.normals[down0];
        let n2 = this.MeshInfo.normals[down1];
        let normal_a = Vec3.subtract(v3(), n1, n0).multiplyScalar(aScale).add(n0).normalize();
        let normal_b = Vec3.subtract(v3(), n2, n0).multiplyScalar(bScale).add(n0).normalize();

        // 获取三角形的切线并根据比例得到分割点的切线
        let t0 = this.MeshInfo.tangents[up];
        let t1 = this.MeshInfo.tangents[down0];
        let t2 = this.MeshInfo.tangents[down1];
        let tangent_a = (Vec4.subtract(v4(), t1, t0).multiplyScalar(aScale).add(t0)).normalize();
        let tangent_b = (Vec4.subtract(v4(), t2, t0).multiplyScalar(bScale).add(t0)).normalize();
        tangent_a.w = t1.w;
        tangent_b.w = t2.w;

        // 添加分割后的顶点和三角形到对应的 MeshInfo 对象中
        let top_a = top.positions.length;
        top.Add(pos_a, uv_a, normal_a, tangent_a);
        let top_b = top.positions.length;
        top.Add(pos_b, uv_b, normal_b, tangent_b);
        top.indices.push(newindices[up]);
        top.indices.push(top_a);
        top.indices.push(top_b);

        let down_a = bottom.positions.length;
        bottom.Add(pos_a, uv_a, normal_a, tangent_a);
        let down_b = bottom.positions.length;
        bottom.Add(pos_b, uv_b, normal_b, tangent_b);

        bottom.indices.push(newindices[down0]);
        bottom.indices.push(newindices[down1]);
        bottom.indices.push(down_b);

        bottom.indices.push(newindices[down0]);
        bottom.indices.push(down_b);
        bottom.indices.push(down_a);

        // 返回分割点的位置
        return [pos_a, pos_b];
    }

    // 快速填充切割边缘
    FastFillCutEdges(edges: Vec3[], pos: Vec3, normal: Vec3) {
        // 如果边缘数量少于3个，无法构成多边形，输出错误信息并返回
        if (edges.length < 3) {
            console.log("edges point less than 3!");
            return;
        }

        // 对边缘集合进行排序和处理，确保连接顺序正确
        for (let i = 0; i < edges.length - 3; i++) {
            let t = edges[i + 1];
            let temp = edges[i + 3];
            for (let j = i + 2; j < edges.length - 1; j += 2) {
                if ((Vec3.subtract(v3(), edges[j], t)).lengthSqr() < (1e-6)) {
                    edges[j] = edges[i + 2];
                    edges[i + 3] = edges[j + 1];
                    edges[j + 1] = temp;
                    break;
                }
                if ((Vec3.subtract(v3(), edges[j + 1], t)).lengthSqr() < (1e-6)) {
                    edges[j + 1] = edges[i + 2];
                    edges[i + 3] = edges[j];
                    edges[j] = temp;
                    break;
                }
            }
            edges.splice(i + 2, 1);
        }
        edges.splice(edges.length - 1, 1);

        // 计算切线
        let tangent = MeshInfo.CalculateTangent(normal);

        // 创建一个新的 MeshInfo 对象来存储填充后的网格数据
        let cutEdges = new MeshInfo();
        // 将边缘集合中的顶点添加到新的 MeshInfo 对象中
        for (let i = 0; i < edges.length; i++)
            cutEdges.Add(edges[i], v2(), normal, tangent);
        // 根据边缘集合中的顶点生成三角形索引
        let count = edges.length - 1;
        for (let i = 1; i < count; i++) {
            cutEdges.indices.push(0);
            cutEdges.indices.push(i);
            cutEdges.indices.push(i + 1);
        }

        // 更新新的网格对象的中心点和大小，并进行 UV 坐标的映射
        cutEdges.center = this.MeshInfo.center;
        cutEdges.size = this.MeshInfo.size;
        cutEdges.MapperCube(new Rect(0, 0, 1, 1));
        return cutEdges;
    }
}
