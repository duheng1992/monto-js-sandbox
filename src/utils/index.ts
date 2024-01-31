export function isObjectNotFunction(value) {  
  return value !== null && typeof value === 'object' && typeof value !== 'function' && !(Array.isArray(value));  
}