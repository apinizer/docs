#!/usr/bin/env python3
"""
menu-index.txt dosyasındaki legacylink URL'lerini menu-index.json dosyasına ekler.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def parse_menu_index_txt(filepath: Path) -> Dict[str, str]:
    """menu-index.txt dosyasını parse edip başlık -> URL eşleştirmesi döner."""
    title_to_url = {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    for line in lines:
        # legacylink:URL pattern'ini bul
        match = re.search(r'[├└─│\s]*(.+?)\s*legacylink:(https?://[^\s]+)', line)
        if match:
            title = match.group(1).strip()
            url = match.group(2).strip()
            
            # Başlıktaki özel karakterleri temizle
            title = re.sub(r'^[├└─│\s]+', '', title)
            title = title.strip()
            
            if title and url:
                title_to_url[title] = url
    
    return title_to_url


def normalize_title(title: str) -> str:
    """Başlığı normalize et (karşılaştırma için)."""
    # Küçük harfe çevir, özel karakterleri kaldır
    normalized = title.lower()
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()


def update_json_recursive(items: List[Dict], title_to_url: Dict[str, str], stats: Dict) -> int:
    """JSON'daki entry'leri recursive olarak güncelle."""
    updated = 0
    
    # Normalize edilmiş başlık -> URL map oluştur
    normalized_map = {}
    for title, url in title_to_url.items():
        normalized_map[normalize_title(title)] = url
    
    for item in items:
        title_tr = item.get("title_tr", "")
        
        # old_doc_url yoksa veya boşsa ekle
        if title_tr and not item.get("old_doc_url"):
            normalized = normalize_title(title_tr)
            
            # Tam eşleşme ara
            if normalized in normalized_map:
                item["old_doc_url"] = normalized_map[normalized]
                updated += 1
                stats["matched"].append(title_tr)
            else:
                # Kısmi eşleşme dene
                for txt_title, url in title_to_url.items():
                    if normalize_title(txt_title) == normalized:
                        item["old_doc_url"] = url
                        updated += 1
                        stats["matched"].append(title_tr)
                        break
                    # Başlık txt_title ile başlıyorsa veya içeriyorsa
                    elif normalized in normalize_title(txt_title) or normalize_title(txt_title) in normalized:
                        if len(normalized) > 10:  # Çok kısa eşleşmeleri atla
                            item["old_doc_url"] = url
                            updated += 1
                            stats["partial_matched"].append((title_tr, txt_title))
                            break
        
        # Children varsa recursive devam et
        if "children" in item:
            updated += update_json_recursive(item["children"], title_to_url, stats)
    
    return updated


def main():
    print("=" * 70)
    print("LEGACY URL SYNC")
    print("=" * 70)
    
    base_dir = Path(".")
    txt_path = base_dir / "menu-index.txt"
    json_path = base_dir / "menu-index.json"
    
    # TXT dosyasını parse et
    print("\nmenu-index.txt parse ediliyor...")
    title_to_url = parse_menu_index_txt(txt_path)
    print(f"✓ {len(title_to_url)} legacylink URL bulundu")
    
    # JSON dosyasını yükle
    print("\nmenu-index.json yükleniyor...")
    with open(json_path, 'r', encoding='utf-8') as f:
        menu_data = json.load(f)
    print("✓ menu-index.json yüklendi")
    
    # Stats
    stats = {"matched": [], "partial_matched": []}
    
    # Güncelle
    print("\nURL'ler eşleştiriliyor ve ekleniyor...")
    total_updated = 0
    
    for section in menu_data.get("sections", []):
        if "children" in section:
            total_updated += update_json_recursive(section["children"], title_to_url, stats)
    
    print(f"✓ {total_updated} entry güncellendi")
    
    # Kaydet
    print("\nmenu-index.json kaydediliyor...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)
    print("✓ menu-index.json kaydedildi")
    
    # İstatistikler
    print("\n" + "=" * 70)
    print("İSTATİSTİKLER")
    print("=" * 70)
    print(f"TXT'de bulunan URL sayısı: {len(title_to_url)}")
    print(f"Tam eşleşme: {len(stats['matched'])}")
    print(f"Kısmi eşleşme: {len(stats['partial_matched'])}")
    print(f"Toplam güncellenen: {total_updated}")
    
    if stats['partial_matched']:
        print("\nKısmi eşleşmeler:")
        for json_title, txt_title in stats['partial_matched'][:10]:
            print(f"  '{json_title}' <- '{txt_title}'")
        if len(stats['partial_matched']) > 10:
            print(f"  ... ve {len(stats['partial_matched']) - 10} tane daha")
    
    print("=" * 70)


if __name__ == "__main__":
    main()

