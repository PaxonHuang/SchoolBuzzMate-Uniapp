'use strict'

const db = uniCloud.database()
const dbCmd = db.command

async function getSchoolUser(context) {
  const userId = context.UNIID_USER && context.UNIID_USER._id
  if (!userId) {
    const err = new Error('请先登录'); err.code = 'UNAUTHORIZED'; throw err
  }
  const res = await db.collection('school_users').where({ user_id: userId }).get()
  if (!res.data || res.data.length === 0) {
    const err = new Error('请先完成学生认证'); err.code = 'NOT_VERIFIED'; throw err
  }
  return { userId, schoolUser: res.data[0] }
}

async function enrichComments(comments, currentSchoolUserId) {
  if (comments.length === 0) return []
  const buyerIds = [...new Set(comments.map(function (c) { return c.buyer_id }))]
  let userMap = {}
  if (buyerIds.length > 0) {
    const suRes = await db.collection('school_users')
      .where({ _id: dbCmd.in(buyerIds) })
      .field({ _id: true, user_id: true })
      .get()
    const userIds = suRes.data.map(function (s) { return s.user_id }).filter(Boolean)
    if (userIds.length > 0) {
      const uRes = await db.collection('uni-id-users')
        .where({ _id: dbCmd.in(userIds) })
        .field({ _id: true, nickname: true, avatar: true })
        .get()
      uRes.data.forEach(function (u) { userMap[u._id] = u })
    }
    suRes.data.forEach(function (s) {
      const u = userMap[s.user_id] || {}
      userMap[s._id] = {
        _id: s._id,
        nickname: u.nickname || '匿名用户',
        avatar: u.avatar || '',
      }
    })
  }
  return comments.map(function (c) {
    const isAnon = c.anonymous && c.buyer_id !== currentSchoolUserId
    const buyer = isAnon ? { _id: '', nickname: '匿名用户', avatar: '' } : (userMap[c.buyer_id] || { _id: '', nickname: '匿名用户', avatar: '' })
    return Object.assign({}, c, { buyer })
  })
}

const ACTIONS = {
  create: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { order_id, rating, content, tags, anonymous } = params
    if (!order_id) throw new Error('缺少 order_id')
    if (!rating || rating < 1 || rating > 5) throw new Error('评分必须在 1-5 星')
    if (content && content.length > 500) throw new Error('评价内容不超过 500 字')

    const oRes = await db.collection('orders').doc(order_id).get()
    if (!oRes.data || oRes.data.length === 0) throw new Error('订单不存在')
    const order = oRes.data[0]
    if (order.buyer_id !== schoolUser._id) throw new Error('只有买家可以评价')
    if (order.status !== 3) throw new Error('订单未完成, 无法评价')

    const existing = await db.collection('comments')
      .where({ order_id, buyer_id: schoolUser._id })
      .count()
    if (existing.total > 0) throw new Error('已评价过此订单')

    const now = new Date()
    const commentData = {
      order_id,
      product_id: order.product_id,
      buyer_id: schoolUser._id,
      seller_id: order.seller_id,
      rating: Number(rating),
      content: content || '',
      tags: Array.isArray(tags) ? tags : [],
      anonymous: !!anonymous,
      create_date: now,
    }
    const addRes = await db.collection('comments').add(commentData)

    await db.collection('products').doc(order.product_id).update({
      comment_count: dbCmd.inc(1),
      update_date: now,
    }).catch(function () {})

    return { comment: { _id: addRes.id, ...commentData } }
  },

  getByProduct: async (params, context) => {
    const { product_id, page = 1 } = params
    const size = Math.min(params.size || 10, 50)
    if (!product_id) throw new Error('缺少 product_id')

    const [listRes, countRes] = await Promise.all([
      db.collection('comments').where({ product_id })
        .orderBy('create_date', 'desc')
        .skip((page - 1) * size).limit(size)
        .get(),
      db.collection('comments').where({ product_id }).count(),
    ])

    let currentSchoolUserId = null
    if (context.UNIID_USER && context.UNIID_USER._id) {
      const su = await db.collection('school_users')
        .where({ user_id: context.UNIID_USER._id })
        .field({ _id: true })
        .get()
      currentSchoolUserId = su.data && su.data[0] && su.data[0]._id
    }
    const list = await enrichComments(listRes.data, currentSchoolUserId)
    return { list, total: countRes.total }
  },

  getBySeller: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const sellerId = params.seller_id || schoolUser._id
    const { page = 1 } = params
    const size = Math.min(params.size || 10, 50)

    const [listRes, countRes] = await Promise.all([
      db.collection('comments').where({ seller_id: sellerId })
        .orderBy('create_date', 'desc')
        .skip((page - 1) * size).limit(size)
        .get(),
      db.collection('comments').where({ seller_id: sellerId }).count(),
    ])
    const list = await enrichComments(listRes.data, schoolUser._id)
    return { list, total: countRes.total }
  },
}

exports.main = async (event, context) => {
  const { action, params = {} } = event
  if (!ACTIONS[action]) {
    return { code: -1, msg: '未知操作: ' + action }
  }
  try {
    const data = await ACTIONS[action](params, context)
    return { code: 0, msg: 'success', data }
  } catch (error) {
    console.error('[comment-co.' + action + ']', error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}