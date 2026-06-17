package com.schoolbuzz.gui;

import javax.swing.*;

/**
 * GUI 程序启动入口
 * 在事件分发线程中创建 MainFrame。
 */
public class App {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                // 设置跨平台外观，更接近原生 Windows
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) {}
            new MainFrame().setVisible(true);
        });
    }
}