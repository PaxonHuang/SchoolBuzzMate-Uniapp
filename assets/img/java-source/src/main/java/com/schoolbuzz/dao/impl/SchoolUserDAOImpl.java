package com.schoolbuzz.dao.impl;

import com.schoolbuzz.dao.BaseDAO;
import com.schoolbuzz.entity.SchoolUser;
import com.schoolbuzz.util.DBUtil;

import java.sql.*;
import java.time.LocalDateTime;

/**
 * 学校用户扩展 DAO
 * 演示 JOIN 查询（school_users + users + schools）。
 */
public class SchoolUserDAOImpl extends BaseDAO<SchoolUser, String> {

    @Override protected Class<SchoolUser> entityClass() { return SchoolUser.class; }
    @Override protected String primaryKeyColumn() { return "id"; }
    @Override protected String tableName() { return "school_users"; }

    @Override
    protected SchoolUser mapRow(ResultSet rs) throws SQLException {
        SchoolUser su = new SchoolUser();
        su.setId(rs.getString("id"));
        su.setUserId(rs.getString("user_id"));
        su.setSchoolId(rs.getString("school_id"));
        su.setCollege(rs.getString("college"));
        su.setMajor(rs.getString("major"));
        su.setGrade(rs.getString("grade"));
        su.setStudentNo(rs.getString("student_no"));
        su.setRealName(rs.getString("real_name"));
        su.setStudentCard(rs.getString("student_card"));
        su.setIsVerified(rs.getBoolean("is_verified"));
        su.setCreditScore(rs.getInt("credit_score"));
        su.setBalance(rs.getBigDecimal("balance"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) su.setCreatedAt(ts.toLocalDateTime());
        return su;
    }

    @Override
    public SchoolUser insert(SchoolUser entity) throws SQLException {
        String sql = "INSERT INTO school_users(id, user_id, school_id, college, major, grade, " +
                     "student_no, real_name, student_card, is_verified, credit_score, balance) " +
                     "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getId());
            ps.setString(2, entity.getUserId());
            ps.setString(3, entity.getSchoolId());
            ps.setString(4, entity.getCollege());
            ps.setString(5, entity.getMajor());
            ps.setString(6, entity.getGrade());
            ps.setString(7, entity.getStudentNo());
            ps.setString(8, entity.getRealName());
            ps.setString(9, entity.getStudentCard());
            ps.setBoolean(10, entity.getIsVerified() != null && entity.getIsVerified());
            ps.setInt(11, entity.getCreditScore() == null ? 100 : entity.getCreditScore());
            ps.setBigDecimal(12, entity.getBalance() == null ? java.math.BigDecimal.ZERO : entity.getBalance());
            ps.executeUpdate();
            return entity;
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    @Override
    public int update(SchoolUser entity) throws SQLException {
        String sql = "UPDATE school_users SET college=?, major=?, grade=?, student_no=?, " +
                     "real_name=?, student_card=?, is_verified=?, credit_score=?, balance=? WHERE id=?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, entity.getCollege());
            ps.setString(2, entity.getMajor());
            ps.setString(3, entity.getGrade());
            ps.setString(4, entity.getStudentNo());
            ps.setString(5, entity.getRealName());
            ps.setString(6, entity.getStudentCard());
            ps.setBoolean(7, entity.getIsVerified() != null && entity.getIsVerified());
            ps.setInt(8, entity.getCreditScore() == null ? 100 : entity.getCreditScore());
            ps.setBigDecimal(9, entity.getBalance() == null ? java.math.BigDecimal.ZERO : entity.getBalance());
            ps.setString(10, entity.getId());
            return ps.executeUpdate();
        } finally {
            DBUtil.close(conn, null, null);
        }
    }

    /** 按 user_id 查询（每个用户仅有一条） */
    public SchoolUser findByUserId(String userId) throws SQLException {
        String sql = "SELECT * FROM school_users WHERE user_id = ?";
        Connection conn = DBUtil.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } finally {
            DBUtil.close(conn, null, null);
        }
        return null;
    }
}