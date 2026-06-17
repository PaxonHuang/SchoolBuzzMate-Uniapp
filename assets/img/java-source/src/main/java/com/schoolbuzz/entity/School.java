package com.schoolbuzz.entity;

import java.time.LocalDateTime;

/**
 * 学校实体
 * 对应数据库 schools 表。
 */
public class School {
    private String id;
    private String name;
    private String province;
    private String city;
    private String logo;
    private Integer status;
    private LocalDateTime createdAt;

    public School() {}

    public School(String id, String name, String province, String city) {
        this.id = id;
        this.name = name;
        this.province = province;
        this.city = city;
        this.status = 1;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return "School{id='" + id + "', name='" + name + "', city='" + province + city + "'}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof School)) return false;
        School s = (School) o;
        return id != null && id.equals(s.id);
    }

    @Override
    public int hashCode() {
        return id == null ? 0 : id.hashCode();
    }
}