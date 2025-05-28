export function isObjectNotFunction(value: unknown) {
  return value !== null && typeof value === 'object' && typeof value !== 'function' && !Array.isArray(value);
}

export function deepClone(obj: any) {
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(obj);
    } catch (e) {
      // window 对象是不可克隆的
      // 克隆失败，返回原对象引用（浅拷贝）
      return obj;
    }
  }
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}
