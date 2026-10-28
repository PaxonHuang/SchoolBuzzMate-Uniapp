'use strict'

const { resolveUniIdUser, findSchoolUser } = require('../common/auth.js')
const db = uniCloud.database()

const ACTIONS = {
  getSchoolList: async (params) => {
    const res = await db.collection('schools')
      .where({ status: 1 })
      .orderBy('name', 'asc')
      .get()
    return res.data
  },

  getSchoolStats: async (params) => {
    const { school_id } = params

    const [productCount, userCount] = await Promise.all([
      db.collection('products').where({ school_id, status: 1 }).count(),
      db.collection('school_users').where({ school_id, is_verified: true }).count(),
    ])

    return {
      productCount: productCount.total,
      userCount: userCount.total,
    }
  },
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  if (!ACTIONS[action]) {
    return { code: -1, msg: `未知操作: ${action}` }
  }

  // 2026-09-13 (known-issues.md#33 根因 C): context.UNIID_USER 是虚构字段, 从未被填充。
  // 改为从 event.uniIdToken 校验出真实身份后注入, 保持各 action 的 (params, context) 签名不变。
  context.UNIID_USER = await resolveUniIdUser(event, context)
  const schoolUser = context.UNIID_USER
    ? await findSchoolUser(context.UNIID_USER.uid)
    : null
  if (schoolUser) context.SCHOOL_USER = schoolUser

  try {
    const result = await ACTIONS[action](params, context)
    return { code: 0, msg: 'success', data: result }
  } catch (error) {
    console.error(`[school-co.${action}]`, error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}