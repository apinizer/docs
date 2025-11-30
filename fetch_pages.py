#!/usr/bin/env python3
"""
Bu script, menu-index.txt dosyasındaki linklerden içerikleri okuyup MDX dosyalarına yazar.
Kullanım: python fetch_pages.py
"""

import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time
import os

def extract_content_from_html(html_content):
    """HTML içeriğinden metin içeriğini çıkarır"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Wiki content'i bul
    wiki_content = soup.find('div', class_='wiki-content')
    if wiki_content:
        return wiki_content.get_text(separator='\n', strip=True)
    
    # Alternatif olarak main content'i bul
    main_content = soup.find('main') or soup.find('article')
    if main_content:
        return main_content.get_text(separator='\n', strip=True)
    
    return soup.get_text(separator='\n', strip=True)

def read_menu_index():
    """menu-index.txt dosyasını okur ve sayfa bilgilerini çıkarır"""
    with open('menu-index.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 306-405 satırları arasındaki içeriği al
    lines = content.split('\n')
    relevant_lines = lines[305:405]  # 0-indexed, so 305 = line 306
    
    pages = []
    current_section = None
    
    for line in relevant_lines:
        # Link içeren satırları bul
        if 'https://docs.apinizer.com' in line:
            # Sayfa adını ve linkini çıkar
            match = re.search(r'([^:]+):\s*(https://[^\s]+)', line)
            if match:
                page_name = match.group(1).strip()
                page_url = match.group(2).strip()
                pages.append({
                    'name': page_name,
                    'url': page_url
                })
    
    return pages

def get_mdx_file_path(page_name):
    """Sayfa adına göre MDX dosya yolunu döndürür"""
    # Sayfa adını dosya adına çevir
    # Bu mapping'i menu-index.txt'ye göre yapmanız gerekebilir
    # Şimdilik basit bir mapping yapıyoruz
    mapping = {
        'Genel Bakış': 'tr/admin/genel-bakis.mdx',
        'User Creation & Onboarding': 'tr/admin/kullanici-erisim-yonetimi/user-creation-onboarding.mdx',
        'Roles & Permissions': 'tr/admin/kullanici-erisim-yonetimi/roles-permissions.mdx',
        'Teams Management': 'tr/admin/kullanici-erisim-yonetimi/teams-management.mdx',
        # Diğer mapping'leri ekleyin
    }
    
    return mapping.get(page_name, None)

def fetch_page_content(url):
    """Bir sayfanın içeriğini çeker"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Hata: {url} - {e}")
        return None

if __name__ == '__main__':
    print("Menu index dosyası okunuyor...")
    pages = read_menu_index()
    print(f"{len(pages)} sayfa bulundu.")
    
    for i, page in enumerate(pages, 1):
        print(f"\n[{i}/{len(pages)}] {page['name']} işleniyor...")
        
        # İçeriği çek
        html_content = fetch_page_content(page['url'])
        if html_content:
            text_content = extract_content_from_html(html_content)
            print(f"İçerik çekildi: {len(text_content)} karakter")
            # Burada MDX dosyasına yazma işlemi yapılabilir
        else:
            print("İçerik çekilemedi!")
        
        # Rate limiting
        time.sleep(1)


