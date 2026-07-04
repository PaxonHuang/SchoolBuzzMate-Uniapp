'use strict'

const db = uniCloud.database()
const dbCmd = db.command

async function resolveSellersMap(sellerIds) {
  const map = {}
  if (sellerIds.length === 0) return map

  const suRes = await db.collection('school_users')
    .where({ _id: dbCmd.in(sellerIds) })
    .field({ _id: true, user_id: true })
    .get()
  const userIds = suRes.data.map(function (s) { return s.user_id }).filter(Boolean)
  const userMap = {}
  if (userIds.length > 0) {
    const uRes = await db.collection('uni-id-users')
      .where({ _id: dbCmd.in(userIds) })
      .field({ _id: true, nickname: true, avatar: true })
      .get()
    uRes.data.forEach(function (u) { userMap[u._id] = u })
  }
  suRes.data.forEach(function (s) {
    const u = userMap[s.user_id] || {}
    map[s._id] = {
      _id: s._id,
      nickname: u.nickname || '匿名用户',
      avatar: u.avatar || '',
    }
  })
  return map
}

const ACTIONS = {
  toggle: async (params, context) => {
    const userId = context.UNIID_USER && context.UNIID_USER._id
    if (!userId) throw new Error('请先登录')
    const { product_id } = params
    if (!product_id) throw new Error('缺少 product_id')

    const pRes = await db.collection('products').doc(product_id).get()
    if (!pRes.data || pRes.data.length === 0) throw new Error('商品不存在')

    const fRes = await db.collection('favorites')
      .where({ user_id: userId, product_id })
      .get()
    const isFavorited = fRes.data && fRes.data.length > 0

    if (isFavorited) {
      await db.collection('favorites').doc(fRes.data[0]._id).remove()
    } else {
      await db.collection('favorites').add({
        user_id: userId,
        product_id,
        create_date: new Date(),
      })
    }

    const cnt = await db.collection('favorites').where({ product_id }).count()
    return { is_favorited: !isFavorited, favorite_count: cnt.total }
  },

  getList: async (params, context) => {
    const userId = context.UNIID_USER && context.UNIID_USER._id
    if (!userId) throw new Error('请先登录')

    const { page = 1 } = params
    const size = Math.min(params.size || 20, 50)

    const [favRes, countRes] = await Promise.all([
      db.collection('favorites').where({ user_id: userId })
        .orderBy('create_date', 'desc')
        .skip((page - 1) * size).limit(size)
        .get(),
      db.collection('favorites').where({ user_id: userId }).count(),
    ])

    if (favRes.data.length === 0) {
      return { list: [], total: countRes.total }
    }

    const productIds = favRes.data.map(function (f) { return f.product_id })
    const pRes = await db.collection('products')
      .where({ _id: dbCmd.in(productIds) })
      .field({
        _id: true, title: true, price: true, condition: true, category: true,
        images: true, seller_id: true, like_count: true, view_count: true, publish_time: true, status: true,
      })
      .get()

    const productMap = {}
    pRes.data.forEach(function (p) {
      productMap[p._id] = Object.assign({}, p, {
        images: p.images && p.images.length > 0 ? [p.images[0]] : [],
      })
    })

    const sellerIds = [...new Set(pRes.data.map(function (p) { return p.seller_id }).filter(Boolean))]
    const sellersMap = await resolveSellersMap(sellerIds)

    const list = favRes.data.map(function (f) {
      const product = productMap[f.product_id]
      if (!product) return null
      return {
        _id: f._id,
        favorite_time: f.create_date,
        product: Object.assign({}, product, {
          seller: sellersMap[product.seller_id] || { _id: '', nickname: '匿名用户', avatar: '' },
          is_favorited: true,
        }),
      }
    }).filter(Boolean)

    return { list, total: countRes.total }
  },

  checkBatch: async (params, context) => {
    const userId = context.UNIID_USER && context.UNIID_USER._id
    if (!userId) return { favorited: [] }
    const { product_ids } = params
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return { favorited: [] }
    }
    const res = await db.collection('favorites')
      .where({ user_id: userId, product_id: dbCmd.in(product_ids) })
      .field({ product_id: true })
      .get()
    return { favorited: res.data.map(function (f) { return f.product_id }) }
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
    console.error('[favorites-co.' + action + ']', error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}