// uni-id 权限验证公共模块
'use strict'

/**
 * 2026-09-13 重写 (known-issues.md#33 根因 C)
 *
 * 旧实现的 `context.UNIID_USER` 是**虚构字段** —— 项目里没有任何代码填充它,
 * 官方 `@dcloudio/types` 里也搜不到, 所以旧版三个守卫**从未生效过**
 * (所有需要登录态的 action 都会失败)。
 *
 * 正解: 客户端 (src/api/unicloud.ts) 每次调用透传 `uniIdToken`,
 * 服务端用 uni-id-common 的 checkToken 校验, 拿到 payload.uid
 * (= uni-id-users._id)。这与官方 uni-id-co/middleware/auth.js 的做法一致。
 */

const uniIdCommon = require('uni-id-common')

const db = uniCloud.database()

const ERR_UNAUTHORIZED = 'UNAUTHORIZED'
const ERR_NOT_VERIFIED = 'NOT_VERIFIED'
const ERR_NOT_FOUND = 'NOT_FOUND'
const ERR_FORBIDDEN = 'FORBIDDEN'

/**
 * 从 event 里取出客户端透传的 uni-id token 并校验
 * @returns {Promise<object|null>} payload(含 uid/role/permission) 或 null(未登录/失效)
 */
async function resolveUniIdUser(event, context) {
  const token = (event && event.uniIdToken) || ''
  if (!token) return null

  const instance = uniIdCommon.createInstance({ context })
  const payload = await instance.checkToken(token)

  // checkToken 不抛错, 失败时返回 { errCode, errMsg, code }
  if (!payload || payload.errCode) return null

  return payload
}

/**
 * 把 uni-id 的 uid 解析成 school_users 记录 (三表用户模型的中间表)
 * 注意: products.seller_id 指向 school_users._id, 不是 uni-id-users._id
 */
async function findSchoolUser(uid) {
  if (!uid) return null
  const res = await db.collection('school_users').where({ user_id: uid }).limit(1).get()
  return (res.data && res.data[0]) || null
}

/**
 * 从 uni-id-users 记录里解析微信小程序 openid (支付必传)
 *
 * 结构参考官方 uni-id-co/lib/utils/weixin.js#getWeixinOpenid:
 *   userRecord.wx_openid = { 'mp_<appId>': '...' } 或 { mp: '...' }
 * 注意 token payload 里**没有** openid, 必须查表。
 *
 * @param {string} uid uni-id-users._id
 * @returns {Promise<string|undefined>}
 */
async function resolveWeixinOpenid(uid) {
  if (!uid) return undefined

  const res = await db.collection('uni-id-users').doc(uid).field({ wx_openid: true }).get()
  const userRecord = res.data && res.data[0]
  const wxOpenidObj = userRecord && userRecord.wx_openid
  if (!wxOpenidObj) return undefined

  const appId = (uniCloud.getCurrentClientInfo && uniCloud.getCurrentClientInfo().appId) || ''
  // 优先平台+appId 精确匹配, 回退到裸平台名 (与官方取法一致)
  return wxOpenidObj[`mp_${appId}`] || wxOpenidObj.mp || undefined
}

/**
 * 校验用户登录状态
 * @returns {Promise<{uid:string, uniIdUser:object, schoolUser:object|null, tokenPayload:object}>}
 * @throws 未登录 / token 失效时抛 UNAUTHORIZED
 */
async function requireAuth(event, context) {
  const payload = await resolveUniIdUser(event, context)
  if (!payload || !payload.uid) {
    const err = new Error('请先登录')
    err.code = ERR_UNAUTHORIZED
    throw err
  }

  const schoolUser = await findSchoolUser(payload.uid)

  return {
    uid: payload.uid, // uni-id-users._id
    tokenPayload: payload,
    uniIdUser: { _id: payload.uid },
    schoolUser, // 可能为 null (还没选学校/建扩展记录)
  }
}

/**
 * 校验学生认证状态 (会顺带返回 schoolUser)
 * @throws NOT_VERIFIED 未通过学生认证
 */
async function requireVerified(event, context) {
  const auth = await requireAuth(event, context)
  if (!auth.schoolUser || auth.schoolUser.is_verified !== true) {
    const err = new Error('请先完成学生认证')
    err.code = ERR_NOT_VERIFIED
    throw err
  }
  return auth
}

/**
 * 校验是否资源所有者
 * @param ownerField 默认 'seller_id'; 注意比对的是 school_users._id
 */
async function requireOwner(event, context, collection, docId, ownerField = 'seller_id') {
  const auth = await requireAuth(event, context)
  if (!auth.schoolUser) {
    const err = new Error('请先完成学生认证')
    err.code = ERR_NOT_VERIFIED
    throw err
  }

  const doc = await db.collection(collection).doc(docId).get()
  if (!doc.data || doc.data.length === 0) {
    const err = new Error('资源不存在')
    err.code = ERR_NOT_FOUND
    throw err
  }

  if (doc.data[0][ownerField] !== auth.schoolUser._id) {
    const err = new Error('无权操作此资源')
    err.code = ERR_FORBIDDEN
    throw err
  }

  return { ...auth, doc: doc.data[0] }
}

module.exports = {
  resolveUniIdUser,
  resolveWeixinOpenid,
  findSchoolUser,
  requireAuth,
  requireVerified,
  requireOwner,
}
