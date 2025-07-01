using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using Newtonsoft.Json;
using System.Data.SQLite;
using System.Text;
using System.Management;

namespace IlamMinerDetector
{
    public partial class MainWindow : Window
    {
        private ObservableCollection<MinerDevice> _detectedDevices;
        private CancellationTokenSource _cancellationTokenSource;
        private IlamMinerDetector _detector;
        private DispatcherTimer _updateTimer;
        private int _totalDevicesToScan;
        private int _scannedDevices;

        public MainWindow()
        {
            InitializeComponent();
            InitializeApplication();
            this.Loaded += MainWindow_Loaded;
        }

        private void InitializeApplication()
        {
            _detectedDevices = new ObservableCollection<MinerDevice>();
            DgResults.ItemsSource = _detectedDevices;
            _detector = new IlamMinerDetector();
            
            // Setup update timer
            _updateTimer = new DispatcherTimer();
            _updateTimer.Interval = TimeSpan.FromSeconds(1);
            _updateTimer.Tick += UpdateTimer_Tick;
            
            UpdateStatistics();
        }

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            CreateAnimatedStars(60); // تعداد ستاره‌ها
        }

        private void CreateAnimatedStars(int count)
        {
            var rand = new Random();
            StarCanvas.Children.Clear();
            for (int i = 0; i < count; i++)
            {
                var star = new System.Windows.Shapes.Ellipse
                {
                    Width = rand.Next(2, 5),
                    Height = rand.Next(2, 5),
                    Fill = System.Windows.Media.Brushes.White,
                    Opacity = rand.NextDouble() * 0.7 + 0.3
                };
                double left = rand.NextDouble() * StarCanvas.ActualWidth;
                double top = rand.NextDouble() * 220 + 20; // فقط در بالای صفحه
                // اگر هنوز اندازه canvas صفر است، مقدار پیش‌فرض بده
                if (StarCanvas.ActualWidth < 10) left = rand.Next(0, 1200);
                if (StarCanvas.ActualHeight < 10) top = rand.Next(20, 220);
                System.Windows.Controls.Canvas.SetLeft(star, left);
                System.Windows.Controls.Canvas.SetTop(star, top);
                StarCanvas.Children.Add(star);

                // انیمیشن چشمک‌زن
                var anim = new System.Windows.Media.Animation.DoubleAnimation
                {
                    From = star.Opacity,
                    To = rand.NextDouble() * 0.3 + 0.1,
                    Duration = TimeSpan.FromSeconds(rand.NextDouble() * 2 + 1),
                    AutoReverse = true,
                    RepeatBehavior = System.Windows.Media.Animation.RepeatBehavior.Forever,
                    BeginTime = TimeSpan.FromSeconds(rand.NextDouble() * 3)
                };
                star.BeginAnimation(System.Windows.Shapes.Ellipse.OpacityProperty, anim);
            }
        }

        private void UpdateTimer_Tick(object sender, EventArgs e)
        {
            UpdateStatistics();
        }

        private async void BtnStartScan_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                BtnStartScan.IsEnabled = false;
                BtnStopScan.IsEnabled = true;
                _cancellationTokenSource = new CancellationTokenSource();
                
                TxtStatus.Text = "در حال شروع اسکن جامع...";
                ProgressBarMain.Value = 0;
                _updateTimer.Start();
                
                await StartComprehensiveScan(_cancellationTokenSource.Token);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطا در اسکن: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                BtnStartScan.IsEnabled = true;
                BtnStopScan.IsEnabled = false;
                _updateTimer.Stop();
                TxtStatus.Text = "اسکن کامل شد.";
            }
        }

        private void BtnStopScan_Click(object sender, RoutedEventArgs e)
        {
            _cancellationTokenSource?.Cancel();
            TxtStatus.Text = "در حال توقف اسکن...";
        }

        private async void BtnNetworkScan_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                TxtStatus.Text = "در حال اسکن شبکه...";
                var devices = await _detector.ScanLocalNetworkAsync(TxtIpRange.Text, _cancellationTokenSource?.Token ?? CancellationToken.None);
                
                foreach (var device in devices)
                {
                    _detectedDevices.Add(device);
                }
                
                TxtStatus.Text = $"اسکن شبکه کامل شد. {devices.Count} دستگاه یافت شد.";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطا در اسکن شبکه: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void BtnPortScan_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (DgResults.SelectedItem is MinerDevice selectedDevice)
                {
                    TxtStatus.Text = $"در حال اسکن پورت {selectedDevice.IpAddress}...";
                    
                    var ports = TxtPorts.Text.Split(',').Select(p => int.Parse(p.Trim())).ToArray();
                    var timeout = int.Parse(TxtTimeout.Text);
                    
                    var openPorts = await _detector.ScanPortsAsync(selectedDevice.IpAddress, ports, timeout);
                    selectedDevice.OpenPorts = string.Join(",", openPorts);
                    selectedDevice.SuspicionScore += openPorts.Count * 10;
                    
                    TxtStatus.Text = $"اسکن پورت کامل شد. {openPorts.Count} پورت باز یافت شد.";
                }
                else
                {
                    MessageBox.Show("لطفاً یک دستگاه را انتخاب کنید.", "اطلاع", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطا در اسکن پورت: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void BtnGeoLocation_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (DgResults.SelectedItem is MinerDevice selectedDevice)
                {
                    TxtStatus.Text = $"در حال مکان‌یابی {selectedDevice.IpAddress}...";
                    
                    var location = await _detector.GetLocationAsync(selectedDevice.IpAddress);
                    if (location != null)
                    {
                        selectedDevice.City = location.City;
                        selectedDevice.Latitude = location.Latitude;
                        selectedDevice.Longitude = location.Longitude;
                        selectedDevice.Country = location.Country;
                        
                        // Check if in Ilam bounds
                        if (_detector.IsInIlamBounds(location.Latitude, location.Longitude))
                        {
                            selectedDevice.SuspicionScore += 20;
                            selectedDevice.Status = "در ایلام";
                        }
                    }
                    
                    TxtStatus.Text = "مکان‌یابی کامل شد.";
                }
                else
                {
                    MessageBox.Show("لطفاً یک دستگاه را انتخاب کنید.", "اطلاع", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطا در مکان‌یابی: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnExportResults_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var results = new
                {
                    ScanTime = DateTime.Now,
                    TotalDevices = _detectedDevices.Count,
                    SuspiciousDevices = _detectedDevices.Count(d => d.SuspicionScore > 30),
                    ConfirmedMiners = _detectedDevices.Count(d => d.SuspicionScore > 60),
                    Devices = _detectedDevices.ToList()
                };

                var json = JsonConvert.SerializeObject(results, Formatting.Indented);
                var fileName = $"ilam_miner_report_{DateTime.Now:yyyyMMdd_HHmmss}.json";
                
                File.WriteAllText(fileName, json, Encoding.UTF8);
                
                MessageBox.Show($"گزارش در فایل {fileName} ذخیره شد.", "موفق", MessageBoxButton.OK, MessageBoxImage.Information);
                
                // Open file location
                Process.Start("explorer.exe", $"/select,{Path.GetFullPath(fileName)}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطا در ذخیره گزارش: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void BtnShowMap_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var mapWindow = new MapWindow(_detectedDevices.Where(d => d.Latitude != 0 && d.Longitude != 0).ToList());
                mapWindow.Show();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطا در نمایش نقشه: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async Task StartComprehensiveScan(CancellationToken cancellationToken)
        {
            try
            {
                _detectedDevices.Clear();
                
                // Step 1: Network Discovery
                TxtStatus.Text = "مرحله 1: کشف شبکه...";
                ProgressBarMain.Value = 10;
                
                var networkDevices = await _detector.ScanLocalNetworkAsync(TxtIpRange.Text, cancellationToken);
                foreach (var device in networkDevices)
                {
                    _detectedDevices.Add(device);
                }
                
                if (cancellationToken.IsCancellationRequested) return;
                
                // Step 2: Port Scanning
                TxtStatus.Text = "مرحله 2: اسکن پورت...";
                ProgressBarMain.Value = 30;
                
                var ports = TxtPorts.Text.Split(',').Select(p => int.Parse(p.Trim())).ToArray();
                var timeout = int.Parse(TxtTimeout.Text);
                
                _totalDevicesToScan = _detectedDevices.Count;
                _scannedDevices = 0;
                
                var tasks = _detectedDevices.Select(async device =>
                {
                    var openPorts = await _detector.ScanPortsAsync(device.IpAddress, ports, timeout);
                    device.OpenPorts = string.Join(",", openPorts);
                    device.SuspicionScore += openPorts.Count * 15;
                    
                    // Check for miner-specific services
                    foreach (var port in openPorts)
                    {
                        if (_detector.IsMinerPort(port))
                        {
                            device.DeviceType = "Crypto Miner";
                            device.SuspicionScore += 30;
                            device.Status = "مشکوک";
                        }
                    }
                    
                    Interlocked.Increment(ref _scannedDevices);
                });
                
                await Task.WhenAll(tasks);
                
                if (cancellationToken.IsCancellationRequested) return;
                
                // Step 3: Geolocation
                TxtStatus.Text = "مرحله 3: مکان‌یابی...";
                ProgressBarMain.Value = 60;
                
                var geoTasks = _detectedDevices.Where(d => d.SuspicionScore > 20).Select(async device =>
                {
                    var location = await _detector.GetLocationAsync(device.IpAddress);
                    if (location != null)
                    {
                        device.City = location.City;
                        device.Latitude = location.Latitude;
                        device.Longitude = location.Longitude;
                        device.Country = location.Country;
                        
                        if (_detector.IsInIlamBounds(location.Latitude, location.Longitude))
                        {
                            device.SuspicionScore += 25;
                            device.Status = "در ایلام";
                        }
                    }
                });
                
                await Task.WhenAll(geoTasks);
                
                if (cancellationToken.IsCancellationRequested) return;
                
                // Step 4: Advanced Analysis
                TxtStatus.Text = "مرحله 4: تحلیل پیشرفته...";
                ProgressBarMain.Value = 80;
                
                foreach (var device in _detectedDevices)
                {
                    // Check hostname
                    try
                    {
                        var hostname = await _detector.GetHostnameAsync(device.IpAddress);
                        if (!string.IsNullOrEmpty(hostname))
                        {
                            device.Hostname = hostname;
                            if (_detector.IsSuspiciousHostname(hostname))
                            {
                                device.SuspicionScore += 20;
                                device.DeviceType = "Suspected Miner";
                            }
                        }
                    }
                    catch { }
                    
                    // Determine final status
                    if (device.SuspicionScore >= 70)
                    {
                        device.Status = "ماینر تأیید شده";
                    }
                    else if (device.SuspicionScore >= 40)
                    {
                        device.Status = "بسیار مشکوک";
                    }
                    else if (device.SuspicionScore >= 20)
                    {
                        device.Status = "مشکوک";
                    }
                    else
                    {
                        device.Status = "عادی";
                    }
                }
                
                // Step 5: Save to Database
                TxtStatus.Text = "مرحله 5: ذخیره در دیتابیس...";
                ProgressBarMain.Value = 90;
                
                await _detector.SaveToDatabase(_detectedDevices.ToList());
                
                MessageBox.Show("نتایج اسکن با موفقیت در دیتابیس ذخیره شد.", "ذخیره موفق", MessageBoxButton.OK, MessageBoxImage.Information);
                
                ProgressBarMain.Value = 100;
                TxtStatus.Text = $"اسکن کامل شد. {_detectedDevices.Count} دستگاه اسکن شد.";
                
                // Show summary
                var confirmedMiners = _detectedDevices.Count(d => d.SuspicionScore >= 70);
                var suspiciousDevices = _detectedDevices.Count(d => d.SuspicionScore >= 40);
                
                MessageBox.Show($"نتایج اسکن:\n" +
                              $"کل دستگاه‌ها: {_detectedDevices.Count}\n" +
                              $"ماینرهای تأیید شده: {confirmedMiners}\n" +
                              $"دستگاه‌های مشکوک: {suspiciousDevices}\n" +
                              $"دستگاه‌های در ایلام: {_detectedDevices.Count(d => d.Status == "در ایلام")}",
                              "نتایج اسکن", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (OperationCanceledException)
            {
                TxtStatus.Text = "اسکن متوقف شد.";
            }
            catch (Exception ex)
            {
                TxtStatus.Text = $"خطا در اسکن: {ex.Message}";
                MessageBox.Show($"خطا در اسکن جامع: {ex.Message}", "خطا", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void UpdateStatistics()
        {
            Dispatcher.Invoke(() =>
            {
                PnlStatistics.Children.Clear();
                
                var totalDevices = _detectedDevices.Count;
                var confirmedMiners = _detectedDevices.Count(d => d.SuspicionScore >= 70);
                var suspiciousDevices = _detectedDevices.Count(d => d.SuspicionScore >= 40);
                var devicesInIlam = _detectedDevices.Count(d => d.Status == "در ایلام");
                
                AddStatistic("📊 کل دستگاه‌ها:", totalDevices.ToString());
                AddStatistic("⚠️ ماینرهای تأیید شده:", confirmedMiners.ToString());
                AddStatistic("🔍 دستگاه‌های مشکوک:", suspiciousDevices.ToString());
                AddStatistic("🏔️ دستگاه‌های در ایلام:", devicesInIlam.ToString());
                AddStatistic("⏱️ زمان آخرین بروزرسانی:", DateTime.Now.ToString("HH:mm:ss"));
                
                // Progress info during scan
                if (_totalDevicesToScan > 0)
                {
                    var progress = (_scannedDevices * 100) / _totalDevicesToScan;
                    TxtProgress.Text = $"{progress}%";
                    ProgressBarMain.Value = Math.Min(progress, 100);
                }
                
                // Top suspicious IPs
                if (_detectedDevices.Any())
                {
                    PnlStatistics.Children.Add(new TextBlock 
                    { 
                        Text = "\n🎯 IP های مشکوک:", 
                        FontWeight = FontWeights.Bold,
                        Margin = new Thickness(0, 10, 0, 5)
                    });
                    
                    var topSuspicious = _detectedDevices
                        .Where(d => d.SuspicionScore > 30)
                        .OrderByDescending(d => d.SuspicionScore)
                        .Take(5);
                    
                    foreach (var device in topSuspicious)
                    {
                        PnlStatistics.Children.Add(new TextBlock 
                        { 
                            Text = $"• {device.IpAddress} (امتیاز: {device.SuspicionScore})",
                            Margin = new Thickness(10, 2, 0, 2)
                        });
                    }
                }
            });
        }

        private void AddStatistic(string label, string value)
        {
            var panel = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 2, 0, 2) };
            
            panel.Children.Add(new TextBlock { Text = label, Width = 150, FontWeight = FontWeights.Bold });
            panel.Children.Add(new TextBlock { Text = value, Foreground = System.Windows.Media.Brushes.LightBlue });
            
            PnlStatistics.Children.Add(panel);
        }

        private async void BtnShowAllFromDb_Click(object sender, RoutedEventArgs e)
        {
            var allDevices = await _detector.GetAllDevicesFromDatabase();
            _detectedDevices.Clear();
            foreach (var device in allDevices)
                _detectedDevices.Add(device);
            TxtStatus.Text = $"تعداد کل دستگاه‌های ثبت‌شده: {allDevices.Count}";
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            _cancellationTokenSource?.Cancel();
            _updateTimer?.Stop();
            base.OnClosing(e);
        }
    }
}