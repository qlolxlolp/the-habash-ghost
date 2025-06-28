using System;
using System.IO;
using System.Windows;
using System.Windows.Threading;

namespace IlamMinerDetector
{
    /// <summary>
    /// App.xaml کلاس اصلی اپلیکیشن
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            // تنظیم handler برای خطاهای غیرمنتظره
            this.DispatcherUnhandledException += App_DispatcherUnhandledException;
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;

            // ایجاد پوشه‌های مورد نیاز
            CreateRequiredDirectories();

            // تنظیم Culture برای RTL
            System.Threading.Thread.CurrentThread.CurrentUICulture = 
                new System.Globalization.CultureInfo("fa-IR");

            base.OnStartup(e);
        }

        private void CreateRequiredDirectories()
        {
            try
            {
                var directories = new[]
                {
                    "Reports",
                    "Logs",
                    "Database",
                    "Exports"
                };

                foreach (var dir in directories)
                {
                    if (!Directory.Exists(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }
                }
            }
            catch (Exception ex)
            {
                LogError($"خطا در ایجاد پوشه‌ها: {ex.Message}");
            }
        }

        private void App_DispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            var errorMessage = $"خطای غیرمنتظره: {e.Exception.Message}\n\nجزئیات:\n{e.Exception}";
            
            MessageBox.Show(errorMessage, "خطای سیستم", 
                MessageBoxButton.OK, MessageBoxImage.Error);
            
            LogError(errorMessage);
            
            // جلوگیری از بسته شدن اپلیکیشن
            e.Handled = true;
        }

        private void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            var exception = e.ExceptionObject as Exception;
            var errorMessage = $"خطای شدید سیستم: {exception?.Message}\n\nجزئیات:\n{exception}";
            
            LogError(errorMessage);
            
            MessageBox.Show(errorMessage, "خطای شدید", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }

        private void LogError(string error)
        {
            try
            {
                var logFile = Path.Combine("Logs", $"errors_{DateTime.Now:yyyyMMdd}.log");
                var logEntry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {error}\n{new string('-', 80)}\n";
                
                File.AppendAllText(logFile, logEntry, System.Text.Encoding.UTF8);
            }
            catch
            {
                // در صورت عدم امکان لاگ کردن، هیچ کاری نمی‌کنیم
            }
        }

        protected override void OnExit(ExitEventArgs e)
        {
            // پاکسازی منابع
            try
            {
                // اطمینان از بسته شدن اتصالات دیتابیس
                System.Data.SQLite.SQLiteConnection.ClearAllPools();
                GC.Collect();
                GC.WaitForPendingFinalizers();
            }
            catch (Exception ex)
            {
                LogError($"خطا در پاکسازی منابع: {ex.Message}");
            }

            base.OnExit(e);
        }
    }
}