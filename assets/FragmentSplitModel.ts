// import { _decorator, Component, Node, Mesh, MeshRenderer, gfx, primitives, utils, v3, Vec3 } from 'cc';
// const { ccclass, property } = _decorator;

// @ccclass('FragmentManager')
// export class FragmentManager extends Component {
//     @property(Node)
//     originalModel: Node = null; // 原始模型

//     protected onEnable(): void {
//         this.splitModel();
//     }

//     splitModel() {
//         const meshFilter = this.originalModel.getComponent(MeshRenderer); // 获取原始模型的 Mesh 组件
//         const originalMesh = meshFilter.mesh; // 获取原始网格

//         // 获取顶点、法线和 UV 数据
//         const positions = originalMesh.readAttribute(0, gfx.AttributeName.ATTR_POSITION);;
//         const normals = originalMesh.readAttribute(0, gfx.AttributeName.ATTR_NORMAL);
//         const uvs = originalMesh.readAttribute(0, gfx.AttributeName.ATTR_TEX_COORD);
//         const indices = originalMesh.readIndices(0);
//         const tangents = originalMesh.readAttribute(0, gfx.AttributeName.ATTR_TANGENT);

//         const fragmentCount = 5; // 分割数量
//         const center = new Vec3(0, 0, 0); // 假设模型的中心点为 (0, 0, 0)

//         for (let i = 0; i < fragmentCount; i++) {
//             const newFragment = new Node(`Fragment_${i}`); // 创建新的碎片节点

//             const fragmentPositions = [];
//             const fragmentNormals = [];
//             const fragmentUVs = [];
//             const fragmentTangents = [];
//             const fragmentIndicesArray = [];

//             // 随机生成切割面的顶点
//             const randomOffset = Math.random() * 0.5; // 控制随机偏移量
//             for (let j = 0; j < positions.length; j++) {
//                 // 生成新的位置，向外扩展随机距离
//                 const position = positions[j];
//                 const randomDirection = v3(position).subtract(center).normalize().multiplyScalar(randomOffset);
//                 const newPosition = v3(position).add(randomDirection);

//                 // 记录新的顶点、法线、UV 和切线
//                 fragmentPositions.push(newPosition);
//                 fragmentNormals.push(normals[j]);
//                 fragmentUVs.push(uvs[j]);
//                 fragmentTangents.push(tangents[j]);

//                 // 对于新索引，使用 fragmentPositions 的当前长度 - 1
//                 fragmentIndicesArray.push(fragmentPositions.length - 1);
//             }

//             // 将顶点、法线、UV 和切线数据设置到新的 Mesh
//             let geometry: primitives.IGeometry = {
//                 positions: fragmentPositions,
//                 normals: fragmentNormals,
//                 uvs: fragmentUVs,
//                 tangents: fragmentIndicesArray,
//                 indices: fragmentIndicesArray,
//                 doubleSided: true,
//                 primitiveMode: gfx.PrimitiveMode.TRIANGLE_LIST,
//             }
//             // 创建网格
//             var newMesh = utils.MeshUtils.createMesh(geometry, null, { calculateBounds: true });


//             var meshRender = newFragment.addComponent(MeshRenderer);
//             meshRender.setMaterialInstance(meshFilter.getMaterialInstance(0), 0);
//             meshRender.mesh = (newMesh); // 设置新的 MeshRenderer

//             // 设置随机位置和旋转
//             newFragment.setPosition(
//                 this.originalModel.position.x + (Math.random() - 0.5) * 2,
//                 this.originalModel.position.y,
//                 this.originalModel.position.z + (Math.random() - 0.5) * 2
//             );

//             this.node.addChild(newFragment); // 将碎片添加到场景中
//         }

//         // this.originalModel.active = false; // 隐藏原始模型
//     }
// }
