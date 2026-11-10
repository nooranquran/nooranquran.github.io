import json, glob, hashlib, os, sys, difflib, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from align import align, norm
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '')
files = json.load(open('files.json')); idx = {}; report = []
def cov(ref, hyp): return sum(n for *_, n in difflib.SequenceMatcher(None, ref, hyp, autojunk=False).get_matching_blocks())
for f in sorted(glob.glob(R + 'chelleh/*.json') + glob.glob(R + 'books/mafatih/[0-9]*.json')):
    d = json.load(open(f))
    if not isinstance(d, dict) or not d.get('audio') or not d.get('sections'): continue
    key = f[len(R):-5] if '/mafatih/' in f else d['key']
    for a in d['audio']:
        u = a['url']; lang = 'fa' if 'ترجمه فارسی' in a['name'] else 'ar'; h = hashlib.sha1(u.encode()).hexdigest()[:10]
        best = None
        for wf in (f'words/{h}.{lang}.json', f'words2/{h}.{lang}.json'):
            if not os.path.exists(wf): continue
            w = json.load(open(wf)); hyp = ''.join(norm(x[2]) for x in w)
            ref = ''.join(norm(s.get(lang) or '') for s in d['sections'] if s.get('ar'))
            hc = cov(ref, hyp) / len(hyp) if len(hyp) > 30 else 0
            t, ratio = align(d['sections'], w, lang)
            got = sum(v is not None for v in t)
            if not best or (hc, got) > (best[0], best[2]): best = (hc, t, got, ratio)
        n = sum(1 for s in d['sections'] if s.get('ar'))
        import math
        ok = best and ((best[0] >= (0.4 if lang == 'fa' else 0.6) and best[2] >= min(3, math.ceil(0.6 * n))) or (best[0] >= 0.55 and best[2] >= 0.8 * n))
        report.append(dict(key=key, title=d['title'], name=a['name'], url=u, hc=round(best[0], 2) if best else None, got=best[2] if best else 0, n=n, ok=bool(ok)))
        if ok:
            name = re.sub(r'[^a-z0-9]+', '-', key.replace('books/mafatih/', 'm')) + '-' + h[:6]
            json.dump({'t': best[1]}, open(R + f'audio/sync/{name}.json', 'w'), separators=(',', ':'))
            idx[f'{key}|{u}'] = name
json.dump(idx, open(R + 'audio/sync/index.json', 'w'), ensure_ascii=False, indent=0, sort_keys=True)
json.dump(report, open('final-report.json', 'w'), ensure_ascii=False, indent=1)
print('synced', len(idx), 'of', len(report))
for r in report:
    if not r['ok']: print('NO', r['hc'], f"{r['got']}/{r['n']}", r['key'], r['title'], r['name'])
