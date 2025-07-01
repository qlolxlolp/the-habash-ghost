#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IP Geolocation Service for Miner Detection System
"""

import json
import logging
import math
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin

import requests

logger = logging.getLogger(__name__)

class IPGeolocator:
    def __init__(self):
        # Ilam province boundaries
        self.ilam_bounds = {
            'north': 34.5,
            'south': 32.0, 
            'east': 48.5,
            'west': 45.5,
            'center': (33.63, 46.42)
        }
        
        # Major cities in Ilam province with coordinates
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
            'ملکشاهی': (33.3833, 46.5667),
            'شیروان چرداول': (33.9, 46.95),
            'ارکواز': (33.4167, 46.6833),
            'زرنه': (33.2833, 46.8167)
        }
        
        # Cache for geolocation results
        self.location_cache = {}
        self.cache_expiry = timedelta(hours=24)
        
        # Rate limiting
        self.last_request_time = {}
        self.request_delay = 1.0  # seconds between requests
        
    def geolocate_ip(self, ip_address: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """Geolocate IP address using multiple services"""
        # Check cache first
        if use_cache and ip_address in self.location_cache:
            cached_data = self.location_cache[ip_address]
            if datetime.now() - cached_data['cached_at'] < self.cache_expiry:
                return cached_data['data']
        
        # Skip private IP addresses
        if self._is_private_ip(ip_address):
            return {
                'ip': ip_address,
                'status': 'private',
                'latitude': None,
                'longitude': None,
                'city': 'شبکه محلی',
                'region': 'شبکه خصوصی',
                'country': 'ایران',
                'in_ilam': True,  # Assume local network is in Ilam
                'accuracy': 'network'
            }
        
        # Try multiple geolocation services
        services = [
            {
                'name': 'ip-api',
                'url': f'http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query',
                'parser': self._parse_ipapi_response
            },
            {
                'name': 'ipapi.co',
                'url': f'https://ipapi.co/{ip_address}/json/',
                'parser': self._parse_ipapi_co_response
            },
            {
                'name': 'ipinfo.io',
                'url': f'https://ipinfo.io/{ip_address}/json',
                'parser': self._parse_ipinfo_response
            }
        ]
        
        for service in services:
            try:
                # Rate limiting
                service_name = service['name']
                if service_name in self.last_request_time:
                    time_since_last = time.time() - self.last_request_time[service_name]
                    if time_since_last < self.request_delay:
                        time.sleep(self.request_delay - time_since_last)
                
                # Make request
                response = requests.get(
                    service['url'], 
                    timeout=10,
                    headers={'User-Agent': 'Ilam-Miner-Detection-System/1.0'}
                )
                
                self.last_request_time[service_name] = time.time()
                
                if response.status_code == 200:
                    data = response.json()
                    parsed_data = service['parser'](data, ip_address)
                    
                    if parsed_data and parsed_data.get('latitude') and parsed_data.get('longitude'):
                        # Enhance data with Ilam-specific information
                        enhanced_data = self._enhance_with_ilam_data(parsed_data)
                        
                        # Cache the result
                        self.location_cache[ip_address] = {
                            'data': enhanced_data,
                            'cached_at': datetime.now()
                        }
                        
                        logger.info(f"Successfully geolocated {ip_address} using {service_name}")
                        return enhanced_data
                        
            except Exception as e:
                logger.warning(f"Geolocation service {service['name']} failed for {ip_address}: {e}")
                continue
        
        logger.error(f"All geolocation services failed for {ip_address}")
        return None
    
    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP address is private/local"""
        try:
            import ipaddress
            ip_obj = ipaddress.ip_address(ip)
            return ip_obj.is_private
        except ValueError:
            return False
    
    def _parse_ipapi_response(self, data: Dict[str, Any], ip: str) -> Optional[Dict[str, Any]]:
        """Parse response from ip-api.com"""
        if data.get('status') != 'success':
            return None
            
        return {
            'ip': ip,
            'status': 'success',
            'latitude': float(data['lat']) if data.get('lat') else None,
            'longitude': float(data['lon']) if data.get('lon') else None,
            'city': data.get('city', ''),
            'region': data.get('regionName', ''),
            'country': data.get('country', ''),
            'country_code': data.get('countryCode', ''),
            'timezone': data.get('timezone', ''),
            'isp': data.get('isp', ''),
            'organization': data.get('org', ''),
            'as_number': data.get('as', ''),
            'accuracy': 'city',
            'service': 'ip-api'
        }
    
    def _parse_ipapi_co_response(self, data: Dict[str, Any], ip: str) -> Optional[Dict[str, Any]]:
        """Parse response from ipapi.co"""
        if not data.get('latitude') or not data.get('longitude'):
            return None
            
        return {
            'ip': ip,
            'status': 'success',
            'latitude': float(data['latitude']),
            'longitude': float(data['longitude']),
            'city': data.get('city', ''),
            'region': data.get('region', ''),
            'country': data.get('country_name', ''),
            'country_code': data.get('country', ''),
            'timezone': data.get('timezone', ''),
            'isp': data.get('org', ''),
            'organization': data.get('org', ''),
            'postal_code': data.get('postal', ''),
            'accuracy': 'city',
            'service': 'ipapi.co'
        }
    
    def _parse_ipinfo_response(self, data: Dict[str, Any], ip: str) -> Optional[Dict[str, Any]]:
        """Parse response from ipinfo.io"""
        loc = data.get('loc', '')
        if not loc or ',' not in loc:
            return None
            
        try:
            lat, lon = map(float, loc.split(','))
        except ValueError:
            return None
            
        return {
            'ip': ip,
            'status': 'success',
            'latitude': lat,
            'longitude': lon,
            'city': data.get('city', ''),
            'region': data.get('region', ''),
            'country': data.get('country', ''),
            'country_code': data.get('country', ''),
            'timezone': data.get('timezone', ''),
            'isp': data.get('org', ''),
            'organization': data.get('org', ''),
            'postal_code': data.get('postal', ''),
            'accuracy': 'city',
            'service': 'ipinfo.io'
        }
    
    def _enhance_with_ilam_data(self, location_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance location data with Ilam province specific information"""
        lat = location_data['latitude']
        lon = location_data['longitude']
        
        # Check if coordinates are within Ilam province
        in_ilam = self._is_in_ilam_bounds(lat, lon)
        location_data['in_ilam'] = in_ilam
        
        if in_ilam:
            # Find closest city in Ilam
            closest_city_info = self._find_closest_ilam_city(lat, lon)
            location_data['closest_ilam_city'] = closest_city_info['city']
            location_data['distance_to_city'] = closest_city_info['distance_km']
            
            # If very close to a city, update the city name
            if closest_city_info['distance_km'] < 5:
                location_data['city'] = closest_city_info['city']
                location_data['region'] = 'استان ایلام'
                location_data['country'] = 'ایران'
        else:
            # Calculate distance to Ilam center
            distance_to_ilam = self._calculate_distance(
                lat, lon, 
                self.ilam_bounds['center'][0], 
                self.ilam_bounds['center'][1]
            )
            location_data['distance_to_ilam'] = distance_to_ilam
        
        return location_data
    
    def _is_in_ilam_bounds(self, lat: float, lon: float) -> bool:
        """Check if coordinates are within Ilam province boundaries"""
        return (self.ilam_bounds['south'] <= lat <= self.ilam_bounds['north'] and
                self.ilam_bounds['west'] <= lon <= self.ilam_bounds['east'])
    
    def _find_closest_ilam_city(self, lat: float, lon: float) -> Dict[str, Any]:
        """Find the closest city in Ilam province"""
        min_distance = float('inf')
        closest_city = None
        
        for city, (city_lat, city_lon) in self.ilam_cities.items():
            distance = self._calculate_distance(lat, lon, city_lat, city_lon)
            if distance < min_distance:
                min_distance = distance
                closest_city = city
        
        return {
            'city': closest_city,
            'distance_km': min_distance
        }
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in kilometers
        r = 6371
        
        return c * r
    
    def geolocate_multiple(self, ip_addresses: List[str]) -> Dict[str, Dict[str, Any]]:
        """Geolocate multiple IP addresses"""
        results = {}
        
        for ip in ip_addresses:
            try:
                location = self.geolocate_ip(ip)
                results[ip] = location
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error geolocating {ip}: {e}")
                results[ip] = None
        
        return results
    
    def get_ilam_statistics(self, detected_devices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate statistics for devices in Ilam province"""
        stats = {
            'total_devices': len(detected_devices),
            'devices_in_ilam': 0,
            'devices_outside_ilam': 0,
            'city_distribution': {},
            'coordinates': []
        }
        
        for device in detected_devices:
            geolocation = device.get('geolocation')
            if not geolocation:
                continue
                
            # Check if any geolocation service found Ilam location
            in_ilam = False
            city = None
            
            for service, data in geolocation.items():
                if data and data.get('in_ilam'):
                    in_ilam = True
                    city = data.get('closest_ilam_city') or data.get('city')
                    stats['coordinates'].append({
                        'ip': device.get('ip_address'),
                        'lat': data.get('latitude'),
                        'lon': data.get('longitude'),
                        'city': city,
                        'threat_level': device.get('threat_level', 'low')
                    })
                    break
            
            if in_ilam:
                stats['devices_in_ilam'] += 1
                if city:
                    stats['city_distribution'][city] = stats['city_distribution'].get(city, 0) + 1
            else:
                stats['devices_outside_ilam'] += 1
        
        return stats
    
    def clear_cache(self):
        """Clear the location cache"""
        self.location_cache.clear()
        logger.info("Location cache cleared")

# Global geolocator instance
geolocator = IPGeolocator()

def geolocate_device(ip_address: str) -> Optional[Dict[str, Any]]:
    """Geolocate a single device"""
    return geolocator.geolocate_ip(ip_address)

def geolocate_devices(ip_addresses: List[str]) -> Dict[str, Dict[str, Any]]:
    """Geolocate multiple devices"""
    return geolocator.geolocate_multiple(ip_addresses)

def get_ilam_stats(devices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Get Ilam-specific statistics"""
    return geolocator.get_ilam_statistics(devices)

if __name__ == "__main__":
    # Test geolocation
    test_ips = ['8.8.8.8', '192.168.1.1', '1.1.1.1']
    
    for ip in test_ips:
        result = geolocate_device(ip)
        print(f"\nGeolocation for {ip}:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
