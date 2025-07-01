#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Advanced Cryptocurrency Miner Detection System for Ilam Province
Production-ready implementation with real detection capabilities
"""

import asyncio
import json
import logging
import psutil
import socket
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

import requests
import scapy.all as scapy
from scapy.layers.l2 import ARP, Ether

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AdvancedMinerDetector:
    def __init__(self):
        # Ilam province geographical boundaries
        self.ilam_bounds = {
            'north': 34.5,
            'south': 32.0, 
            'east': 48.5,
            'west': 45.5,
            'center': (33.63, 46.42)
        }
        
        # Ilam cities coordinates
        self.ilam_cities = {
            'ایلام': (33.6374, 46.4227),
            'مهران': (33.1221, 46.1641),
            'دهلران': (32.6942, 47.2678),
            'آبدانان': (32.9928, 47.4164),
            'دره‌شهر': (33.1458, 47.3667),
            'ایوان': (33.8081, 46.2892),
            'چرداول': (33.7333, 46.8833),
            'بدره': (33.0833, 47.1167),
            'سرابله': (32.9667, 46.5833),
            'ملکشاهی': (33.3833, 46.5667)
        }
        
        # Mining-related ports
        self.miner_ports = {
            4028: "CGMiner API", 4029: "SGMiner API", 4030: "BFGMiner API",
            4031: "CPUMiner API", 4032: "XMRig API", 4033: "T-Rex API",
            4034: "PhoenixMiner API", 4035: "Claymore API", 4036: "Gminer API",
            8080: "Web Interface", 8888: "Web Interface Alt", 8081: "Miner Web UI",
            3000: "Miner Dashboard", 3001: "Mining Pool UI", 8000: "HTTP Server",
            3333: "Stratum Pool", 4444: "Stratum Pool Alt", 9999: "Stratum SSL",
            14444: "Stratum SSL Alt", 5555: "Stratum Pool", 7777: "Stratum Pool",
            1080: "SOCKS Proxy", 3128: "HTTP Proxy", 8118: "Privoxy",
            9050: "Tor SOCKS", 1194: "OpenVPN", 1723: "PPTP VPN",
            8332: "Bitcoin RPC", 8333: "Bitcoin P2P", 9332: "Litecoin RPC"
        }
        
        # Known miner process signatures
        self.miner_processes = {
            'cgminer.exe', 'bfgminer.exe', 'sgminer.exe', 'cpuminer.exe',
            'xmrig.exe', 'xmr-stak.exe', 'claymore.exe', 'phoenixminer.exe',
            't-rex.exe', 'gminer.exe', 'nbminer.exe', 'teamredminer.exe',
            'lolminer.exe', 'miniZ.exe', 'bminer.exe', 'z-enemy.exe',
            'ccminer.exe', 'ethminer.exe', 'nanominer.exe', 'srbminer.exe'
        }
        
        # Mining algorithm signatures
        self.mining_algorithms = [
            'sha256', 'scrypt', 'x11', 'ethash', 'equihash', 'cryptonight',
            'lyra2rev2', 'neoscrypt', 'blake2s', 'skunk', 'x16r', 'x16s'
        ]

    def ping_host(self, ip: str, timeout: int = 1) -> bool:
        """Check if host is reachable via ping"""
        try:
            if hasattr(subprocess, 'DEVNULL'):
                result = subprocess.run(
                    ['ping', '-c', '1', '-W', str(timeout), ip], 
                    stdout=subprocess.DEVNULL, 
                    stderr=subprocess.DEVNULL,
                    timeout=timeout + 1
                )
            else:
                with open('/dev/null', 'w') as devnull:
                    result = subprocess.run(
                        ['ping', '-c', '1', '-W', str(timeout), ip], 
                        stdout=devnull, 
                        stderr=devnull,
                        timeout=timeout + 1
                    )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return False

    def scan_port(self, ip: str, port: int, timeout: float = 3.0) -> bool:
        """Scan a single port on target IP"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((ip, port))
            sock.close()
            return result == 0
        except (socket.error, OSError):
            return False

    def get_mac_address(self, ip: str) -> Optional[str]:
        """Get MAC address for IP using ARP"""
        try:
            # Create ARP request
            arp_request = ARP(pdst=ip)
            broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
            arp_request_broadcast = broadcast / arp_request
            
            # Send request and receive response
            answered_list = scapy.srp(arp_request_broadcast, timeout=2, verbose=False)[0]
            
            if answered_list:
                return answered_list[0][1].hwsrc
                
        except Exception as e:
            logger.warning(f"Failed to get MAC for {ip}: {e}")
            
        # Fallback to system ARP table
        try:
            result = subprocess.run(['arp', '-n', ip], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if ip in line:
                        parts = line.split()
                        for part in parts:
                            if ':' in part and len(part) == 17:
                                return part
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass
            
        return None

    def detect_miner_signatures(self, ip: str, open_ports: List[int]) -> Dict[str, Any]:
        """Detect miner-specific signatures on a device"""
        detection_results = {
            'is_miner': False,
            'confidence_score': 0,
            'device_type': 'unknown',
            'detection_methods': [],
            'mining_software': None,
            'hash_rate': None,
            'power_consumption': None
        }
        
        # Check for mining ports
        mining_ports_found = [port for port in open_ports if port in self.miner_ports]
        if mining_ports_found:
            detection_results['confidence_score'] += len(mining_ports_found) * 25
            detection_results['detection_methods'].append('mining_ports')
            
        # Try to connect to common miner APIs
        for port in mining_ports_found:
            try:
                if port in [4028, 4029, 4030]:  # CGMiner/SGMiner/BFGMiner APIs
                    miner_data = self._query_cgminer_api(ip, port)
                    if miner_data:
                        detection_results['is_miner'] = True
                        detection_results['confidence_score'] = 95
                        detection_results['device_type'] = miner_data.get('device_type', 'ASIC Miner')
                        detection_results['mining_software'] = miner_data.get('software', 'CGMiner')
                        detection_results['hash_rate'] = miner_data.get('hash_rate')
                        detection_results['detection_methods'].append('api_response')
                        
                elif port in [8080, 8888, 3000]:  # Web interfaces
                    web_data = self._check_web_interface(ip, port)
                    if web_data:
                        detection_results['confidence_score'] += 30
                        detection_results['detection_methods'].append('web_interface')
                        if web_data.get('is_miner'):
                            detection_results['is_miner'] = True
                            detection_results['device_type'] = web_data.get('device_type', 'Web-managed Miner')
                            
            except Exception as e:
                logger.debug(f"Error checking port {port} on {ip}: {e}")
                
        # Check for Stratum connections
        stratum_ports = [3333, 4444, 9999, 14444, 5555, 7777]
        stratum_found = [port for port in open_ports if port in stratum_ports]
        if stratum_found:
            detection_results['confidence_score'] += len(stratum_found) * 20
            detection_results['detection_methods'].append('stratum_connection')
            
        # Analyze network behavior patterns
        network_analysis = self._analyze_network_patterns(ip)
        if network_analysis['suspicious_traffic']:
            detection_results['confidence_score'] += 15
            detection_results['detection_methods'].append('network_analysis')
            
        # Power consumption estimation
        if detection_results['confidence_score'] > 50:
            power_estimate = self._estimate_power_consumption(detection_results['device_type'], detection_results['hash_rate'])
            detection_results['power_consumption'] = power_estimate
            
        # Final classification
        if detection_results['confidence_score'] >= 70:
            detection_results['is_miner'] = True
        elif detection_results['confidence_score'] >= 40:
            detection_results['device_type'] = 'suspicious'
            
        return detection_results

    def _query_cgminer_api(self, ip: str, port: int) -> Optional[Dict[str, Any]]:
        """Query CGMiner-compatible API for miner information"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, port))
            
            # Send summary command
            sock.send(b'{"command":"summary"}')
            response = sock.recv(4096).decode('utf-8', errors='ignore')
            sock.close()
            
            if 'SUMMARY' in response and ('GH/s' in response or 'MH/s' in response or 'TH/s' in response):
                # Parse response for miner info
                data = {}
                if 'Type=' in response:
                    type_start = response.find('Type=') + 5
                    type_end = response.find(',', type_start)
                    if type_end == -1:
                        type_end = response.find(']', type_start)
                    data['software'] = response[type_start:type_end]
                    
                if 'GHS 5s=' in response:
                    hash_start = response.find('GHS 5s=') + 8
                    hash_end = response.find(',', hash_start)
                    try:
                        hash_rate = float(response[hash_start:hash_end])
                        data['hash_rate'] = f"{hash_rate:.2f} GH/s"
                        data['device_type'] = 'ASIC Miner'
                    except ValueError:
                        pass
                        
                return data
                
        except (socket.error, socket.timeout, OSError):
            pass
            
        return None

    def _check_web_interface(self, ip: str, port: int) -> Optional[Dict[str, Any]]:
        """Check for miner web interface"""
        try:
            url = f"http://{ip}:{port}"
            response = requests.get(url, timeout=5)
            content = response.text.lower()
            
            miner_keywords = [
                'antminer', 'whatsminer', 'avalon', 'innosilicon', 'bitmain',
                'mining', 'hashrate', 'hash rate', 'pool', 'worker',
                'cgminer', 'bfgminer', 'cryptocurrency', 'bitcoin', 'ethereum'
            ]
            
            found_keywords = [keyword for keyword in miner_keywords if keyword in content]
            
            if found_keywords:
                return {
                    'is_miner': len(found_keywords) >= 2,
                    'device_type': 'Web-managed Miner',
                    'keywords_found': found_keywords
                }
                
        except (requests.RequestException, requests.Timeout):
            pass
            
        return None

    def _analyze_network_patterns(self, ip: str) -> Dict[str, Any]:
        """Analyze network traffic patterns for mining behavior"""
        analysis = {
            'suspicious_traffic': False,
            'connection_patterns': [],
            'data_volume': 0
        }
        
        try:
            # Get network connections for the IP
            connections = []
            for conn in psutil.net_connections(kind='inet'):
                if conn.raddr and conn.raddr.ip == ip:
                    connections.append(conn)
                    
            # Look for patterns typical of mining
            pool_connections = 0
            for conn in connections:
                if conn.raddr:
                    # Check if connecting to known pool ports
                    if conn.raddr.port in [3333, 4444, 9999, 14444]:
                        pool_connections += 1
                        analysis['connection_patterns'].append('pool_connection')
                        
            if pool_connections > 0:
                analysis['suspicious_traffic'] = True
                
        except Exception as e:
            logger.debug(f"Network analysis error for {ip}: {e}")
            
        return analysis

    def _estimate_power_consumption(self, device_type: str, hash_rate: Optional[str]) -> Optional[float]:
        """Estimate power consumption based on device type and hash rate"""
        power_estimates = {
            'ASIC Miner': {'base': 1500, 'per_th': 50},  # Watts
            'GPU Miner': {'base': 800, 'per_th': 200},
            'CPU Miner': {'base': 200, 'per_th': 100},
            'Web-managed Miner': {'base': 1200, 'per_th': 75}
        }
        
        if device_type not in power_estimates:
            return None
            
        base_power = power_estimates[device_type]['base']
        
        if hash_rate:
            try:
                # Extract numeric value from hash rate
                import re
                match = re.search(r'(\d+\.?\d*)', hash_rate)
                if match:
                    rate_value = float(match.group(1))
                    if 'TH/s' in hash_rate:
                        rate_th = rate_value
                    elif 'GH/s' in hash_rate:
                        rate_th = rate_value / 1000
                    elif 'MH/s' in hash_rate:
                        rate_th = rate_value / 1000000
                    else:
                        rate_th = 0
                        
                    additional_power = rate_th * power_estimates[device_type]['per_th']
                    return base_power + additional_power
            except (ValueError, AttributeError):
                pass
                
        return base_power

    def scan_network_range(self, ip_range: str, ports: List[int], progress_callback=None) -> List[Dict[str, Any]]:
        """Scan a network range for devices and potential miners"""
        discovered_devices = []
        
        try:
            import ipaddress
            network = ipaddress.IPv4Network(ip_range, strict=False)
            total_hosts = len(list(network.hosts()))
            
            def scan_host(ip_obj):
                ip = str(ip_obj)
                device_info = {
                    'ip_address': ip,
                    'mac_address': None,
                    'hostname': None,
                    'open_ports': [],
                    'detection_results': None,
                    'scan_time': datetime.now()
                }
                
                # Check if host is alive
                if self.ping_host(ip):
                    # Get MAC address
                    device_info['mac_address'] = self.get_mac_address(ip)
                    
                    # Get hostname
                    try:
                        device_info['hostname'] = socket.gethostbyaddr(ip)[0]
                    except (socket.herror, socket.gaierror):
                        pass
                    
                    # Scan ports
                    open_ports = []
                    for port in ports:
                        if self.scan_port(ip, port):
                            open_ports.append(port)
                    
                    device_info['open_ports'] = open_ports
                    
                    # Detect miner signatures if ports are open
                    if open_ports:
                        device_info['detection_results'] = self.detect_miner_signatures(ip, open_ports)
                    
                    return device_info
                
                return None
                
            # Use ThreadPoolExecutor for parallel scanning
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = []
                hosts = list(network.hosts())
                
                for i, ip_obj in enumerate(hosts):
                    future = executor.submit(scan_host, ip_obj)
                    futures.append(future)
                    
                    if progress_callback and i % 10 == 0:
                        progress = (i / total_hosts) * 100
                        progress_callback(progress, f"Scanning {ip_obj}")
                
                # Collect results
                for i, future in enumerate(futures):
                    try:
                        result = future.result(timeout=30)
                        if result:
                            discovered_devices.append(result)
                    except Exception as e:
                        logger.warning(f"Scan error: {e}")
                        
                    if progress_callback and i % 10 == 0:
                        progress = (i / len(futures)) * 100
                        progress_callback(progress, f"Processing results...")
                        
        except Exception as e:
            logger.error(f"Network scan error: {e}")
            
        return discovered_devices

    def geolocate_device(self, ip_address: str) -> Optional[Dict[str, Any]]:
        """Geolocate device using multiple IP geolocation services"""
        location_data = {}
        
        # Try multiple services for accuracy
        services = [
            {
                'name': 'ip-api',
                'url': f'http://ip-api.com/json/{ip_address}',
                'parser': lambda data: {
                    'lat': float(data['lat']) if data.get('lat') else None,
                    'lon': float(data['lon']) if data.get('lon') else None,
                    'city': data.get('city', ''),
                    'region': data.get('regionName', ''),
                    'country': data.get('country', ''),
                    'isp': data.get('isp', '')
                } if data.get('status') == 'success' else None
            },
            {
                'name': 'ipapi',
                'url': f'http://ipapi.co/{ip_address}/json/',
                'parser': lambda data: {
                    'lat': float(data['latitude']) if data.get('latitude') else None,
                    'lon': float(data['longitude']) if data.get('longitude') else None,
                    'city': data.get('city', ''),
                    'region': data.get('region', ''),
                    'country': data.get('country_name', ''),
                    'isp': data.get('org', '')
                } if data.get('latitude') and data.get('longitude') else None
            }
        ]
        
        for service in services:
            try:
                response = requests.get(service['url'], timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    parsed_data = service['parser'](data)
                    if parsed_data and parsed_data['lat'] and parsed_data['lon']:
                        # Check if location is within Ilam province
                        if self._is_in_ilam_bounds(parsed_data['lat'], parsed_data['lon']):
                            parsed_data['in_ilam'] = True
                            parsed_data['closest_city'] = self._find_closest_city(parsed_data['lat'], parsed_data['lon'])
                        else:
                            parsed_data['in_ilam'] = False
                            
                        location_data[service['name']] = parsed_data
                        break  # Use first successful result
                        
            except Exception as e:
                logger.warning(f"Geolocation service {service['name']} failed: {e}")
                
        return location_data

    def _is_in_ilam_bounds(self, lat: float, lon: float) -> bool:
        """Check if coordinates are within Ilam province bounds"""
        return (self.ilam_bounds['south'] <= lat <= self.ilam_bounds['north'] and
                self.ilam_bounds['west'] <= lon <= self.ilam_bounds['east'])

    def _find_closest_city(self, lat: float, lon: float) -> Dict[str, Any]:
        """Find closest city in Ilam province"""
        import math
        
        min_distance = float('inf')
        closest_city = None
        
        for city, (city_lat, city_lon) in self.ilam_cities.items():
            # Calculate distance using Haversine formula
            dlat = math.radians(lat - city_lat)
            dlon = math.radians(lon - city_lon)
            a = (math.sin(dlat/2) * math.sin(dlat/2) + 
                 math.cos(math.radians(city_lat)) * math.cos(math.radians(lat)) * 
                 math.sin(dlon/2) * math.sin(dlon/2))
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = 6371 * c  # Earth's radius in kilometers
            
            if distance < min_distance:
                min_distance = distance
                closest_city = city
                
        return {'city': closest_city, 'distance_km': min_distance}

# Main detection function to be called from Node.js
def detect_miners(scan_config: Dict[str, Any]) -> Dict[str, Any]:
    """Main function to detect miners based on scan configuration"""
    detector = AdvancedMinerDetector()
    
    try:
        ip_range = scan_config.get('ip_range', '192.168.1.0/24')
        ports = scan_config.get('ports', [22, 80, 443, 4028, 8080, 9999, 3333, 4444])
        
        # Convert port string to list if needed
        if isinstance(ports, str):
            ports = [int(p.strip()) for p in ports.split(',') if p.strip().isdigit()]
            
        results = {
            'scan_session': {
                'start_time': datetime.now().isoformat(),
                'ip_range': ip_range,
                'ports': ports,
                'status': 'running'
            },
            'detected_devices': [],
            'miners_found': 0,
            'total_devices': 0
        }
        
        def progress_callback(progress, message):
            # This could be sent via WebSocket in real implementation
            logger.info(f"Progress: {progress:.1f}% - {message}")
        
        # Perform scan
        devices = detector.scan_network_range(ip_range, ports, progress_callback)
        
        for device in devices:
            results['total_devices'] += 1
            
            # Add geolocation data
            if device['ip_address']:
                geo_data = detector.geolocate_device(device['ip_address'])
                device['geolocation'] = geo_data
                
            # Determine threat level
            detection = device.get('detection_results')
            if detection and detection.get('is_miner'):
                device['threat_level'] = 'high'
                results['miners_found'] += 1
            elif detection and detection.get('confidence_score', 0) > 40:
                device['threat_level'] = 'medium'
            else:
                device['threat_level'] = 'low'
                
            results['detected_devices'].append(device)
            
        results['scan_session']['end_time'] = datetime.now().isoformat()
        results['scan_session']['status'] = 'completed'
        
        return results
        
    except Exception as e:
        logger.error(f"Detection error: {e}")
        return {
            'error': str(e),
            'scan_session': {
                'status': 'failed',
                'start_time': datetime.now().isoformat()
            },
            'detected_devices': [],
            'miners_found': 0,
            'total_devices': 0
        }

if __name__ == "__main__":
    # Test configuration
    test_config = {
        'ip_range': '192.168.1.0/24',
        'ports': [22, 80, 443, 4028, 8080, 9999]
    }
    
    results = detect_miners(test_config)
    print(json.dumps(results, indent=2, ensure_ascii=False))
