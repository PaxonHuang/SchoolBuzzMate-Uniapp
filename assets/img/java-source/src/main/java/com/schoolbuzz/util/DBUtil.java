package com.schoolbuzz.util;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

/**
 * 数据库工具类
 * 负责加载驱动、获取连接、释放资源。
 * 静态初始化块保证驱动只加载一次。
 */
public class DBUtil {

    private static String driver;
    private static String url;
    private static String username;
    private static String password;

    static {
        try (InputStream in = DBUtil.class.getResourceAsStream("/db.properties")) {
            Properties p = new Properties();
            p.load(in);
            driver   = p.getProperty("jdbc.driver");
            url      = p.getProperty("jdbc.url");
            username = p.getProperty("jdbc.username");
            password = p.getProperty("jdbc.password");
            Class.forName(driver);
        } catch (IOException | ClassNotFoundException e) {
            throw new ExceptionInInitializerError("加载数据库配置失败: " + e.getMessage());
        }
    }

    /** 获取数据库连接 */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, username, password);
    }

    /** 释放 JDBC 资源 */
    public static void close(Connection conn, Statement stmt, ResultSet rs) {
        if (rs != null) {
            try { rs.close(); } catch (SQLException ignored) {}
        }
        if (stmt != null) {
            try { stmt.close(); } catch (SQLException ignored) {}
        }
        if (conn != null) {
            try { conn.close(); } catch (SQLException ignored) {}
        }
    }

    /** 静默关闭，仅打印日志 */
    public static void closeQuietly(AutoCloseable... resources) {
        for (AutoCloseable r : resources) {
            if (r != null) {
                try { r.close(); } catch (Exception e) {
                    System.err.println("[DBUtil] 关闭资源失败: " + e.getMessage());
                }
            }
        }
    }
}