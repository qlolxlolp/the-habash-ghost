import sys
import os
import json
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QPushButton, QVBoxLayout, QWidget,
    QTextEdit, QLabel, QFileDialog, QHBoxLayout, QMessageBox
)
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QThread, pyqtSignal
from crypto_miner_detector_complete import IlamMinerGeoDetector

class ScanThread(QThread):
    progress = pyqtSignal(str)
    finished = pyqtSignal(dict, str, str)
    error = pyqtSignal(str)

    def run(self):
        try:
            self.progress.emit("شروع اسکن...")
            detector = IlamMinerGeoDetector()
            results = detector.comprehensive_ilam_scan()
            self.progress.emit("اسکن کامل شد. تولید نقشه...")
            map_file = detector.generate_ilam_map(results)
            self.progress.emit(f"نقشه ذخیره شد: {map_file}")
            report, report_file = detector.generate_report(results)
            self.progress.emit(f"گزارش ذخیره شد: {report_file}")
            detector.close_database()
            self.finished.emit(results, map_file, report_file)
        except Exception as e:
            self.error.emit(f"خطا در اسکن: {str(e)}")

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("سیستم شناسایی ماینر استان ایلام")
        self.resize(900, 700)

        self.scan_thread = ScanThread()
        self.scan_thread.progress.connect(self.update_log)
        self.scan_thread.finished.connect(self.scan_finished)
        self.scan_thread.error.connect(self.scan_error)

        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()

        self.start_button = QPushButton("شروع اسکن")
        self.start_button.clicked.connect(self.start_scan)
        layout.addWidget(self.start_button)

        self.status_label = QLabel("وضعیت: آماده")
        layout.addWidget(self.status_label)

        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        layout.addWidget(self.log_text)

        self.map_view = QWebEngineView()
        layout.addWidget(self.map_view, stretch=2)

        buttons_layout = QHBoxLayout()
        self.save_results_button = QPushButton("ذخیره نتایج JSON")
        self.save_results_button.clicked.connect(self.save_results)
        self.save_results_button.setEnabled(False)
        buttons_layout.addWidget(self.save_results_button)

        self.save_report_button = QPushButton("ذخیره گزارش JSON")
        self.save_report_button.clicked.connect(self.save_report)
        self.save_report_button.setEnabled(False)
        buttons_layout.addWidget(self.save_report_button)

        self.load_results_button = QPushButton("بارگذاری نتایج قبلی")
        self.load_results_button.clicked.connect(self.load_previous_results)
        buttons_layout.addWidget(self.load_results_button)

        layout.addLayout(buttons_layout)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.results = None
        self.report_file = None
        self.map_file = None

    def start_scan(self):
        self.start_button.setEnabled(False)
        self.status_label.setText("وضعیت: در حال اسکن...")
        self.log_text.clear()
        self.scan_thread.start()

    def update_log(self, message):
        self.log_text.append(message)
        self.status_label.setText(f"وضعیت: {message}")

    def scan_finished(self, results, map_file, report_file):
        self.results = results
        self.map_file = map_file
        self.report_file = report_file
        self.load_map(map_file)
        self.save_results_button.setEnabled(True)
        self.save_report_button.setEnabled(True)
        self.start_button.setEnabled(True)
        self.status_label.setText("وضعیت: اسکن و تولید گزارش به پایان رسید.")
        self.update_log("اسکن و تولید گزارش به پایان رسید.")

    def scan_error(self, error_message):
        self.status_label.setText("وضعیت: خطا در اسکن")
        self.update_log(error_message)
        QMessageBox.critical(self, "خطا", error_message)
        self.start_button.setEnabled(True)

    def load_map(self, map_file):
        if os.path.exists(map_file):
            self.map_view.load(f"file:///{os.path.abspath(map_file)}")
        else:
            self.update_log("فایل نقشه پیدا نشد.")

    def save_results(self):
        if self.results is None:
            return
        path, _ = QFileDialog.getSaveFileName(self, "ذخیره نتایج JSON", "", "JSON Files (*.json)")
        if path:
            try:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(self.results, f, ensure_ascii=False, indent=2)
                QMessageBox.information(self, "موفقیت", "نتایج با موفقیت ذخیره شد.")
            except Exception as e:
                QMessageBox.warning(self, "خطا", f"خطا در ذخیره نتایج: {e}")

    def save_report(self):
        if self.report_file is None:
            return
        path, _ = QFileDialog.getSaveFileName(self, "ذخیره گزارش JSON", "", "JSON Files (*.json)")
        if path:
            try:
                with open(self.report_file, 'r', encoding='utf-8') as src:
                    data = src.read()
                with open(path, 'w', encoding='utf-8') as dst:
                    dst.write(data)
                QMessageBox.information(self, "موفقیت", "گزارش با موفقیت ذخیره شد.")
            except Exception as e:
                QMessageBox.warning(self, "خطا", f"خطا در ذخیره گزارش: {e}")

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
