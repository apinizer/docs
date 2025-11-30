#!/usr/bin/env python3
"""
docs.json dosyasında olup dosya sisteminde olmayan veya
tr/ altındaki dosya sisteminde olup docs.json'da olmayan dosyaları bulur.
"""

import json
import os
from pathlib import Path
from typing import Set, List, Dict

def extract_pages_from_json(obj, pages: Set[str]) -> None:
    """JSON objesinden tüm 'pages' değerlerini recursive olarak çıkarır."""
    if isinstance(obj, dict):
        if 'pages' in obj:
            for page in obj['pages']:
                if isinstance(page, str):
                    # Sadece tr/ ile başlayan dosyaları al
                    if page.startswith('tr/'):
                        pages.add(page)
                elif isinstance(page, dict):
                    # Nested group/pages yapısı
                    extract_pages_from_json(page, pages)
        # Tüm key-value çiftlerini recursive olarak kontrol et
        for value in obj.values():
            extract_pages_from_json(value, pages)
    elif isinstance(obj, list):
        for item in obj:
            extract_pages_from_json(item, pages)

def get_all_mdx_files(base_path: Path) -> Set[str]:
    """tr/ altındaki tüm .mdx dosyalarını bulur ve normalize eder."""
    mdx_files = set()
    tr_path = base_path / 'tr'
    
    if not tr_path.exists():
        return mdx_files
    
    for mdx_file in tr_path.rglob('*.mdx'):
        # Dosya yolunu normalize et: tr/... şeklinde
        relative_path = mdx_file.relative_to(base_path)
        # .mdx uzantısını kaldır
        path_without_ext = str(relative_path).replace('.mdx', '')
        mdx_files.add(path_without_ext)
    
    return mdx_files

def main():
    base_path = Path(__file__).parent
    docs_json_path = base_path / 'docs.json'
    
    # docs.json'ı oku
    with open(docs_json_path, 'r', encoding='utf-8') as f:
        docs_data = json.load(f)
    
    # docs.json'dan tüm tr/ dosyalarını çıkar
    docs_json_files: Set[str] = set()
    extract_pages_from_json(docs_data, docs_json_files)
    
    # Dosya sistemindeki tüm .mdx dosyalarını bul
    filesystem_files = get_all_mdx_files(base_path)
    
    # Karşılaştır
    in_json_not_in_filesystem = docs_json_files - filesystem_files
    in_filesystem_not_in_json = filesystem_files - docs_json_files
    
    print("=" * 80)
    print("DOCS.JSON vs DOSYA SİSTEMİ KARŞILAŞTIRMASI")
    print("=" * 80)
    print()
    
    if in_json_not_in_filesystem:
        print(f"❌ DOCS.JSON'DA OLUP DOSYA SİSTEMİNDE OLMAYAN DOSYALAR ({len(in_json_not_in_filesystem)}):")
        print("-" * 80)
        for file_path in sorted(in_json_not_in_filesystem):
            print(f"  - {file_path}.mdx")
        print()
    else:
        print("✅ docs.json'daki tüm dosyalar dosya sisteminde mevcut.")
        print()
    
    if in_filesystem_not_in_json:
        print(f"⚠️  DOSYA SİSTEMİNDE OLUP DOCS.JSON'DA OLMAYAN DOSYALAR ({len(in_filesystem_not_in_json)}):")
        print("-" * 80)
        for file_path in sorted(in_filesystem_not_in_json):
            print(f"  - {file_path}.mdx")
        print()
    else:
        print("✅ Dosya sistemindeki tüm dosyalar docs.json'da mevcut.")
        print()
    
    print("=" * 80)
    print(f"ÖZET:")
    print(f"  - docs.json'daki dosya sayısı: {len(docs_json_files)}")
    print(f"  - Dosya sistemindeki .mdx dosya sayısı: {len(filesystem_files)}")
    print(f"  - docs.json'da olup dosya sisteminde olmayan: {len(in_json_not_in_filesystem)}")
    print(f"  - Dosya sisteminde olup docs.json'da olmayan: {len(in_filesystem_not_in_json)}")
    print("=" * 80)

if __name__ == '__main__':
    main()
