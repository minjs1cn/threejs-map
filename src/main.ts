import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { onTouchstart, onResize } from './utils'
import { EColors, importMapObject3D } from './object3d'

async function init() {
    // 创建一个场景
    const scene = new THREE.Scene()

    // 创建一个相机
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(45, 45, 150)
    camera.lookAt(0, 0, 0)

    // 创建一个渲染器
    const renderer = new THREE.WebGL1Renderer({
        antialias: true, // 抗锯齿
        // alpha: true, // 背景透明
    })
    renderer.setSize(window.innerWidth, window.innerHeight)

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight)
        // 改变相机比例
        camera.aspect = window.innerWidth / window.innerHeight
        // 刷新计算矩阵
        camera.updateProjectionMatrix()
    }
    onResize(resize)

    // 展示渲染节点
    document.body.appendChild(renderer.domElement)

    // 创建坐标系
    const axes = new THREE.AxesHelper(2000)
    scene.add(axes)

    // 创建地面辅助
    const grid = new THREE.GridHelper(500, 50)
    scene.add(grid)

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.rotateSpeed = 0.35

    const boxGeometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000
    })
    const cube = new THREE.Mesh(boxGeometry, material)
    cube.position.y = 30
    cube.scale.set(4, 4, 4)
    scene.add(cube)

    const mapObject3D = await importMapObject3D()
    scene.add(mapObject3D)

    // 显示省份
    const info = document.getElementById('info') as HTMLDivElement

    // 创建射线
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(0, 0)

    function onMouseMove(event: THREE.Vec2) {
        // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
        mouse.x = (event.x / window.innerWidth) * 2 - 1
        mouse.y = - (event.y / window.innerHeight) * 2 + 1

        info.style.left = event.x + 5 + 'px'
        info.style.top = event.y + 5 + 'px'
    }
    onTouchstart(onMouseMove)

    type TMesh = THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshBasicMaterial[]>

    let lastPick: TMesh

    // 渲染
    function render() {
        requestAnimationFrame(render)
        cube.rotation.y += 0.01
        cube.rotation.x += 0.01

        if (mouse.x !== 0) {
            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(scene.children, true)
            const find = intersects.find(item => (item.object as TMesh).material && (item.object as TMesh).material.length === 2)
            
            if (lastPick) {
                let [m1, m2] = lastPick.material
                m1.color.set(EColors.COLOR1)
                m2.color.set(EColors.COLOR2)
                m1.needsUpdate = true
                m2.needsUpdate = true
            }

            if (find) {
                lastPick = find.object as TMesh
                let [m1, m2] = lastPick.material
                m1.color.set(EColors.COLOR3)
                m2.color.set(EColors.COLOR3)
                m1.needsUpdate = true
                m2.needsUpdate = true

                if (lastPick.name) {
                    info.textContent =lastPick.name
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
}

init()