package com.schoolbuzz.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 学校用户扩展实体
 * 关联 uni-id 账户与校园身份；商品 seller_id 引用本表的主键。
 */
public class SchoolUser {
    private String id;
    private String userId;
    private String schoolId;
    private String college;
    private String major;
    private String grade;
    private String studentNo;
    private String realName;
    private String studentCard;
    private Boolean isVerified;
    private Integer creditScore;
    private BigDecimal balance;
    private LocalDateTime createdAt;

    // 关联对象（用于 join 查询）
    private User user;
    private School school;

    public SchoolUser() {
        this.isVerified = false;
        this.creditScore = 100;
        this.balance = BigDecimal.ZERO;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getSchoolId() { return schoolId; }
    public void setSchoolId(String schoolId) { this.schoolId = schoolId; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getStudentNo() { return studentNo; }
    public void setStudentNo(String studentNo) { this.studentNo = studentNo; }

    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }

    public String getStudentCard() { return studentCard; }
    public void setStudentCard(String studentCard) { this.studentCard = studentCard; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public Integer getCreditScore() { return creditScore; }
    public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public School getSchool() { return school; }
    public void setSchool(School school) { this.school = school; }

    @Override
    public String toString() {
        return "SchoolUser{id='" + id + "', realName='" + realName + "', verified=" + isVerified + "}";
    }
}