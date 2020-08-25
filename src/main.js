import qs from 'qs'
import $ from './js/jquery.min'
import THREE from './js/three.module'
import EnvironmentScene from './js/EnvironmentScene'
import RefracMaterial from './js/RefracMaterial'
// import { PCSS, PCSSGetShadow } from './js/ShadowShader'
import './js/GLTFLoader'
import './js/RGBELoader'
import './js/OrbitControls'

import './js/crypto-js/core'
import './js/crypto-js/enc-base64'
import './js/crypto-js/md5'
import './js/crypto-js/evpkdf'
import './js/crypto-js/cipher-core'
import './js/crypto-js/aes'
import './js/crypto-js/pad-pkcs7'
import './js/crypto-js/mode-ecb'
import './js/crypto-js/enc-utf8'
import './js/crypto-js/enc-hex'

const LOG_MAX_RESOLUTION = 9
const LOG_MIN_RESOLUTION = 6

const { id } = qs.parse(location.search.replace(/\?/, ''))
const canvas = $('#canvas')
const progress = $('#progress')
canvas.css('lineHeight', window.innerHeight + 'px')

$('#website').html(process.env.WEB_SITE).attr('href', process.env.STATIC_URL.replace('static.', ''))

if (!id) {
    canvas.text('Id not found')
    throw new Error('Id not found')
} else {
    // progress.css('display', 'flex')
    // $('#thumbnail').show()
}
const staticUrl = process.env.STATIC_URL

let width = canvas.width()
let height = canvas.height()

const renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true, //将渲染保存到缓冲区，否则获取的图片会是空的
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
renderer.shadowMap.soft = true
renderer.shadowMap.autoUpdate = false
renderer.shadowMap.needsUpdate = true;

canvas.append(renderer.domElement)

const scene = new THREE.Scene()

const light = new THREE.DirectionalLight()
light.position.set(0, 5, 0)
light.castShadow = true
light.shadow.mapSize.set(1024, 1024)
light.name = 'Light'
const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.5 }))
floor.rotation.x = - Math.PI / 2
floor.receiveShadow = true
floor.castShadow = false
floor.frustumCulled = false
floor.name = 'Shadow'

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

let isShadow = false, shadowOpacity = 0, shadowColor = '', shadowPosition = 0, shadowSoftness = 0
/*
// overwrite shadowmap code
let shader = THREE.ShaderChunk.shadowmap_pars_fragment
shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + PCSS)
shader = shader.replace('#if defined( SHADOWMAP_TYPE_PCF )', PCSSGetShadow + '#if defined( SHADOWMAP_TYPE_PCF )')
THREE.ShaderChunk.shadowmap_pars_fragment = shader
*/


const url = (process.env.NODE_ENV === "development" ? '/api' : '') + `/scene/findInfo?id=${id}`
$.ajax({
    url: url,
    contentType: "application/json;charset=utf-8",
    dataType: "json"
}).done(function(response) {
    if (response.code == 200) {
        const res = response.data
        const t_url = res.thumbnail.replace('thumbnail', 'thumbnail_s')
        $('.t-2').css('backgroundImage', 'url(' + staticUrl + t_url + ')')
        renderer.toneMappingExposure = res.exposure
        renderer.gammaFactor = res.gammaFactor
        const json = Decrypt(res.id.substring(0, 16), res.mtext)
        const resourcePath = staticUrl + res.modelFileUrls.split(res.id)[0] + res.id + '/'
        isShadow = !!res.isShadow
        shadowOpacity = res.shadowOpacity
        shadowColor = res.shadowColor
        shadowPosition = res.shadowPosition
        shadowSoftness = res.shadowSoftness
        if (res.skyBgUrl) {
            const rgbeLoader = new THREE.RGBELoader().setDataType(THREE.UnsignedByteType)
            rgbeLoader.load(staticUrl + res.skyBgUrl, (hdrTexture, data) => {
                hdrTexture.encoding = THREE.RGBEEncoding
                hdrTexture.minFilter = THREE.LinearFilter
                hdrTexture.magFilter = THREE.LinearFilter
                hdrTexture.flipY = true
                const pmremGenerator = new THREE.PMREMGenerator(renderer)
                const environment = pmremGenerator.fromEquirectangular(hdrTexture).texture
                scene.environment = environment
                if (res.skyBgMode === 'Sky') {
                    const background = pmremGenerator.fromEquirectangular2(hdrTexture, res.backBlur).texture
                    scene.background = background
                } else if (res.skyBgMode === "Color") {
                    canvas.css('background', res.skyBgColor)
                }
                loadGltf(json, res.materials, resourcePath)
            }, (e) => {
                // console.log(e)
                // const rate = e.loaded / e.total
            }, err => {
                console.log(err)
                loadGltf(json, res.materials, resourcePath)
            })
        } else {
            if (res.skyBgMode === 'Color') {
                canvas.css('background', res.skyBgColor)
            }
            loadGltf(json, res.materials, resourcePath)
        }
    } else {
        progress.hide()
        $('#thumbnail').hide()
        canvas.text(response.msg)
    }
}).fail(function(err) {
    console.log(err.responseJSON)
})


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

function loadGltf(json, materials, resourcePath) {
    const gltfLoader = new THREE.GLTFLoader()
    gltfLoader.load(json, gltf => {
        makeCenterScale(gltf.scene)
        let i = 0
        // const shadows = []
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
                node.material.flatShading = mtl.flatShading || false
                node.castShadow = true
                node.receiveShadow = true
                i++
            }
        })

        scene.add(gltf.scene)
        if (isShadow) {
            scene.add(light)
            scene.add(floor)
            floor.material.opacity = shadowOpacity
            floor.material.color.set(shadowColor)
            floor.position.y = shadowPosition
            setTimeout(() => {
                setShadowSoft(shadowSoftness)
            }, 100)
        }
        progress.hide()
        $('#thumbnail').fadeOut(2000)
    }, (e) => {
        // const rate = e.loaded / e.total
        // console.log(e)
    }, (err) => {
        console.log(err)
    }, resourcePath)
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
    return {size, pos: cent}
}

function Decrypt(key, word) {
    key = CryptoJS.enc.Utf8.parse(key)
    let encryptedHexStr = CryptoJS.enc.Hex.parse(word)
    let encryptedBase64Str = CryptoJS.enc.Base64.stringify(encryptedHexStr)
    let decrypt = CryptoJS.AES.decrypt(encryptedBase64Str, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypt.toString(CryptoJS.enc.Utf8)
}

function Encrypt(key, word) {
    var encrypted = CryptoJS.AES.encrypt(word, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString()
}

function setShadowSoft(softness) {
    const maxMapSize = Math.pow(2, LOG_MAX_RESOLUTION - softness * (LOG_MAX_RESOLUTION - LOG_MIN_RESOLUTION))
    const { camera, mapSize } = light.shadow

    const size = { x: 1, y: 1, z: 1 }, boundingBox = 20

    const width = Math.floor(size.x > size.z ? maxMapSize : maxMapSize * size.x / size.z)
    const height = Math.floor(size.x > size.z ? maxMapSize * size.z / size.x : maxMapSize)

    mapSize.set(width, height)
    // These pads account for the softening radius around the shadow.
    const widthPad = 2.5 * size.x / width
    const heightPad = 2.5 * size.z / height
    camera.left = -boundingBox - widthPad
    camera.right = -boundingBox + widthPad
    camera.bottom = boundingBox - heightPad
    camera.top = boundingBox + heightPad

    const sizeY = size.y
    camera.zoom = camera.zoom
    camera.near = 0;
    camera.far = sizeY * camera.zoom - 0

    camera.projectionMatrix.makeOrthographic(
        camera.left * camera.zoom,
        camera.right * camera.zoom,
        camera.top * camera.zoom,
        camera.bottom * camera.zoom,
        camera.near,
        camera.far);
    camera.projectionMatrixInverse.getInverse(camera.projectionMatrix);
}