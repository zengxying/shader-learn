import { _decorator, Vec3, Vec4, Vec2, v3, Mesh, Rect, gfx, v2, v4, primitives, utils } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MeshInfo')
export class MeshInfo {
    positions: Vec3[] = []; // 存储顶点数组
    indices: number[] = []; // 存储三角形索引数组
    uvs: Vec2[] = []; // 存储 UV 数组
    normals: Vec3[] = []; // 存储法线数组
    tangents: Vec4[] = []; // 存储切线数组
    size: Vec3 = v3(); // 网格尺寸
    center: Vec3 = v3(); // 网格中心点

    constructor(mesh?: Mesh) {
        if (mesh) {
            // 读取顶点位置属性
            let positions = mesh.readAttribute(0, gfx.AttributeName.ATTR_POSITION);
            for (let i = 0; i < positions.length; i = i + 3) {
                this.positions.push(v3(positions[i], positions[i + 1], positions[i + 2]));
            }
            // 读取法线属性
            let normals = mesh.readAttribute(0, gfx.AttributeName.ATTR_NORMAL);
            for (let i = 0; i < normals.length; i = i + 3) {
                this.normals.push(v3(normals[i], normals[i + 1], normals[i + 2]));
            }
            // 读取 UV 属性
            let uvs = mesh.readAttribute(0, gfx.AttributeName.ATTR_TEX_COORD);
            for (let i = 0; i < uvs.length; i = i + 2) {
                this.uvs.push(v2(uvs[i], uvs[i + 1]));
            }
            // 读取切线属性
            let tangents = mesh.readAttribute(0, gfx.AttributeName.ATTR_TANGENT);
            for (let i = 0; i < tangents.length; i = i + 4) {
                this.tangents.push(v4(tangents[i], tangents[i + 1], tangents[i + 2], tangents[i + 3]));
            }
            // 读取三角形索引属性
            let indices = mesh.readIndices(0);
            for (let j = 0; j < indices.length; j++) {
                this.indices[j] = indices[j];
            }
            // 计算网格中心点和尺寸
            this.center = Vec3.add(new Vec3(), mesh.struct.minPosition, mesh.struct.maxPosition).multiplyScalar(1 / 2);
            this.size = Vec3.subtract(new Vec3(), mesh.struct.maxPosition, mesh.struct.minPosition);
        }
    }

    // 创建新的网格
    public createMesh() {
        let positions: number[] = [];
        for (let i = 0; i < this.positions.length; i++) {
            positions.push(this.positions[i].x);
            positions.push(this.positions[i].y);
            positions.push(this.positions[i].z);
        }
        let normals: number[] = [];
        for (let i = 0; i < this.normals.length; i++) {
            normals.push(this.normals[i].x);
            normals.push(this.normals[i].y);
            normals.push(this.normals[i].z);
        }
        let uvs: number[] = [];
        for (let i = 0; i < this.uvs.length; i++) {
            uvs.push(this.uvs[i].x);
            uvs.push(this.uvs[i].y);
        }
        let tangents: number[] = [];
        for (let i = 0; i < this.tangents.length; i++) {
            tangents.push(this.tangents[i].x);
            tangents.push(this.tangents[i].y);
            tangents.push(this.tangents[i].z);
            tangents.push(this.tangents[i].w);
        }
        let indices: number[] = [];
        for (let i = 0; i < this.indices.length; i++) {
            indices.push(this.indices[i]);
        }
        let geometry: primitives.IGeometry = {
            positions: positions,
            normals: normals,
            uvs: uvs,
            tangents: tangents,
            indices: indices,
            doubleSided: true,
            primitiveMode: gfx.PrimitiveMode.TRIANGLE_LIST,
        }
        // 创建网格
        return utils.MeshUtils.createMesh(geometry, null, { calculateBounds: true });
    }

    // 添加顶点信息
    public Add(vert: Vec3, uv: Vec2, normal: Vec3, tangent: Vec4) {
        this.positions.push(vert);
        this.normals.push(normal);
        this.uvs.push(uv);
        this.tangents.push(tangent);
    }

    // 对立方体进行映射
    public MapperCube(range: Rect) {
        // 如果 UV 坐标数组长度小于顶点数组长度，则将 UV 坐标数组清空
        // if (this.uvs.length < this.positions.length)
        this.uvs = [];

        // 计算三角形数量
        let count = this.indices.length / 3;

        // 遍历每个三角形
        for (let i = 0; i < count; i++) {
            // 获取当前三角形的顶点索引
            let _i0 = this.indices[i * 3];
            let _i1 = this.indices[i * 3 + 1];
            let _i2 = this.indices[i * 3 + 2];

            // 计算顶点相对于中心点的偏移，并将顶点转换为相对于大小的比例
            let v0 = Vec3.multiplyScalar(v3(), this.size, 0.5).add(this.positions[_i0]).subtract(this.center);
            let v1 = Vec3.multiplyScalar(v3(), this.size, 0.5).add(this.positions[_i1]).subtract(this.center);
            let v2 = Vec3.multiplyScalar(v3(), this.size, 0.5).add(this.positions[_i2]).subtract(this.center);
            v0 = new Vec3(v0.x / this.size.x, v0.y / this.size.y, v0.z / this.size.z);
            v1 = new Vec3(v1.x / this.size.x, v1.y / this.size.y, v1.z / this.size.z);
            v2 = new Vec3(v2.x / this.size.x, v2.y / this.size.y, v2.z / this.size.z);

            // 计算三角形的法线方向
            let a = Vec3.subtract(v3(), v0, v1);
            let b = Vec3.subtract(v3(), v2, v1);
            let dir = Vec3.cross(v3(), a, b);

            // 根据法线方向确定 UV 映射方式
            let x = Math.abs(Vec3.dot(dir, Vec3.RIGHT));
            let y = Math.abs(Vec3.dot(dir, Vec3.UP));
            let z = Math.abs(Vec3.dot(dir, Vec3.FORWARD));
            if (x >= y && x >= z) {
                this.uvs[_i0] = new Vec2(v0.z, v0.y);
                this.uvs[_i1] = new Vec2(v1.z, v1.y);
                this.uvs[_i2] = new Vec2(v2.z, v2.y);
            }
            else if (y >= x && y >= z) {
                this.uvs[_i0] = new Vec2(v0.x, v0.z);
                this.uvs[_i1] = new Vec2(v1.x, v1.z);
                this.uvs[_i2] = new Vec2(v2.x, v2.z);
            }
            else if (z >= x && z >= y) {
                this.uvs[_i0] = new Vec2(v0.x, v0.y);
                this.uvs[_i1] = new Vec2(v1.x, v1.y);
                this.uvs[_i2] = new Vec2(v2.x, v2.y);
            }

            // 将 UV 坐标映射到指定范围
            this.uvs[_i0] = new Vec2(range.xMin + (range.xMax - range.xMin) * this.uvs[_i0].x, range.yMin + (range.yMax - range.yMin) * this.uvs[_i0].y);
            this.uvs[_i1] = new Vec2(range.xMin + (range.xMax - range.xMin) * this.uvs[_i1].x, range.yMin + (range.yMax - range.yMin) * this.uvs[_i1].y);
            this.uvs[_i2] = new Vec2(range.xMin + (range.xMax - range.xMin) * this.uvs[_i2].x, range.yMin + (range.yMax - range.yMin) * this.uvs[_i2].y);
        }
    }


    // 合并相邻顶点
    public Combinepositions(range: number) {
        // 将范围平方化，以便后续比较使用
        range *= range;

        // 遍历顶点数组
        for (let i = 0; i < this.positions.length; i++) {
            // 从当前顶点后面的顶点开始遍历
            for (let j = i + 1; j < this.positions.length; j++) {
                // 计算顶点之间的距离的平方，并判断是否小于指定范围
                let dis = Vec3.subtract(v3(), this.positions[i], this.positions[j]).lengthSqr() < range;
                // 计算 UV 坐标之间的距离的平方，并判断是否小于指定范围
                let uv = Vec2.subtract(v2(), this.uvs[i], this.uvs[j]).lengthSqr() < range;
                // 计算顶点法线方向之间的点积，并判断是否接近于 1
                let dir = Vec3.dot(this.normals[i], this.normals[j]) > 0.999;

                // 如果距离、UV 坐标距离和法线方向都满足条件
                if (dis && uv && dir) {
                    // 更新三角形数组中顶点索引，将第二个顶点索引替换为第一个顶点索引
                    for (let k = 0; k < this.indices.length; k++) {
                        if (this.indices[k] == j)
                            this.indices[k] = i;
                        if (this.indices[k] > j)
                            this.indices[k]--;
                    }
                    // 删除第二个顶点及其相关数据
                    this.positions.splice(j, 1);
                    this.normals.splice(j, 1);
                    this.tangents.splice(j, 1);
                    this.uvs.splice(j, 1);
                }
            }
        }
    }

    // 翻转法线和切线
    public Reverse() {
        let count = this.indices.length / 3;
        for (let i = 0; i < count; i++) {
            let t = this.indices[i * 3 + 2];
            this.indices[i * 3 + 2] = this.indices[i * 3 + 1];
            this.indices[i * 3 + 1] = t;
        }
        count = this.positions.length;
        for (let i = 0; i < count; i++) {
            this.normals[i].multiplyScalar(-1);
            let tan = this.tangents[i];
            tan.w = -1;
            this.tangents[i] = tan;
        }
    }

    // 计算切线
    public static CalculateTangent(normal: Vec3) {
        let tan: Vec3 = Vec3.cross(v3(), normal, Vec3.UP);
        if (tan.equals(v3()))
            tan = Vec3.cross(v3(), normal, Vec3.FORWARD);
        tan = Vec3.cross(v3(), tan, normal);
        return new Vec4(tan.x, tan.y, tan.z, 1.0);
    }
}
