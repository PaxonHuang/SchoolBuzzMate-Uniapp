package com.schoolbuzz.dao.impl;

import com.schoolbuzz.dao.BaseDAO;
import com.schoolbuzz.entity.School;
import com.schoolbuzz.util.DBUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * School 数据访问对象实现
 */
public class SchoolDAOImpl extends BaseDAO<School, String> {

    @Override protected Class<School> entityClass() { return School.class; }
    @Override protected String primaryKeyColumn() { return "id"; }
    @Override protected String tableName() { return "schools"; }

    @Override
    protected School mapRow(ResultSet rs) throws SQLException {
        School s = new School();
        s.setId(rs.getString("id"));
        s.setName(rs.getString("name"));
        s.setProvince(rs.getString("province"));
        s.setCity(rs.getString("city"));
        s.setLogo(rs.getString("logo"));
        s.setStatus(rs.getInt("status"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) s.setCreatedAt(ts.toLocalDateTime());
        return s;
    }

    @Override
    public School insert(School entity) throws SQLException {
        String sql = "INSERT INTO schools(id, name, province, city, logo, status) VALUES(?,?,?,?,?,?)";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getId());
            ps.setString(2, entity.getName());
            ps.setString(3, entity.getProvince());
            ps.setString(4, entity.getCity());
            ps.setString(5, entity.getLogo());
            ps.setInt(6, entity.getStatus() == null ? 1 : entity.getStatus());
            ps.executeUpdate();
            return entity;
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    @Override
    public int update(School entity) throws SQLException {
        String sql = "UPDATE schools SET name=?, province=?, city=?, logo=?, status=? WHERE id=?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getName());
            ps.setString(2, entity.getProvince());
            ps.setString(3, entity.getCity());
            ps.setString(4, entity.getLogo());
            ps.setInt(5, entity.getStatus() == null ? 1 : entity.getStatus());
            ps.setString(6, entity.getId());
            return ps.executeUpdate();
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /** 查询所有启用的学校，按名称升序 */
    public List<School> findAllEnabled() throws SQLException {
        String sql = "SELECT * FROM schools WHERE status=1 ORDER BY name ASC";
        List<School> list = new ArrayList<>();
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        } finally {
            DBUtil.close(conn, null, null);
        }
        return list;
    }
}