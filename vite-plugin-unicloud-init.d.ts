/**
 * Vite plugin 类型声明 (见 vite-plugin-unicloud-init.js)
 *
 * SchoolBuzzMate 自动注入 uniCloud.init 参数到 vendor.js,
 * 解决 pnpm run dev:mp-weixin 模式下 vite HMR rebuild 覆盖手工注入的问题
 * (见 known-issues.md #19 / #29 / #30)
 */
declare const unicloudInitPlugin: (options?: any) => any
export default unicloudInitPlugin
