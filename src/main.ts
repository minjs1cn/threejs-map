import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as d3 from 'd3-geo'

// 创建一个场景
const scene = new THREE.Scene()

// 创建一个相机
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 30, 150)
camera.lookAt(0, 0, 0)

// 创建一个渲染器
const renderer = new THREE.WebGL1Renderer({
    antialias: true, // 抗锯齿
    // alpha: true, // 背景透明
})
renderer.setSize(window.innerWidth, window.innerHeight)

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    // 改变相机比例
    camera.aspect = window.innerWidth / window.innerHeight
    // 刷新计算矩阵
    camera.updateProjectionMatrix()
})

// 展示渲染节点
document.body.appendChild(renderer.domElement)

// 创建坐标系
const axes = new THREE.AxesHelper(2000)
// scene.add(axes)

// 创建地面辅助
const grid = new THREE.GridHelper(500, 50)
// scene.add(grid)

// 创建控制器
const controls = new OrbitControls(camera, renderer.domElement)
// controls.enableDamping = true
controls.dampingFactor = 0.25
controls.rotateSpeed = 0.35

const boxGeometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({
    color: 0xff0000
})
const cube = new THREE.Mesh(boxGeometry, material)
cube.position.y = 120
cube.scale.set(100, 100, 100)
// scene.add(cube)


// 存储省份3D对象和省份信息的映射关系
const provinces = new WeakMap()
const colors = {
    meshColor1: '#02A1E2',
    meshColor2: '#3480C4',
    meshColor3: 0xff0000
}

import('./china.json').then(data => {
    const projection = d3.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0])
    const map = new THREE.Object3D()

    data.features.forEach(item => {
        // 创建一个省份3D对象
        const province = new THREE.Object3D()
        // 坐标数组
        const coordinates = item.geometry.coordinates

        coordinates.forEach(multiPolygon => {
            multiPolygon.forEach(polygon => {
                const shape = new THREE.Shape()
                const bufferGeometry = new THREE.BufferGeometry()

                const vertices = []

                for (let i = 0; i < polygon.length; i++) {
                    const polygonProjection = projection(polygon[i] as [number, number])
                    if (polygonProjection) {
                        const [x, y] = polygonProjection
                        if (i === 0) {
                            shape.moveTo(x, -y)
                        }
                        shape.lineTo(x, -y)

                        vertices.push(x)
                        vertices.push(-y)
                        vertices.push(4)
                    }
                }
                bufferGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
                
                const extrudeGeometry = new THREE.ExtrudeGeometry(shape, {
                    depth: 4, // 可以理解为几何体的厚度
                    bevelEnabled: false
                })

                const mesh = new THREE.Mesh(extrudeGeometry, [
                    new THREE.MeshBasicMaterial({
                        color: colors.meshColor1,
                        transparent: true,
                        opacity: 0.6,
                    }),
                    new THREE.MeshBasicMaterial({
                        color: colors.meshColor2,
                        transparent: true,
                        opacity: 0.5,
                    })
                ])

                const line = new THREE.Line(bufferGeometry, new THREE.LineBasicMaterial({
                    color: 'white'
                }))

                provinces.set(mesh, item.properties)

                province.add(mesh)
                province.add(line)
            })

            
        })

        map.add(province)
    })

    scene.add(map)
})

// 显示省份
const info = document.getElementById('info') as HTMLDivElement

// 创建射线
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(0, 0)

function onMouseMove(event: MouseEvent) {
	// 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1

    info.style.left = event.clientX + 5 + 'px'
    info.style.top = event.clientY + 5 + 'px'
}

window.addEventListener('mousemove', onMouseMove, false)

type TMesh = THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshBasicMaterial[]>

let lastPick: TMesh

// 渲染
function render() {
    requestAnimationFrame(render)

    if (mouse.x !== 0) {
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children, true)
        const find = intersects.find(item => (item.object as TMesh).material && (item.object as TMesh).material.length === 2)
        
        if (lastPick) {
            let [m1, m2] = lastPick.material
            m1.color.set(colors.meshColor1)
            m2.color.set(colors.meshColor2)
            m1.needsUpdate = true
            m2.needsUpdate = true
        }

        if (find) {
            lastPick = find.object as TMesh
            let [m1, m2] = lastPick.material
            m1.color.set(colors.meshColor3)
            m2.color.set(colors.meshColor3)
            m1.needsUpdate = true
            m2.needsUpdate = true
            console.log()
            if (provinces.get(lastPick).name) {
                info.textContent = provinces.get(lastPick).name
                info.style.display = 'block'
            } else {
                info.style.display = 'none'
            }
        } else {
            info.style.display = 'none'
        }
    }

    renderer.render(scene, camera)
}
render()