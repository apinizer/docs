#!/usr/bin/env python3
"""
MDX dosyalarındaki frontmatter description alanlarındaki tek tırnak sorunlarını düzeltir.
Description alanı tek tırnakla başlayıp tek tırnakla bitiyorsa ve içinde tek tırnak varsa,
çift tırnakla değiştirir. İçindeki tek tırnaklar korunur.
Çift tek tırnakları (''') tek tek tırnağa (') çevirir.
"""

import re
import os
from pathlib import Path

def fix_description_quotes(content):
    """
    Frontmatter description alanındaki tek tırnak sorunlarını düzeltir.
    
    Örnek:
    description: 'API Proxy'de mesajlar' -> description: "API Proxy'de mesajlar"
    description: "API Proxy'de mesajlar" -> değişmez (zaten doğru)
    description: "GitOps''un" -> description: "GitOps'un"
    """
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Description satırını bul
        if re.match(r'^\s*description:\s*\'', line):
            # Tek tırnakla başlayan description satırı
            # Satırın sonunda tek tırnak var mı kontrol et
            if line.rstrip().endswith("'"):
                # Tek satırda tamamlanmış
                # İçinde tek tırnak var mı kontrol et
                desc_match = re.match(r'^(\s*description:\s*)\'(.*)\'\s*$', line)
                if desc_match:
                    indent = desc_match.group(1)
                    desc_content = desc_match.group(2)
                    # İçinde tek tırnak varsa çift tırnakla değiştir
                    if "'" in desc_content:
                        fixed_line = f'{indent}"{desc_content}"'
                        fixed_lines.append(fixed_line)
                    else:
                        fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            else:
                # Çok satırlı description (heredoc benzeri)
                # İlk satırı ekle
                fixed_lines.append(line)
                i += 1
                # Kapanış tırnağını bulana kadar devam et
                while i < len(lines):
                    current_line = lines[i]
                    fixed_lines.append(current_line)
                    if current_line.rstrip().endswith("'"):
                        break
                    i += 1
        elif re.match(r'^\s*description:\s*"', line):
            # Çift tırnakla başlayan description satırı
            # Çift tek tırnakları (''') tek tek tırnağa çevir
            if "''" in line:
                # Çift tek tırnakları tek tek tırnağa çevir
                fixed_line = line.replace("''", "'")
                fixed_lines.append(fixed_line)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
        
        i += 1
    
    return '\n'.join(fixed_lines)

def process_mdx_file(file_path):
    """Bir MDX dosyasını işle ve gerekirse düzelt."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        fixed_content = fix_description_quotes(content)
        
        if original_content != fixed_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True
        return False
    except Exception as e:
        print(f"Hata ({file_path}): {e}")
        return False

def main():
    """Tüm MDX dosyalarını tarayıp düzelt."""
    tr_dir = Path('tr')
    
    if not tr_dir.exists():
        print("'tr' dizini bulunamadı!")
        return
    
    mdx_files = list(tr_dir.rglob('*.mdx'))
    print(f"Toplam {len(mdx_files)} MDX dosyası bulundu.")
    
    fixed_count = 0
    for mdx_file in mdx_files:
        if process_mdx_file(mdx_file):
            print(f"Düzeltildi: {mdx_file}")
            fixed_count += 1
    
    print(f"\nToplam {fixed_count} dosya düzeltildi.")

if __name__ == '__main__':
    main()

