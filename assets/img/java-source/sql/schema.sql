-- SchoolBuzzMate MySQL Schema
-- 对应 UniCloud 的 schools / school_users / uni-id-users / products / product_likes 集合

CREATE DATABASE IF NOT EXISTS schoolbuzz DEFAULT CHARSET utf8mb4;
USE schoolbuzz;

DROP TABLE IF EXISTS product_likes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS school_users;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;

-- 1. 学校表
CREATE TABLE schools (
    id          VARCHAR(32)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    province    VARCHAR(50)  NOT NULL,
    city        VARCHAR(50)  NOT NULL,
    logo        VARCHAR(255),
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '0=禁用 1=启用',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户表（对应 uni-id-users）
CREATE TABLE users (
    id          VARCHAR(32)  PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE,
    nickname    VARCHAR(50)  NOT NULL,
    avatar      VARCHAR(255),
    mobile      VARCHAR(20),
    gender      TINYINT,
    status      TINYINT      NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 学校用户扩展表（对应 school_users）
CREATE TABLE school_users (
    id            VARCHAR(32)  PRIMARY KEY,
    user_id       VARCHAR(32)  NOT NULL,
    school_id     VARCHAR(32)  NOT NULL,
    college       VARCHAR(100),
    major         VARCHAR(100),
    grade         VARCHAR(20),
    student_no    VARCHAR(50),
    real_name     VARCHAR(50),
    student_card  VARCHAR(255),
    is_verified   TINYINT      NOT NULL DEFAULT 0,
    credit_score  INT          NOT NULL DEFAULT 100,
    balance       DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 4. 商品表（products.seller_id 指向 school_users.id）
CREATE TABLE products (
    id              VARCHAR(32)  PRIMARY KEY,
    seller_id       VARCHAR(32)  NOT NULL,
    school_id       VARCHAR(32)  NOT NULL,
    category        VARCHAR(20)  NOT NULL COMMENT 'textbook/digital/clothing/daily/sports/other',
    title           VARCHAR(50)  NOT NULL,
    description     VARCHAR(500) NOT NULL,
    images          TEXT         NOT NULL COMMENT 'JSON数组',
    original_price  DECIMAL(10,2) DEFAULT 0,
    price           DECIMAL(10,2) NOT NULL,
    `condition`     VARCHAR(20)  NOT NULL COMMENT 'brand_new/like_new/used/old',
    trade_method    VARCHAR(100) NOT NULL COMMENT 'JSON数组',
    location        VARCHAR(100),
    status          TINYINT      NOT NULL DEFAULT 1 COMMENT '0=下架 1=上架 2=已售',
    view_count      INT          NOT NULL DEFAULT 0,
    like_count      INT          NOT NULL DEFAULT 0,
    comment_count   INT          NOT NULL DEFAULT 0,
    publish_time    DATETIME     NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES school_users(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 5. 商品点赞表
CREATE TABLE product_likes (
    id          VARCHAR(32)  PRIMARY KEY,
    user_id     VARCHAR(32)  NOT NULL,
    product_id  VARCHAR(32)  NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id),
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 初始数据
INSERT INTO schools (id, name, province, city) VALUES
('sch_001', '南京工业大学', '江苏省', '南京市'),
('sch_002', '东南大学',     '江苏省', '南京市'),
('sch_003', '南京大学',     '江苏省', '南京市');

INSERT INTO users (id, username, nickname, avatar, gender) VALUES
('usr_001', 'zhangsan', '小张同学', 'https://i.pravatar.cc/100?img=1', 1),
('usr_002', 'lisi',     '李四',     'https://i.pravatar.cc/100?img=2', 0);

INSERT INTO school_users (id, user_id, school_id, college, major, grade, student_no, real_name, student_card, is_verified, credit_score, balance) VALUES
('su_001', 'usr_001', 'sch_001', '计算机科学与技术学院', '软件工程', '2022级', '20220101', '张三', 'card_001.jpg', 1, 100, 250.00),
('su_002', 'usr_002', 'sch_001', '艺术设计学院',         '视觉传达', '2023级', '20230202', '李四', 'card_002.jpg', 1,  98,  50.00);

INSERT INTO products (id, seller_id, school_id, category, title, description, images, original_price, price, `condition`, trade_method, location, status, view_count, like_count, comment_count, publish_time) VALUES
('p_001', 'su_001', 'sch_001', 'textbook', '高等数学（同济第七版）上下册',  '九成新，原价99元，课堂笔记齐全',           '["https://img.example/p1.jpg"]',                                                                                  99.00, 35.00, 'like_new', '["self_pickup","express"]', '图书馆一楼',        1, 120, 15,  3, '2026-06-01 10:30:00'),
('p_002', 'su_001', 'sch_001', 'digital',  '罗技 MX Master 3S 鼠标',       '使用半年，无划痕，附原装充电线',             '["https://img.example/p2.jpg","https://img.example/p2b.jpg"]',                                                    799.00, 480.00,'used',     '["express"]',              '',                 1,  45,  8,  1, '2026-06-02 14:20:00'),
('p_003', 'su_002', 'sch_001', 'clothing', 'UNIQLO 男士羽绒服 L码',          '去年冬天买的，只穿过两次',                    '["https://img.example/p3.jpg"]',                                                                                  599.00, 220.00,'like_new', '["self_pickup"]',           '男生宿舍楼下',       1,  88, 12,  0, '2026-06-03 09:15:00'),
('p_004', 'su_002', 'sch_001', 'daily',    '全新收纳盒三件套',                '搬家清仓，密封性好，适合宿舍收纳',           '["https://img.example/p4.jpg"]',                                                                                   49.00,  15.00,'brand_new','["self_pickup","express"]', '女生宿舍楼下',       1,  20,  3,  0, '2026-06-04 18:00:00'),
('p_005', 'su_001', 'sch_001', 'sports',   '李宁 跑步鞋 42码',               '跑了两次不合适，转让',                       '["https://img.example/p5.jpg"]',                                                                                  369.00, 180.00,'like_new', '["self_pickup"]',           '操场看台',           1,  15,  2,  0, '2026-06-05 11:00:00');