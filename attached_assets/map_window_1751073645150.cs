using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;

namespace IlamMinerDetector
{
    public partial class MapWindow : Window
    {
        private List<MinerDevice> _devices;
        private Canvas _mapCanvas;
        
        // حدود جغرافیایی ایلام برای نمایش نقشه
        private const double IlamCenterLat = 33.6374;
        private const double IlamCenterLng = 46.4227;
        private const double MapScale = 100; // ضریب مقیاس نقشه

        public MapWindow(List<MinerDevice> devices)
        {
            _devices = devices ?? new List<MinerDevice>();
            InitializeWindow();
            DrawMap();
        }

        private void InitializeWindow()
        {
            Title = "نقشه توزیع ماینرها - استان ایلام";
            Width = 800;
            Height = 600;
            WindowStartupLocation = WindowStartupLocation.CenterOwner;
            Background = new SolidColorBrush(Color.FromRgb(45, 45, 48));
            
            var mainGrid = new Grid();
            Content = mainGrid;
            
            // Header
            var header = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(0, 122, 204)),
                Padding = new Thickness(10),
                Height = 60
            };
            
            var headerText = new TextBlock
            {
                Text = "🗺️ نقشه توزیع ماینرهای شناسایی شده در استان ایلام",
                Foreground = Brushes.White,
                FontSize = 16,
                FontWeight = FontWeights.Bold,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                FontFamily = new FontFamily("B Nazanin")
            };
            
            header.Child = headerText;
            
            // Map Canvas
            _mapCanvas = new Canvas
            {
                Background = new SolidColorBrush(Color.FromRgb(63, 63, 70)),
                Margin = new Thickness(10)
            };
            
            var scrollViewer = new ScrollViewer
            {
                Content = _mapCanvas,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Auto,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                ZoomMode = ZoomMode.Enabled
            };
            
            // Legend
            var legend = CreateLegend();
            
            mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            mainGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            mainGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            
            Grid.SetRow(header, 0);
            Grid.SetRow(scrollViewer, 1);
            Grid.SetRow(legend, 2);
            
            mainGrid.Children.Add(header);
            mainGrid.Children.Add(scrollViewer);
            mainGrid.Children.Add(legend);
        }

        private void DrawMap()
        {
            _mapCanvas.Children.Clear();
            
            if (_devices.Count == 0)
            {
                var noDataText = new TextBlock
                {
                    Text = "هیچ دستگاهی با موقعیت جغرافیایی یافت نشد",
                    Foreground = Brushes.White,
                    FontSize = 14,
                    FontFamily = new FontFamily("B Nazanin")
                };
                
                Canvas.SetLeft(noDataText, 50);
                Canvas.SetTop(noDataText, 50);
                _mapCanvas.Children.Add(noDataText);
                return;
            }

            // رسم مرزهای تقریبی استان ایلام
            DrawIlamBoundary();
            
            // رسم نقاط دستگاه‌ها
            foreach (var device in _devices)
            {
                if (device.Latitude != 0 && device.Longitude != 0)
                {
                    DrawDeviceMarker(device);
                }
            }
            
            // اضافه کردن برچسب شهرهای مهم
            DrawCityLabels();
        }

        private void DrawIlamBoundary()
        {
            // رسم یک مستطیل تقریبی برای مرزهای ایلام
            var boundary = new Rectangle
            {
                Width = 300,
                Height = 200,
                Stroke = new SolidColorBrush(Color.FromRgb(0, 122, 204)),
                StrokeThickness = 2,
                Fill = new SolidColorBrush(Color.FromArgb(30, 0, 122, 204))
            };
            
            Canvas.SetLeft(boundary, 100);
            Canvas.SetTop(boundary, 100);
            _mapCanvas.Children.Add(boundary);
            
            // برچسب استان
            var provinceLabel = new TextBlock
            {
                Text = "استان ایلام",
                Foreground = Brushes.White,
                FontSize = 18,
                FontWeight = FontWeights.Bold,
                FontFamily = new FontFamily("B Nazanin")
            };
            
            Canvas.SetLeft(provinceLabel, 200);
            Canvas.SetTop(provinceLabel, 80);
            _mapCanvas.Children.Add(provinceLabel);
        }

        private void DrawDeviceMarker(MinerDevice device)
        {
            // محاسبه موقعیت بر روی کانواس
            var x = 100 + ((device.Longitude - 46.0) * MapScale);
            var y = 100 + ((34.5 - device.Latitude) * MapScale);
            
            // انتخاب رنگ بر اساس امتیاز شک
            Brush markerBrush;
            double markerSize;
            
            if (device.SuspicionScore >= 70)
            {
                markerBrush = Brushes.Red;
                markerSize = 12;
            }
            else if (device.SuspicionScore >= 40)
            {
                markerBrush = Brushes.Orange;
                markerSize = 10;
            }
            else if (device.SuspicionScore >= 20)
            {
                markerBrush = Brushes.Yellow;
                markerSize = 8;
            }
            else
            {
                markerBrush = Brushes.Green;
                markerSize = 6;
            }
            
            // رسم نقطه
            var marker = new Ellipse
            {
                Width = markerSize,
                Height = markerSize,
                Fill = markerBrush,
                Stroke = Brushes.White,
                StrokeThickness = 1
            };
            
            Canvas.SetLeft(marker, x - markerSize / 2);
            Canvas.SetTop(marker, y - markerSize / 2);
            
            // اضافه کردن Tooltip
            var tooltip = new ToolTip
            {
                Content = $"IP: {device.IpAddress}\n" +
                         $"نوع: {device.DeviceType}\n" +
                         $"امتیاز شک: {device.SuspicionScore}\n" +
                         $"شهر: {device.City}\n" +
                         $"وضعیت: {device.Status}",
                FontFamily = new FontFamily("B Nazanin")
            };
            
            marker.ToolTip = tooltip;
            marker.MouseEnter += (s, e) => marker.Opacity = 0.7;
            marker.MouseLeave += (s, e) => marker.Opacity = 1.0;
            
            _mapCanvas.Children.Add(marker);
            
            // اضافه کردن برچسب IP
            if (device.SuspicionScore >= 40)
            {
                var ipLabel = new TextBlock
                {
                    Text = device.IpAddress,
                    Foreground = Brushes.White,
                    FontSize = 10,
                    FontFamily = new FontFamily("B Nazanin"),
                    Background = new SolidColorBrush(Color.FromArgb(128, 0, 0, 0))
                };
                
                Canvas.SetLeft(ipLabel, x + 10);
                Canvas.SetTop(ipLabel, y - 5);
                _mapCanvas.Children.Add(ipLabel);
            }
        }

        private void DrawCityLabels()
        {
            var cities = new[]
            {
                new { Name = "ایلام", Lat = 33.6374, Lng = 46.4227 },
                new { Name = "دهلران", Lat = 32.6941, Lng = 47.2677 },
                new { Name = "مهران", Lat = 33.1215, Lng = 46.1641 },
                new { Name = "ایوان", Lat = 33.8081, Lng = 46.2847 }
            };
            
            foreach (var city in cities)
            {
                var x = 100 + ((city.Lng - 46.0) * MapScale);
                var y = 100 + ((34.5 - city.Lat) * MapScale);
                
                var cityMarker = new Ellipse
                {
                    Width = 6,
                    Height = 6,
                    Fill = Brushes.CornflowerBlue,
                    Stroke = Brushes.White,
                    StrokeThickness = 1
                };
                
                var cityLabel = new TextBlock
                {
                    Text = city.Name,
                    Foreground = Brushes.CornflowerBlue,
                    FontSize = 12,
                    FontWeight = FontWeights.Bold,
                    FontFamily = new FontFamily("B Nazanin")
                };
                
                Canvas.SetLeft(cityMarker, x - 3);
                Canvas.SetTop(cityMarker, y - 3);
                Canvas.SetLeft(cityLabel, x + 8);
                Canvas.SetTop(cityLabel, y - 8);
                
                _mapCanvas.Children.Add(cityMarker);
                _mapCanvas.Children.Add(cityLabel);
            }
        }

        private Border CreateLegend()
        {
            var legendPanel = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Center
            };
            
            var legendItems = new[]
            {
                new { Color = Brushes.Red, Text = "ماینر تأیید شده (70+)" },
                new { Color = Brushes.Orange, Text = "بسیار مشکوک (40-69)" },
                new { Color = Brushes.Yellow, Text = "مشکوک (20-39)" },
                new { Color = Brushes.Green, Text = "عادی (0-19)" },
                new { Color = Brushes.CornflowerBlue, Text = "شهرهای مهم" }
            };
            
            foreach (var item in legendItems)
            {
                var legendItem = new StackPanel
                {
                    Orientation = Orientation.Horizontal,
                    Margin = new Thickness(10, 5, 10, 5)
                };
                
                var colorBox = new Rectangle
                {
                    Width = 15,
                    Height = 15,
                    Fill = item.Color,
                    Stroke = Brushes.White,
                    StrokeThickness = 1,
                    VerticalAlignment = VerticalAlignment.Center
                };
                
                var label = new TextBlock
                {
                    Text = item.Text,
                    Foreground = Brushes.White,
                    FontSize = 12,
                    FontFamily = new FontFamily("B Nazanin"),
                    Margin = new Thickness(5, 0, 0, 0),
                    VerticalAlignment = VerticalAlignment.Center
                };
                
                legendItem.Children.Add(colorBox);
                legendItem.Children.Add(label);
                legendPanel.Children.Add(legendItem);
            }
            
            return new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(63, 63, 70)),
                Padding = new Thickness(10),
                Child = legendPanel
            };
        }
    }
}