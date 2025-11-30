#!/usr/bin/env python3
"""
Bu script, "Bu sayfa için içerik hazırlanıyor" yazan dosyaları bulur ve
menu-index.json'daki old_doc_url bilgisini kullanarak sayfaları günceller.
"""

import json
import os
import re
from pathlib import Path

def find_placeholder_files(root_dir):
    """'Bu sayfa için içerik hazırlanıyor' içeren dosyaları bul"""
    placeholder_files = []
    pattern = re.compile(r'Bu sayfa için içerik hazırlanıyor', re.IGNORECASE)
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.mdx'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if pattern.search(content):
                            # Dosya yolunu workspace root'a göre relative yap
                            rel_path = os.path.relpath(file_path, root_dir)
                            placeholder_files.append(rel_path)
                except Exception as e:
                    print(f"Hata: {file_path} okunamadı: {e}")
    
    return placeholder_files

def load_menu_index(menu_index_path):
    """menu-index.json dosyasını yükle"""
    with open(menu_index_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_old_doc_url(menu_data, file_path):
    """menu-index.json'da dosya için old_doc_url bul"""
    def search_recursive(items):
        for item in items:
            # actual_file alanını kontrol et
            if 'actual_file' in item and item['actual_file']:
                # actual_file path'i ile eşleşiyor mu kontrol et
                actual_file = item['actual_file']
                # .mdx uzantısını kaldır ve karşılaştır
                file_path_no_ext = file_path.replace('.mdx', '')
                actual_file_no_ext = actual_file.replace('.mdx', '')
                
                if actual_file_no_ext == file_path_no_ext:
                    return item.get('old_doc_url', None)
            
            # children varsa recursive ara
            if 'children' in item:
                result = search_recursive(item['children'])
                if result is not None:
                    return result
        
        return None
    
    if 'sections' in menu_data:
        return search_recursive(menu_data['sections'])
    return None

def update_file(file_path, old_doc_url):
    """Dosyayı güncelle"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # "Bu sayfa için içerik hazırlanıyor" metnini bul ve değiştir
        pattern = re.compile(r'Bu sayfa için içerik hazırlanıyor\.?', re.IGNORECASE)
        
        if old_doc_url:
            new_content = f"Bu sayfa için içerik hazırlanıyor. Bu sayfa içeriği için bakınız: {old_doc_url}"
        else:
            new_content = "Bu sayfa için içerik hazırlanıyor."
        
        updated_content = pattern.sub(new_content, content)
        
        # İçerik değiştiyse dosyayı yaz
        if updated_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            return True
        return False
    except Exception as e:
        print(f"Hata: {file_path} güncellenemedi: {e}")
        return False

def main():
    workspace_root = Path(__file__).parent
    menu_index_path = workspace_root / 'menu-index.json'
    
    print("Menu index yükleniyor...")
    menu_data = load_menu_index(menu_index_path)
    
    print("Placeholder içeren dosyalar aranıyor...")
    placeholder_files = find_placeholder_files(workspace_root)
    print(f"Toplam {len(placeholder_files)} dosya bulundu.")
    
    updated_count = 0
    not_found_count = 0
    no_url_count = 0
    
    for file_path in placeholder_files:
        full_path = workspace_root / file_path
        print(f"\nİşleniyor: {file_path}")
        
        old_doc_url = find_old_doc_url(menu_data, file_path)
        
        if old_doc_url:
            print(f"  old_doc_url bulundu: {old_doc_url}")
            if update_file(full_path, old_doc_url):
                updated_count += 1
                print(f"  ✓ Güncellendi")
            else:
                print(f"  - Değişiklik yapılmadı")
        else:
            print(f"  ⚠ old_doc_url bulunamadı")
            no_url_count += 1
    
    print(f"\n{'='*60}")
    print(f"Özet:")
    print(f"  Toplam dosya: {len(placeholder_files)}")
    print(f"  Güncellenen: {updated_count}")
    print(f"  URL bulunamayan: {no_url_count}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()

