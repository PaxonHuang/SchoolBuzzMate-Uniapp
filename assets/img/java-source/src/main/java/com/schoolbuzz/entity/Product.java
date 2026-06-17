package com.schoolbuzz.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * 商品实体
 * 对应数据库 products 表，seller_id 指向 school_users.id。
 */
public class Product {

    /** 商品分类枚举 */
    public enum Category {
        TEXTBOOK("textbook", "教材资料", "📚"),
        DIGITAL("digital", "数码电子", "📱"),
        CLOTHING("clothing", "服饰鞋包", "👔"),
        DAILY("daily", "生活用品", "🏠"),
        SPORTS("sports", "运动户外", "🏃"),
        OTHER("other", "其他杂项", "🎨");

        public final String code;
        public final String label;
        public final String icon;

        Category(String code, String label, String icon) {
            this.code = code;
            this.label = label;
            this.icon = icon;
        }

        public static Category fromCode(String code) {
            for (Category c : values()) {
                if (c.code.equalsIgnoreCase(code)) return c;
            }
            return OTHER;
        }
    }

    /** 商品成色枚举 */
    public enum Condition {
        BRAND_NEW("brand_new", "全新"),
        LIKE_NEW("like_new", "几乎全新"),
        USED("used", "已使用"),
        OLD("old", "较旧");

        public final String code;
        public final String label;
        Condition(String code, String label) { this.code = code; this.label = label; }

        public static Condition fromCode(String code) {
            for (Condition c : values()) {
                if (c.code.equalsIgnoreCase(code)) return c;
            }
            return USED;
        }
    }

    /** 交易方式 */
    public enum TradeMethod {
        SELF_PICKUP("self_pickup", "自提"),
        EXPRESS("express", "快递");

        public final String code;
        public final String label;
        TradeMethod(String code, String label) { this.code = code; this.label = label; }
    }

    /** 商品状态机：0下架 1上架 2已售 */
    public enum Status { OFF_SHELF(0), ON_SHELF(1), SOLD(2);
        public final int code;
        Status(int code) { this.code = code; }
    }

    private String id;
    private String sellerId;
    private String schoolId;
    private String category;
    private String title;
    private String description;
    private List<String> images;
    private BigDecimal originalPrice;
    private BigDecimal price;
    private String condition;
    private List<String> tradeMethod;
    private String location;
    private Integer status;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private LocalDateTime publishTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 关联对象
    private SchoolUser seller;
    private Boolean liked;

    public Product() {
        this.status = Status.ON_SHELF.code;
        this.viewCount = 0;
        this.likeCount = 0;
        this.commentCount = 0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSellerId() { return sellerId; }
    public void setSellerId(String sellerId) { this.sellerId = sellerId; }

    public String getSchoolId() { return schoolId; }
    public void setSchoolId(String schoolId) { this.schoolId = schoolId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public List<String> getTradeMethod() { return tradeMethod; }
    public void setTradeMethod(List<String> tradeMethod) { this.tradeMethod = tradeMethod; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }

    public Integer getLikeCount() { return likeCount; }
    public void setLikeCount(Integer likeCount) { this.likeCount = likeCount; }

    public Integer getCommentCount() { return commentCount; }
    public void setCommentCount(Integer commentCount) { this.commentCount = commentCount; }

    public LocalDateTime getPublishTime() { return publishTime; }
    public void setPublishTime(LocalDateTime publishTime) { this.publishTime = publishTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public SchoolUser getSeller() { return seller; }
    public void setSeller(SchoolUser seller) { this.seller = seller; }

    public Boolean getLiked() { return liked; }
    public void setLiked(Boolean liked) { this.liked = liked; }

    public String getFirstImage() {
        return images == null || images.isEmpty() ? "" : images.get(0);
    }

    public Category getCategoryEnum() {
        return Category.fromCode(category);
    }

    public Condition getConditionEnum() {
        return Condition.fromCode(condition);
    }

    public String getTradeMethodsDisplay() {
        if (tradeMethod == null || tradeMethod.isEmpty()) return "未指定";
        StringBuilder sb = new StringBuilder();
        for (String m : tradeMethod) {
            if ("self_pickup".equals(m)) sb.append("自提 ");
            else if ("express".equals(m)) sb.append("快递 ");
        }
        return sb.toString().trim();
    }

    @Override
    public String toString() {
        return "Product{id='" + id + "', title='" + title + "', price=" + price + "}";
    }
}