import THREE from '../three.module'
import shader from './shader'

function RefracMaterial(parameters) {
    parameters = Object.assign({}, parameters)
    THREE.MeshStandardMaterial.call(this)
    this.envMapMode = null
    this.uniforms = THREE.UniformsUtils.merge([
        THREE.ShaderLib.standard.uniforms,
        {
            "envMapMode": { value: parameters.envMapMode || null }
        }
    ])
    setFlags(this)
    this.setValues(parameters)
}

RefracMaterial.prototype = Object.create(THREE.MeshStandardMaterial.prototype)
RefracMaterial.prototype.constructor = RefracMaterial
RefracMaterial.prototype.isMeshStandardMaterial = true

RefracMaterial.prototype.copy = function (source) {
    THREE.MeshStandardMaterial.prototype.copy.call(this, source)
    this.uniforms = THREE.UniformsUtils.clone(source.uniforms)
    setFlags(this)
    return this
}

export default RefracMaterial

function setFlags(material) {
    material.vertexShader = shader.vertexShader
    material.fragmentShader = shader.fragmentShader
    material.type = 'RefracMaterial'
}