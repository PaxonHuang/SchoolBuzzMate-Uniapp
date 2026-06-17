package com.schoolbuzz.dao;

import com.schoolbuzz.util.DBUtil;

import java.lang.reflect.Field;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * 泛型 DAO 基类
 * 使用 Java 反射实现通用 CRUD，演示泛型 + 反射的 OOP 技术。
 *
 * @param <T> 实体类型
 * @param <K> 主键类型
 */
public abstract class BaseDAO<T, K> {

    /** 由子类返回实体 Class */
    protected abstract Class<T> entityClass();

    /** 由子类把 ResultSet 的一行映射为实体 */
    protected abstract T mapRow(ResultSet rs) throws SQLException;

    /** 主键列名 */
    protected abstract String primaryKeyColumn();

    /** 表名 */
    protected abstract String tableName();

    /** 执行 INSERT（由子类各自实现，SQL 与主键策略不同） */
    public abstract T insert(T entity) throws SQLException;

    /** 执行 UPDATE（由子类各自实现） */
    public abstract int update(T entity) throws SQLException;

    /** 把对象属性拼接为 INSERT VALUES 子句占位符 */
    protected String buildInsertPlaceholders(T entity, List<Object> params) {
        Field[] fields = entityClass().getDeclaredFields();
        StringBuilder sb = new StringBuilder("(");
        boolean first = true;
        for (Field f : fields) {
            if (skipField(f)) continue;
            f.setAccessible(true);
            try {
                Object val = f.get(entity);
                // 主键由 DB 生成，跳过
                if (f.getName().equalsIgnoreCase("id")) continue;
                if (val == null) continue;
            } catch (IllegalAccessException ignored) {}
            if (!first) sb.append(",");
            sb.append(f.getName());
            first = false;
        }
        sb.append(") VALUES (");
        first = true;
        for (Field f : fields) {
            if (skipField(f)) continue;
            f.setAccessible(true);
            Object val;
            try { val = f.get(entity); } catch (IllegalAccessException e) { continue; }
            if (f.getName().equalsIgnoreCase("id")) continue;
            if (val == null) continue;
            if (!first) sb.append(",");
            sb.append("?");
            first = false;
        }
        sb.append(")");
        return sb.toString();
    }

    /** 是否跳过该字段（如关联对象、静态字段） */
    protected boolean skipField(Field f) {
        String name = f.getName();
        return name.startsWith("$") || "seller".equals(name) || "user".equals(name)
            || "school".equals(name) || "liked".equals(name) || "isLiked".equals(name)
            || java.lang.reflect.Modifier.isStatic(f.getModifiers());
    }

    /** 把对象属性值收集成 INSERT 参数列表 */
    protected void collectInsertParams(T entity, List<Object> params) {
        Field[] fields = entityClass().getDeclaredFields();
        for (Field f : fields) {
            if (skipField(f)) continue;
            f.setAccessible(true);
            if (f.getName().equalsIgnoreCase("id")) continue;
            try {
                Object val = f.get(entity);
                if (val == null) continue;
                params.add(val);
            } catch (IllegalAccessException ignored) {}
        }
    }

    /** 通用查询全部 */
    public List<T> findAll() throws SQLException {
        String sql = "SELECT * FROM " + tableName();
        List<T> list = new ArrayList<>();
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        } finally {
            DBUtil.close(conn, null, null);
        }
        return list;
    }

    /** 通用按主键查询 */
    public T findById(K id) throws SQLException {
        String sql = "SELECT * FROM " + tableName() + " WHERE " + primaryKeyColumn() + " = ?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } finally {
            DBUtil.close(conn, null, null);
        }
        return null;
    }

    /** 通用按主键删除 */
    public int deleteById(K id) throws SQLException {
        String sql = "DELETE FROM " + tableName() + " WHERE " + primaryKeyColumn() + " = ?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, id);
            return ps.executeUpdate();
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /** 通用计数 */
    public long count() throws SQLException {
        String sql = "SELECT COUNT(*) FROM " + tableName();
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getLong(1);
        } finally {
            DBUtil.close(conn, null, null);
        }
        return 0;
    }
}