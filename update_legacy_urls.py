#!/usr/bin/env python3
"""
menu-index.txt dosyasındaki legacylink URL'lerini menu-index.json dosyasına ekler.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def parse_menu_index_txt(filepath: str) -> List[Tuple[str, str]]:
    """menu-index.txt dosyasından başlık ve legacylink URL çiftlerini çıkar."""
    entries = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Her satırı işle
    for line in content.split('\n'):
        # legacylink içeren satırları bul
        if 'legacylink:' in line:
            # Başlığı çıkar (├─ veya └─ sonrasındaki metin)
            title_match = re.search(r'[├└]─\s*([^l]+?)(?:\s*legacylink:|$)', line)
            if not title_match:
                # Alternatif format
                title_match = re.search(r'[├└]─\s*(.+?)\s+legacylink:', line)
            
            if title_match:
                title = title_match.group(1).strip()
                # Başlıktaki fazlalıkları temizle
                title = re.sub(r'\s*\[EKLENDİ\]', '', title)
                title = title.strip()
            else:
                continue
            
            # İlk legacylink URL'sini çıkar
            url_match = re.search(r'legacylink:(https?://[^\s]+)', line)
            if url_match:
                url = url_match.group(1).strip()
                entries.append((title, url))
    
    return entries


def normalize_title(title: str) -> str:
    """Başlığı karşılaştırma için normalize et."""
    # Küçük harfe çevir, özel karakterleri temizle
    normalized = title.lower()
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()


def find_and_update_entry(items: List[Dict], title: str, url: str, updated_count: List[int]) -> bool:
    """JSON yapısında başlığa göre entry bul ve old_doc_url ekle."""
    normalized_search = normalize_title(title)
    
    for item in items:
        item_title = item.get("title_tr", "")
        normalized_item = normalize_title(item_title)
        
        # Tam eşleşme veya içerme kontrolü
        if normalized_search == normalized_item or normalized_search in normalized_item or normalized_item in normalized_search:
            # old_doc_url yoksa veya boşsa ekle
            if not item.get("old_doc_url"):
                item["old_doc_url"] = url
                updated_count[0] += 1
                print(f"  ✓ Güncellendi: {item_title[:50]}...")
                return True
        
        # Alt elemanları kontrol et
        if "children" in item:
            if find_and_update_entry(item["children"], title, url, updated_count):
                return True
    
    return False


def main():
    print("=" * 70)
    print("LEGACY URL GÜNCELLEYİCİ")
    print("=" * 70)
    
    base_dir = Path(".")
    menu_txt_path = base_dir / "menu-index.txt"
    menu_json_path = base_dir / "menu-index.json"
    
    # menu-index.txt'den URL'leri parse et
    print("\nmenu-index.txt parse ediliyor...")
    entries = parse_menu_index_txt(str(menu_txt_path))
    print(f"✓ {len(entries)} legacylink bulundu")
    
    # menu-index.json'ı yükle
    print("\nmenu-index.json yükleniyor...")
    with open(menu_json_path, 'r', encoding='utf-8') as f:
        menu_data = json.load(f)
    print("✓ menu-index.json yüklendi")
    
    # Her entry için güncelleme yap
    print("\nGüncelleme yapılıyor...")
    updated_count = [0]
    not_found = []
    
    for title, url in entries:
        found = False
        for section in menu_data.get("sections", []):
            if "children" in section:
                if find_and_update_entry(section["children"], title, url, updated_count):
                    found = True
                    break
        
        if not found:
            not_found.append((title, url))
    
    # Kaydet
    print("\nmenu-index.json kaydediliyor...")
    with open(menu_json_path, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)
    print("✓ menu-index.json kaydedildi")
    
    # İstatistikler
    print("\n" + "=" * 70)
    print("İSTATİSTİKLER")
    print("=" * 70)
    print(f"Toplam legacylink: {len(entries)}")
    print(f"Güncellenen:       {updated_count[0]}")
    print(f"Bulunamayan:       {len(not_found)}")
    
    if not_found and len(not_found) <= 20:
        print("\nBulunamayan başlıklar:")
        for title, url in not_found[:20]:
            print(f"  - {title[:60]}...")
    
    print("=" * 70)


if __name__ == "__main__":
    main()

