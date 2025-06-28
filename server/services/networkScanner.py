#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Network Scanner Service for Real-time Device Detection
"""

import asyncio
import json
import logging
import socket
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Dict, List, Optional, Callable

import psutil
import scapy.all as scapy
from scapy.layers.l2 import ARP, Ether

logger = logging.getLogger(__name__)

class NetworkScanner:
    def __init__(self):
        self.active_scans = {}
        self.scan_results = {}
        
    def discover_local_networks(self) -> List[str]:
        """Discover local network ranges"""
        networks = []
        
        try:
            for interface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    if addr.family == socket.AF_INET and not addr.address.startswith('127.'):
                        # Calculate network range
                        if addr.netmask:
                            import ipaddress
                            network = ipaddress.IPv4Network(f"{addr.address}/{addr.netmask}", strict=False)
                            networks.append(str(network))
        except Exception as e:
            logger.error(f"Error discovering networks: {e}")
            
        return networks
    
    def fast_port_scan(self, ip: str, ports: List[int], timeout: float = 1.0) -> List[int]:
        """Fast TCP port scanner"""
        open_ports = []
        
        def scan_port(port):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex((ip, port))
                sock.close()
                if result == 0:
                    return port
            except Exception:
                pass
            return None
        
        with ThreadPoolExecutor(max_workers=100) as executor:
            futures = [executor.submit(scan_port, port) for port in ports]
            for future in futures:
                try:
                    result = future.result(timeout=timeout + 1)
                    if result:
                        open_ports.append(result)
                except Exception:
                    pass
                    
        return sorted(open_ports)
    
    def arp_scan(self, network: str) -> List[Dict[str, str]]:
        """Perform ARP scan to discover active hosts"""
        devices = []
        
        try:
            # Create ARP request
            arp_request = ARP(pdst=network)
            broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
            arp_request_broadcast = broadcast / arp_request
            
            # Send request and receive responses
            answered_list = scapy.srp(arp_request_broadcast, timeout=3, verbose=False)[0]
            
            for element in answered_list:
                device_info = {
                    'ip': element[1].psrc,
                    'mac': element[1].hwsrc,
                    'vendor': self._get_vendor_from_mac(element[1].hwsrc)
                }
                devices.append(device_info)
                
        except Exception as e:
            logger.error(f"ARP scan error: {e}")
            
        return devices
    
    def _get_vendor_from_mac(self, mac: str) -> str:
        """Get vendor from MAC address (simplified)"""
        # This would typically use a MAC vendor database
        # For now, return basic identification
        oui = mac[:8].upper().replace(':', '')
        
        known_vendors = {
            '00:1B:44': 'Bitmain Technologies',
            '00:0C:43': 'Microchip Technology',
            '00:07:32': 'Micro-Star International',
            '00:1E:C9': 'ASUSTEK Computer',
            '00:24:8C': 'NVIDIA Corporation'
        }
        
        return known_vendors.get(oui[:6], 'Unknown')
    
    def monitor_network_traffic(self, interface: str = None, duration: int = 60) -> Dict[str, Any]:
        """Monitor network traffic for mining patterns"""
        traffic_data = {
            'start_time': datetime.now(),
            'suspicious_connections': [],
            'high_traffic_ips': [],
            'mining_pool_connections': []
        }
        
        # Known mining pool domains/IPs
        mining_pools = [
            'pool.nanopool.org', 'eth-us-east1.nanopool.org',
            'us1.ethermine.org', 'eu1.ethermine.org',
            'xmr-usa-east1.nanopool.org', 'xmr-eu1.nanopool.org',
            'btc.antpool.com', 'stratum.antpool.com'
        ]
        
        try:
            def packet_handler(packet):
                if packet.haslayer('IP'):
                    src_ip = packet['IP'].src
                    dst_ip = packet['IP'].dst
                    
                    # Check for connections to mining pools
                    try:
                        if packet.haslayer('TCP'):
                            dst_port = packet['TCP'].dport
                            
                            # Check for stratum ports
                            if dst_port in [3333, 4444, 9999, 14444]:
                                traffic_data['suspicious_connections'].append({
                                    'src_ip': src_ip,
                                    'dst_ip': dst_ip,
                                    'dst_port': dst_port,
                                    'timestamp': datetime.now(),
                                    'type': 'stratum_port'
                                })
                                
                    except Exception:
                        pass
            
            # Capture packets for specified duration
            if interface:
                scapy.sniff(iface=interface, prn=packet_handler, timeout=duration)
            else:
                scapy.sniff(prn=packet_handler, timeout=duration)
                
        except Exception as e:
            logger.error(f"Traffic monitoring error: {e}")
            
        traffic_data['end_time'] = datetime.now()
        return traffic_data
    
    def scan_network_async(self, network: str, ports: List[int], 
                          progress_callback: Optional[Callable] = None) -> str:
        """Start asynchronous network scan"""
        scan_id = f"scan_{int(time.time())}"
        
        def run_scan():
            try:
                # Discover hosts
                if progress_callback:
                    progress_callback(10, "Discovering hosts...")
                    
                hosts = self.arp_scan(network)
                
                if progress_callback:
                    progress_callback(30, f"Found {len(hosts)} hosts, scanning ports...")
                
                # Scan ports on each host
                detailed_results = []
                for i, host in enumerate(hosts):
                    ip = host['ip']
                    open_ports = self.fast_port_scan(ip, ports)
                    
                    host_info = {
                        **host,
                        'open_ports': open_ports,
                        'scan_time': datetime.now().isoformat()
                    }
                    
                    # Get additional info
                    try:
                        hostname = socket.gethostbyaddr(ip)[0]
                        host_info['hostname'] = hostname
                    except Exception:
                        host_info['hostname'] = None
                        
                    detailed_results.append(host_info)
                    
                    if progress_callback:
                        progress = 30 + int((i / len(hosts)) * 60)
                        progress_callback(progress, f"Scanning {ip}...")
                
                self.scan_results[scan_id] = {
                    'status': 'completed',
                    'network': network,
                    'ports': ports,
                    'results': detailed_results,
                    'start_time': self.active_scans[scan_id]['start_time'],
                    'end_time': datetime.now().isoformat()
                }
                
                if progress_callback:
                    progress_callback(100, "Scan completed")
                    
            except Exception as e:
                logger.error(f"Scan error: {e}")
                self.scan_results[scan_id] = {
                    'status': 'failed',
                    'error': str(e),
                    'start_time': self.active_scans[scan_id]['start_time'],
                    'end_time': datetime.now().isoformat()
                }
            finally:
                if scan_id in self.active_scans:
                    del self.active_scans[scan_id]
        
        # Start scan in background thread
        self.active_scans[scan_id] = {
            'status': 'running',
            'network': network,
            'ports': ports,
            'start_time': datetime.now().isoformat()
        }
        
        thread = threading.Thread(target=run_scan)
        thread.daemon = True
        thread.start()
        
        return scan_id
    
    def get_scan_status(self, scan_id: str) -> Dict[str, Any]:
        """Get status of running or completed scan"""
        if scan_id in self.active_scans:
            return self.active_scans[scan_id]
        elif scan_id in self.scan_results:
            return self.scan_results[scan_id]
        else:
            return {'status': 'not_found'}
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system network information"""
        info = {
            'interfaces': [],
            'connections': [],
            'processes': []
        }
        
        try:
            # Network interfaces
            for interface, addrs in psutil.net_if_addrs().items():
                interface_info = {'name': interface, 'addresses': []}
                for addr in addrs:
                    interface_info['addresses'].append({
                        'family': str(addr.family),
                        'address': addr.address,
                        'netmask': addr.netmask,
                        'broadcast': addr.broadcast
                    })
                info['interfaces'].append(interface_info)
            
            # Active connections
            for conn in psutil.net_connections():
                if conn.raddr:
                    info['connections'].append({
                        'local_addr': f"{conn.laddr.ip}:{conn.laddr.port}",
                        'remote_addr': f"{conn.raddr.ip}:{conn.raddr.port}",
                        'status': conn.status,
                        'pid': conn.pid
                    })
            
            # Network-related processes
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    if proc.info['connections']:
                        info['processes'].append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'connection_count': len(proc.info['connections'])
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
                    
        except Exception as e:
            logger.error(f"System info error: {e}")
            
        return info

# Global scanner instance
scanner = NetworkScanner()

def start_network_scan(config: Dict[str, Any]) -> str:
    """Start network scan with given configuration"""
    network = config.get('network', '192.168.1.0/24')
    ports = config.get('ports', [22, 80, 443, 4028, 8080, 9999])
    
    return scanner.scan_network_async(network, ports)

def get_scan_results(scan_id: str) -> Dict[str, Any]:
    """Get results of network scan"""
    return scanner.get_scan_status(scan_id)

def discover_networks() -> List[str]:
    """Discover local networks"""
    return scanner.discover_local_networks()

def get_network_info() -> Dict[str, Any]:
    """Get network system information"""
    return scanner.get_system_info()

if __name__ == "__main__":
    # Test network discovery
    networks = discover_networks()
    print("Discovered networks:", networks)
    
    if networks:
        # Test scan
        scan_id = start_network_scan({
            'network': networks[0],
            'ports': [22, 80, 443, 4028, 8080]
        })
        print(f"Started scan: {scan_id}")
        
        # Wait and check results
        time.sleep(10)
        results = get_scan_results(scan_id)
        print("Scan results:", json.dumps(results, indent=2, default=str))
