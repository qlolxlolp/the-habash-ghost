#!/usr/bin/env python3
"""
Real Owner Identification Service for Miner Detection System
Designed for Iran telecommunications infrastructure

This service identifies device owners through authorized database lookups
using IP/MAC addresses and official telecommunications records.
"""

import requests
import json
import sqlite3
import re
import time
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import hashlib
import os

class OwnerIdentificationService:
    def __init__(self):
        self.db_path = "owner_identification.db"
        
        # Official Iranian telecommunications authorities APIs
        self.tci_api_base = "https://api.tci.ir"  # Iran Telecom Company
        self.tic_api_base = "https://api.tic.gov.ir"  # Telecommunications Infrastructure Company
        self.cra_api_base = "https://api.cra.gov.ir"  # Communications Regulatory Authority
        
        # ISP databases for IP ownership lookup
        self.isp_databases = {
            'iran_telecom': {
                'name': 'مخابرات ایران',
                'api_endpoint': 'https://customer.tci.ir/api/lookup',
                'auth_required': True
            },
            'pars_online': {
                'name': 'پارس آنلاین',
                'api_endpoint': 'https://api.parsonline.com/customer-lookup',
                'auth_required': True
            },
            'asiatech': {
                'name': 'آسیاتک',
                'api_endpoint': 'https://portal.asiatech.ir/api/subscriber',
                'auth_required': True
            },
            'fanava': {
                'name': 'فناوا',
                'api_endpoint': 'https://api.fanava.ir/customer',
                'auth_required': True
            },
            'shatel': {
                'name': 'شاتل',
                'api_endpoint': 'https://my.shatel.ir/api/customer-info',
                'auth_required': True
            }
        }
        
        # Mobile operators for cellular data lookup
        self.mobile_operators = {
            'irancell': {
                'name': 'ایران‌سل',
                'api_endpoint': 'https://my.irancell.ir/api/subscriber',
                'prefixes': ['0901', '0902', '0903', '0905', '0930', '0933', '0934', '0935', '0936', '0937', '0938', '0939']
            },
            'hamrah_avval': {
                'name': 'همراه اول',
                'api_endpoint': 'https://my.mci.ir/api/customer',
                'prefixes': ['0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0990', '0991', '0992', '0993', '0994']
            },
            'rightel': {
                'name': 'رایتل',
                'api_endpoint': 'https://my.rightel.ir/api/user',
                'prefixes': ['0920', '0921', '0922']
            }
        }
        
        self.init_database()
        
    def init_database(self):
        """Initialize database for owner identification cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ip_ownership (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT UNIQUE NOT NULL,
                mac_address TEXT,
                owner_name TEXT,
                owner_family TEXT,
                phone_number TEXT,
                national_id TEXT,
                address TEXT,
                isp_name TEXT,
                contract_type TEXT,
                registration_date TEXT,
                last_verified TEXT NOT NULL,
                verification_source TEXT NOT NULL,
                confidence_score REAL NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS mac_vendor_lookup (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mac_prefix TEXT UNIQUE NOT NULL,
                vendor_name TEXT NOT NULL,
                device_type TEXT,
                last_updated TEXT NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lookup_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ip_address TEXT,
                mac_address TEXT,
                lookup_type TEXT NOT NULL,
                source_api TEXT,
                success BOOLEAN NOT NULL,
                response_time REAL,
                error_message TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Initialize MAC vendor database
        self.update_mac_vendor_database()

    def update_mac_vendor_database(self):
        """Update MAC vendor database from IEEE OUI registry"""
        try:
            # Download latest OUI database
            oui_url = "https://standards-oui.ieee.org/oui/oui.txt"
            response = requests.get(oui_url, timeout=30)
            
            if response.status_code == 200:
                self.parse_oui_database(response.text)
                print("MAC vendor database updated successfully")
            else:
                print(f"Failed to download OUI database: {response.status_code}")
                
        except Exception as e:
            print(f"Error updating MAC vendor database: {e}")

    def parse_oui_database(self, oui_data: str):
        """Parse IEEE OUI database and store vendor information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        lines = oui_data.split('\n')
        current_oui = None
        
        for line in lines:
            line = line.strip()
            
            # Look for OUI assignment lines
            oui_match = re.match(r'^([0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2})\s+\(hex\)\s+(.+)$', line)
            if oui_match:
                oui = oui_match.group(1).replace('-', ':').lower()
                vendor = oui_match.group(2).strip()
                
                # Determine device type based on vendor
                device_type = self.classify_device_type(vendor)
                
                cursor.execute('''
                    INSERT OR REPLACE INTO mac_vendor_lookup 
                    (mac_prefix, vendor_name, device_type, last_updated)
                    VALUES (?, ?, ?, ?)
                ''', (oui, vendor, device_type, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()

    def classify_device_type(self, vendor: str) -> str:
        """Classify device type based on vendor name"""
        vendor_lower = vendor.lower()
        
        # Mining hardware vendors
        mining_vendors = [
            'bitmain', 'canaan', 'ebang', 'innosilicon', 'whatsminer',
            'avalon', 'antminer', 'asicminer', 'butterfly labs'
        ]
        
        # GPU vendors
        gpu_vendors = ['nvidia', 'amd', 'intel', 'asus', 'msi', 'gigabyte', 'evga']
        
        # Network equipment vendors
        network_vendors = ['cisco', 'huawei', 'tp-link', 'linksys', 'netgear', 'd-link']
        
        for mining_vendor in mining_vendors:
            if mining_vendor in vendor_lower:
                return 'mining_hardware'
                
        for gpu_vendor in gpu_vendors:
            if gpu_vendor in vendor_lower:
                return 'gpu_device'
                
        for network_vendor in network_vendors:
            if network_vendor in vendor_lower:
                return 'network_equipment'
        
        return 'unknown'

    def lookup_ip_owner_tci(self, ip_address: str) -> Optional[Dict]:
        """
        Lookup IP owner through Iran Telecom Company (TCI) official API
        Requires proper authorization and compliance with privacy laws
        """
        try:
            # This would require official API access with proper credentials
            # For demonstration, showing the structure of real API call
            
            headers = {
                'Authorization': f'Bearer {os.getenv("TCI_API_KEY")}',
                'Content-Type': 'application/json',
                'User-Agent': 'IlamMinerDetection/1.0'
            }
            
            payload = {
                'ip_address': ip_address,
                'request_type': 'owner_lookup',
                'requesting_authority': 'ilam_cybersecurity_unit',
                'case_reference': f'MINER_DETECTION_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            }
            
            response = requests.post(
                f"{self.tci_api_base}/customer/ip-lookup",
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return {
                        'name': data.get('customer_name'),
                        'family': data.get('customer_family'),
                        'phone': data.get('contact_number'),
                        'national_id': data.get('national_id'),
                        'address': data.get('service_address'),
                        'contract_type': data.get('service_type'),
                        'isp': 'مخابرات ایران',
                        'confidence': 0.95,
                        'source': 'tci_official_api'
                    }
            
            return None
            
        except Exception as e:
            self.log_lookup_attempt(ip_address, None, 'tci_api', False, str(e))
            return None

    def lookup_ip_owner_whois(self, ip_address: str) -> Optional[Dict]:
        """
        Lookup IP ownership through WHOIS databases
        Uses official Iranian network information centers
        """
        try:
            # Use IRNIC (Iran Network Information Center) WHOIS
            whois_servers = [
                'whois.nic.ir',
                'whois.apnic.net',
                'whois.ripe.net'
            ]
            
            for whois_server in whois_servers:
                try:
                    result = subprocess.run(
                        ['whois', '-h', whois_server, ip_address],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    
                    if result.returncode == 0:
                        whois_data = result.stdout
                        parsed_info = self.parse_whois_response(whois_data)
                        
                        if parsed_info:
                            return parsed_info
                            
                except subprocess.TimeoutExpired:
                    continue
                except Exception as e:
                    continue
            
            return None
            
        except Exception as e:
            self.log_lookup_attempt(ip_address, None, 'whois', False, str(e))
            return None

    def parse_whois_response(self, whois_data: str) -> Optional[Dict]:
        """Parse WHOIS response to extract owner information"""
        lines = whois_data.split('\n')
        info = {}
        
        for line in lines:
            line = line.strip()
            
            # Look for common WHOIS fields
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()
                
                if key in ['person', 'admin-c', 'tech-c']:
                    info['contact_person'] = value
                elif key in ['phone', 'tel']:
                    info['phone'] = value
                elif key in ['address', 'addr']:
                    info['address'] = value
                elif key in ['org', 'organization', 'orgname']:
                    info['organization'] = value
                elif key in ['netname', 'netblock-name']:
                    info['network_name'] = value
        
        if info:
            return {
                'name': info.get('contact_person', '').split()[0] if info.get('contact_person') else None,
                'family': ' '.join(info.get('contact_person', '').split()[1:]) if info.get('contact_person') else None,
                'phone': info.get('phone'),
                'address': info.get('address'),
                'organization': info.get('organization'),
                'network_name': info.get('network_name'),
                'confidence': 0.7,
                'source': 'whois_lookup'
            }
        
        return None

    def lookup_mac_vendor(self, mac_address: str) -> Optional[Dict]:
        """Lookup MAC address vendor and device information"""
        if not mac_address or len(mac_address) < 8:
            return None
            
        # Normalize MAC address
        mac_clean = re.sub(r'[^0-9a-fA-F]', '', mac_address)
        if len(mac_clean) < 6:
            return None
            
        oui = ':'.join([mac_clean[i:i+2] for i in range(0, 6, 2)]).lower()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT vendor_name, device_type FROM mac_vendor_lookup 
            WHERE mac_prefix = ?
        ''', (oui,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'vendor': result[0],
                'device_type': result[1],
                'mac_oui': oui,
                'source': 'ieee_oui_database'
            }
        
        return None

    def lookup_cellular_owner(self, ip_address: str) -> Optional[Dict]:
        """
        Lookup cellular data connection owner through mobile operators
        Requires official API access to mobile operator databases
        """
        try:
            # Determine if IP belongs to cellular network
            cellular_ranges = self.get_cellular_ip_ranges()
            
            is_cellular = False
            operator = None
            
            for op_name, ranges in cellular_ranges.items():
                for ip_range in ranges:
                    if self.ip_in_range(ip_address, ip_range):
                        is_cellular = True
                        operator = op_name
                        break
                        
                if is_cellular:
                    break
            
            if not is_cellular:
                return None
            
            # Query specific operator API
            if operator in self.mobile_operators:
                return self.query_mobile_operator_api(ip_address, operator)
            
            return None
            
        except Exception as e:
            self.log_lookup_attempt(ip_address, None, 'cellular_lookup', False, str(e))
            return None

    def get_cellular_ip_ranges(self) -> Dict[str, List[str]]:
        """Get IP ranges for Iranian mobile operators"""
        return {
            'irancell': [
                '5.160.0.0/16',
                '31.24.0.0/16',
                '37.32.0.0/16'
            ],
            'hamrah_avval': [
                '2.176.0.0/16',
                '5.22.0.0/16',
                '31.2.0.0/16'
            ],
            'rightel': [
                '5.134.0.0/16',
                '31.14.0.0/16'
            ]
        }

    def ip_in_range(self, ip: str, cidr: str) -> bool:
        """Check if IP address is in CIDR range"""
        try:
            import ipaddress
            return ipaddress.ip_address(ip) in ipaddress.ip_network(cidr)
        except:
            return False

    def query_mobile_operator_api(self, ip_address: str, operator: str) -> Optional[Dict]:
        """
        Query mobile operator API for subscriber information
        This would require official API access and legal authorization
        """
        try:
            if operator not in self.mobile_operators:
                return None
            
            op_config = self.mobile_operators[operator]
            
            # This would require official API credentials
            headers = {
                'Authorization': f'Bearer {os.getenv(f"{operator.upper()}_API_KEY")}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'ip_address': ip_address,
                'lookup_type': 'data_session',
                'requesting_authority': 'cybersecurity_unit'
            }
            
            response = requests.post(
                op_config['api_endpoint'],
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return {
                        'name': data.get('subscriber_name'),
                        'family': data.get('subscriber_family'),
                        'phone': data.get('mobile_number'),
                        'national_id': data.get('national_id'),
                        'operator': op_config['name'],
                        'confidence': 0.9,
                        'source': f'{operator}_api'
                    }
            
            return None
            
        except Exception as e:
            return None

    def comprehensive_owner_lookup(self, ip_address: str, mac_address: str = None) -> Dict:
        """
        Comprehensive owner identification using multiple sources
        """
        start_time = time.time()
        results = {
            'ip_address': ip_address,
            'mac_address': mac_address,
            'timestamp': datetime.now().isoformat(),
            'sources_checked': [],
            'owner_info': None,
            'device_info': None,
            'confidence_score': 0.0,
            'lookup_time': 0.0
        }
        
        # Check cache first
        cached_result = self.get_cached_owner_info(ip_address)
        if cached_result and self.is_cache_valid(cached_result):
            results['owner_info'] = cached_result
            results['confidence_score'] = cached_result.get('confidence', 0.0)
            results['sources_checked'] = ['cache']
            results['lookup_time'] = time.time() - start_time
            return results
        
        # Try multiple lookup methods
        owner_info = None
        
        # 1. Official TCI API lookup
        try:
            tci_result = self.lookup_ip_owner_tci(ip_address)
            if tci_result:
                owner_info = tci_result
                results['sources_checked'].append('tci_official')
        except Exception as e:
            pass
        
        # 2. WHOIS lookup
        if not owner_info:
            try:
                whois_result = self.lookup_ip_owner_whois(ip_address)
                if whois_result:
                    owner_info = whois_result
                    results['sources_checked'].append('whois')
            except Exception as e:
                pass
        
        # 3. Mobile operator lookup (if cellular IP)
        if not owner_info:
            try:
                cellular_result = self.lookup_cellular_owner(ip_address)
                if cellular_result:
                    owner_info = cellular_result
                    results['sources_checked'].append('cellular')
            except Exception as e:
                pass
        
        # 4. MAC vendor lookup
        device_info = None
        if mac_address:
            try:
                mac_info = self.lookup_mac_vendor(mac_address)
                if mac_info:
                    device_info = mac_info
                    results['sources_checked'].append('mac_vendor')
            except Exception as e:
                pass
        
        # Store results
        results['owner_info'] = owner_info
        results['device_info'] = device_info
        results['confidence_score'] = owner_info.get('confidence', 0.0) if owner_info else 0.0
        results['lookup_time'] = time.time() - start_time
        
        # Cache the result
        if owner_info:
            self.cache_owner_info(ip_address, mac_address, owner_info, device_info)
        
        # Log the lookup
        self.log_lookup_attempt(
            ip_address, 
            mac_address, 
            'comprehensive', 
            owner_info is not None,
            None,
            results['lookup_time']
        )
        
        return results

    def get_cached_owner_info(self, ip_address: str) -> Optional[Dict]:
        """Get cached owner information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM ip_ownership WHERE ip_address = ?
        ''', (ip_address,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'name': result[3],
                'family': result[4],
                'phone': result[5],
                'national_id': result[6],
                'address': result[7],
                'isp': result[8],
                'contract_type': result[9],
                'last_verified': result[11],
                'source': result[12],
                'confidence': result[13]
            }
        
        return None

    def is_cache_valid(self, cached_info: Dict, max_age_hours: int = 24) -> bool:
        """Check if cached information is still valid"""
        try:
            last_verified = datetime.fromisoformat(cached_info['last_verified'])
            age = datetime.now() - last_verified
            return age < timedelta(hours=max_age_hours)
        except:
            return False

    def cache_owner_info(self, ip_address: str, mac_address: str, owner_info: Dict, device_info: Dict):
        """Cache owner information in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO ip_ownership 
            (ip_address, mac_address, owner_name, owner_family, phone_number, 
             national_id, address, isp_name, contract_type, registration_date,
             last_verified, verification_source, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ip_address,
            mac_address,
            owner_info.get('name'),
            owner_info.get('family'),
            owner_info.get('phone'),
            owner_info.get('national_id'),
            owner_info.get('address'),
            owner_info.get('isp'),
            owner_info.get('contract_type'),
            datetime.now().isoformat(),
            datetime.now().isoformat(),
            owner_info.get('source'),
            owner_info.get('confidence', 0.0)
        ))
        
        conn.commit()
        conn.close()

    def log_lookup_attempt(self, ip_address: str, mac_address: str, lookup_type: str, 
                          success: bool, error_message: str = None, response_time: float = None):
        """Log lookup attempt for audit purposes"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO lookup_log 
            (timestamp, ip_address, mac_address, lookup_type, success, response_time, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            ip_address,
            mac_address,
            lookup_type,
            success,
            response_time,
            error_message
        ))
        
        conn.commit()
        conn.close()

def main():
    """Main function for command line usage"""
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python3 ownerIdentification.py <ip_address> [mac_address]")
        sys.exit(1)
    
    service = OwnerIdentificationService()
    ip_address = sys.argv[1]
    mac_address = sys.argv[2] if len(sys.argv) > 2 else None
    
    results = service.comprehensive_owner_lookup(ip_address, mac_address)
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()