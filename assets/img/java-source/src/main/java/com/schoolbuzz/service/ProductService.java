package com.schoolbuzz.service;

import com.schoolbuzz.dao.impl.ProductDAOImpl;
import com.schoolbuzz.entity.Product;

import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 商品业务逻辑层
 * 演示业务校验、异常包装、ID 生成。
 */
public class ProductService {

    private final ProductDAOImpl productDAO = new ProductDAOImpl();

    /** 创建商品：参数校验 + ID 生成 */
    public Product create(Product p) throws SQLException {
        validate(p);
        if (p.getId() == null || p.getId().isEmpty()) {
            p.setId("p_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        }
        if (p.getStatus() == null) p.setStatus(Product.Status.ON_SHELF.code);
        if (p.getPublishTime() == null) p.setPublishTime(java.time.LocalDateTime.now());
        if (p.getImages() == null || p.getImages().isEmpty()) {
            throw new IllegalArgumentException("请至少上传一张图片");
        }
        return productDAO.insert(p);
    }

    /** 编辑商品 */
    public int update(Product p) throws SQLException {
        if (p.getTitle() == null || p.getTitle().length() < 2 || p.getTitle().length() > 50) {
            throw new IllegalArgumentException("标题长度需在 2~50 之间");
        }
        if (p.getDescription() != null && p.getDescription().length() > 500) {
            throw new IllegalArgumentException("描述不能超过 500 字");
        }
        return productDAO.update(p);
    }

    /** 软删除（仅卖家本人） */
    public boolean softDelete(String productId, String sellerId) throws SQLException {
        return productDAO.softDelete(productId, sellerId) > 0;
    }

    /** 商品列表 */
    public ProductDAOImpl.PageResult<Product> list(String schoolId, String category, String condition,
                                                   String sort, int page, int size) throws SQLException {
        size = Math.min(Math.max(size, 1), 50);
        page = Math.max(page, 1);
        return productDAO.findList(schoolId, category, condition, sort, page, size);
    }

    /** 商品详情 */
    public ProductDAOImpl.ProductDetailVO detail(String productId, String currentUserId) throws SQLException {
        if (productId == null || productId.isEmpty()) throw new IllegalArgumentException("缺少商品ID");
        return productDAO.findDetail(productId, currentUserId);
    }

    /** 切换点赞 */
    public ProductDAOImpl.ToggleLikeResult toggleLike(String userId, String productId) throws SQLException {
        if (userId == null || userId.isEmpty()) throw new IllegalArgumentException("请先登录");
        return productDAO.toggleLike(userId, productId);
    }

    /** 搜索 */
    public ProductDAOImpl.PageResult<Product> search(String keyword, String schoolId, int page, int size)
            throws SQLException {
        if (keyword == null || keyword.trim().isEmpty()) throw new IllegalArgumentException("请输入搜索关键词");
        size = Math.min(Math.max(size, 1), 50);
        page = Math.max(page, 1);
        return productDAO.search(keyword.trim(), schoolId, page, size);
    }

    /** 我的商品 */
    public List<Product> myProducts(String sellerId) throws SQLException {
        return productDAO.findBySeller(sellerId);
    }

    /** 创建商品时的入参校验 */
    private void validate(Product p) {
        if (p == null) throw new IllegalArgumentException("商品不能为空");
        if (p.getTitle() == null || p.getTitle().length() < 2 || p.getTitle().length() > 50) {
            throw new IllegalArgumentException("标题长度需在 2~50 之间");
        }
        if (p.getDescription() == null || p.getDescription().isEmpty()) {
            throw new IllegalArgumentException("描述不能为空");
        }
        if (p.getDescription().length() > 500) {
            throw new IllegalArgumentException("描述不能超过 500 字");
        }
        if (p.getImages() == null || p.getImages().isEmpty() || p.getImages().size() > 6) {
            throw new IllegalArgumentException("请上传 1~6 张图片");
        }
        if (p.getPrice() == null || p.getPrice().doubleValue() <= 0) {
            throw new IllegalArgumentException("请输入合理的价格");
        }
        if (p.getCategory() == null || p.getCategory().isEmpty()) {
            throw new IllegalArgumentException("请选择分类");
        }
        if (p.getCondition() == null || p.getCondition().isEmpty()) {
            throw new IllegalArgumentException("请选择成色");
        }
        if (p.getTradeMethod() == null || p.getTradeMethod().isEmpty()) {
            throw new IllegalArgumentException("请选择至少一种交易方式");
        }
        if (p.getSellerId() == null || p.getSellerId().isEmpty()) {
            throw new IllegalArgumentException("缺少卖家信息");
        }
        if (p.getSchoolId() == null || p.getSchoolId().isEmpty()) {
            throw new IllegalArgumentException("缺少学校信息");
        }
    }
}