package com.schoolbuzz.cli;

import com.schoolbuzz.dao.impl.SchoolDAOImpl;
import com.schoolbuzz.dao.impl.SchoolUserDAOImpl;
import com.schoolbuzz.dao.impl.ProductDAOImpl;
import com.schoolbuzz.entity.Product;
import com.schoolbuzz.entity.School;
import com.schoolbuzz.entity.SchoolUser;
import com.schoolbuzz.service.ProductService;
import com.schoolbuzz.service.UserService;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 校趣闪搭 - 命令行主程序 (CLI)
 *
 * 演示：
 *  - Scanner / BufferedReader 标准输入
 *  - switch-case 分支选择
 *  - while/for 循环菜单
 *  - 异常捕获与友好提示
 *  - 业务层 + DAO 层 + 实体层 三层架构
 *  - 集合（List / ArrayList / Stream）使用
 */
public class Main {

    // === 全局上下文 ===
    private static String currentUserId = null;          // 当前登录用户 ID
    private static String currentSchoolUserId = null;    // 当前登录用户的学校扩展 ID
    private static String currentNickname = null;
    private static String currentSchoolId = null;
    private static String currentSchoolName = null;

    // === 业务对象 ===
    private static final ProductService productService = new ProductService();
    private static final UserService userService = new UserService();
    private static final SchoolDAOImpl schoolDAO = new SchoolDAOImpl();
    private static final SchoolUserDAOImpl schoolUserDAO = new SchoolUserDAOImpl();
    private static final ProductDAOImpl productDAO = new ProductDAOImpl();

    private static final BufferedReader IN = new BufferedReader(new InputStreamReader(System.in));

    public static void main(String[] args) throws IOException {
        printBanner();
        // 自动尝试初始化当前学校（用列表中第一所）
        try {
            List<School> schools = schoolDAO.findAllEnabled();
            if (!schools.isEmpty()) {
                currentSchoolId = schools.get(0).getId();
                currentSchoolName = schools.get(0).getName();
            }
        } catch (SQLException e) {
            System.err.println("[警告] 数据库未就绪: " + e.getMessage());
        }

        boolean running = true;
        while (running) {
            printMainMenu();
            String choice = readLine("\n请选择[0-8]: ").trim();
            try {
                switch (choice) {
                    case "1": doLogin();        break;
                    case "2": listProducts();   break;
                    case "3": publishProduct(); break;
                    case "4": searchProduct();  break;
                    case "5": toggleLike();     break;
                    case "6": applyVerify();    break;
                    case "7": myProducts();     break;
                    case "8": switchSchool();   break;
                    case "0": running = false;  break;
                    default : System.out.println("无效选项，请重新输入。");
                }
            } catch (SQLException | IllegalArgumentException ex) {
                System.err.println("[错误] " + ex.getMessage());
            } catch (Exception ex) {
                ex.printStackTrace();
                System.err.println("[错误] " + ex.getMessage());
            }
        }
        System.out.println("\n感谢使用校趣闪搭 CLI，再见 👋");
    }

    // ============ 主菜单 ============
    private static void printMainMenu() {
        System.out.println();
        System.out.println("╔═══════════════════════════════════════════════════════════╗");
        System.out.println("║  当前用户：" + padRight(currentNickname == null ? "未登录" : currentNickname, 12) +
                "  学校：" + padRight(currentSchoolName == null ? "未选择" : currentSchoolName, 16) + " ║");
        System.out.println("╠═══════════════════════════════════════════════════════════╣");
        System.out.println("║  1. 登录（演示用：直接输入 user_id）                      ║");
        System.out.println("║  2. 查看商品列表（分页+分类筛选）                        ║");
        System.out.println("║  3. 发布商品                                            ║");
        System.out.println("║  4. 搜索商品（关键字）                                  ║");
        System.out.println("║  5. 点赞 / 取消点赞                                     ║");
        System.out.println("║  6. 申请学生认证                                        ║");
        System.out.println("║  7. 我的商品                                            ║");
        System.out.println("║  8. 切换学校                                            ║");
        System.out.println("║  0. 退出                                                ║");
        System.out.println("╚═══════════════════════════════════════════════════════════╝");
    }

    private static void printBanner() {
        System.out.println("============================================================");
        System.out.println("     校 趣 闪 搭  ·  SchoolBuzzMate  CLI  v1.0");
        System.out.println("     校园二手交易平台 · 命令行版");
        System.out.println("============================================================");
    }

    // ============ 1. 登录 ============
    private static void doLogin() throws SQLException, IOException {
        if (currentUserId != null) {
            System.out.println("您已登录为 " + currentNickname + "，请先退出再切换。");
            return;
        }
        System.out.println("\n>>> 1. 登录");
        System.out.println("演示账户：usr_001（张三） / usr_002（李四）");
        String userId = readLine("请输入 user_id: ").trim();
        if (userId.isEmpty()) {
            System.out.println("user_id 不能为空");
            return;
        }
        // 简易登录：直接按 ID 加载
        var user = userService.getUserDAO().findById(userId);
        if (user == null) {
            System.out.println("用户不存在，请先注册或输入正确 user_id");
            return;
        }
        currentUserId = user.getId();
        currentNickname = user.getNickname();
        SchoolUser su = userService.getSchoolUser(currentUserId);
        if (su != null) {
            currentSchoolUserId = su.getId();
            currentSchoolId = su.getSchoolId();
            School sc = schoolDAO.findById(currentSchoolId);
            if (sc != null) currentSchoolName = sc.getName();
        }
        System.out.println("登录成功！欢迎您，" + currentNickname + " 🎉");
        if (su != null) {
            System.out.println("学校身份：" + su.getRealName() + " / " + su.getCollege() +
                    " / 是否认证=" + su.getIsVerified() + " / 信用分=" + su.getCreditScore());
        } else {
            System.out.println("[提示] 您尚未完成学生认证，发布商品前请先认证。");
        }
    }

    // ============ 2. 商品列表 ============
    private static void listProducts() throws SQLException, IOException {
        System.out.println("\n>>> 2. 商品列表");
        System.out.println("分类：[1]全部 [2]教材 [3]数码 [4]服饰 [5]生活 [6]运动 [7]其他");
        String c = readLine("请选择分类: ").trim();
        String category = "";
        switch (c) {
            case "2": category = "textbook"; break;
            case "3": category = "digital";  break;
            case "4": category = "clothing"; break;
            case "5": category = "daily";    break;
            case "6": category = "sports";   break;
            case "7": category = "other";    break;
            default:  category = "";
        }
        System.out.println("排序：[1]最新 [2]价格升 [3]价格降");
        String s = readLine("请选择排序: ").trim();
        String sort = "newest";
        if ("2".equals(s)) sort = "price_asc";
        else if ("3".equals(s)) sort = "price_desc";

        int page = 1, size = 5;
        ProductDAOImpl.PageResult<Product> res =
                productService.list(currentSchoolId, category, "", sort, page, size);
        renderProductTable(res.list);
        System.out.println("共 " + res.total + " 条，当前第 " + res.page + "/" + res.getTotalPages() + " 页");
    }

    private static void renderProductTable(List<Product> list) {
        if (list == null || list.isEmpty()) {
            System.out.println("(暂无商品)");
            return;
        }
        System.out.printf("%-12s %-28s %-8s %-10s %-12s%n", "ID", "标题", "价格", "成色", "卖家");
        System.out.println("----------------------------------------------------------------------");
        for (Product p : list) {
            String title = p.getTitle().length() > 26 ? p.getTitle().substring(0, 26) + ".." : p.getTitle();
            System.out.printf("%-12s %-28s ¥%-7s %-10s %-12s%n",
                    p.getId(), title, p.getPrice(),
                    p.getConditionEnum().label, "匿名同学");
        }
    }

    // ============ 3. 发布商品 ============
    private static void publishProduct() throws SQLException, IOException {
        System.out.println("\n>>> 3. 发布商品");
        if (currentUserId == null) { System.out.println("请先登录"); return; }
        if (currentSchoolUserId == null) { System.out.println("请先完成学生认证"); return; }

        SchoolUser su = schoolUserDAO.findByUserId(currentUserId);
        if (su == null) { System.out.println("请先完成学生认证"); return; }

        String title = readLine("标题(2-50字): ");
        String desc  = readLine("描述(<=500字): ");
        String priceStr = readLine("售价(元): ");
        String origStr  = readLine("原价(可空): ");
        System.out.println("分类: textbook/digital/clothing/daily/sports/other");
        String cat = readLine("分类: ");
        System.out.println("成色: brand_new/like_new/used/old");
        String cond = readLine("成色: ");
        System.out.println("交易方式（多选用逗号分隔）: self_pickup,express");
        String tmStr = readLine("交易方式: ");
        String location = readLine("自提地点(可空): ");

        Product p = new Product();
        p.setTitle(title);
        p.setDescription(desc);
        p.setPrice(new BigDecimal(priceStr));
        if (!origStr.isEmpty()) p.setOriginalPrice(new BigDecimal(origStr));
        p.setCategory(cat);
        p.setCondition(cond);
        p.setTradeMethod(splitToList(tmStr));
        p.setImages(splitToList("https://img.example/default.jpg")); // 演示版：占位图
        p.setLocation(location);
        p.setSellerId(su.getId());
        p.setSchoolId(su.getSchoolId());

        Product created = productService.create(p);
        System.out.println("发布成功！商品ID = " + created.getId());
    }

    // ============ 4. 搜索 ============
    private static void searchProduct() throws SQLException, IOException {
        System.out.println("\n>>> 4. 搜索商品");
        String kw = readLine("请输入关键词: ");
        ProductDAOImpl.PageResult<Product> res =
                productService.search(kw, currentSchoolId, 1, 10);
        System.out.println("命中 " + res.total + " 条：");
        renderProductTable(res.list);
    }

    // ============ 5. 点赞 ============
    private static void toggleLike() throws SQLException, IOException {
        System.out.println("\n>>> 5. 点赞 / 取消点赞");
        if (currentUserId == null) { System.out.println("请先登录"); return; }
        String pid = readLine("商品ID: ");
        ProductDAOImpl.ToggleLikeResult r = productService.toggleLike(currentUserId, pid);
        System.out.println("操作完成！is_liked=" + r.liked + " like_count=" + r.likeCount);
    }

    // ============ 6. 学生认证 ============
    private static void applyVerify() throws SQLException, IOException {
        System.out.println("\n>>> 6. 申请学生认证");
        if (currentUserId == null) { System.out.println("请先登录"); return; }

        List<School> schools = schoolDAO.findAllEnabled();
        System.out.println("可选学校：");
        for (int i = 0; i < schools.size(); i++) {
            System.out.println("  " + (i + 1) + ". " + schools.get(i).getName());
        }
        int idx = Integer.parseInt(readLine("选择学校序号: ")) - 1;
        School sc = schools.get(idx);

        String realName = readLine("真实姓名: ");
        String studentNo = readLine("学号: ");
        String college   = readLine("学院(可空): ");
        String major     = readLine("专业(可空): ");
        String grade     = readLine("年级(可空): ");
        String cardUrl   = readLine("学生证URL(可空): ");

        SchoolUser form = new SchoolUser();
        form.setUserId(currentUserId);
        form.setSchoolId(sc.getId());
        form.setRealName(realName);
        form.setStudentNo(studentNo);
        form.setCollege(college);
        form.setMajor(major);
        form.setGrade(grade);
        form.setStudentCard(cardUrl.isEmpty() ? "card_demo.jpg" : cardUrl);
        SchoolUser saved = userService.applyVerification(form);
        currentSchoolUserId = saved.getId();
        currentSchoolId = saved.getSchoolId();
        currentSchoolName = sc.getName();
        System.out.println("认证信息已提交！is_verified=" + saved.getIsVerified() + "（需管理员审核）");
    }

    // ============ 7. 我的商品 ============
    private static void myProducts() throws SQLException {
        System.out.println("\n>>> 7. 我的商品");
        if (currentSchoolUserId == null) { System.out.println("请先完成学生认证"); return; }
        List<Product> list = productService.myProducts(currentSchoolUserId);
        renderProductTable(list);
        System.out.println("共 " + list.size() + " 件在售商品");
    }

    // ============ 8. 切换学校 ============
    private static void switchSchool() throws SQLException, IOException {
        System.out.println("\n>>> 8. 切换学校");
        List<School> schools = schoolDAO.findAllEnabled();
        for (int i = 0; i < schools.size(); i++) {
            System.out.println("  " + (i + 1) + ". " + schools.get(i).getName());
        }
        int idx = Integer.parseInt(readLine("选择学校序号: ")) - 1;
        currentSchoolId = schools.get(idx).getId();
        currentSchoolName = schools.get(idx).getName();
        System.out.println("已切换至 " + currentSchoolName);
    }

    // ============ 工具方法 ============
    private static String readLine(String prompt) throws IOException {
        System.out.print(prompt);
        System.out.flush();
        return IN.readLine();
    }

    private static List<String> splitToList(String s) {
        if (s == null || s.trim().isEmpty()) return new ArrayList<>();
        return java.util.Arrays.stream(s.split(","))
                .map(String::trim).filter(t -> !t.isEmpty())
                .collect(Collectors.toList());
    }

    private static String padRight(String s, int n) {
        if (s == null) s = "";
        if (s.length() >= n) return s;
        StringBuilder sb = new StringBuilder(s);
        for (int i = s.length(); i < n; i++) sb.append(' ');
        return sb.toString();
    }
}