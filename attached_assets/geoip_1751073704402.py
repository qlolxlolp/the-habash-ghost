import requests

def get_location(ip):
    try:
        # API رایگان و معتبر برای جستجوی IP (ip-api.com)
        url = f"http://ip-api.com/json/{ip}?fields=status,message,country,regionName,city,lat,lon,query"
        response = requests.get(url)
        data = response.json()
        
        if data['status'] == 'success':
            print(f"IP: {data['query']}")
            print(f"Country: {data['country']}")
            print(f"Region: {data['regionName']}")
            print(f"City: {data['city']}")
            print(f"Latitude: {data['lat']}")
            print(f"Longitude: {data['lon']}")
            
            # لینک نمایش موقعیت روی گوگل مپ
            print(f"Google Maps URL: https://www.google.com/maps?q={data['lat']},{data['lon']}")
        else:
            print(f"Error: {data['message']}")
            
    except Exception as e:
        print(f"Exception occurred: {e}")

if __name__ == "__main__":
    ip_input = input("Enter an IP address (or leave empty for your IP): ").strip()
    if ip_input == "":
        ip_input = ""  # اگر خالی بود، api به طور خودکار ip خودت رو برمی‌گردونه
    get_location(ip_input)
