'use strict'

const db = uniCloud.database()
const dbCmd = db.command

function genOrderNo() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const ts = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
    + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
  return 'SJ' + ts + rnd
}

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

async function resolveUsers(buyerId, sellerId) {
  const ids = []
  if (buyerId) ids.push(buyerId)
  if (sellerId) ids.push(sellerId)
  const out = { buyer: null, seller: null }
  if (ids.length === 0) return out

  const suRes = await db.collection('school_users')
    .where({ _id: dbCmd.in(ids) })
    .field({ _id: true, user_id: true, school_id: true, credit_score: true })
    .get()
  const userIds = suRes.data.map(function (s) { return s.user_id })
  const userMap = {}
  if (userIds.length > 0) {
    const uRes = await db.collection('uni-id-users')
      .where({ _id: dbCmd.in(userIds) })
      .field({ _id: true, nickname: true, avatar: true })
      .get()
    uRes.data.forEach(function (u) { userMap[u._id] = u })
  }
  const schoolIds = suRes.data.map(function (s) { return s.school_id }).filter(Boolean)
  const schoolMap = {}
  if (schoolIds.length > 0) {
    const sRes = await db.collection('schools')
      .where({ _id: dbCmd.in(schoolIds) })
      .field({ _id: true, name: true })
      .get()
    sRes.data.forEach(function (s) { schoolMap[s._id] = s.name })
  }
  suRes.data.forEach(function (s) {
    const u = userMap[s.user_id] || {}
    const info = {
      _id: s._id,
      nickname: u.nickname || '匿名用户',
      avatar: u.avatar || '',
      credit_score: s.credit_score || 100,
      school_name: schoolMap[s.school_id] || '',
    }
    if (s._id === buyerId) out.buyer = info
    if (s._id === sellerId) out.seller = info
  })
  return out
}

const ACTIONS = {
  getList: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { page = 1, role, status } = params
    const size = Math.min(params.size || 10, 50)
    if (role !== 'buyer' && role !== 'seller') {
      throw new Error('role 必填且为 buyer/seller')
    }
    const where = role === 'buyer' ? { buyer_id: schoolUser._id } : { seller_id: schoolUser._id }
    if (status !== undefined && status !== null) where.status = status

    const [listRes, countRes] = await Promise.all([
      db.collection('orders').where(where)
        .orderBy('create_date', 'desc')
        .skip((page - 1) * size).limit(size)
        .get(),
      db.collection('orders').where(where).count(),
    ])

    const enriched = await Promise.all(listRes.data.map(async function (o) {
      const cpId = role === 'buyer' ? o.seller_id : o.buyer_id
      const { buyer, seller } = await resolveUsers(o.buyer_id, o.seller_id)
      const cp = role === 'buyer' ? seller : buyer
      return Object.assign({}, o, {
        counterparty: cp || { _id: cpId, nickname: '匿名用户', avatar: '' },
      })
    }))

    return { list: enriched, total: countRes.total }
  },

  getDetail: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { order_id } = params
    if (!order_id) throw new Error('缺少 order_id')

    const res = await db.collection('orders').doc(order_id).get()
    if (!res.data || res.data.length === 0) throw new Error('订单不存在')
    const order = res.data[0]
    if (order.buyer_id !== schoolUser._id && order.seller_id !== schoolUser._id) {
      throw new Error('无权查看此订单')
    }
    const role = order.buyer_id === schoolUser._id ? 'buyer' : 'seller'
    const { buyer, seller } = await resolveUsers(order.buyer_id, order.seller_id)
    return { order, role, buyer, seller }
  },

  create: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { product_id, trade_method, address, remark } = params
    if (!product_id) throw new Error('缺少 product_id')
    if (trade_method !== 'self_pickup' && trade_method !== 'express') {
      throw new Error('交易方式无效')
    }
    if (trade_method === 'express' && !address) {
      throw new Error('快递交易必须填写收货地址')
    }

    const pRes = await db.collection('products').doc(product_id).get()
    if (!pRes.data || pRes.data.length === 0) throw new Error('商品不存在')
    const product = pRes.data[0]
    if (product.status !== 1) throw new Error('商品已下架或已售出')
    if (product.seller_id === schoolUser._id) throw new Error('不能购买自己的商品')

    const snapshot = {
      title: product.title,
      price: product.price,
      original_price: product.original_price || 0,
      images: product.images || [],
      category: product.category,
      condition: product.condition,
      trade_method: product.trade_method || [],
    }

    const now = new Date()
    const orderData = {
      order_no: genOrderNo(),
      buyer_id: schoolUser._id,
      seller_id: product.seller_id,
      product_id,
      product_snapshot: snapshot,
      amount: product.price,
      pay_amount: product.price,
      status: 0,
      trade_method,
      address: address || null,
      remark: remark || '',
      status_log: [{
        status: 0, operator_id: schoolUser._id, operator_role: 'buyer', time: now, note: '买家下单',
      }],
      create_date: now,
      update_date: now,
    }
    const addRes = await db.collection('orders').add(orderData)
    return { order: { _id: addRes.id, ...orderData } }
  },

  cancel: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { order_id, reason } = params
    if (!order_id) throw new Error('缺少 order_id')

    const res = await db.collection('orders').doc(order_id).get()
    if (!res.data || res.data.length === 0) throw new Error('订单不存在')
    const order = res.data[0]
    if (order.buyer_id !== schoolUser._id && order.seller_id !== schoolUser._id) {
      throw new Error('无权操作此订单')
    }
    if (order.status !== 0 && order.status !== 1) {
      throw new Error('当前订单状态不可取消')
    }
    const now = new Date()
    const role = order.buyer_id === schoolUser._id ? 'buyer' : 'seller'
    const log = (order.status_log || []).concat([{
      status: 4, operator_id: schoolUser._id, operator_role: role, time: now,
      note: reason ? ('取消: ' + reason) : '取消订单',
    }])
    await db.collection('orders').doc(order_id).update({
      status: 4,
      status_log: log,
      cancelled_at: now,
      cancel_reason: reason || '',
      update_date: now,
    })
    return { success: true }
  },

  pay: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { order_id } = params
    if (!order_id) throw new Error('缺少 order_id')

    const res = await db.collection('orders').doc(order_id).get()
    if (!res.data || res.data.length === 0) throw new Error('订单不存在')
    const order = res.data[0]
    if (order.buyer_id !== schoolUser._id) throw new Error('只有买家可以支付')
    if (order.status !== 0) throw new Error('当前订单状态不可支付')

    const now = new Date()
    const log = (order.status_log || []).concat([{
      status: 1, operator_id: schoolUser._id, operator_role: 'buyer', time: now, note: '买家已支付',
    }])
    await db.collection('orders').doc(order_id).update({
      status: 1,
      status_log: log,
      paid_at: now,
      update_date: now,
    })
    return { success: true }
  },

  ship: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { order_id } = params
    if (!order_id) throw new Error('缺少 order_id')

    const res = await db.collection('orders').doc(order_id).get()
    if (!res.data || res.data.length === 0) throw new Error('订单不存在')
    const order = res.data[0]
    if (order.seller_id !== schoolUser._id) throw new Error('只有卖家可以发货')
    if (order.trade_method !== 'express') throw new Error('非快递订单无需发货')
    if (order.status !== 1) throw new Error('订单未支付或已发货')

    const now = new Date()
    const log = (order.status_log || []).concat([{
      status: 2, operator_id: schoolUser._id, operator_role: 'seller', time: now, note: '卖家已发货',
    }])
    await db.collection('orders').doc(order_id).update({
      status: 2,
      status_log: log,
      shipped_at: now,
      update_date: now,
    })
    return { success: true }
  },

  confirm: async (params, context) => {
    const { schoolUser } = await getSchoolUser(context)
    const { order_id } = params
    if (!order_id) throw new Error('缺少 order_id')

    const res = await db.collection('orders').doc(order_id).get()
    if (!res.data || res.data.length === 0) throw new Error('订单不存在')
    const order = res.data[0]
    if (order.buyer_id !== schoolUser._id) throw new Error('只有买家可以确认收货')
    if (order.trade_method === 'express' && order.status !== 2) throw new Error('订单未发货')
    if (order.trade_method === 'self_pickup' && order.status !== 1) throw new Error('订单状态不允许确认')
    if (order.status === 3) return { success: true }

    const now = new Date()
    const log = (order.status_log || []).concat([{
      status: 3, operator_id: schoolUser._id, operator_role: 'buyer', time: now, note: '交易完成',
    }])
    const updateData = {
      status: 3,
      status_log: log,
      completed_at: now,
      update_date: now,
    }
    if (order.trade_method === 'express') updateData.received_at = now
    await db.collection('orders').doc(order_id).update(updateData)
    await db.collection('products').doc(order.product_id).update({
      status: 2,
      update_date: now,
    }).catch(function () {})
    return { success: true }
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
    console.error('[order-co.' + action + ']', error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}