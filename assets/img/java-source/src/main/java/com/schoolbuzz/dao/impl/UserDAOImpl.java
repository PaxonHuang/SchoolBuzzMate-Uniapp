package com.schoolbuzz.dao.impl;

import com.schoolbuzz.dao.BaseDAO;
import com.schoolbuzz.entity.User;
import com.schoolbuzz.util.DBUtil;

import java.sql.*;

/**
 * User 数据访问对象实现
 */
public class UserDAOImpl extends BaseDAO<User, String> {

    @Override protected Class<User> entityClass() { return User.class; }
    @Override protected String primaryKeyColumn() { return "id"; }
    @Override protected String tableName() { return "users"; }

    @Override
    protected User mapRow(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getString("id"));
        u.setUsername(rs.getString("username"));
        u.setNickname(rs.getString("nickname"));
        u.setAvatar(rs.getString("avatar"));
        u.setMobile(rs.getString("mobile"));
        u.setGender((Integer) rs.getObject("gender"));
        u.setStatus(rs.getInt("status"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) u.setCreatedAt(ts.toLocalDateTime());
        return u;
    }

    @Override
    public User insert(User entity) throws SQLException {
        String sql = "INSERT INTO users(id, username, nickname, avatar, mobile, gender, status) " +
                     "VALUES(?,?,?,?,?,?,?)";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getId());
            ps.setString(2, entity.getUsername());
            ps.setString(3, entity.getNickname());
            ps.setString(4, entity.getAvatar());
            ps.setString(5, entity.getMobile());
            ps.setObject(6, entity.getGender());
            ps.setInt(7, entity.getStatus() == null ? 1 : entity.getStatus());
            ps.executeUpdate();
            return entity;
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    @Override
    public int update(User entity) throws SQLException {
        String sql = "UPDATE users SET nickname=?, avatar=?, mobile=?, gender=? WHERE id=?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getNickname());
            ps.setString(2, entity.getAvatar());
            ps.setString(3, entity.getMobile());
            ps.setObject(4, entity.getGender());
            ps.setString(5, entity.getId());
            return ps.executeUpdate();
        } finally {
            DBUtil.close(conn, null, null);
        }
    }
}