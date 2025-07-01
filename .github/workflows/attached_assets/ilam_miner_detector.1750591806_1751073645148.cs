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
using Newtonsoft.Json;

namespace IlamMinerDetector
{
    public class IlamMinerDetector
    {
        private readonly string _connectionString;
        private readonly HttpClient _httpClient;
        
        // حدود جغرافیایی استان ایلام
        private readonly double IlamMinLat = 32.0;
        private readonly double IlamMaxLat = 34.5;
        private readonly double IlamMinLng = 46.0;
        private readonly double IlamMaxLng = 48.5;
        
        // پورت‌های معمول ماینرها
        private readonly int[] CommonMinerPorts = { 4028, 4029, 8080, 3333, 9999, 14444, 25, 443, 8333, 8888 };
        
        // نام‌های مشکوک hostname
        private readonly string[] SuspiciousHostnames = { "miner", "antminer", "asic", "bitcoin", "btc", "eth", "mining", "pool", "hash", "crypto" };

        public IlamMinerDetector()
        {
            _connectionString = "Data Source=ilam_miners.db;Version=3;";
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(10);
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            try
            {
                using (var connection = new SQLiteConnection(_connectionString))
                {
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
                            LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP
                        )";
                    
                    using (var command = new SQLiteCommand(createTableQuery, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"خطا در راه‌اندازی دیتابیس: {ex.Message}");
            }
        }

        public async Task<List<MinerDevice>> ScanLocalNetworkAsync(string ipRange, CancellationToken cancellationToken = default)
        {
            var devices = new List<MinerDevice>();
            var ipRangeParts = ipRange.Split('-');
            
            if (ipRangeParts.Length != 2)
                throw new ArgumentException("فرمت محدوده IP نامعتبر است. مثال: 192.168.1.1-254");

            var baseIp = ipRangeParts[0].Trim();
            var baseParts = baseIp.Split('.');
            
            if (baseParts.Length != 4)
                throw new ArgumentException("آدرس IP پایه نامعتبر است.");

            var startRange = int.Parse(ipRangeParts[1].Trim());
            var endRange = startRange;
            
            if (ipRangeParts[1].Contains('-'))
            {
                var rangeParts = ipRangeParts[1].Split('-');
                startRange = int.Parse(rangeParts[0].Trim());
                endRange = int.Parse(rangeParts[1].Trim());
            }

            var baseNetwork = $"{baseParts[0]}.{baseParts[1]}.{baseParts[2]}";
            var tasks = new List<Task>();

            for (int i = startRange; i <= endRange; i++)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var ip = $"{baseNetwork}.{i}";
                tasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        var ping = new Ping();
                        var reply = await ping.SendPingAsync(ip, 1000);
                        
                        if (reply.Status == IPStatus.Success)
                        {
                            var device = new MinerDevice
                            {
                                IpAddress = ip,
                                DetectionTime = DateTime.Now,
                                Status = "فعال",
                                SuspicionScore = 5 // امتیاز اولیه برای دستگاه‌های آنلاین
                            };

                            // سعی در دریافت MAC Address
                            try
                            {
                                device.MacAddress = await GetMacAddressAsync(ip);
                            }
                            catch { }

                            lock (devices)
                            {
                                devices.Add(device);
                            }
                        }
                    }
                    catch { }
                }, cancellationToken));
            }

            await Task.WhenAll(tasks);
            return devices;
        }

        public async Task<List<int>> ScanPortsAsync(string ipAddress, int[] ports, int timeoutSeconds = 3)
        {
            var openPorts = new List<int>();
            var tasks = ports.Select(async port =>
            {
                try
                {
                    using (var client = new TcpClient())
                    {
                        var connectTask = client.ConnectAsync(ipAddress, port);
                        var timeoutTask = Task.Delay(timeoutSeconds * 1000);
                        
                        var completedTask = await Task.WhenAny(connectTask, timeoutTask);
                        
                        if (completedTask == connectTask && client.Connected)
                        {
                            lock (openPorts)
                            {
                                openPorts.Add(port);
                            }
                        }
                    }
                }
                catch { }
            });

            await Task.WhenAll(tasks);
            return openPorts.OrderBy(p => p).ToList();
        }

        public async Task<LocationInfo> GetLocationAsync(string ipAddress)
        {
            try
            {
                // استفاده از سرویس رایگان ipapi.co
                var response = await _httpClient.GetStringAsync($"https://ipapi.co/{ipAddress}/json/");
                var locationData = JsonConvert.DeserializeObject<dynamic>(response);

                return new LocationInfo
                {
                    City = locationData.city ?? "نامشخص",
                    Country = locationData.country_name ?? "نامشخص",
                    Latitude = locationData.latitude ?? 0.0,
                    Longitude = locationData.longitude ?? 0.0
                };
            }
            catch
            {
                // در صورت عدم دسترسی به API، از IP محلی استفاده کنید
                if (IsPrivateIP(ipAddress))
                {
                    return new LocationInfo
                    {
                        City = "ایلام",
                        Country = "ایران",
                        Latitude = 33.6374,
                        Longitude = 46.4227
                    };
                }
                
                return null;
            }
        }

        public async Task<string> GetHostnameAsync(string ipAddress)
        {
            try
            {
                var hostEntry = await Dns.GetHostEntryAsync(ipAddress);
                return hostEntry.HostName;
            }
            catch
            {
                return null;
            }
        }

        private async Task<string> GetMacAddressAsync(string ipAddress)
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
                            return parts[1];
                        }
                    }
                }
                
                return "نامشخص";
            }
            catch
            {
                return "نامشخص";
            }
        }

        public bool IsInIlamBounds(double latitude, double longitude)
        {
            return latitude >= IlamMinLat && latitude <= IlamMaxLat &&
                   longitude >= IlamMinLng && longitude <= IlamMaxLng;
        }

        public bool IsMinerPort(int port)
        {
            return CommonMinerPorts.Contains(port);
        }

        public bool IsSuspiciousHostname(string hostname)
        {
            if (string.IsNullOrEmpty(hostname)) return false;
            
            hostname = hostname.ToLower();
            return SuspiciousHostnames.Any(suspicious => hostname.Contains(suspicious));
        }

        private bool IsPrivateIP(string ipAddress)
        {
            if (!IPAddress.TryParse(ipAddress, out var ip)) return false;
            
            var bytes = ip.GetAddressBytes();
            
            return (bytes[0] == 10) ||
                   (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                   (bytes[0] == 192 && bytes[1] == 168);
        }

        public async Task SaveToDatabase(List<MinerDevice> devices)
        {
            try
            {
                using (var connection = new SQLiteConnection(_connectionString))
                {
                    connection.Open();
                    
                    foreach (var device in devices)
                    {
                        var insertQuery = @"
                            INSERT OR REPLACE INTO MinerDevices 
                            (IpAddress, MacAddress, DeviceType, OpenPorts, SuspicionScore, 
                             City, Country, Latitude, Longitude, Hostname, Status, DetectionTime, LastUpdate)
                            VALUES 
                            (@IpAddress, @MacAddress, @DeviceType, @OpenPorts, @SuspicionScore,
                             @City, @Country, @Latitude, @Longitude, @Hostname, @Status, @DetectionTime, @LastUpdate)";

                        using (var command = new SQLiteCommand(insertQuery, connection))
                        {
                            command.Parameters.AddWithValue("@IpAddress", device.IpAddress);
                            command.Parameters.AddWithValue("@MacAddress", device.MacAddress ?? "");
                            command.Parameters.AddWithValue("@DeviceType", device.DeviceType ?? "");
                            command.Parameters.AddWithValue("@OpenPorts", device.OpenPorts ?? "");
                            command.Parameters.AddWithValue("@SuspicionScore", device.SuspicionScore);
                            command.Parameters.AddWithValue("@City", device.City ?? "");
                            command.Parameters.AddWithValue("@Country", device.Country ?? "");
                            command.Parameters.AddWithValue("@Latitude", device.Latitude);
                            command.Parameters.AddWithValue("@Longitude", device.Longitude);
                            command.Parameters.AddWithValue("@Hostname", device.Hostname ?? "");
                            command.Parameters.AddWithValue("@Status", device.Status ?? "");
                            command.Parameters.AddWithValue("@DetectionTime", device.DetectionTime);
                            command.Parameters.AddWithValue("@LastUpdate", DateTime.Now);

                            command.ExecuteNonQuery();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"خطا در ذخیره دیتابیس: {ex.Message}");
            }
        }

        public async Task<List<MinerDevice>> LoadFromDatabase()
        {
            var devices = new List<MinerDevice>();
            
            try
            {
                using (var connection = new SQLiteConnection(_connectionString))
                {
                    connection.Open();
                    var selectQuery = "SELECT * FROM MinerDevices ORDER BY SuspicionScore DESC";
                    
                    using (var command = new SQLiteCommand(selectQuery, connection))
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            devices.Add(new MinerDevice
                            {
                                IpAddress = reader["IpAddress"].ToString(),
                                MacAddress = reader["MacAddress"].ToString(),
                                DeviceType = reader["DeviceType"].ToString(),
                                OpenPorts = reader["OpenPorts"].ToString(),
                                SuspicionScore = Convert.ToInt32(reader["SuspicionScore"]),
                                City = reader["City"].ToString(),
                                Country = reader["Country"].ToString(),
                                Latitude = Convert.ToDouble(reader["Latitude"]),
                                Longitude = Convert.ToDouble(reader["Longitude"]),
                                Hostname = reader["Hostname"].ToString(),
                                Status = reader["Status"].ToString(),
                                DetectionTime = Convert.ToDateTime(reader["DetectionTime"])
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"خطا در خواندن از دیتابیس: {ex.Message}");
            }
            
            return devices;
        }

        public async Task<List<MinerDevice>> GetAllDevicesFromDatabase()
        {
            var devices = new List<MinerDevice>();
            using (var connection = new SQLiteConnection(_connectionString))
            {
                await connection.OpenAsync();
                var query = "SELECT * FROM MinerDevices";
                using (var command = new SQLiteCommand(query, connection))
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        devices.Add(new MinerDevice
                        {
                            IpAddress = reader["IpAddress"].ToString(),
                            MacAddress = reader["MacAddress"].ToString(),
                            DeviceType = reader["DeviceType"].ToString(),
                            OpenPorts = reader["OpenPorts"].ToString(),
                            SuspicionScore = Convert.ToInt32(reader["SuspicionScore"]),
                            City = reader["City"].ToString(),
                            Country = reader["Country"].ToString(),
                            Latitude = Convert.ToDouble(reader["Latitude"]),
                            Longitude = Convert.ToDouble(reader["Longitude"]),
                            Hostname = reader["Hostname"].ToString(),
                            Status = reader["Status"].ToString()
                        });
                    }
                }
            }
            return devices;
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    // کلاس‌های مدل
    public class MinerDevice
    {
        public string IpAddress { get; set; }
        public string MacAddress { get; set; }
        public string DeviceType { get; set; }
        public string OpenPorts { get; set; }
        public int SuspicionScore { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Hostname { get; set; }
        public string Status { get; set; }
        public DateTime DetectionTime { get; set; }
    }

    public class LocationInfo
    {
        public string City { get; set; }
        public string Country { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}