'use strict'

const db = uniCloud.database()
const dbCmd = db.command

// 路由表
const ACTIONS = {
  getProfile: async (params, context) => {
    const userId = context.UNIID_USER._id

    // 查询用户基本资料
    const userRes = await db.collection('uni-id-users').doc(userId).get()

    // 查询学校用户扩展信息
    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .get()

    const schoolUser = schoolUserRes.data[0] || null
    let school = null

    if (schoolUser) {
      const schoolRes = await db.collection('schools').doc(schoolUser.school_id).get()
      school = schoolRes.data[0] || null
    }

    return {
      profile: userRes.data[0],
      schoolUser,
      school,
    }
  },

  updateProfile: async (params, context) => {
    const userId = context.UNIID_USER._id
    const { nickname, avatar, gender, mobile } = params

    const updateData = {}
    if (nickname) updateData.nickname = nickname
    if (avatar) updateData.avatar = avatar
    if (gender !== undefined) updateData.gender = gender
    if (mobile) updateData.mobile = mobile

    await db.collection('uni-id-users').doc(userId).update(updateData)

    const userRes = await db.collection('uni-id-users').doc(userId).get()
    return userRes.data[0]
  },

  verifyStudent: async (params, context) => {
    const userId = context.UNIID_USER._id
    const { school_id, real_name, student_no, college, major, grade, student_card } = params

    // 检查是否已经认证
    const existing = await db.collection('school_users')
      .where({ user_id: userId })
      .get()

    if (existing.data.length > 0 && existing.data[0].is_verified) {
      throw new Error('已通过学生认证，无需重复认证')
    }

    const schoolUserData = {
      user_id: userId,
      school_id,
      real_name,
      student_no,
      college,
      major,
      grade,
      student_card,
      is_verified: false, // 需要管理员审核
      credit_score: 100,  // 默认信用分
      balance: 0,
      create_date: new Date(),
    }

    if (existing.data.length > 0) {
      // 更新已有记录
      await db.collection('school_users').doc(existing.data[0]._id).update({
        ...schoolUserData,
        update_date: new Date(),
      })
      const updatedRes = await db.collection('school_users').doc(existing.data[0]._id).get()
      return { schoolUser: updatedRes.data[0] }
    } else {
      // 创建新记录
      const addRes = await db.collection('school_users').add(schoolUserData)
      const newRes = await db.collection('school_users').doc(addRes.id).get()
      return { schoolUser: newRes.data[0] }
    }
  },

  getUserStats: async (params, context) => {
    const userId = context.UNIID_USER._id

    const [productCount, orderBuyCount, orderSellCount, favoriteCount] = await Promise.all([
      db.collection('products').where({ seller_id: userId }).count(),
      db.collection('orders').where({ buyer_id: userId }).count(),
      db.collection('orders').where({ seller_id: userId }).count(),
      db.collection('favorites').where({ user_id: userId }).count(),
    ])

    return {
      productCount: productCount.total,
      orderBuyCount: orderBuyCount.total,
      orderSellCount: orderSellCount.total,
      favoriteCount: favoriteCount.total,
    }
  },
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  if (!ACTIONS[action]) {
    return { code: -1, msg: `未知操作: ${action}` }
  }

  try {
    const result = await ACTIONS[action](params, context)
    return { code: 0, msg: 'success', data: result }
  } catch (error) {
    console.error(`[user-co.${action}]`, error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}