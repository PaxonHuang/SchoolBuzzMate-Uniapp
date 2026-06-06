# uni-id 权限验证公共模块
'use strict'

const db = uniCloud.database()

/** 校验用户登录状态 */
function requireAuth(context) {
  const user = context.UNIID_USER
  if (!user || !user._id) {
    const err = new Error('请先登录')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  return user
}

/** 校验学生认证状态 */
async function requireVerified(context) {
  const user = requireAuth(context)
  const res = await db.collection('school_users')
    .where({ user_id: user._id, is_verified: true })
    .get()

  if (!res.data || res.data.length === 0) {
    const err = new Error('请先完成学生认证')
    err.code = 'NOT_VERIFIED'
    throw err
  }
  return { ...user, schoolUser: res.data[0] }
}

/** 校验是否资源所有者 */
async function requireOwner(context, collection, docId, ownerField = 'seller_id') {
  const user = requireAuth(context)
  const doc = await db.collection(collection).doc(docId).get()

  if (!doc.data || doc.data.length === 0) {
    const err = new Error('资源不存在')
    err.code = 'NOT_FOUND'
    throw err
  }
  if (doc.data[0][ownerField] !== user._id) {
    const err = new Error('无权操作此资源')
    err.code = 'FORBIDDEN'
    throw err
  }
  return { user, doc: doc.data[0] }
}

module.exports = { requireAuth, requireVerified, requireOwner }