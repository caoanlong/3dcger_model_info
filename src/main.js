import qs from 'qs'
import THREE from './js/three.module'
import EnvironmentScene from './js/EnvironmentScene'
import RefracMaterial from './js/RefracMaterial'
import './js/GLTFLoader'
import './js/RGBELoader'
import './js/OrbitControls'

const { id } = qs.parse(location.search.replace(/\?/, ''))
const canvas = document.getElementById('canvas')
const thumbnail = document.getElementById('thumbnail')
const progress = document.getElementById('progress')
const progressBar = document.getElementById('progressBar')
const website = document.getElementById('website')
canvas.style.lineHeight = window.innerHeight + 'px'

website.innerHTML = process.env.WEB_SITE
website.href = 'http://' + process.env.WEB_SITE
if (!id) {
    canvas.innerText = 'Not found id'
    throw new Error('Not found id')
}
const staticUrl = 'http://static.cgers.art/'
thumbnail.style.backgroundImage = `url(${staticUrl}${id}/thumbnail_s.png)`
let width = canvas.offsetWidth
let height = canvas.offsetHeight
const progressWidth = progress.offsetWidth
let pWidth1 = 0, pWidth2 = 0

const renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,  //将渲染保存到缓冲区，否则获取的图片会是空的
    antialias: true,
    alpha: true 
})
renderer.setSize(width, height)
renderer.setClearColor('#ffffff', 0)
renderer.autoClear = true
renderer.toneMappingExposure = 1
renderer.gammaFactor = 2.2
renderer.outputEncoding = THREE.GammaEncoding
renderer.physicallyCorrectLights = true
renderer.setPixelRatio(window.devicePixelRatio)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.autoUpdate = false
canvas.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const pmremGenerator = new THREE.PMREMGenerator(renderer)
const defaultScene = new EnvironmentScene()
const defaultEnvTextture = pmremGenerator.fromScene(defaultScene, 0.04).texture
scene.environment = defaultEnvTextture
defaultScene.dispose()

window.addEventListener('resize', resizeWin, false)
resizeWin()
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
camera.position.set(0, 0, 5)
render()
new THREE.OrbitControls(camera, renderer.domElement)

const url = (process.env.NODE_ENV === "development" ? '/api' : '') + `/scene/findInfo?id=${id}`
fetch(url).then(res => {
    if (res.status === 200) {
        return res.json()
    } else {
        canvas.innerText = res.status + ' ' + res.statusText
    }
}).then(response => {
    if (response.code === 200) {
        const res = response.data
        const baseUrl = staticUrl + id + '/'
        const gltfUrl = baseUrl + res.modelFileUrls.replace(/\.obj/ig, '.gltf')
        renderer.toneMappingExposure = res.exposure
        renderer.gammaFactor = res.gammaFactor
        if (res.skyBgUrl) {
            const rgbeLoader = new THREE.RGBELoader().setDataType(THREE.UnsignedByteType)
            rgbeLoader.load(baseUrl + res.skyBgUrl, (hdrTexture, data) => {
                hdrTexture.encoding = THREE.RGBEEncoding
                hdrTexture.minFilter = THREE.LinearFilter
                hdrTexture.magFilter = THREE.LinearFilter
                hdrTexture.flipY = true
                const pmremGenerator = new THREE.PMREMGenerator(renderer)
                const texture = pmremGenerator.fromEquirectangular(hdrTexture).texture
                scene.environment = texture
                if (res.skyBgMode === 'Sky') scene.background = texture
                if (res.skyBgMode === 'Color') {
                    canvas.style.background = res.skyBgColor
                }
                loadGltf(gltfUrl, res.materials)
            }, (e) => {
                const rate = e.loaded / e.total
                pWidth1 = progressWidth * 0.4 * rate
                progressBar.style.width = pWidth1 + 'px'
            }, err => {
                console.log(err)
                loadGltf(gltfUrl, res.materials)
            })
        } else {
            if (res.skyBgMode === 'Color') {
                canvas.style.background = res.skyBgColor
            }
            loadGltf(gltfUrl, res.materials)
        }
    }
})
document.onreadystatechange = function () {
    console.log(document.readyState)
    if (document.readyState == 'complete') {
        progressBar.style.width = progressWidth + 'px'
        setTimeout(() => {
            thumbnail.className = 'fade'
            progress.style.display = 'none'
            setTimeout(() => {
                thumbnail.style.display = 'none'
            }, 1000)
        }, 500)
    }
}

function resizeWin() {
    width = window.innerWidth
    height = window.innerHeight
    const aspect = width / height
    if (camera) {
        camera.aspect = aspect
        camera.updateProjectionMatrix()
    }
    if (renderer) {
        renderer.setSize(width, height)
    }
}
function render() {
    renderer.render(scene, camera)
    requestAnimationFrame(render)
}
function loadGltf(gltfUrl, materials) {
    const gltfLoader = new THREE.GLTFLoader()
    gltfLoader.load(gltfUrl, gltf => {
        makeCenterScale(gltf.scene)
        let i = 0
        gltf.scene.traverse((node) => {
            if (node.isMesh) {
                const mtl = materials[i]
                if (mtl.mtlType === 'refraction') {
                    const material = new RefracMaterial({
                        metalness: mtl.metalness,
                        roughness: mtl.roughness,
                        refractionRatio: mtl.refractionRatio,
                        envMap: scene.environment,
                        envMapMode: THREE.EquirectangularRefractionMapping,
                        color: node.material.color,
                        emissive: node.material.emissive,
                        map: node.material.map,
                        normalMap: node.material.normalMap,
                        metalnessMap: node.material.metalnessMap,
                        roughnessMap: node.material.roughnessMap,
                        emissiveMap: node.material.emissiveMap,
                    })
                    node.material = material
                } else {
                    node.material.transparent = true
                    node.material.transparency = mtl.transparency
                    node.material.reflectivity = mtl.reflectivity
                    node.material.clearcoat = mtl.clearcoat
                    node.material.clearcoatRoughness = mtl.clearcoatRoughness
                    node.material.side = mtl.side
                    node.material.alphaTest = 0.5
                }
                i++
            }
        })
        scene.add(gltf.scene)
    }, (e) => {
        const rate = e.loaded / e.total
        pWidth2 = progressWidth * 0.4 * rate
        progressBar.style.width = (pWidth1 + pWidth2) + 'px'
    }, (err) => {

    })
}

/**
 * 缩放居中适应
 */
function makeCenterScale(group) {
    const bbox = new THREE.Box3().setFromObject(group)
    const cent = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const maxAxis = Math.max(size.x, size.y, size.z)
    group.scale.multiplyScalar(2.5 / maxAxis)
    bbox.setFromObject(group)
    bbox.getCenter(cent)
    bbox.getSize(size)
    //Reposition to 0,halfY,0
    group.position.copy(cent).multiplyScalar(-1)
}