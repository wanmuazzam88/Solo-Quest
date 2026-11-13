/**
 * Lightweight standalone GLB / glTF 2.0 Loader for Three.js r128
 * Attaches THREE.GLTFLoader to the global THREE namespace.
 */
(function (root) {
  'use strict';

  var THREE = root.THREE;
  if (!THREE) return;

  var TYPE_SIZES = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
  };

  var COMPONENT_ARRAYS = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  };

  var COMPONENT_DIVISORS = {
    5120: 127,
    5121: 255,
    5122: 32767,
    5123: 65535
  };

  function GLTFLoader() {}

  GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    var self = this;
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' loading ' + url);
        return res.arrayBuffer();
      })
      .then(function (buffer) {
        self.parse(buffer, '', onLoad, onError);
      })
      .catch(function (err) {
        if (onError) onError(err);
        else console.error('[GLTFLoader]', err);
      });
  };

  GLTFLoader.prototype.parse = function (data, path, onLoad, onError) {
    try {
      var view = new DataView(data);
      var magic = view.getUint32(0, true);
      if (magic !== 0x46546c67) {
        throw new Error('Invalid GLB binary magic');
      }

      var jsonChunk = null;
      var binChunk = null;
      var offset = 12;
      while (offset < data.byteLength) {
        var chunkLen = view.getUint32(offset, true);
        var chunkType = view.getUint32(offset + 4, true);
        var sliceStart = offset + 8;
        if (chunkType === 0x4e4f534a) {
          var jsonBytes = new Uint8Array(data, sliceStart, chunkLen);
          var text = new TextDecoder('utf-8').decode(jsonBytes);
          jsonChunk = JSON.parse(text);
        } else if (chunkType === 0x004e4942) {
          binChunk = data.slice(sliceStart, sliceStart + chunkLen);
        }
        offset += 8 + chunkLen;
      }

      if (!jsonChunk) throw new Error('Missing JSON chunk in GLB');
      var result = buildScene(jsonChunk, binChunk);
      if (onLoad) onLoad(result);
    } catch (err) {
      if (onError) onError(err);
      else console.error('[GLTFLoader.parse]', err);
    }
  };

  function readAccessor(json, bin, accessorIndex) {
    var acc = json.accessors[accessorIndex];
    var bv = json.bufferViews[acc.bufferView];
    var TypedArray = COMPONENT_ARRAYS[acc.componentType];
    var itemSize = TYPE_SIZES[acc.type] || 1;
    var count = acc.count;
    var byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    var byteStride = bv.byteStride || 0;
    var elemBytes = TypedArray.BYTES_PER_ELEMENT;
    var total = count * itemSize;

    if (!byteStride || byteStride === itemSize * elemBytes) {
      var raw = new TypedArray(bin, byteOffset, total);
      if (acc.normalized && COMPONENT_DIVISORS[acc.componentType]) {
        var div = COMPONENT_DIVISORS[acc.componentType];
        var outNorm = new Float32Array(total);
        for (var i = 0; i < total; i++) outNorm[i] = raw[i] / div;
        return { array: outNorm, itemSize: itemSize };
      }
      return { array: raw, itemSize: itemSize };
    }

    // Interleaved bufferView
    var dv = new DataView(bin);
    var out = acc.normalized ? new Float32Array(total) : new TypedArray(total);
    var normDiv = acc.normalized ? (COMPONENT_DIVISORS[acc.componentType] || 1) : 1;
    for (var n = 0; n < count; n++) {
      var base = byteOffset + n * byteStride;
      for (var c = 0; c < itemSize; c++) {
        var off = base + c * elemBytes;
        var val = 0;
        switch (acc.componentType) {
          case 5120: val = dv.getInt8(off); break;
          case 5121: val = dv.getUint8(off); break;
          case 5122: val = dv.getInt16(off, true); break;
          case 5123: val = dv.getUint16(off, true); break;
          case 5125: val = dv.getUint32(off, true); break;
          case 5126: val = dv.getFloat32(off, true); break;
        }
        out[n * itemSize + c] = val / normDiv;
      }
    }
    return { array: out, itemSize: itemSize };
  }

  function buildMaterials(json) {
    var mats = json.materials || [];
    return mats.map(function (m) {
      var pbr = m.pbrMetallicRoughness || {};
      var base = pbr.baseColorFactor || [1, 1, 1, 1];
      var emissive = m.emissiveFactor || [0, 0, 0];
      var emissiveStrength = 1.0;
      if (m.extensions && m.extensions.KHR_materials_emissive_strength &&
          typeof m.extensions.KHR_materials_emissive_strength.emissiveStrength === 'number') {
        emissiveStrength = m.extensions.KHR_materials_emissive_strength.emissiveStrength;
      }
      var mat = new THREE.MeshStandardMaterial({
        name: m.name || '',
        color: new THREE.Color(base[0], base[1], base[2]),
        metalness: typeof pbr.metallicFactor === 'number' ? pbr.metallicFactor : 1.0,
        roughness: typeof pbr.roughnessFactor === 'number' ? pbr.roughnessFactor : 1.0,
        emissive: new THREE.Color(emissive[0], emissive[1], emissive[2]),
        emissiveIntensity: emissiveStrength,
        side: m.doubleSided ? THREE.DoubleSide : THREE.FrontSide
      });
      if (m.alphaMode === 'BLEND' || (base[3] !== undefined && base[3] < 1)) {
        mat.transparent = true;
        mat.opacity = base[3] !== undefined ? base[3] : 1;
      }
      return mat;
    });
  }

  function buildScene(json, bin) {
    var materials = buildMaterials(json);
    var defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.25, metalness: 0.65 });

    var meshes = (json.meshes || []).map(function (meshDef) {
      var prims = meshDef.primitives || [];
      var group = prims.length > 1 ? new THREE.Group() : null;
      if (group) group.name = meshDef.name || '';

      for (var p = 0; p < prims.length; p++) {
        var prim = prims[p];
        var geom = new THREE.BufferGeometry();
        var attrs = prim.attributes || {};
        if (attrs.POSITION !== undefined) {
          var pos = readAccessor(json, bin, attrs.POSITION);
          geom.setAttribute('position', new THREE.BufferAttribute(pos.array, pos.itemSize));
        }
        if (attrs.NORMAL !== undefined) {
          var norm = readAccessor(json, bin, attrs.NORMAL);
          geom.setAttribute('normal', new THREE.BufferAttribute(norm.array, norm.itemSize));
        }
        if (attrs.TEXCOORD_0 !== undefined) {
          var uv = readAccessor(json, bin, attrs.TEXCOORD_0);
          geom.setAttribute('uv', new THREE.BufferAttribute(uv.array, uv.itemSize));
        }
        if (prim.indices !== undefined) {
          var idx = readAccessor(json, bin, prim.indices);
          geom.setIndex(new THREE.BufferAttribute(idx.array, 1));
        }
        if (!attrs.NORMAL) {
          geom.computeVertexNormals();
        }
        geom.computeBoundingSphere();
        geom.computeBoundingBox();

        var mat = (prim.material !== undefined && materials[prim.material])
          ? materials[prim.material]
          : defaultMaterial;
        var mesh = new THREE.Mesh(geom, mat);
        mesh.name = meshDef.name || '';
        if (group) {
          group.add(mesh);
        } else {
          return mesh;
        }
      }
      return group || new THREE.Group();
    });

    function buildNode(nodeIdx) {
      var nd = json.nodes[nodeIdx];
      var obj;
      if (nd.mesh !== undefined && meshes[nd.mesh]) {
        obj = meshes[nd.mesh];
        if (nd.name) obj.name = nd.name;
      } else {
        obj = new THREE.Group();
        obj.name = nd.name || '';
      }

      if (nd.matrix) {
        var mat4 = new THREE.Matrix4().fromArray(nd.matrix);
        mat4.decompose(obj.position, obj.quaternion, obj.scale);
      } else {
        if (nd.translation) obj.position.fromArray(nd.translation);
        if (nd.rotation) obj.quaternion.fromArray(nd.rotation);
        if (nd.scale) obj.scale.fromArray(nd.scale);
      }

      if (nd.children) {
        for (var c = 0; c < nd.children.length; c++) {
          obj.add(buildNode(nd.children[c]));
        }
      }
      return obj;
    }

    var sceneIdx = typeof json.scene === 'number' ? json.scene : 0;
    var sceneDef = (json.scenes && json.scenes[sceneIdx]) || { nodes: [] };
    var rootGroup = new THREE.Group();
    rootGroup.name = sceneDef.name || 'Scene';
    (sceneDef.nodes || []).forEach(function (nIdx) {
      rootGroup.add(buildNode(nIdx));
    });

    return { scene: rootGroup, scenes: [rootGroup], asset: json.asset || {} };
  }

  THREE.GLTFLoader = GLTFLoader;
})(window);
