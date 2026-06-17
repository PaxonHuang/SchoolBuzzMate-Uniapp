package com.schoolbuzz.service;

import com.schoolbuzz.dao.impl.SchoolUserDAOImpl;
import com.schoolbuzz.dao.impl.UserDAOImpl;
import com.schoolbuzz.entity.SchoolUser;

import java.sql.SQLException;

/**
 * 用户业务逻辑层
 * 演示多个 DAO 协作完成业务用例。
 */
public class UserService {

    private final UserDAOImpl userDAO = new UserDAOImpl();
    private final SchoolUserDAOImpl schoolUserDAO = new SchoolUserDAOImpl();

    /** 申请学生认证（演示简单的业务规则：已认证不可重复认证） */
    public SchoolUser applyVerification(SchoolUser form) throws SQLException {
        if (form == null) throw new IllegalArgumentException("认证信息不能为空");
        if (form.getUserId() == null || form.getUserId().isEmpty())
            throw new IllegalArgumentException("缺少用户ID");
        if (form.getSchoolId() == null || form.getSchoolId().isEmpty())
            throw new IllegalArgumentException("请选择学校");
        if (form.getRealName() == null || form.getRealName().isEmpty())
            throw new IllegalArgumentException("请填写真实姓名");
        if (form.getStudentNo() == null || form.getStudentNo().isEmpty())
            throw new IllegalArgumentException("请填写学号");

        SchoolUser existing = schoolUserDAO.findByUserId(form.getUserId());
        if (existing != null && Boolean.TRUE.equals(existing.getIsVerified())) {
            throw new IllegalArgumentException("已通过学生认证，无需重复认证");
        }
        form.setIsVerified(false); // 默认待审核
        if (form.getCreditScore() == null) form.setCreditScore(100);
        if (form.getBalance() == null)     form.setBalance(java.math.BigDecimal.ZERO);

        if (existing == null) {
            form.setId("su_" + System.currentTimeMillis());
            return schoolUserDAO.insert(form);
        } else {
            form.setId(existing.getId());
            schoolUserDAO.update(form);
            return schoolUserDAO.findByUserId(form.getUserId());
        }
    }

    /** 获取当前登录用户的 SchoolUser 记录 */
    public SchoolUser getSchoolUser(String userId) throws SQLException {
        return schoolUserDAO.findByUserId(userId);
    }

    public UserDAOImpl getUserDAO()     { return userDAO; }
    public SchoolUserDAOImpl getSchoolUserDAO() { return schoolUserDAO; }
}