"""
Smart Excel/CSV import – auto-detects column meanings.
Maps common header variations to our fields.
"""
import re
import pandas as pd
from typing import Dict, List, Tuple, Optional

# Known header patterns → field name
COLUMN_MAP = {
    'full_name': [
        r'^full[_\s-]?name$', r'^name$', r'^contact[_\s-]?name$', r'^customer[_\s-]?name$',
        r'^client[_\s-]?name$', r'^fullname$', r'^first[_\s-]?last$', r'^display[_\s-]?name$'
    ],
    'email': [
        r'^e[_\s-]?mail$', r'^email[_\s-]?address$', r'^mail$', r'^emailid$', r'^e-mail$'
    ],
    'phone': [
        r'^phone$', r'^mobile$', r'^cell$', r'^telephone$', r'^phone[_\s-]?number$',
        r'^mobile[_\s-]?number$', r'^contact[_\s-]?number$', r'^tel$', r'^ph$'
    ],
    'home_address': [
        r'^home[_\s-]?address$', r'^address$', r'^residential[_\s-]?address$',
        r'^street[_\s-]?address$', r'^full[_\s-]?address$', r'^location$', r'^addr$'
    ],
    'is_subscribed': [
        r'^is[_\s-]?subscribed$', r'^subscribed$', r'^subscription$', r'^opt[_\s-]?in$',
        r'^marketing[_\s-]?consent$', r'^newsletter$', r'^active$'
    ],
    'first_name': [r'^first[_\s-]?name$', r'^fname$', r'^given[_\s-]?name$'],
    'last_name': [r'^last[_\s-]?name$', r'^lname$', r'^surname$', r'^family[_\s-]?name$'],
}


def normalize_header(h: str) -> str:
    return re.sub(r'[^a-z0-9]', '', str(h).lower().strip())


def detect_columns(df: pd.DataFrame) -> Dict[str, str]:
    """
    Returns mapping: our_field -> actual_column_name_in_df
    """
    mapping = {}
    headers = {col: normalize_header(col) for col in df.columns}

    for field, patterns in COLUMN_MAP.items():
        for col, norm in headers.items():
            for pat in patterns:
                if re.match(pat.replace(r'[_\s-]?', ''), norm) or re.search(pat, str(col).lower()):
                    if field not in mapping:
                        mapping[field] = col
                    break

    # Combine first + last if full_name missing
    if 'full_name' not in mapping and 'first_name' in mapping:
        mapping['full_name'] = '__combine_name__'

    return mapping


def smart_read_file(file) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """
    Read CSV (comma-separated) or Excel and auto-detect columns.
    CSV is preferred for imports.
    """
    name = getattr(file, 'name', '').lower()
    if name.endswith('.csv') or name.endswith('.txt'):
        # Try UTF-8 first, then latin-1; comma delimiter
        try:
            df = pd.read_csv(file, encoding='utf-8', sep=',')
        except UnicodeDecodeError:
            file.seek(0)
            df = pd.read_csv(file, encoding='latin-1', sep=',')
        except Exception:
            file.seek(0)
            # Auto-detect delimiter (comma, semicolon, tab)
            df = pd.read_csv(file, encoding='utf-8', sep=None, engine='python')
    else:
        df = pd.read_excel(file)

    # Strip whitespace from headers
    df.columns = [str(c).strip() for c in df.columns]

    # Clean empty columns/rows
    df = df.dropna(how='all', axis=1).dropna(how='all', axis=0)
    mapping = detect_columns(df)
    return df, mapping


def row_to_subscriber_data(row, mapping: Dict[str, str]) -> Optional[dict]:
    def get(field, default=''):
        col = mapping.get(field)
        if not col:
            return default
        if col == '__combine_name__':
            first = str(row.get(mapping.get('first_name', ''), '') or '').strip()
            last = str(row.get(mapping.get('last_name', ''), '') or '').strip()
            return f'{first} {last}'.strip()
        val = row.get(col, default)
        if pd.isna(val):
            return default
        return str(val).strip()

    email = get('email').lower()
    if not email or '@' not in email:
        return None

    full_name = get('full_name') or email.split('@')[0].replace('.', ' ').title()

    sub_raw = get('is_subscribed', 'true').lower()
    is_subscribed = sub_raw in ('true', '1', 'yes', 'y', 'active', 'subscribed', 'opt-in')

    return {
        'full_name': full_name,
        'email': email,
        'phone': get('phone'),
        'home_address': get('home_address'),
        'is_subscribed': is_subscribed,
        'source': 'import',
    }
