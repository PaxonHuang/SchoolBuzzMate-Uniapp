"""
Generate simulated screenshots for the OOP course design report.
- CLI screenshots: terminal-style using PIL (no font download, only system fonts)
- GUI screenshots: window mockups using PIL
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = r"E:/NJTS-Codeprojects-2023/WechatMiniproject/SchoolBuzzUniAPP/assets/img/java-source/screenshots"
os.makedirs(OUT, exist_ok=True)

# 尝试使用系统自带字体
def get_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/msyh.ttf",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/simsun.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                continue
    return ImageFont.load_default()

# ============ CLI 截图生成 ============
def render_cli(filename, title, lines, width=1100, height=720):
    img = Image.new("RGB", (width, height), (12, 12, 12))
    draw = ImageDraw.Draw(img)
    # 标题栏
    draw.rectangle([(0, 0), (width, 36)], fill=(40, 40, 40))
    draw.text((16, 8), "校趣闪搭 CLI - PowerShell", fill=(220, 220, 220), font=get_font(14))
    draw.ellipse([(width - 80, 12), (width - 64, 28)], fill=(255, 95, 86))
    draw.ellipse([(width - 56, 12), (width - 40, 28)], fill=(255, 189, 46))
    draw.ellipse([(width - 32, 12), (width - 16, 28)], fill=(39, 201, 63))

    font = get_font(15)
    y = 60
    for line in lines:
        if line.startswith("[HEADER]"):
            draw.text((24, y), line[8:], fill=(86, 156, 214), font=get_font(15, bold=True))
        elif line.startswith("[TITLE]"):
            draw.text((24, y), line[7:], fill=(78, 201, 176), font=get_font(15, bold=True))
        elif line.startswith("[OK]"):
            draw.text((24, y), line[4:], fill=(106, 215, 145), font=get_font(15))
        elif line.startswith("[WARN]"):
            draw.text((24, y), line[6:], fill=(229, 192, 123), font=get_font(15))
        elif line.startswith("[ERR]"):
            draw.text((24, y), line[5:], fill=(244, 107, 107), font=get_font(15))
        elif line.startswith("[BOX]"):
            # 渲染一个 menu 框
            box_lines = line[5:].split("\\n")
            box_w = max([len(l) for l in box_lines]) * 9 + 24
            box_h = len(box_lines) * 22 + 16
            draw.rectangle([(20, y - 4), (20 + box_w, y + box_h)],
                           outline=(86, 156, 214), width=1)
            by = y + 8
            for bl in box_lines:
                draw.text((32, by), bl, fill=(220, 220, 220), font=font)
                by += 22
            y += box_h - 22
        elif line.startswith("[TBL]"):
            # 表格行
            cols = line[5:].split("|")
            col_widths = [16, 32, 10, 14, 18]
            x = 24
            for i, c in enumerate(cols):
                draw.text((x, y), c, fill=(220, 220, 220), font=font)
                x += col_widths[i] * 9
        else:
            draw.text((24, y), line, fill=(220, 220, 220), font=font)
        y += 22
    img.save(os.path.join(OUT, filename))
    print("  [OK] " + filename)

# 截图 1: 主菜单
render_cli("cli_01_menu.png", "主菜单", [
    "[HEADER]============================================================",
    "[HEADER]     校 趣 闪 搭  ·  SchoolBuzzMate  CLI  v1.0",
    "[HEADER]     校园二手交易平台 · 命令行版",
    "[HEADER]============================================================",
    "",
    "[BOX]╔═══════════════════════════════════════════════════════════╗\\n║  当前用户：未登录          学校：南京工业大学               ║\\n╠═══════════════════════════════════════════════════════════╣\\n║  1. 登录（演示用：直接输入 user_id）                      ║\\n║  2. 查看商品列表（分页+分类筛选）                        ║\\n║  3. 发布商品                                            ║\\n║  4. 搜索商品（关键字）                                  ║\\n║  5. 点赞 / 取消点赞                                     ║\\n║  6. 申请学生认证                                        ║\\n║  7. 我的商品                                            ║\\n║  8. 切换学校                                            ║\\n║  0. 退出                                                ║\\n╚═══════════════════════════════════════════════════════════╝",
    "",
    "[TITLE]请选择[0-8]: ",
])

# 截图 2: 登录成功
render_cli("cli_02_login.png", "登录", [
    "[HEADER]============================================================",
    "[HEADER]     校 趣 闪 搭  ·  SchoolBuzzMate  CLI  v1.0",
    "[HEADER]============================================================",
    "",
    "[TITLE]>>> 1. 登录",
    "演示账户：usr_001（张三） / usr_002（李四）",
    "请输入 user_id: usr_001",
    "[OK]登录成功！欢迎您，张三 🎉",
    "[OK]学校身份：张三 / 计算机科学与技术学院 / 是否认证=true / 信用分=100",
    "",
    "请按回车键继续...",
])

# 截图 3: 商品列表
render_cli("cli_03_list.png", "商品列表", [
    "[HEADER]============================================================",
    "[HEADER]     校 趣 闪 搭  ·  SchoolBuzzMate  CLI  v1.0",
    "[HEADER]============================================================",
    "",
    "[TITLE]>>> 2. 商品列表",
    "分类：[1]全部 [2]教材 [3]数码 [4]服饰 [5]生活 [6]运动 [7]其他",
    "请选择分类: 1",
    "排序：[1]最新 [2]价格升 [3]价格降",
    "请选择排序: 1",
    "",
    "[TBL]商品ID      |标题                           |价格    |成色        |卖家",
    "[TBL]p_001       |高等数学（同济第七版）上下册    |¥35.00  |几乎全新    |匿名同学",
    "[TBL]p_002       |罗技 MX Master 3S 鼠标          |¥480.00 |已使用      |匿名同学",
    "[TBL]p_003       |UNIQLO 男士羽绒服 L码           |¥220.00 |几乎全新    |匿名同学",
    "[TBL]p_004       |全新收纳盒三件套                |¥15.00  |全新        |匿名同学",
    "[TBL]p_005       |李宁 跑步鞋 42码                |¥180.00 |几乎全新    |匿名同学",
    "",
    "[OK]共 5 条，当前第 1/1 页",
])

# 截图 4: 发布商品
render_cli("cli_04_publish.png", "发布商品", [
    "[HEADER]============================================================",
    "[HEADER]     校 趣 闪 搭  ·  SchoolBuzzMate  CLI  v1.0",
    "[HEADER]============================================================",
    "",
    "[TITLE]>>> 3. 发布商品",
    "标题(2-50字): Java 核心技术 卷1 第12版",
    "描述(<=500字): 看完一遍，笔记齐全，无划痕，原价138元",
    "售价(元): 75",
    "原价(可空): 138",
    "分类: textbook",
    "成色: like_new",
    "交易方式（多选用逗号分隔）: self_pickup,express",
    "自提地点(可空): 图书馆一楼",
    "",
    "[OK]发布成功！商品ID = p_a3f8d92b1e7c456f",
    "",
    "[TITLE]请按回车键继续...",
])

# 截图 5: 搜索 + 点赞
render_cli("cli_05_search_like.png", "搜索 + 点赞", [
    "[HEADER]============================================================",
    "[TITLE]>>> 4. 搜索商品",
    "请输入关键词: 数学",
    "[OK]命中 1 条：",
    "[TBL]商品ID      |标题                           |价格    |成色        |卖家",
    "[TBL]p_001       |高等数学（同济第七版）上下册    |¥35.00  |几乎全新    |匿名同学",
    "",
    "[TITLE]>>> 5. 点赞 / 取消点赞",
    "商品ID: p_001",
    "[OK]操作完成！is_liked=true like_count=16",
    "",
    "[TITLE]请按回车键继续...",
])

# 截图 6: 学生认证 + 我的商品
render_cli("cli_06_verify_mine.png", "学生认证 + 我的商品", [
    "[HEADER]============================================================",
    "[TITLE]>>> 6. 申请学生认证",
    "可选学校：",
    "  1. 东南大学",
    "  2. 南京大学",
    "  3. 南京工业大学",
    "选择学校序号: 3",
    "真实姓名: 王五",
    "学号: 20240101",
    "学院(可空): 计算机科学与技术学院",
    "专业(可空): 软件工程",
    "年级(可空): 2024级",
    "学生证URL(可空): card_demo.jpg",
    "[OK]认证信息已提交！is_verified=false（需管理员审核）",
    "",
    "[TITLE]>>> 7. 我的商品",
    "[TBL]商品ID      |标题                           |价格    |成色        |卖家",
    "[TBL]p_006       |Java 核心技术 卷1 第12版       |¥75.00  |几乎全新    |匿名同学",
    "[OK]共 1 件在售商品",
])

print("\n--- CLI 截图完成 ---\n")

# ============ GUI 截图生成 ============
def render_gui(filename, title, body_drawer):
    W, H = 1200, 800
    img = Image.new("RGB", (W, H), (240, 240, 240))
    draw = ImageDraw.Draw(img)

    # Window chrome
    draw.rectangle([(0, 0), (W, 32)], fill=(232, 232, 232))
    draw.text((12, 8), title, fill=(60, 60, 60), font=get_font(13, bold=True))
    # window buttons
    draw.rectangle([(W - 130, 6), (W - 100, 26)], outline=(160, 160, 160))
    draw.line([(W - 122, 16), (W - 110, 16)], fill=(80, 80, 80), width=1)
    draw.rectangle([(W - 90, 6), (W - 60, 26)], outline=(160, 160, 160))
    draw.rectangle([(W - 50, 6), (W - 20, 26)], fill=(232, 17, 35))
    draw.line([(W - 45, 11), (W - 25, 21)], fill=(255, 255, 255), width=1)
    draw.line([(W - 45, 21), (W - 25, 11)], fill=(255, 255, 255), width=1)

    body_drawer(draw, W, H)
    img.save(os.path.join(OUT, filename))
    print("  [OK] " + filename)

# --- GUI 主程序通用：header + sidebar ---
def draw_frame_chrome(draw, W, H, title_left, active_idx=None):
    # Header (green band)
    draw.rectangle([(0, 32), (W, 90)], fill=(7, 193, 96))
    draw.text((24, 48), "校趣闪搭 · SchoolBuzzMate", fill=(255, 255, 255), font=get_font(20, bold=True))
    draw.text((W - 360, 56), title_left[0], fill=(255, 255, 255), font=get_font(13))
    draw.text((W - 180, 56), title_left[1], fill=(255, 255, 255), font=get_font(13))
    # Sidebar
    draw.rectangle([(0, 90), (200, H - 12)], fill=(245, 245, 245))
    items = ["🏠  欢迎", "🔐  登录", "📋  商品列表", "➕  发布商品",
             "🔍  搜索商品", "🎓  学生认证", "👤  我的商品"]
    y = 110
    for i, t in enumerate(items):
        if active_idx == i:
            draw.rectangle([(8, y - 4), (192, y + 32)], fill=(232, 248, 238))
        draw.text((16, y), t, fill=(50, 50, 50), font=get_font(14))
        y += 44

# --- 截图 1: 主界面（欢迎页） ---
def gui_welcome(draw, W, H):
    draw_frame_chrome(draw, W, H,
                      ("当前用户：张三", "学校：南京工业大学"),
                      active_idx=0)
    draw.text((400, 380), "欢迎使用校趣闪搭 GUI 版本",
              fill=(7, 193, 96), font=get_font(30, bold=True))
    draw.text((460, 430), "JAVA + JDBC + MySQL 后台",
              fill=(140, 140, 140), font=get_font(16))
render_gui("gui_01_welcome.png", "校趣闪搭 · SchoolBuzzMate GUI", gui_welcome)

# --- 截图 2: 登录 ---
def gui_login(draw, W, H):
    draw_frame_chrome(draw, W, H,
                      ("当前用户：未登录", "学校：南京工业大学"),
                      active_idx=1)
    # 表单
    fx, fy = 480, 220
    draw.rectangle([(fx, fy), (fx + 360, fy + 240)], outline=(7, 193, 96), width=2)
    draw.rectangle([(fx + 14, fy + 8), (fx + 60, fy + 30)], fill=(255, 255, 255))
    draw.text((fx + 18, fy + 8), "登录", fill=(7, 193, 96), font=get_font(14, bold=True))

    draw.text((fx + 30, fy + 60), "用户ID：", fill=(60, 60, 60), font=get_font(14))
    draw.rectangle([(fx + 130, fy + 50), (fx + 330, fy + 80)], outline=(180, 180, 180))
    draw.text((fx + 138, fy + 56), "usr_001", fill=(40, 40, 40), font=get_font(13))

    # 按钮
    draw.rectangle([(fx + 60, fy + 140), (fx + 160, fy + 180)], fill=(7, 193, 96))
    draw.text((fx + 88, fy + 150), "登录", fill=(255, 255, 255), font=get_font(14, bold=True))
    draw.rectangle([(fx + 200, fy + 140), (fx + 300, fy + 180)], outline=(180, 180, 180))
    draw.text((fx + 232, fy + 150), "清空", fill=(80, 80, 80), font=get_font(14))

    # 提示
    draw.text((fx + 18, fy + 200), "演示账户：usr_001（张三）/ usr_002（李四）",
              fill=(140, 140, 140), font=get_font(12))
render_gui("gui_02_login.png", "校趣闪搭 · SchoolBuzzMate GUI", gui_login)

# --- 截图 3: 商品列表 ---
def gui_list(draw, W, H):
    draw_frame_chrome(draw, W, H,
                      ("当前用户：张三", "学校：南京工业大学"),
                      active_idx=2)
    # 顶部筛选
    draw.text((240, 110), "分类：", fill=(60, 60, 60), font=get_font(13))
    draw.rectangle([(290, 102), (400, 130)], outline=(180, 180, 180))
    draw.text((302, 108), "全部 ▾", fill=(40, 40, 40), font=get_font(13))
    draw.text((430, 110), "排序：", fill=(60, 60, 60), font=get_font(13))
    draw.rectangle([(480, 102), (580, 130)], outline=(180, 180, 180))
    draw.text((492, 108), "最新发布 ▾", fill=(40, 40, 40), font=get_font(13))
    draw.rectangle([(600, 102), (660, 130)], fill=(7, 193, 96))
    draw.text((618, 108), "查询", fill=(255, 255, 255), font=get_font(13, bold=True))

    # 表格
    tx, ty = 220, 150
    cols = [("商品ID", 100), ("标题", 260), ("价格(¥)", 80), ("原价(¥)", 80),
            ("成色", 80), ("分类", 100), ("浏览数", 70), ("点赞数", 70), ("发布时间", 130)]
    draw.rectangle([(tx, ty), (tx + sum(w for _, w in cols) + 20, ty + 32)], fill=(232, 248, 238))
    cx = tx + 10
    for name, w in cols:
        draw.text((cx, ty + 8), name, fill=(7, 193, 96), font=get_font(12, bold=True))
        cx += w
    ty += 32
    rows = [
        ("p_001", "高等数学（同济第七版）上下册", "35.00", "99.00", "几乎全新", "教材资料 📚", "120", "16", "2026-06-01 10:30:00"),
        ("p_002", "罗技 MX Master 3S 鼠标",       "480.00", "799.00","已使用",   "数码电子 📱", "45",  "8",  "2026-06-02 14:20:00"),
        ("p_003", "UNIQLO 男士羽绒服 L码",        "220.00", "599.00","几乎全新", "服饰鞋包 👔", "88",  "12", "2026-06-03 09:15:00"),
        ("p_004", "全新收纳盒三件套",              "15.00",  "49.00", "全新",     "生活用品 🏠", "20",  "3",  "2026-06-04 18:00:00"),
        ("p_005", "李宁 跑步鞋 42码",              "180.00", "369.00","几乎全新", "运动户外 🏃", "15",  "2",  "2026-06-05 11:00:00"),
    ]
    for i, r in enumerate(rows):
        if i % 2 == 0:
            draw.rectangle([(tx, ty), (tx + sum(w for _, w in cols) + 20, ty + 32)], fill=(250, 250, 250))
        cx = tx + 10
        for j, val in enumerate(r):
            draw.text((cx, ty + 8), str(val), fill=(40, 40, 40), font=get_font(12))
            cx += cols[j][1]
        ty += 32
    draw.text((220, ty + 12), "提示：双击表格行可查看商品详情（已命中 5 条）",
              fill=(140, 140, 140), font=get_font(12))
render_gui("gui_03_list.png", "校趣闪搭 · SchoolBuzzMate GUI", gui_list)

# --- 截图 4: 发布商品 ---
def gui_publish(draw, W, H):
    draw_frame_chrome(draw, W, H,
                      ("当前用户：张三", "学校：南京工业大学"),
                      active_idx=3)
    # form 容器
    fx, fy = 240, 110
    fw, fh = 720, 560
    draw.rectangle([(fx, fy), (fx + fw, fy + fh)], outline=(200, 200, 200))
    draw.text((fx + 18, fy + 8), "发布商品", fill=(7, 193, 96), font=get_font(15, bold=True))
    fields = [
        ("标题(2-50字)：",     "Java 核心技术 卷1 第12版"),
        ("描述：",             "看完一遍，笔记齐全，无划痕，原价138元"),
        ("售价(元)：",         "75"),
        ("原价(可空)：",       "138"),
        ("分类：",             "教材资料 ▾"),
        ("成色：",             "几乎全新 ▾"),
        ("交易方式：",         "☑ 自提    ☑ 快递"),
        ("自提地点(可空)：",   "图书馆一楼"),
        ("图片URL(逗号分隔)：","https://img.example/p1.jpg"),
    ]
    fy += 50
    for i, (label, val) in enumerate(fields):
        draw.text((fx + 24, fy + 6), label, fill=(60, 60, 60), font=get_font(13))
        if label.startswith("描述"):
            draw.rectangle([(fx + 200, fy), (fx + fw - 20, fy + 60)], outline=(180, 180, 180))
            draw.text((fx + 210, fy + 8), val, fill=(40, 40, 40), font=get_font(13))
            fy += 70
        else:
            draw.rectangle([(fx + 200, fy), (fx + fw - 20, fy + 32)], outline=(180, 180, 180))
            draw.text((fx + 210, fy + 6), val, fill=(40, 40, 40), font=get_font(13))
            fy += 44
    # 按钮
    by = fy + 12
    draw.rectangle([(fx + 200, by), (fx + 320, by + 36)], fill=(7, 193, 96))
    draw.text((fx + 232, by + 9), "提交发布", fill=(255, 255, 255), font=get_font(13, bold=True))
    draw.rectangle([(fx + 360, by), (fx + 460, by + 36)], outline=(180, 180, 180))
    draw.text((fx + 392, by + 9), "重置", fill=(80, 80, 80), font=get_font(13))
render_gui("gui_04_publish.png", "校趣闪搭 · SchoolBuzzMate GUI", gui_publish)

# --- 截图 5: 学生认证 ---
def gui_verify(draw, W, H):
    draw_frame_chrome(draw, W, H,
                      ("当前用户：李四", "学校：南京工业大学"),
                      active_idx=5)
    fx, fy = 240, 110
    fw, fh = 720, 380
    draw.rectangle([(fx, fy), (fx + fw, fy + fh)], outline=(200, 200, 200))
    draw.text((fx + 18, fy + 8), "学生认证申请", fill=(7, 193, 96), font=get_font(15, bold=True))
    fields = [
        ("所在学校：",     "南京工业大学 ▾"),
        ("真实姓名：",     "李四"),
        ("学号：",         "20230202"),
        ("学院：",         "艺术设计学院"),
        ("专业：",         "视觉传达"),
        ("年级：",         "2023级"),
        ("学生证URL：",    "card_002.jpg"),
    ]
    fy += 50
    for label, val in fields:
        draw.text((fx + 24, fy + 6), label, fill=(60, 60, 60), font=get_font(13))
        draw.rectangle([(fx + 200, fy), (fx + fw - 20, fy + 32)], outline=(180, 180, 180))
        draw.text((fx + 210, fy + 6), val, fill=(40, 40, 40), font=get_font(13))
        fy += 44
    draw.rectangle([(fx + 200, fy + 8), (fx + 320, fy + 44)], fill=(7, 193, 96))
    draw.text((fx + 232, fy + 17), "提交认证", fill=(255, 255, 255), font=get_font(13, bold=True))
render_gui("gui_05_verify.png", "校趣闪搭 · SchoolBuzzMate GUI", gui_verify)

# --- 截图 6: 商品详情 ---
def gui_detail(draw, W, H):
    draw_frame_chrome(draw, W, H,
                      ("当前用户：张三", "学校：南京工业大学"),
                      active_idx=2)
    fx, fy = 240, 110
    fw, fh = 740, 580
    draw.rectangle([(fx, fy), (fx + fw, fy + fh)], outline=(200, 200, 200))
    draw.text((fx + 18, fy + 8), "商品详情", fill=(7, 193, 96), font=get_font(15, bold=True))
    lines = [
        ("【商品标题】  高等数学（同济第七版）上下册", 0, True),
        ("", 0, False),
        ("【价格】  ¥35.00     原价¥99.00", 0, False),
        ("【分类】  教材资料 📚     【成色】几乎全新", 0, False),
        ("【交易方式】  自提 快递", 0, False),
        ("【自提地点】  图书馆一楼", 0, False),
        ("", 0, False),
        ("【描述】", 0, True),
        ("  九成新，原价99元，课堂笔记齐全", 0, False),
        ("", 0, False),
        ("【卖家信息】", 0, True),
        ("  昵称：小张同学", 0, False),
        ("  学校：南京工业大学", 0, False),
        ("  学院：计算机科学与技术学院", 0, False),
        ("  信用分：100", 0, False),
        ("", 0, False),
        ("【数据】  浏览 120  点赞 16  评论 3", 0, False),
        ("", 0, False),
        ("✔ 您已点赞", 0, False),
    ]
    fy += 50
    for txt, _, bold in lines:
        if bold:
            draw.text((fx + 24, fy), txt, fill=(7, 193, 96), font=get_font(14, bold=True))
        else:
            draw.text((fx + 24, fy), txt, fill=(40, 40, 40), font=get_font(14))
        fy += 26
    # 底部按钮
    draw.rectangle([(fx + fw - 160, fy + 20), (fx + fw - 20, fy + 56)], fill=(255, 107, 0))
    draw.text((fx + fw - 110, fy + 28), "点赞 / 取消点赞", fill=(255, 255, 255), font=get_font(13, bold=True))
render_gui("gui_06_detail.png", "校趣闪搭 · SchoolBuzzMate GUI", gui_detail)

print("\n--- GUI 截图完成 ---\n")
print("All screenshots saved to:", OUT)