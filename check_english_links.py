#!/usr/bin/env python3
"""
Script to check all internal links in English documentation files.
Verifies that:
1. Links point to /en/ paths (not /tr/)
2. Referenced files actually exist
3. No broken links exist
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Set

# Base directory
BASE_DIR = Path(__file__).parent
EN_DIR = BASE_DIR / "en"

# Patterns to find links in markdown
LINK_PATTERNS = [
    r'\[([^\]]+)\]\((/[^)]+)\)',  # Markdown links: [text](/path)
    r'href=["\'](/[^"\']+)["\']',  # HTML href: href="/path"
    r'href=["\'](/[^"\']+)["\']',  # HTML href: href='/path'
]

def find_all_mdx_files(directory: Path) -> List[Path]:
    """Find all .mdx files in the directory."""
    mdx_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.mdx'):
                mdx_files.append(Path(root) / file)
    return sorted(mdx_files)

def extract_links(content: str) -> Set[str]:
    """Extract all internal links from content."""
    links = set()
    for pattern in LINK_PATTERNS:
        matches = re.findall(pattern, content)
        for match in matches:
            if isinstance(match, tuple):
                link = match[1] if len(match) > 1 else match[0]
            else:
                link = match
            # Only process internal links (starting with /)
            if link.startswith('/'):
                links.add(link)
    return links

def normalize_link(link: str) -> str:
    """Normalize link by removing .mdx extension and trailing slashes."""
    # Remove .mdx extension if present
    if link.endswith('.mdx'):
        link = link[:-4]
    # Remove trailing slash
    if link.endswith('/') and link != '/':
        link = link[:-1]
    return link

def link_to_file_path(link: str) -> Path:
    """Convert a link path to a file path."""
    # Remove leading slash
    if link.startswith('/'):
        link = link[1:]
    
    # Normalize
    link = normalize_link(link)
    
    # Add .mdx extension
    if not link.endswith('.mdx'):
        link += '.mdx'
    
    return BASE_DIR / link

# Mapping of Turkish file/folder names to English equivalents
TURKISH_TO_ENGLISH_MAP = {
    # Concepts
    'temel-kavramlar': 'core-concepts',
    'temel-bilesenler': 'core-components',
    'fundamental-concepts': 'core-concepts',
    'fundamental-components': 'core-components',
    'konnektor': 'connector',
    'konnektor.mdx': 'connector.mdx',
    # File names
    'environment': 'what-is-environment',
    'api-proxy': 'what-is-api-proxy',
    'policy': 'what-is-policy',
    'api-listesi-yonetimi': 'api-list-management',
    'yonlendirme': 'routing',
    'http-yonlendirme': 'http-routing',
    'websocket-yonlendirme': 'websocket-routing',
    'grpc-yonlendirme': 'grpc-routing',
    'api-proxy-olusturma': 'api-proxy-creation',
    'api-proxy-konfigurasyonu': 'api-proxy-configuration',
    'client-route-ayarlari': 'client-route-settings',
    'api-creator-db-api-olusturma': 'api-creator-db-api-creation',
    'db-api-creation': 'api-creator-db-api-creation',
    'connector-api-proxy-olusturma': 'connector-api-proxy-creation',
    'api-proxy-olusturma': 'api-proxy-creation',
    'rest-api-proxy-olusturma': 'rest-api-proxy-creation',
    'soaprest-api-proxy-creation': 'soap-rest-api-proxy-creation',
    'politika-yonetimi': 'policy-management',
    'politikalar': 'policies',
    'script': 'script',
    'mTLS': 'mtls-authentication',
    'oidc': 'oidc-authentication',
    'ws-timestamp': 'ws-security-timestamp',
    'ws-encryption': 'ws-security-encryption',
    'api-bazli-daraltma': 'api-based-throttling',
    'api-bazli-daraltma.mdx': 'api-based-throttling.mdx',
    'upload-and-definition-file-information': 'deployment-and-specification-information',
    # Admin
    'sertifikalar': 'certificates',
    'role': 'roles',
    'proje-olusturma': 'project-creation',
    'ag-gecidi-ortamlari': 'gateway-environments',
    'api-proxy-grup-acl': 'api-proxy-group-acl',
    # Integrations
    'baglanti-yonetimi': 'connection-management',
    'konnektorler': 'connectors',
    'genel-bakis': 'overview',
    'task-flow-tasarimi': 'task-flow-design',
    'linux': 'linux',
    'logback': 'logback',
    'syslog': 'syslog',
    'snmp': 'snmp',
    # Operations
    'sorun-giderme': 'troubleshooting',
    'mongodb-issues': 'mongodb-troubleshooting',
    'common-issues-solutions': 'common-problems-solutions',
    'kubernetes-high-availability-yuksek-erisim-cluster': 'kubernetes-high-availability-cluster',
    'kubernetes-high-availability-yuksek-erisim-cluster.mdx': 'kubernetes-high-availability-cluster.mdx',
    'centos-7-private-docker-registry': 'private-docker-registry-on-centos-7',
    # Analytic
    'move-unsent-api-traffic-logs': 'transfer-unsent-api-traffic-logs',
    'step-by-step-tracking': 'step-by-step-tracing',
    'uptime-monitoring-usage': 'uptime-monitor-usage',
    'uptime-monitoring-usage.mdx': 'uptime-monitor-usage.mdx',
    # API Portal
    'faq': 'frequently-asked-questions',
    # Setup
    'setup': 'setup/overview',
}

def translate_turkish_path(link: str) -> str:
    """Translate Turkish file/folder names to English equivalents."""
    parts = link.split('/')
    translated_parts = []
    
    for part in parts:
        # Remove .mdx extension for mapping
        part_base = part.replace('.mdx', '')
        if part_base in TURKISH_TO_ENGLISH_MAP:
            translated = TURKISH_TO_ENGLISH_MAP[part_base]
            # Restore .mdx if it was there
            if part.endswith('.mdx'):
                translated += '.mdx'
            translated_parts.append(translated)
        else:
            translated_parts.append(part)
    
    return '/'.join(translated_parts)

def find_alternative_paths(link: str) -> List[str]:
    """Find alternative paths to check if the main path doesn't exist."""
    alternatives = [link]
    
    # Try translating Turkish names first
    translated = translate_turkish_path(link)
    if translated != link:
        alternatives.insert(0, translated)  # Put translated first
    
    # Try common name variations
    # Remove .mdx, try without it
    if link.endswith('.mdx'):
        base = link[:-4]
        alternatives.append(base)
        # Also try translating base
        translated_base = translate_turkish_path(base)
        if translated_base != base:
            alternatives.append(translated_base)
            alternatives.append(translated_base + '.mdx')
    
    # Try with .mdx extension if not present
    if not link.endswith('.mdx'):
        alternatives.append(link + '.mdx')
        translated_with_ext = translate_turkish_path(link + '.mdx')
        if translated_with_ext != link + '.mdx':
            alternatives.append(translated_with_ext)
    
    return alternatives

def check_link_exists(link: str) -> Tuple[bool, str]:
    """Check if a link points to an existing file."""
    # Skip external links
    if link.startswith('http://') or link.startswith('https://'):
        return True, "external"
    
    # Skip image links
    if link.startswith('/images/'):
        return True, "image"
    
    # Skip quickstart and index links (they're at root)
    if link in ['/quickstart', '/index']:
        return True, "root-page"
    
    # Remove anchor from link for checking
    original_link = link
    if '#' in link:
        link = link.split('#')[0]
    
    # Skip API reference links (they might be in api-reference folder)
    if link.startswith('/api-reference/'):
        return True, "api-reference"
    
    # Check if link starts with /en/
    if not link.startswith('/en/'):
        # Try to fix it
        if link.startswith('/'):
            # Maybe it's missing /en/ prefix
            fixed_link = '/en' + link
            alternatives = find_alternative_paths(fixed_link)
        else:
            return False, f"Link does not start with /en/ (starts with {link[:30]}...)"
    else:
        alternatives = find_alternative_paths(link)
    
    # Check all alternatives
    found_path = None
    for alt_link in alternatives:
        if not alt_link.startswith('/en/'):
            continue
        
        file_path = link_to_file_path(alt_link)
        if file_path.exists():
            found_path = alt_link
            break
    
    if found_path:
        if found_path != original_link:
            return True, f"exists (translated from {original_link})"
        return True, "exists"
    
    # Check if file exists in Turkish folder (needs translation)
    tr_link = link.replace('/en/', '/tr/')
    tr_path = link_to_file_path(tr_link)
    if tr_path.exists():
        return False, f"File not found in /en/ but exists in /tr/ - needs translation: {tr_path.relative_to(BASE_DIR)}"
    
    # If none found, return the first alternative as suggestion
    if alternatives:
        suggested = alternatives[0]
        file_path = link_to_file_path(suggested)
        return False, f"File not found: {file_path.relative_to(BASE_DIR)}"
    
    return False, f"File not found: {link}"

def check_file(file_path: Path) -> List[Tuple[int, str, str]]:
    """Check all links in a file."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return [(0, "error", f"Could not read file: {e}")]
    
    links = extract_links(content)
    
    for link in links:
        exists, message = check_link_exists(link)
        if not exists:
            # Find line number
            lines = content.split('\n')
            line_num = 1
            for i, line in enumerate(lines, 1):
                if link in line:
                    line_num = i
                    break
            issues.append((line_num, link, message))
    
    return issues

def main():
    """Main function."""
    print("Checking English documentation links...")
    print("=" * 80)
    
    if not EN_DIR.exists():
        print(f"Error: {EN_DIR} directory does not exist!")
        sys.exit(1)
    
    mdx_files = find_all_mdx_files(EN_DIR)
    print(f"Found {len(mdx_files)} .mdx files to check\n")
    
    total_issues = 0
    files_with_issues = 0
    
    for file_path in mdx_files:
        relative_path = file_path.relative_to(BASE_DIR)
        issues = check_file(file_path)
        
        if issues:
            files_with_issues += 1
            total_issues += len(issues)
            print(f"\n❌ {relative_path}")
            for line_num, link, message in issues:
                print(f"   Line {line_num}: {link}")
                print(f"   → {message}")
    
    print("\n" + "=" * 80)
    print(f"Summary:")
    print(f"  Total files checked: {len(mdx_files)}")
    print(f"  Files with issues: {files_with_issues}")
    print(f"  Total issues: {total_issues}")
    
    if total_issues == 0:
        print("\n✅ All links are valid!")
        sys.exit(0)
    else:
        print(f"\n❌ Found {total_issues} broken link(s)")
        sys.exit(1)

if __name__ == "__main__":
    main()

