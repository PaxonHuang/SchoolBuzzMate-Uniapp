package com.schoolbuzz.gui;

import com.schoolbuzz.dao.impl.ProductDAOImpl;
import com.schoolbuzz.dao.impl.SchoolDAOImpl;
import com.schoolbuzz.dao.impl.SchoolUserDAOImpl;
import com.schoolbuzz.entity.Product;
import com.schoolbuzz.entity.School;
import com.schoolbuzz.entity.SchoolUser;
import com.schoolbuzz.service.ProductService;
import com.schoolbuzz.service.UserService;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;

/**
 * 校趣闪搭 - GUI 主程序 (Swing)
 *
 * 演示：
 *  - JFrame / JPanel / JTable / JButton / JTextField 等 Swing 组件
 *  - BorderLayout / GridLayout / FlowLayout 多种布局管理器
 *  - ActionListener 事件驱动
 *  - CardLayout 多面板切换
 *  - JTable + DefaultTableModel 数据绑定
 *  - 内部类 + Lambda 表达式
 */
public class MainFrame extends JFrame {

    // === 业务对象 ===
    private final ProductService productService = new ProductService();
    private final UserService userService = new UserService();
    private final SchoolDAOImpl schoolDAO = new SchoolDAOImpl();
    private final SchoolUserDAOImpl schoolUserDAO = new SchoolUserDAOImpl();

    // === 全局上下文 ===
    private String currentUserId;
    private String currentSchoolUserId;
    private String currentNickname;
    private String currentSchoolId;
    private String currentSchoolName;

    // === UI 组件 ===
    private final CardLayout cardLayout = new CardLayout();
    private final JPanel rootPanel = new JPanel(cardLayout);

    private JLabel lblUser;
    private JLabel lblSchool;

    // 商品列表相关
    private DefaultTableModel productTableModel;
    private JTable productTable;
    private JComboBox<String> cbCategory;
    private JComboBox<String> cbSort;

    // 登录面板
    private JTextField txtUserId;

    // 发布商品面板
    private JTextField txtTitle;
    private JTextArea  txtDescription;
    private JTextField txtPrice;
    private JTextField txtOriginalPrice;
    private JComboBox<String> cbPubCategory;
    private JComboBox<String> cbCondition;
    private JCheckBox cbSelfPickup;
    private JCheckBox cbExpress;
    private JTextField txtLocation;
    private JTextField txtImages;

    public MainFrame() {
        setTitle("校趣闪搭 · SchoolBuzzMate GUI");
        setSize(1100, 720);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        add(buildHeader(), BorderLayout.NORTH);
        add(buildSidebar(), BorderLayout.WEST);
        rootPanel.setBackground(Color.WHITE);
        add(rootPanel, BorderLayout.CENTER);

        // 各页面注册到 CardLayout
        rootPanel.add(buildWelcomePanel(), "welcome");
        rootPanel.add(buildProductListPanel(), "list");
        rootPanel.add(buildPublishPanel(), "publish");
        rootPanel.add(buildLoginPanel(), "login");
        rootPanel.add(buildVerifyPanel(), "verify");
        rootPanel.add(buildSearchPanel(), "search");
        rootPanel.add(buildMyProductsPanel(), "mine");
        rootPanel.add(buildDetailPanel(), "detail");

        cardLayout.show(rootPanel, "welcome");
        initCurrentSchool();
    }

    // ============ Header ============
    private JPanel buildHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(new Color(7, 193, 96));
        header.setBorder(new EmptyBorder(12, 20, 12, 20));

        JLabel title = new JLabel("校趣闪搭 · SchoolBuzzMate");
        title.setFont(new Font("Microsoft YaHei", Font.BOLD, 22));
        title.setForeground(Color.WHITE);
        header.add(title, BorderLayout.WEST);

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 16, 0));
        right.setOpaque(false);
        lblUser   = new JLabel("当前用户：未登录");
        lblSchool = new JLabel("学校：未选择");
        lblUser.setForeground(Color.WHITE);
        lblSchool.setForeground(Color.WHITE);
        lblUser.setFont(new Font("Microsoft YaHei", Font.PLAIN, 14));
        lblSchool.setFont(new Font("Microsoft YaHei", Font.PLAIN, 14));
        right.add(lblUser);
        right.add(lblSchool);
        header.add(right, BorderLayout.EAST);
        return header;
    }

    // ============ Sidebar ============
    private JPanel buildSidebar() {
        JPanel sidebar = new JPanel();
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBackground(new Color(245, 245, 245));
        sidebar.setBorder(new EmptyBorder(16, 12, 16, 12));
        sidebar.setPreferredSize(new Dimension(180, 0));

        addNavButton(sidebar, "🏠  欢迎",         "welcome");
        addNavButton(sidebar, "🔐  登录",         "login");
        addNavButton(sidebar, "📋  商品列表",     "list");
        addNavButton(sidebar, "➕  发布商品",     "publish");
        addNavButton(sidebar, "🔍  搜索商品",     "search");
        addNavButton(sidebar, "🎓  学生认证",     "verify");
        addNavButton(sidebar, "👤  我的商品",     "mine");
        return sidebar;
    }

    private void addNavButton(JPanel parent, String text, String card) {
        JButton btn = new JButton(text);
        btn.setAlignmentX(Component.LEFT_ALIGNMENT);
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.setBackground(Color.WHITE);
        btn.setFocusPainted(false);
        btn.setFont(new Font("Microsoft YaHei", Font.PLAIN, 14));
        btn.setBorder(new EmptyBorder(8, 12, 8, 12));
        btn.addActionListener((ActionEvent e) -> {
            cardLayout.show(rootPanel, card);
            if ("list".equals(card)) refreshProductTable();
            if ("mine".equals(card)) refreshMyProducts();
            if ("detail".equals(card)) refreshDetail();
        });
        btn.addMouseListener(new MouseAdapter() {
            @Override public void mouseEntered(MouseEvent e) { btn.setBackground(new Color(232, 248, 238)); }
            @Override public void mouseExited(MouseEvent e)  { btn.setBackground(Color.WHITE); }
        });
        parent.add(btn);
        parent.add(Box.createVerticalStrut(6));
    }

    // ============ Welcome ============
    private JPanel buildWelcomePanel() {
        JPanel p = new JPanel(new GridBagLayout());
        p.setBackground(Color.WHITE);
        JLabel hello = new JLabel("欢迎使用校趣闪搭 GUI 版本");
        hello.setFont(new Font("Microsoft YaHei", Font.BOLD, 28));
        hello.setForeground(new Color(7, 193, 96));
        p.add(hello);
        return p;
    }

    // ============ Login ============
    private JPanel buildLoginPanel() {
        JPanel p = new JPanel(new GridBagLayout());
        p.setBackground(Color.WHITE);
        JPanel form = new JPanel(new GridLayout(4, 2, 12, 12));
        form.setBorder(BorderFactory.createTitledBorder(
                new LineBorder(new Color(7, 193, 96), 1, true), "登录",
                0, 0, new Font("Microsoft YaHei", Font.BOLD, 16)));
        form.setBackground(Color.WHITE);

        form.add(new JLabel("用户ID："));
        txtUserId = new JTextField("usr_001");
        form.add(txtUserId);
        form.add(new JLabel(""));
        form.add(new JLabel(""));

        JButton btnLogin = new JButton("登录");
        btnLogin.setBackground(new Color(7, 193, 96));
        btnLogin.setForeground(Color.WHITE);
        btnLogin.setFont(new Font("Microsoft YaHei", Font.BOLD, 14));
        btnLogin.addActionListener(this::onLogin);
        form.add(btnLogin);

        JButton btnClear = new JButton("清空");
        btnClear.addActionListener(e -> txtUserId.setText(""));
        form.add(btnClear);

        p.add(form);
        return p;
    }

    private void onLogin(ActionEvent e) {
        String userId = txtUserId.getText().trim();
        if (userId.isEmpty()) { showError("用户ID不能为空"); return; }
        try {
            var user = userService.getUserDAO().findById(userId);
            if (user == null) { showError("用户不存在"); return; }
            currentUserId = user.getId();
            currentNickname = user.getNickname();
            SchoolUser su = userService.getSchoolUser(currentUserId);
            if (su != null) {
                currentSchoolUserId = su.getId();
                currentSchoolId = su.getSchoolId();
                School sc = schoolDAO.findById(currentSchoolId);
                if (sc != null) currentSchoolName = sc.getName();
            }
            lblUser.setText("当前用户：" + currentNickname);
            lblSchool.setText("学校：" + (currentSchoolName == null ? "未选择" : currentSchoolName));
            JOptionPane.showMessageDialog(this, "登录成功！\n欢迎 " + currentNickname);
        } catch (SQLException ex) {
            showError("登录失败：" + ex.getMessage());
        }
    }

    // ============ 商品列表 ============
    private JPanel buildProductListPanel() {
        JPanel p = new JPanel(new BorderLayout(8, 8));
        p.setBackground(Color.WHITE);
        p.setBorder(new EmptyBorder(12, 12, 12, 12));

        // 顶部筛选条
        JPanel filter = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 8));
        filter.setBackground(Color.WHITE);
        filter.add(new JLabel("分类："));
        cbCategory = new JComboBox<>(new String[]{"全部", "教材资料", "数码电子", "服饰鞋包", "生活用品", "运动户外", "其他杂项"});
        filter.add(cbCategory);
        filter.add(new JLabel("排序："));
        cbSort = new JComboBox<>(new String[]{"最新发布", "价格升序", "价格降序"});
        filter.add(cbSort);
        JButton btnQuery = new JButton("查询");
        btnQuery.setBackground(new Color(7, 193, 96));
        btnQuery.setForeground(Color.WHITE);
        btnQuery.addActionListener(e -> refreshProductTable());
        filter.add(btnQuery);
        p.add(filter, BorderLayout.NORTH);

        // 中间表格
        String[] columns = {"商品ID", "标题", "价格(¥)", "原价(¥)", "成色", "分类", "浏览数", "点赞数", "发布时间"};
        productTableModel = new DefaultTableModel(columns, 0) {
            @Override public boolean isCellEditable(int row, int col) { return false; }
        };
        productTable = new JTable(productTableModel);
        productTable.setRowHeight(28);
        productTable.setFont(new Font("Microsoft YaHei", Font.PLAIN, 13));
        JTableHeader th = productTable.getTableHeader();
        th.setFont(new Font("Microsoft YaHei", Font.BOLD, 13));
        th.setBackground(new Color(232, 248, 238));
        th.setForeground(new Color(7, 193, 96));
        DefaultTableCellRenderer center = new DefaultTableCellRenderer();
        center.setHorizontalAlignment(JLabel.CENTER);
        for (int i = 0; i < productTable.getColumnCount(); i++) {
            productTable.getColumnModel().getColumn(i).setCellRenderer(center);
        }
        // 双击查看详情
        productTable.addMouseListener(new MouseAdapter() {
            @Override public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2) {
                    int row = productTable.getSelectedRow();
                    if (row >= 0) {
                        String pid = (String) productTableModel.getValueAt(row, 0);
                        showDetail(pid);
                    }
                }
            }
        });
        JScrollPane sp = new JScrollPane(productTable);
        p.add(sp, BorderLayout.CENTER);

        // 底部状态
        JLabel status = new JLabel("提示：双击表格行可查看商品详情");
        status.setForeground(Color.GRAY);
        p.add(status, BorderLayout.SOUTH);
        return p;
    }

    private void refreshProductTable() {
        try {
            String cat = (String) cbCategory.getSelectedItem();
            String category = "";
            switch (cat) {
                case "教材资料": category = "textbook"; break;
                case "数码电子": category = "digital";  break;
                case "服饰鞋包": category = "clothing"; break;
                case "生活用品": category = "daily";    break;
                case "运动户外": category = "sports";   break;
                case "其他杂项": category = "other";    break;
            }
            String sort = "newest";
            if ("价格升序".equals(cbSort.getSelectedItem())) sort = "price_asc";
            else if ("价格降序".equals(cbSort.getSelectedItem())) sort = "price_desc";

            ProductDAOImpl.PageResult<Product> res =
                    productService.list(currentSchoolId, category, "", sort, 1, 20);
            productTableModel.setRowCount(0);
            for (Product p : res.list) {
                productTableModel.addRow(new Object[]{
                        p.getId(),
                        p.getTitle(),
                        p.getPrice(),
                        p.getOriginalPrice() == null ? "" : p.getOriginalPrice(),
                        p.getConditionEnum().label,
                        p.getCategoryEnum().label + " " + p.getCategoryEnum().icon,
                        p.getViewCount(),
                        p.getLikeCount(),
                        p.getPublishTime() == null ? "" : p.getPublishTime().toString()
                });
            }
        } catch (SQLException ex) {
            showError("加载商品列表失败：" + ex.getMessage());
        }
    }

    // ============ 商品详情 ============
    private JPanel buildDetailPanel() {
        JPanel p = new JPanel(new BorderLayout(8, 8));
        p.setBackground(Color.WHITE);
        p.setBorder(new EmptyBorder(12, 12, 12, 12));
        JTextArea txt = new JTextArea();
        txt.setEditable(false);
        txt.setFont(new Font("Microsoft YaHei", Font.PLAIN, 14));
        txt.setLineWrap(true);
        txt.setWrapStyleWord(true);
        detailArea = txt;
        JScrollPane sp = new JScrollPane(txt);
        p.add(sp, BorderLayout.CENTER);

        JPanel south = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        south.setBackground(Color.WHITE);
        JButton btnLike = new JButton("点赞 / 取消点赞");
        btnLike.setBackground(new Color(255, 107, 0));
        btnLike.setForeground(Color.WHITE);
        btnLike.addActionListener(e -> {
            if (currentUserId == null) { showError("请先登录"); return; }
            if (currentDetailId == null) { showError("无详情"); return; }
            try {
                ProductDAOImpl.ToggleLikeResult r =
                        productService.toggleLike(currentUserId, currentDetailId);
                JOptionPane.showMessageDialog(this,
                        "is_liked=" + r.liked + ", like_count=" + r.likeCount);
                refreshDetail();
            } catch (SQLException ex) {
                showError("点赞失败：" + ex.getMessage());
            }
        });
        south.add(btnLike);
        p.add(south, BorderLayout.SOUTH);
        return p;
    }
    private JTextArea detailArea;
    private String currentDetailId;

    private void refreshDetail() {
        if (currentDetailId == null) {
            detailArea.setText("（未选择商品）");
            return;
        }
        try {
            ProductDAOImpl.ProductDetailVO vo =
                    productService.detail(currentDetailId, currentUserId);
            if (vo == null) { detailArea.setText("（商品不存在）"); return; }
            Product p = vo.product;
            StringBuilder sb = new StringBuilder();
            sb.append("【商品标题】").append(p.getTitle()).append("\n\n");
            sb.append("【价格】¥").append(p.getPrice());
            if (p.getOriginalPrice() != null && p.getOriginalPrice().doubleValue() > 0)
                sb.append("  原价¥").append(p.getOriginalPrice());
            sb.append("\n\n【分类】").append(p.getCategoryEnum().label).append(" ").append(p.getCategoryEnum().icon);
            sb.append("\n【成色】").append(p.getConditionEnum().label);
            sb.append("\n【交易方式】").append(p.getTradeMethodsDisplay());
            if (p.getLocation() != null && !p.getLocation().isEmpty())
                sb.append("\n【自提地点】").append(p.getLocation());
            sb.append("\n\n【描述】\n").append(p.getDescription());
            sb.append("\n\n【卖家信息】\n");
            sb.append("  昵称：").append(vo.sellerNickname).append("\n");
            sb.append("  学校：").append(vo.sellerSchool).append("\n");
            sb.append("  学院：").append(vo.sellerCollege).append("\n");
            sb.append("  信用分：").append(vo.sellerCredit).append("\n");
            sb.append("\n【数据】浏览 ").append(p.getViewCount())
              .append("  点赞 ").append(p.getLikeCount())
              .append("  评论 ").append(p.getCommentCount());
            if (vo.liked) sb.append("\n\n✔ 您已点赞");
            detailArea.setText(sb.toString());
        } catch (SQLException ex) {
            showError("加载详情失败：" + ex.getMessage());
        }
    }

    private void showDetail(String productId) {
        currentDetailId = productId;
        cardLayout.show(rootPanel, "detail");
        refreshDetail();
    }

    // ============ 发布商品 ============
    private JPanel buildPublishPanel() {
        JPanel p = new JPanel(new BorderLayout(8, 8));
        p.setBackground(Color.WHITE);
        p.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel form = new JPanel(new GridLayout(10, 2, 8, 8));
        form.setBorder(BorderFactory.createTitledBorder("发布商品"));
        form.setBackground(Color.WHITE);

        form.add(new JLabel("标题(2-50字)："));
        txtTitle = new JTextField();
        form.add(txtTitle);

        form.add(new JLabel("描述："));
        txtDescription = new JTextArea(3, 20);
        txtDescription.setLineWrap(true);
        JScrollPane descSp = new JScrollPane(txtDescription);
        form.add(descSp);

        form.add(new JLabel("售价(元)："));
        txtPrice = new JTextField();
        form.add(txtPrice);

        form.add(new JLabel("原价(可空)："));
        txtOriginalPrice = new JTextField();
        form.add(txtOriginalPrice);

        form.add(new JLabel("分类："));
        cbPubCategory = new JComboBox<>(new String[]{"教材资料", "数码电子", "服饰鞋包", "生活用品", "运动户外", "其他杂项"});
        form.add(cbPubCategory);

        form.add(new JLabel("成色："));
        cbCondition = new JComboBox<>(new String[]{"全新", "几乎全新", "已使用", "较旧"});
        form.add(cbCondition);

        form.add(new JLabel("交易方式："));
        JPanel tm = new JPanel(new FlowLayout(FlowLayout.LEFT));
        tm.setBackground(Color.WHITE);
        cbSelfPickup = new JCheckBox("自提");
        cbExpress    = new JCheckBox("快递");
        tm.add(cbSelfPickup);
        tm.add(cbExpress);
        form.add(tm);

        form.add(new JLabel("自提地点(可空)："));
        txtLocation = new JTextField();
        form.add(txtLocation);

        form.add(new JLabel("图片URL(逗号分隔)："));
        txtImages = new JTextField("https://img.example/p1.jpg");
        form.add(txtImages);

        JButton btnSubmit = new JButton("提交发布");
        btnSubmit.setBackground(new Color(7, 193, 96));
        btnSubmit.setForeground(Color.WHITE);
        btnSubmit.setFont(new Font("Microsoft YaHei", Font.BOLD, 14));
        btnSubmit.addActionListener(this::onPublish);
        form.add(btnSubmit);

        JButton btnReset = new JButton("重置");
        btnReset.addActionListener(e -> resetPublishForm());
        form.add(btnReset);

        p.add(form, BorderLayout.NORTH);
        return p;
    }

    private void onPublish(ActionEvent e) {
        if (currentUserId == null) { showError("请先登录"); return; }
        if (currentSchoolUserId == null) { showError("请先完成学生认证"); return; }

        try {
            SchoolUser su = schoolUserDAO.findByUserId(currentUserId);
            if (su == null) { showError("请先完成学生认证"); return; }

            String title = txtTitle.getText().trim();
            String desc  = txtDescription.getText().trim();
            String priceStr = txtPrice.getText().trim();

            if (title.isEmpty() || title.length() < 2 || title.length() > 50) {
                showError("标题长度需在 2~50 之间"); return;
            }
            if (desc.isEmpty() || desc.length() > 500) {
                showError("描述不能为空且不能超过 500 字"); return;
            }
            if (priceStr.isEmpty()) { showError("请输入售价"); return; }

            Product p = new Product();
            p.setTitle(title);
            p.setDescription(desc);
            p.setPrice(new BigDecimal(priceStr));
            if (!txtOriginalPrice.getText().trim().isEmpty())
                p.setOriginalPrice(new BigDecimal(txtOriginalPrice.getText().trim()));

            String cat = (String) cbPubCategory.getSelectedItem();
            String catCode = "other";
            switch (cat) {
                case "教材资料": catCode = "textbook"; break;
                case "数码电子": catCode = "digital";  break;
                case "服饰鞋包": catCode = "clothing"; break;
                case "生活用品": catCode = "daily";    break;
                case "运动户外": catCode = "sports";   break;
            }
            p.setCategory(catCode);

            String cond = (String) cbCondition.getSelectedItem();
            String condCode = "used";
            switch (cond) {
                case "全新":     condCode = "brand_new"; break;
                case "几乎全新": condCode = "like_new";  break;
                case "较旧":     condCode = "old";       break;
            }
            p.setCondition(condCode);

            java.util.List<String> tm = new java.util.ArrayList<>();
            if (cbSelfPickup.isSelected()) tm.add("self_pickup");
            if (cbExpress.isSelected())    tm.add("express");
            p.setTradeMethod(tm);
            p.setLocation(txtLocation.getText().trim());
            p.setSellerId(su.getId());
            p.setSchoolId(su.getSchoolId());

            String imgStr = txtImages.getText().trim();
            if (imgStr.isEmpty()) imgStr = "https://img.example/default.jpg";
            java.util.List<String> images = new java.util.ArrayList<>();
            for (String s : imgStr.split(",")) images.add(s.trim());
            p.setImages(images);

            Product created = productService.create(p);
            JOptionPane.showMessageDialog(this, "发布成功！商品ID = " + created.getId());
            resetPublishForm();
        } catch (NumberFormatException ex) {
            showError("价格格式错误：" + ex.getMessage());
        } catch (IllegalArgumentException ex) {
            showError(ex.getMessage());
        } catch (SQLException ex) {
            showError("发布失败：" + ex.getMessage());
        }
    }

    private void resetPublishForm() {
        txtTitle.setText("");
        txtDescription.setText("");
        txtPrice.setText("");
        txtOriginalPrice.setText("");
        txtLocation.setText("");
        txtImages.setText("https://img.example/p1.jpg");
        cbSelfPickup.setSelected(false);
        cbExpress.setSelected(false);
    }

    // ============ 学生认证 ============
    private JTextField txtRealName;
    private JTextField txtStudentNo;
    private JTextField txtCollege;
    private JTextField txtMajor;
    private JTextField txtGrade;
    private JTextField txtStudentCard;
    private JComboBox<String> cbSchool;

    private JPanel buildVerifyPanel() {
        JPanel p = new JPanel(new BorderLayout());
        p.setBackground(Color.WHITE);
        p.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel form = new JPanel(new GridLayout(8, 2, 8, 8));
        form.setBorder(BorderFactory.createTitledBorder("学生认证申请"));
        form.setBackground(Color.WHITE);

        form.add(new JLabel("所在学校："));
        cbSchool = new JComboBox<>();
        try {
            for (School sc : schoolDAO.findAllEnabled()) cbSchool.addItem(sc.getName());
        } catch (SQLException e) { /* ignore */ }
        form.add(cbSchool);

        form.add(new JLabel("真实姓名："));
        txtRealName = new JTextField();
        form.add(txtRealName);

        form.add(new JLabel("学号："));
        txtStudentNo = new JTextField();
        form.add(txtStudentNo);

        form.add(new JLabel("学院："));
        txtCollege = new JTextField();
        form.add(txtCollege);

        form.add(new JLabel("专业："));
        txtMajor = new JTextField();
        form.add(txtMajor);

        form.add(new JLabel("年级："));
        txtGrade = new JTextField("2022级");
        form.add(txtGrade);

        form.add(new JLabel("学生证URL："));
        txtStudentCard = new JTextField("card_demo.jpg");
        form.add(txtStudentCard);

        JButton btnSubmit = new JButton("提交认证");
        btnSubmit.setBackground(new Color(7, 193, 96));
        btnSubmit.setForeground(Color.WHITE);
        btnSubmit.setFont(new Font("Microsoft YaHei", Font.BOLD, 14));
        btnSubmit.addActionListener(this::onApplyVerify);
        form.add(btnSubmit);

        p.add(form, BorderLayout.NORTH);
        return p;
    }

    private void onApplyVerify(ActionEvent e) {
        if (currentUserId == null) { showError("请先登录"); return; }
        try {
            String scName = (String) cbSchool.getSelectedItem();
            School sc = null;
            for (School s : schoolDAO.findAllEnabled()) {
                if (s.getName().equals(scName)) { sc = s; break; }
            }
            if (sc == null) { showError("请选择学校"); return; }

            SchoolUser form = new SchoolUser();
            form.setUserId(currentUserId);
            form.setSchoolId(sc.getId());
            form.setRealName(txtRealName.getText().trim());
            form.setStudentNo(txtStudentNo.getText().trim());
            form.setCollege(txtCollege.getText().trim());
            form.setMajor(txtMajor.getText().trim());
            form.setGrade(txtGrade.getText().trim());
            form.setStudentCard(txtStudentCard.getText().trim());
            SchoolUser saved = userService.applyVerification(form);
            currentSchoolUserId = saved.getId();
            currentSchoolId = saved.getSchoolId();
            currentSchoolName = sc.getName();
            lblSchool.setText("学校：" + currentSchoolName);
            JOptionPane.showMessageDialog(this, "认证信息已提交，等待管理员审核。\nis_verified=" + saved.getIsVerified());
        } catch (IllegalArgumentException ex) {
            showError(ex.getMessage());
        } catch (SQLException ex) {
            showError("提交失败：" + ex.getMessage());
        }
    }

    // ============ 搜索 ============
    private JTextField txtKeyword;
    private DefaultTableModel searchTableModel;
    private JTable searchTable;

    private JPanel buildSearchPanel() {
        JPanel p = new JPanel(new BorderLayout(8, 8));
        p.setBackground(Color.WHITE);
        p.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 8));
        top.setBackground(Color.WHITE);
        top.add(new JLabel("关键字："));
        txtKeyword = new JTextField(20);
        top.add(txtKeyword);
        JButton btn = new JButton("搜索");
        btn.setBackground(new Color(7, 193, 96));
        btn.setForeground(Color.WHITE);
        btn.addActionListener(e -> doSearch());
        top.add(btn);
        p.add(top, BorderLayout.NORTH);

        String[] columns = {"商品ID", "标题", "价格(¥)", "成色", "分类", "发布时间"};
        searchTableModel = new DefaultTableModel(columns, 0) {
            @Override public boolean isCellEditable(int row, int col) { return false; }
        };
        searchTable = new JTable(searchTableModel);
        searchTable.setRowHeight(26);
        searchTable.setFont(new Font("Microsoft YaHei", Font.PLAIN, 13));
        searchTable.getTableHeader().setFont(new Font("Microsoft YaHei", Font.BOLD, 13));
        p.add(new JScrollPane(searchTable), BorderLayout.CENTER);
        return p;
    }

    private void doSearch() {
        String kw = txtKeyword.getText().trim();
        if (kw.isEmpty()) { showError("请输入关键字"); return; }
        try {
            ProductDAOImpl.PageResult<Product> res =
                    productService.search(kw, currentSchoolId, 1, 20);
            searchTableModel.setRowCount(0);
            for (Product p : res.list) {
                searchTableModel.addRow(new Object[]{
                        p.getId(), p.getTitle(), p.getPrice(),
                        p.getConditionEnum().label,
                        p.getCategoryEnum().label + " " + p.getCategoryEnum().icon,
                        p.getPublishTime() == null ? "" : p.getPublishTime().toString()
                });
            }
            if (res.list.isEmpty()) {
                JOptionPane.showMessageDialog(this, "没有命中结果");
            }
        } catch (SQLException ex) {
            showError("搜索失败：" + ex.getMessage());
        }
    }

    // ============ 我的商品 ============
    private DefaultTableModel mineTableModel;
    private JTable mineTable;

    private JPanel buildMyProductsPanel() {
        JPanel p = new JPanel(new BorderLayout(8, 8));
        p.setBackground(Color.WHITE);
        p.setBorder(new EmptyBorder(12, 12, 12, 12));

        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT));
        top.setBackground(Color.WHITE);
        JButton btnRefresh = new JButton("刷新");
        btnRefresh.setBackground(new Color(7, 193, 96));
        btnRefresh.setForeground(Color.WHITE);
        btnRefresh.addActionListener(e -> refreshMyProducts());
        top.add(btnRefresh);
        p.add(top, BorderLayout.NORTH);

        String[] columns = {"商品ID", "标题", "价格(¥)", "成色", "分类", "状态", "发布时间"};
        mineTableModel = new DefaultTableModel(columns, 0) {
            @Override public boolean isCellEditable(int row, int col) { return false; }
        };
        mineTable = new JTable(mineTableModel);
        mineTable.setRowHeight(26);
        mineTable.setFont(new Font("Microsoft YaHei", Font.PLAIN, 13));
        mineTable.getTableHeader().setFont(new Font("Microsoft YaHei", Font.BOLD, 13));
        p.add(new JScrollPane(mineTable), BorderLayout.CENTER);
        return p;
    }

    private void refreshMyProducts() {
        if (currentSchoolUserId == null) { showError("请先完成学生认证"); return; }
        try {
            List<Product> list = productService.myProducts(currentSchoolUserId);
            mineTableModel.setRowCount(0);
            for (Product p : list) {
                String status = p.getStatus() == 0 ? "下架" : (p.getStatus() == 2 ? "已售" : "在售");
                mineTableModel.addRow(new Object[]{
                        p.getId(), p.getTitle(), p.getPrice(),
                        p.getConditionEnum().label,
                        p.getCategoryEnum().label + " " + p.getCategoryEnum().icon,
                        status,
                        p.getPublishTime() == null ? "" : p.getPublishTime().toString()
                });
            }
        } catch (SQLException ex) {
            showError("加载失败：" + ex.getMessage());
        }
    }

    // ============ 通用 ============
    private void initCurrentSchool() {
        try {
            List<School> schools = schoolDAO.findAllEnabled();
            if (!schools.isEmpty()) {
                currentSchoolId = schools.get(0).getId();
                currentSchoolName = schools.get(0).getName();
                lblSchool.setText("学校：" + currentSchoolName);
            }
        } catch (SQLException ignored) {}
    }

    private void showError(String msg) {
        JOptionPane.showMessageDialog(this, msg, "错误", JOptionPane.ERROR_MESSAGE);
    }
}