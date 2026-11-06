#!/usr/bin/env python3
# فهرست فایل‌های «استفاده بدون اینترنت» (offline.json) را از روی همین مخزن می‌سازد.
# هر «بسته» فهرست فایل‌ها و حجمش را دارد؛ offline.js و sw.js با همین فهرست، فایل‌ها را روی گوشی ذخیره یا پاک می‌کنند.
# پس از افزودن یا برداشتن متن (قرآن، کتاب، چله، ترجمه، تفسیر) یا فایل اسکریپت، دوباره اجرا کنید:
#   python3 tools/make-offline-list.py
# صوت‌ها (audio/) عمداً در هیچ بسته‌ای نیستند.
import gzip, hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

FA_TR = {'ansarian', 'ayati', 'bahrampour', 'fooladvand', 'gharaati', 'ghomshei', 'khorramdel', 'khorramshahi',
         'moezzi', 'mojtabavi', 'riaei', 'sadeqi', 'safavi'}


def walk(d):
    out = []
    for base, dirs, files in os.walk(d):
        dirs.sort()
        for f in sorted(files):
            if f.endswith(('.md', '.txt', '.py')):
                continue
            out.append(os.path.join(base, f).replace(os.sep, '/'))
    return out


def core():
    files = [f for f in sorted(os.listdir('.')) if os.path.isfile(f) and (
        f.endswith(('.js', '.css', '.woff2', '.json', '.webmanifest')) or f in ('index.html', 'icon-192.png', 'icon-badge.png', 'quran-logo.png'))
        and f not in ('offline.json', 'sw.js')]
    files = ['./'] + files + walk('bg')
    files += ['quran/index.json', 'quran/search.json', 'quran/razavi.json', 'quran/aghaei.json', 'quran/uthmanic-hafs.woff2']
    files += walk('quran/p') + walk('quran/intro')
    files += [f for f in walk('books') if f.count('/') == 1]
    for b in sorted(os.listdir('books')):
        if os.path.isdir(f'books/{b}') and b not in ('atiq', 'jadid'):
            files += [f for f in walk(f'books/{b}') if f'books/{b}/tr/' not in f]
    files += [f for f in walk('chelleh') if f != 'chelleh/live.json']
    return files


def other_tr():
    files = [f for f in walk('quran/t') if f.split('/')[2] not in FA_TR]
    for b in sorted(os.listdir('books')):
        if os.path.isdir(f'books/{b}/tr') and b not in ('atiq', 'jadid'):
            files += walk(f'books/{b}/tr')
    return files


PACKS = [
    ('core', 'متن قرآن، دعاها، کتاب‌ها و خود برنامه', 'قرآن کامل با ترجمه مکارم، جستجو، مفاتیح، صحیفه، نهج‌البلاغه، منتهی‌الآمال، متن چله‌ها', core),
    ('tr-fa', 'ترجمه‌های فارسی دیگر قرآن', 'انصاریان، فولادوند، الهی قمشه‌ای، خرمشاهی و ۹ ترجمه دیگر',
     lambda: [f for f in walk('quran/t') if f.split('/')[2] in FA_TR]),
    ('tafsir-noor', 'تفسیر نور', 'حجت‌الاسلام محسن قرائتی', lambda: walk('quran/tafsir-noor')),
    ('tafsir', 'تفسیر نمونه', 'آیت‌الله مکارم شیرازی و جمعی از نویسندگان', lambda: walk('quran/tafsir')),
    ('tr-other', 'ترجمه‌های زبان‌های دیگر', 'ترجمه‌های انگلیسی، عربی و زبان‌های دیگر قرآن و کتاب‌ها', other_tr),
    ('bible', 'تورات و انجیل', 'عهد عتیق و عهد جدید با ترجمه‌ها', lambda: walk('books/atiq') + walk('books/jadid')),
]


def main():
    out, sig = {'packs': []}, hashlib.sha1()
    for pid, title, sub, fn in PACKS:
        files = fn()
        raw = gz = 0
        for f in files:
            if f == './':
                f = 'index.html'
            data = open(f, 'rb').read()
            raw += len(data)
            gz += len(gzip.compress(data, 6))
            sig.update(f.encode() + hashlib.sha1(data).digest())
        out['packs'].append({'id': pid, 'title': title, 'sub': sub, 'download': gz, 'size': raw, 'files': files})
        print(f'{pid:12} {len(files):6} files  download {gz/1e6:5.1f} MB  on phone {raw/1e6:6.1f} MB', file=sys.stderr)
    out['v'] = sig.hexdigest()[:12]
    with open('offline.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')


if __name__ == '__main__':
    main()
