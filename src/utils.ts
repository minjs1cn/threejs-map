import * as THREE from 'three'

export function onTouchstart(fn: (e: THREE.Vec2) => void) {
    const evt = new THREE.Vector2(0, 0)
    window.addEventListener('mousemove', event => {
        evt.x = event.clientX
        evt.y = event.clientY
        fn(evt)
    }, false)
    window.addEventListener('touchstart', (event) => {
        evt.x = event.touches[0].clientX
        evt.y = event.touches[0].clientY
        fn(evt)
    }, false)
}

export function onResize(fn: (event: UIEvent) => void) {
    window.addEventListener('resize', fn, false)
}