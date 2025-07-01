using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Management;
using Newtonsoft.Json;

namespace IlamMinerDetector
{
    public class EnhancedIlamMinerDetector : IDisposable
    {
        private readonly string _connectionString;
        private readonly HttpClient _httpClient;
        private bool _disposed = false;
        
        // حدود جغرافیایی استان ایلام (دقیق‌تر)
        private readonly double IlamMinLat = 32.0834;
        private readonly double IlamMaxLat = 34.6167;
        private readonly double IlamMinLng = 46.0667;
        private readonly double IlamMaxLng = 48.5833;
        
        // پورت‌های معمول ماینرها (گسترده‌تر)
        private readonly int[] CommonMinerPorts = { 
            4028, 4029, 8080, 3333, 9999, 14444, 25, 443, 8333, 8888,
            3334, 3335, 3336, 4444, 5555, 7777, 9332, 9001, 17777, 19001
        };
        
        // نام‌های مشکوک hostname
        private readonly string[] SuspiciousHostnames = { 
            "miner", "antminer", "asic", "bitcoin", "btc", "eth", "mining", 
            "pool", "hash", "crypto", "bitmain", "whatsminer", "innosilicon",
            "canaan", "avalon", "dragonmint", "goldshell", "strongu"
        };

        // پترن‌های مشکوک در MAC Address
        private readonly string[] SuspiciousMacPrefixes = {
            "00:1A:4D", // Antminer S9
            "68:B6:B3", // Bitmain
            "B4:2E:99", // Generic ASIC
            "E8:4E:06", // Mining Hardware
        };

        // عوامل امتیازدهی
        private const int PORT_SCORE = 15;
        private const int HOSTNAME_SCORE = 25;
        private const int LOCATION_SCORE = 30;
        private const int MAC_SCORE = 20;
        private const int BEHAVIOR_SCORE = 10;

        public EnhancedIlamMinerDetector()
        {
            var dbPath = Path.Combine("Database", "ilam_miners.db");
            _connectionString = $"Data Source={dbPath};Version=3;";
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", 
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            try
            {
                using var connection = new SQLiteConnection(_connectionString);
                connection.Open();
                
                var createTableQuery = @"
                    CREATE TABLE IF NOT EXISTS MinerDevices (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        IpAddress TEXT NOT NULL UNIQUE,
                        MacAddress TEXT,
                        DeviceType TEXT,
                        OpenPorts TEXT,
                        SuspicionScore INTEGER,
                        City TEXT,
                        Country TEXT,
                        Latitude REAL,
                        Longitude REAL,
                        Hostname TEXT,
                        Status TEXT,
                        DetectionTime DATETIME,
                        LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
                        PowerConsumption REAL,
                        HashRate TEXT,
                        ResponseTime INTEGER,
                        IsActive BOOLEAN DEFAULT 1,
                        Notes TEXT
                    )";
                
                using var command = new SQLiteCommand(createTableQuery, connection);
                command.ExecuteNonQuery();

                // Create index for better performance
                var createIndexQuery = @"
                    CREATE INDEX IF NOT EXISTS idx_suspicion_score ON MinerDevices(SuspicionScore DESC);
                    CREATE INDEX IF NOT EXISTS idx_detection_time ON MinerDevices(DetectionTime DESC);
                    CREATE INDEX IF NOT EXISTS idx_location ON MinerDevices(Latitude, Longitude);";
                
                using var indexCommand = new SQLiteCommand(createIndexQuery, connection);
                indexCommand.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new Exception($"خطا در راه‌اندازی دیتابیس: {ex.Message}");
            }
        }

        public async Task<List<MinerDevice>> ScanLocalNetworkAsync(string ipRange, 
            IProgress<ScanProgress> progress = null, CancellationToken cancellationToken = default)
        {
            var devices = new List<MinerDevice>();
            var ipAddresses = ParseIpRange(ipRange);
            var totalIps = ipAddresses.Count;
            var scannedCount = 0;
            
            var semaphore = new SemaphoreSlim(50); // محدود کردن تعداد Thread همزمان
            var tasks = ipAddresses.Select(async ip =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    var device = await ScanSingleDeviceAsync(ip, cancellationToken);
                    if (device != null)
                    {
                        lock (devices)
                        {
                            devices.Add(device);
                        }
                    }
                    
                    var completed = Interlocked.Increment(ref scannedCount);
                    progress?.Report(new ScanProgress
                    {
                        Current = completed,
                        Total = totalIps,
                        CurrentIp = ip,
                        Phase = "Network Discovery"
                    });
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(tasks);
            return devices;
        }

        private async Task<MinerDevice> ScanSingleDeviceAsync(string ip, CancellationToken cancellationToken)
        {
            try
            {
                using var ping = new Ping();
                var reply = await ping.SendPingAsync(ip, 2000);
                
                if (reply.Status == IPStatus.Success)
                {
                    var device = new MinerDevice
                    {
                        IpAddress = ip,
                        DetectionTime = DateTime.Now,
                        Status = "آنلاین",
                        SuspicionScore = 5,
                        ResponseTime = (int)reply.RoundtripTime
                    };

                    // دریافت اطلاعات تکمیلی
                    await EnrichDeviceInfoAsync(device, cancellationToken);
                    
                    return device;
                }
            }
            catch (Exception ex)
            {
                // Log error if needed
                Debug.WriteLine($"خطا در اسکن {ip}: {ex.Message}");
            }
            
            return null;
        }

        private async Task EnrichDeviceInfoAsync(MinerDevice device, CancellationToken cancellationToken)
        {
            var tasks = new List<Task>
            {
                GetMacAddressAsync(device),
                GetHostnameAsync(device),
                ScanCommonPortsAsync(device),
                GetLocationInfoAsync(device)
            };

            await Task.WhenAll(tasks);
            CalculateSuspicionScore(device);
        }

        private async Task<List<int>> ScanPortsAsync(string ipAddress, int[] ports, 
            int timeoutSeconds = 3, CancellationToken cancellationToken = default)
        {
            var openPorts = new List<int>();
            var semaphore = new SemaphoreSlim(20);
            
            var tasks = ports.Select(async port =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    using var client = new TcpClient();
                    var connectTask = client.ConnectAsync(ipAddress, port);
                    var timeoutTask = Task.Delay(timeoutSeconds * 1000, cancellationToken);
                    
                    var completedTask = await Task.WhenAny(connectTask, timeoutTask);
                    
                    if (completedTask == connectTask && client.Connected)
                    {
                        lock (openPorts)
                        {
                            openPorts.Add(port);
                        }
                        
                        // تلاش برای شناسایی سرویس
                        await IdentifyServiceAsync(client, port, ipAddress);
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"خطا در اسکن پورت {port} برای {ipAddress}: {ex.Message}");
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(tasks);
            return openPorts.OrderBy(p => p).ToList();
        }

        private async Task IdentifyServiceAsync(TcpClient client, int port, string ipAddress)
        {
            try
            {
                if (IsMinerPort(port))
                {
                    // ارسال درخواست های خاص ماینر
                    var stream = client.GetStream();
                    var buffer = new byte[1024];
                    
                    // درخواست وضعیت ماینر
                    var request = Encoding.ASCII.GetBytes("{\"command\":\"summary\"}\n");
                    await stream.WriteAsync(request, 0, request.Length);
                    
                    var bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
                    if (bytesRead > 0)
                    {
                        var response = Encoding.ASCII.GetString(buffer, 0, bytesRead);
                        // تحلیل پاسخ برای شناسایی نوع ماینر
                        AnalyzeMinerResponse(response, ipAddress);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"خطا در شناسایی سرویس پورت {port}: {ex.Message}");
            }
        }

        private void AnalyzeMinerResponse(string response, string ipAddress)
        {
            // تحلیل پاسخ ماینر و شناسایی نوع دستگاه
            var minerKeywords = new[] { "STATUS", "Elapsed", "GH/s", "POOLS", "DEVS", "HARDWARE" };
            var foundKeywords = minerKeywords.Count(keyword => response.Contains(keyword));
            
            if (foundKeywords >= 3)
            {
                // احتمال بالای وجود ماینر
                Debug.WriteLine($"ماینر احتمالی در {ipAddress} شناسایی شد");
            }
        }

        public async Task<LocationInfo> GetLocationAsync(string ipAddress)
        {
            if (IsPrivateIP(ipAddress))
            {
                return new LocationInfo
                {
                    City = "ایلام",
                    Country = "ایران",
                    Latitude = 33.6374,
                    Longitude = 46.4227,
                    IsPrivate = true
                };
            }

            try
            {
                // استفاده از چندین سرویس برای دقت بیشتر
                var services = new[]
                {
                    $"https://ipapi.co/{ipAddress}/json/",
                    $"http://ip-api.com/json/{ipAddress}",
                    $"https://freegeoip.app/json/{ipAddress}"
                };

                foreach (var service in services)
                {
                    try
                    {
                        var response = await _httpClient.GetStringAsync(service);
                        var locationData = JsonConvert.DeserializeObject<dynamic>(response);

                        var location = new LocationInfo
                        {
                            City = locationData.city ?? locationData.regionName ?? "نامشخص",
                            Country = locationData.country_name ?? locationData.country ?? "نامشخص",
                            Latitude = (double)(locationData.latitude ?? locationData.lat ?? 0.0),
                            Longitude = (double)(locationData.longitude ?? locationData.lon ?? 0.0),
                            IsPrivate = false
                        };

                        if (location.Latitude != 0 && location.Longitude != 0)
                        {
                            return location;
                        }
                    }
                    catch
                    {
                        continue; // تلاش با سرویس بعدی
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"خطا در مکان‌یابی {ipAddress}: {ex.Message}");
            }
            
            return null;
        }

        private async Task GetMacAddressAsync(MinerDevice device)
        {
            try
            {
                // روش اول: ARP Table
                var macAddress = await GetMacFromArpTable(device.IpAddress);
                
                if (string.IsNullOrEmpty(macAddress) || macAddress == "نامشخص")
                {
                    // روش دوم: WMI (برای شبکه محلی)
                    macAddress = await GetMacFromWmi(device.IpAddress);
                }

                device.MacAddress = macAddress ?? "نامشخص";
            }
            catch (Exception ex)
            {
                device.MacAddress = "نامشخص";
                Debug.WriteLine($"خطا در دریافت MAC Address برای {device.IpAddress}: {ex.Message}");
            }
        }

        private async Task<string> GetMacFromArpTable(string ipAddress)
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "arp",
                        Arguments = $"-a {ipAddress}",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                var lines = output.Split('\n');
                foreach (var line in lines)
                {
                    if (line.Contains(ipAddress))
                    {
                        var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 2)
                        {
                            return parts[1].Replace("-", ":");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"خطا در دریافت MAC از ARP: {ex.Message}");
            }
            
            return "نامشخص";
        }

        private async Task<string> GetMacFromWmi(string ipAddress)
        {
            try
            {
                await Task.Run(() =>
                {
                    using var searcher = new ManagementObjectSearcher(
                        $"SELECT * FROM Win32_NetworkAdapterConfiguration WHERE IPAddress = '{ipAddress}'");
                    
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        return obj["MACAddress"]?.ToString();
                    }
                    return null;
                });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"خطا در دریافت MAC از WMI: {ex.Message}");
            }
            
            return "نامشخص";
        }

        private async Task GetHostnameAsync(MinerDevice device)
        {
            try
            {
                var hostEntry = await Dns.GetHostEntryAsync(device.IpAddress);
                device.Hostname = hostEntry.HostName;
            }
            catch
            {
                device.Hostname = "نامشخص";
            }
        }

        private async Task ScanCommonPortsAsync(MinerDevice device)
        {
            var openPorts = await ScanPortsAsync(device.IpAddress, CommonMinerPorts, 3);
            device.OpenPorts = string.Join(",", openPorts);
        }

        private async Task GetLocationInfoAsync(MinerDevice device)
        {
            var location = await GetLocationAsync(device.IpAddress);
            if (location != null)
            {