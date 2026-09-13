'use strict'

const db = uniCloud.database()
const dbCmd = db.command

/** 解析卖家信息（school_users → uni-id-users 双表查询） */
async function resolveSellers(sellerIds) {
  const sellersMap = {}
  if (sellerIds.length === 0) return sellersMap

  const sellerRes = await db.collection('school_users')
    .where({ _id: dbCmd.in(sellerIds) })
    .field({ _id: true, user_id: true })
    .get()
  const userIds = sellerRes.data.map(s => s.user_id)
  let userMap = {}
  if (userIds.length > 0) {
    const userRes = await db.collection('uni-id-users')
      .where({ _id: dbCmd.in(userIds) })
      .field({ _id: true, nickname: true, avatar: true })
      .get()
    userMap = Object.fromEntries(userRes.data.map(u => [u._id, u]))
  }
  sellerRes.data.forEach(s => {
    sellersMap[s._id] = {
      _id: s._id,
      nickname: userMap[s.user_id]?.nickname || '匿名用户',
      avatar: userMap[s.user_id]?.avatar || '',
    }
  })
  return sellersMap
}

const ACTIONS = {
  /** 商品列表（分页+筛选+排序） */
  getList: async (params, context) => {
    const { page = 1, school_id, category, condition, sort = 'newest', status = 1 } = params
    const size = Math.min(params.size || 10, 50)

    const where = { status }
    if (school_id) where.school_id = school_id
    if (category) where.category = category
    if (condition) where.condition = condition

    const sortField = sort === 'price_asc' || sort === 'price_desc' ? 'price' : 'publish_time'
    const sortOrder = sort === 'price_asc' ? 'asc' : 'desc'

    const [listRes, countRes] = await Promise.all([
      db.collection('products')
        .where(where)
        .orderBy(sortField, sortOrder)
        .skip((page - 1) * size)
        .limit(size)
        .field({
          _id: true, title: true, price: true, condition: true,
          category: true, images: true, seller_id: true,
          like_count: true, view_count: true, publish_time: true,
        })
        .get(),
      db.collection('products').where(where).count(),
    ])

    const sellerIds = [...new Set(listRes.data.map(p => p.seller_id))]
    const sellersMap = await resolveSellers(sellerIds)

    let likedSet = new Set()
    const userId = context.UNIID_USER?._id
    if (userId && listRes.data.length > 0) {
      const likeRes = await db.collection('product_likes')
        .where({
          user_id: userId,
          product_id: dbCmd.in(listRes.data.map(p => p._id)),
        })
        .field({ product_id: true })
        .get()
      likedSet = new Set(likeRes.data.map(l => l.product_id))
    }

    const list = listRes.data.map(product => ({
      ...product,
      images: product.images?.length > 0 ? [product.images[0]] : [],
      seller: sellersMap[product.seller_id] || { _id: '', nickname: '匿名用户', avatar: '' },
      is_liked: likedSet.has(product._id),
    }))

    return { list, total: countRes.total }
  },

  /** 商品详情 */
  getDetail: async (params, context) => {
    const { product_id } = params
    if (!product_id) throw new Error('缺少商品ID')

    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) {
      throw new Error('商品不存在')
    }
    const product = productRes.data[0]

    db.collection('products').doc(product_id).update({
      view_count: dbCmd.inc(1),
    }).catch(() => {})

    let seller = { _id: '', nickname: '匿名用户', avatar: '', credit_score: 100, school_name: '', college: '', product_count: 0 }
    const schoolUserRes = await db.collection('school_users').doc(product.seller_id).get()
    if (schoolUserRes.data && schoolUserRes.data.length > 0) {
      const schoolUser = schoolUserRes.data[0]
      const userRes = await db.collection('uni-id-users').doc(schoolUser.user_id).get()
      const user = userRes.data?.[0] || {}
      let schoolName = ''
      if (schoolUser.school_id) {
        const schoolRes = await db.collection('schools').doc(schoolUser.school_id).get()
        schoolName = schoolRes.data?.[0]?.name || ''
      }
      const productCountRes = await db.collection('products')
        .where({ seller_id: product.seller_id, status: 1 })
        .count()
      seller = {
        _id: product.seller_id,
        nickname: user.nickname || '匿名用户',
        avatar: user.avatar || '',
        credit_score: schoolUser.credit_score || 100,
        school_name: schoolName,
        college: schoolUser.college || '',
        product_count: productCountRes.total,
      }
    }

    let is_liked = false
    let is_owner = false
    const userId = context.UNIID_USER?._id
    if (userId) {
      // Check if current user is the seller by comparing school_users._id
      const ownerCheck = await db.collection('school_users')
        .where({ user_id: userId })
        .field({ _id: true })
        .get()
      is_owner = ownerCheck.data?.[0]?._id === product.seller_id
      const likeRes = await db.collection('product_likes')
        .where({ user_id: userId, product_id })
        .count()
      is_liked = likeRes.total > 0
    }

    return { product, seller, is_liked, is_owner }
  },

  /** 发布商品 */
  create: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true, school_id: true })
      .get()
    if (!schoolUserRes.data || schoolUserRes.data.length === 0) {
      throw new Error('请先完成学生认证')
    }
    const schoolUser = schoolUserRes.data[0]

    const {
      title, description, images, price, original_price,
      category, condition, trade_method, location,
    } = params

    if (!title || title.length < 2 || title.length > 50) throw new Error('标题需2-50个字')
    if (!description || description.length > 500) throw new Error('描述不能超过500字')
    if (!images || images.length < 1 || images.length > 6) throw new Error('请上传1-6张图片')
    if (!price || price <= 0) throw new Error('请输入合理的价格')
    if (!category) throw new Error('请选择分类')
    if (!condition) throw new Error('请选择成色')
    if (!trade_method || trade_method.length === 0) throw new Error('请选择交易方式')

    const now = new Date()
    const productData = {
      seller_id: schoolUser._id,
      school_id: schoolUser.school_id,
      category,
      title: title.trim(),
      description: description.trim(),
      images,
      original_price: original_price || 0,
      price: Number(price),
      condition,
      trade_method,
      location: location || '',
      status: 1,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      publish_time: now,
      create_date: now,
      update_date: now,
    }

    const addRes = await db.collection('products').add(productData)
    return { product: { _id: addRes.id, ...productData } }
  },

  /** 编辑商品 */
  update: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id, ...updateFields } = params
    if (!product_id) throw new Error('缺少商品ID')

    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) throw new Error('商品不存在')
    const product = productRes.data[0]

    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true })
      .get()
    if (!schoolUserRes.data?.[0] || schoolUserRes.data[0]._id !== product.seller_id) {
      throw new Error('无权编辑此商品')
    }

    const allowedFields = ['title', 'description', 'images', 'price', 'original_price', 'category', 'condition', 'trade_method', 'location']
    const data = { update_date: new Date() }
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        data[key] = updateFields[key]
      }
    }

    await db.collection('products').doc(product_id).update(data)
    const updated = await db.collection('products').doc(product_id).get()
    return { product: updated.data[0] }
  },

  /** 删除商品（软删除） */
  delete: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id } = params
    if (!product_id) throw new Error('缺少商品ID')

    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) throw new Error('商品不存在')

    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true })
      .get()
    if (!schoolUserRes.data?.[0] || schoolUserRes.data[0]._id !== productRes.data[0].seller_id) {
      throw new Error('无权删除此商品')
    }

    await db.collection('products').doc(product_id).update({
      status: 0,
      update_date: new Date(),
    })
    return { success: true }
  },

  /** 点赞/取消点赞 */
  toggleLike: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id } = params
    if (!product_id) throw new Error('缺少商品ID')

    const likeRes = await db.collection('product_likes')
      .where({ user_id: userId, product_id })
      .get()

    const isLiked = likeRes.data && likeRes.data.length > 0

    if (isLiked) {
      await db.collection('product_likes').doc(likeRes.data[0]._id).remove()
      await db.collection('products').doc(product_id).update({
        like_count: dbCmd.inc(-1),
        // guard: like_count = max(0, like_count - 1) — handled by schema default 0
      })
    } else {
      await db.collection('product_likes').add({
        user_id: userId,
        product_id,
        create_date: new Date(),
      })
      await db.collection('products').doc(product_id).update({ like_count: dbCmd.inc(1) })
    }

    const productRes = await db.collection('products').doc(product_id)
      .field({ like_count: true })
      .get()

    return {
      is_liked: !isLiked,
      like_count: productRes.data?.[0]?.like_count || 0,
    }
  },

  /** 上架/下架 */
  toggleStatus: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id, status } = params
    if (!product_id) throw new Error('缺少商品ID')
    if (status !== 0 && status !== 1) throw new Error('无效状态值')

    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) throw new Error('商品不存在')

    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true })
      .get()
    if (!schoolUserRes.data?.[0] || schoolUserRes.data[0]._id !== productRes.data[0].seller_id) {
      throw new Error('无权操作此商品')
    }

    await db.collection('products').doc(product_id).update({
      status,
      update_date: new Date(),
    })
    return { success: true }
  },

  /** 关键词搜索 */
  search: async (params, context) => {
    const { keyword, school_id, page = 1 } = params
    const size = Math.min(params.size || 10, 50)
    if (!keyword || !keyword.trim()) throw new Error('请输入搜索关键词')

    const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const where = {
      status: 1,
      title: new RegExp(escaped, 'i'),
    }
    if (school_id) where.school_id = school_id

    const [listRes, countRes] = await Promise.all([
      db.collection('products')
        .where(where)
        .orderBy('publish_time', 'desc')
        .skip((page - 1) * size)
        .limit(size)
        .field({
          _id: true, title: true, price: true, condition: true,
          category: true, images: true, seller_id: true,
          like_count: true, view_count: true, publish_time: true,
        })
        .get(),
      db.collection('products').where(where).count(),
    ])

    const sellerIds = [...new Set(listRes.data.map(p => p.seller_id))]
    const sellersMap = await resolveSellers(sellerIds)

    const list = listRes.data.map(product => ({
      ...product,
      images: product.images?.length > 0 ? [product.images[0]] : [],
      seller: sellersMap[product.seller_id] || { _id: '', nickname: '匿名用户', avatar: '' },
      is_liked: false,
    }))

    return { list, total: countRes.total }
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
    console.error(`[product-co.${action}]`, error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}
