package com.schoolbuzz.dao.impl;

import com.schoolbuzz.dao.BaseDAO;
import com.schoolbuzz.entity.Product;
import com.schoolbuzz.util.DBUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 商品数据访问对象
 * 演示 JOIN 查询、JSON 字段读写、事务处理。
 */
public class ProductDAOImpl extends BaseDAO<Product, String> {

    @Override protected Class<Product> entityClass() { return Product.class; }
    @Override protected String primaryKeyColumn() { return "id"; }
    @Override protected String tableName() { return "products"; }

    @Override
    protected Product mapRow(ResultSet rs) throws SQLException {
        Product p = new Product();
        p.setId(rs.getString("id"));
        p.setSellerId(rs.getString("seller_id"));
        p.setSchoolId(rs.getString("school_id"));
        p.setCategory(rs.getString("category"));
        p.setTitle(rs.getString("title"));
        p.setDescription(rs.getString("description"));
        String imagesJson = rs.getString("images");
        p.setImages(imagesJson == null ? new ArrayList<>() : parseJsonArray(imagesJson));
        p.setOriginalPrice(rs.getBigDecimal("original_price"));
        p.setPrice(rs.getBigDecimal("price"));
        p.setCondition(rs.getString("condition"));
        String tmJson = rs.getString("trade_method");
        p.setTradeMethod(tmJson == null ? new ArrayList<>() : parseJsonArray(tmJson));
        p.setLocation(rs.getString("location"));
        p.setStatus(rs.getInt("status"));
        p.setViewCount(rs.getInt("view_count"));
        p.setLikeCount(rs.getInt("like_count"));
        p.setCommentCount(rs.getInt("comment_count"));
        Timestamp ts = rs.getTimestamp("publish_time");
        if (ts != null) p.setPublishTime(ts.toLocalDateTime());
        ts = rs.getTimestamp("created_at");
        if (ts != null) p.setCreatedAt(ts.toLocalDateTime());
        ts = rs.getTimestamp("updated_at");
        if (ts != null) p.setUpdatedAt(ts.toLocalDateTime());
        return p;
    }

    @Override
    public Product insert(Product entity) throws SQLException {
        String sql = "INSERT INTO products(id, seller_id, school_id, category, title, description, images, " +
                     "original_price, price, `condition`, trade_method, location, status, view_count, " +
                     "like_count, comment_count, publish_time, created_at, updated_at) " +
                     "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            LocalDateTime now = LocalDateTime.now();
            ps.setString(1, entity.getId());
            ps.setString(2, entity.getSellerId());
            ps.setString(3, entity.getSchoolId());
            ps.setString(4, entity.getCategory());
            ps.setString(5, entity.getTitle());
            ps.setString(6, entity.getDescription());
            ps.setString(7, toJsonArray(entity.getImages()));
            ps.setBigDecimal(8, entity.getOriginalPrice());
            ps.setBigDecimal(9, entity.getPrice());
            ps.setString(10, entity.getCondition());
            ps.setString(11, toJsonArray(entity.getTradeMethod()));
            ps.setString(12, entity.getLocation());
            ps.setInt(13, entity.getStatus() == null ? 1 : entity.getStatus());
            ps.setInt(14, entity.getViewCount() == null ? 0 : entity.getViewCount());
            ps.setInt(15, entity.getLikeCount() == null ? 0 : entity.getLikeCount());
            ps.setInt(16, entity.getCommentCount() == null ? 0 : entity.getCommentCount());
            ps.setTimestamp(17, Timestamp.valueOf(entity.getPublishTime() == null ? now : entity.getPublishTime()));
            ps.setTimestamp(18, Timestamp.valueOf(now));
            ps.setTimestamp(19, Timestamp.valueOf(now));
            ps.executeUpdate();
            return entity;
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    @Override
    public int update(Product entity) throws SQLException {
        String sql = "UPDATE products SET title=?, description=?, images=?, original_price=?, price=?, " +
                     "`condition`=?, trade_method=?, location=?, status=?, updated_at=? WHERE id=?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getTitle());
            ps.setString(2, entity.getDescription());
            ps.setString(3, toJsonArray(entity.getImages()));
            ps.setBigDecimal(4, entity.getOriginalPrice());
            ps.setBigDecimal(5, entity.getPrice());
            ps.setString(6, entity.getCondition());
            ps.setString(7, toJsonArray(entity.getTradeMethod()));
            ps.setString(8, entity.getLocation());
            ps.setInt(9, entity.getStatus());
            ps.setTimestamp(10, Timestamp.valueOf(LocalDateTime.now()));
            ps.setString(11, entity.getId());
            return ps.executeUpdate();
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /**
     * 商品列表（分页 + 筛选 + 排序）
     * 演示多条件动态 SQL 拼接（用 PreparedStatement 防止 SQL 注入）。
     */
    public PageResult<Product> findList(String schoolId, String category, String condition,
                                        String sort, int page, int size) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM products WHERE status = 1");
        StringBuilder cnt = new StringBuilder("SELECT COUNT(*) FROM products WHERE status = 1");
        List<Object> params = new ArrayList<>();
        if (schoolId != null && !schoolId.isEmpty()) {
            sql.append(" AND school_id = ?");
            cnt.append(" AND school_id = ?");
            params.add(schoolId);
        }
        if (category != null && !category.isEmpty()) {
            sql.append(" AND category = ?");
            cnt.append(" AND category = ?");
            params.add(category);
        }
        if (condition != null && !condition.isEmpty()) {
            sql.append(" AND `condition` = ?");
            cnt.append(" AND `condition` = ?");
            params.add(condition);
        }
        String orderBy = "publish_time DESC";
        if ("price_asc".equals(sort))      orderBy = "price ASC";
        else if ("price_desc".equals(sort)) orderBy = "price DESC";
        sql.append(" ORDER BY ").append(orderBy).append(" LIMIT ? OFFSET ?");

        Connection conn = DBUtil.getConnection();
        try (PreparedStatement psCnt = conn.prepareStatement(cnt.toString())) {
            for (int i = 0; i < params.size(); i++) psCnt.setObject(i + 1, params.get(i));
            try (ResultSet rs = psCnt.executeQuery()) {
                long total = rs.next() ? rs.getLong(1) : 0;
                List<Product> list = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                    int idx = 1;
                    for (Object p : params) ps.setObject(idx++, p);
                    ps.setInt(idx++, size);
                    ps.setInt(idx, (page - 1) * size);
                    try (ResultSet rs2 = ps.executeQuery()) {
                        while (rs2.next()) list.add(mapRow(rs2));
                    }
                }
                return new PageResult<>(list, total, page, size);
            }
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /**
     * 商品详情（JOIN 查询卖家信息）
     * 演示多表关联查询。
     */
    public ProductDetailVO findDetail(String productId, String currentUserId) throws SQLException {
        String sql = "SELECT p.*, u.nickname AS seller_nickname, u.avatar AS seller_avatar, " +
                     "       su.credit_score, su.college, s.name AS school_name " +
                     "FROM products p " +
                     "JOIN school_users su ON p.seller_id = su.id " +
                     "JOIN users u          ON su.user_id  = u.id " +
                     "LEFT JOIN schools s   ON su.school_id = s.id " +
                     "WHERE p.id = ?";
        Connection conn = DBUtil.getConnection();
        try {
            ProductDetailVO vo;
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, productId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) return null;
                    Product p = mapRow(rs);
                    vo = new ProductDetailVO();
                    vo.product = p;
                    vo.sellerNickname = rs.getString("seller_nickname");
                    vo.sellerAvatar   = rs.getString("seller_avatar");
                    vo.sellerCredit   = rs.getInt("credit_score");
                    vo.sellerCollege  = rs.getString("college");
                    vo.sellerSchool   = rs.getString("school_name");
                }
            }
            // 浏览数 +1
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE products SET view_count = view_count + 1 WHERE id = ?")) {
                ps.setString(1, productId);
                ps.executeUpdate();
            }
            // 查询当前用户是否点赞
            if (currentUserId != null && !currentUserId.isEmpty()) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT 1 FROM product_likes WHERE user_id=? AND product_id=? LIMIT 1")) {
                    ps.setString(1, currentUserId);
                    ps.setString(2, productId);
                    try (ResultSet rs = ps.executeQuery()) {
                        vo.liked = rs.next();
                    }
                }
            }
            return vo;
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /**
     * 切换点赞（事务示例：插入/删除点赞 + 计数更新在同一事务）
     */
    public ToggleLikeResult toggleLike(String userId, String productId) throws SQLException {
        Connection conn = DBUtil.getConnection();
        boolean originalAutoCommit = conn.getAutoCommit();
        try {
            conn.setAutoCommit(false);
            boolean liked;
            int delta;
            // 查询是否已点赞
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id FROM product_likes WHERE user_id=? AND product_id=?")) {
                ps.setString(1, userId);
                ps.setString(2, productId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        try (PreparedStatement del = conn.prepareStatement(
                                "DELETE FROM product_likes WHERE id=?")) {
                            del.setString(1, rs.getString(1));
                            del.executeUpdate();
                        }
                        delta = -1;
                        liked = false;
                    } else {
                        try (PreparedStatement ins = conn.prepareStatement(
                                "INSERT INTO product_likes(id, user_id, product_id) VALUES(?,?,?)")) {
                            ins.setString(1, "lk_" + System.currentTimeMillis());
                            ins.setString(2, userId);
                            ins.setString(3, productId);
                            ins.executeUpdate();
                        }
                        delta = 1;
                        liked = true;
                    }
                }
            }
            // 更新商品计数
            int newCount;
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE products SET like_count = GREATEST(0, like_count + ?) WHERE id=?")) {
                ps.setInt(1, delta);
                ps.setString(2, productId);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT like_count FROM products WHERE id=?")) {
                ps.setString(1, productId);
                try (ResultSet rs = ps.executeQuery()) {
                    newCount = rs.next() ? rs.getInt(1) : 0;
                }
            }
            conn.commit();
            return new ToggleLikeResult(liked, newCount);
        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(originalAutoCommit);
            DBUtil.close(conn, null, null);
        }
    }

    /** 软删除（status = 0） */
    public int softDelete(String productId, String sellerId) throws SQLException {
        String sql = "UPDATE products SET status=0, updated_at=NOW() WHERE id=? AND seller_id=?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, productId);
            ps.setString(2, sellerId);
            return ps.executeUpdate();
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /** 关键字搜索（正则匹配 title） */
    public PageResult<Product> search(String keyword, String schoolId, int page, int size) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT * FROM products WHERE status=1 AND title REGEXP ?");
        StringBuilder cnt = new StringBuilder(
                "SELECT COUNT(*) FROM products WHERE status=1 AND title REGEXP ?");
        List<Object> params = new ArrayList<>();
        params.add(keyword);
        if (schoolId != null && !schoolId.isEmpty()) {
            sql.append(" AND school_id = ?");
            cnt.append(" AND school_id = ?");
            params.add(schoolId);
        }
        sql.append(" ORDER BY publish_time DESC LIMIT ? OFFSET ?");
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement psCnt = conn.prepareStatement(cnt.toString())) {
            psCnt.setString(1, (String) params.get(0));
            if (params.size() > 1) psCnt.setString(2, (String) params.get(1));
            long total = 0;
            try (ResultSet rs = psCnt.executeQuery()) {
                if (rs.next()) total = rs.getLong(1);
            }
            List<Product> list = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                int idx = 1;
                for (Object p : params) ps.setObject(idx++, p);
                ps.setInt(idx++, size);
                ps.setInt(idx, (page - 1) * size);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) list.add(mapRow(rs));
                }
            }
            return new PageResult<>(list, total, page, size);
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /** 按卖家查询 */
    public List<Product> findBySeller(String sellerId) throws SQLException {
        String sql = "SELECT * FROM products WHERE seller_id=? AND status=1 ORDER BY publish_time DESC";
        List<Product> list = new ArrayList<>();
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sellerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } finally {
            DBUtil.close(conn, null, null);
        }
        return list;
    }

    // === 工具：JSON 数组字符串解析（极简实现，演示字符串处理） ===
    private String toJsonArray(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (String s : list) {
            if (!first) sb.append(",");
            sb.append("\"").append(s.replace("\"", "\\\"")).append("\"");
            first = false;
        }
        sb.append("]");
        return sb.toString();
    }

    private List<String> parseJsonArray(String json) {
        if (json == null) return new ArrayList<>();
        String s = json.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]"))   s = s.substring(0, s.length() - 1);
        if (s.trim().isEmpty()) return new ArrayList<>();
        List<String> out = new ArrayList<>();
        for (String item : s.split(",")) {
            String t = item.trim();
            if (t.startsWith("\"") && t.endsWith("\"")) t = t.substring(1, t.length() - 1);
            t = t.replace("\\\"", "\"");
            out.add(t);
        }
        return out;
    }

    /** 分页结果封装 */
    public static class PageResult<T> {
        public final List<T> list;
        public final long total;
        public final int page;
        public final int size;

        public PageResult(List<T> list, long total, int page, int size) {
            this.list = list; this.total = total; this.page = page; this.size = size;
        }
        public long getTotalPages() { return (total + size - 1) / size; }
    }

    /** 详情视图对象（演示多表 JOIN 时的值对象设计） */
    public static class ProductDetailVO {
        public Product product;
        public String sellerNickname;
        public String sellerAvatar;
        public Integer sellerCredit;
        public String sellerCollege;
        public String sellerSchool;
        public Boolean liked = false;
    }

    /** 点赞结果值对象 */
    public static class ToggleLikeResult {
        public final boolean liked;
        public final int likeCount;
        public ToggleLikeResult(boolean liked, int likeCount) {
            this.liked = liked; this.likeCount = likeCount;
        }
    }
}