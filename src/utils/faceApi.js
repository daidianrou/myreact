import * as faceapi from 'face-api.js';

// 模型文件路径（从 public/models 加载）
const MODEL_URL = process.env.PUBLIC_URL + '/models';

let modelsLoaded = false;

/**
 * 加载 face-api.js 所需的三个模型
 * 只需调用一次，后续调用会直接返回
 */
export async function loadModels() {
  if (modelsLoaded) return true;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    return true;
  } catch (err) {
    console.error('模型加载失败:', err);
    throw new Error('人脸识别模型加载失败，请检查网络连接');
  }
}

/**
 * 检测画面中的人脸并提取特征描述符
 * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} input - 视频/画布/图片元素
 * @returns {Float32Array|null} 人脸特征描述符（128维向量），未检测到人脸返回 null
 */
export async function getFaceDescriptor(input) {
  // 使用 TinyFaceDetector 检测人脸
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  return detection.descriptor;
}

/**
 * 检测画面中是否有人脸
 * @param {HTMLVideoElement|HTMLCanvasElement} input
 * @returns {boolean}
 */
export async function hasFace(input) {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }));
  return !!detection;
}

/**
 * 比对两个人脸描述符是否匹配
 * 使用欧氏距离，距离越小越相似
 * @param {Float32Array} descriptor1 - 注册时的人脸特征
 * @param {Float32Array} descriptor2 - 当前采集的人脸特征
 * @param {number} threshold - 判定阈值，默认 0.45（越小越严格，建议范围 0.4-0.5）
 * @returns {{ match: boolean, distance: number }} 匹配结果和距离值
 */
export function compareDescriptors(descriptor1, descriptor2, threshold = 0.45) {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return {
    match: distance < threshold,
    distance: Math.round(distance * 1000) / 1000,
  };
}

/**
 * 获取检测结果的可视化数据（用于画布绘制）
 * @param {HTMLVideoElement|HTMLCanvasElement} input
 * @returns {object|null} 包含检测框和关键点的数据
 */
export async function getDetectionWithLandmarks(input) {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks();

  if (!detection) return null;

  return {
    box: detection.detection.box,
    landmarks: detection.landmarks,
  };
}

/**
 * 将 Float32Array 描述符转为普通数组以便存储
 */
export function descriptorToArray(descriptor) {
  return Array.from(descriptor);
}

/**
 * 将存储的数组还原为 Float32Array
 */
export function arrayToDescriptor(arr) {
  return new Float32Array(arr);
}

/**
 * 获取匹配阈值对应的文字描述
 */
export function getMatchLevel(distance) {
  if (distance < 0.4) return { level: 'excellent', text: '高度匹配', color: '#22c55e' };
  if (distance < 0.5) return { level: 'good', text: '匹配成功', color: '#3b82f6' };
  if (distance < 0.6) return { level: 'acceptable', text: '基本匹配', color: '#f59e0b' };
  return { level: 'fail', text: '不匹配', color: '#ef4444' };
}
