import json, re, sys, difflib
# usage: align.py text.json words.json out.json
txt = json.load(open(sys.argv[1])); words = json.load(open(sys.argv[2]))
def norm(s):
    s = re.sub(r'[ً-ٰٟـۖ-ۭ]', '', s)
    s = re.sub('[أإآٱا]', 'ا', s); s = re.sub('[ىيی]', 'ي', s); s = s.replace('ة','ه').replace('ک','ك').replace('ؤ','و').replace('ئ','ي').replace('ء','')
    return re.sub(r'[^ء-ي]', '', s)
ref, starts = '', []
for s in txt['sections']:
    starts.append(len(ref) if s.get('ar') else None)
    ref += norm(s.get('ar', ''))
hyp, ht = '', []
for a, b, w in words:
    n = norm(w); hyp += n; ht += [a + (b - a) * k / max(1, len(n)) for k in range(len(n))]
sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
r2h = {}
for i, j, n in sm.get_matching_blocks():
    for k in range(n): r2h[i + k] = j + k
print('ref', len(ref), 'hyp', len(hyp), 'matched', round(len(r2h) / len(ref), 3))
t = []
for idx, p in enumerate(starts):
    if p is None: t.append(None); continue
    end = starts[idx + 1] if idx + 1 < len(starts) and starts[idx + 1] is not None else len(ref)
    # first matched char within the first part of the section (needs a run of 3 matches to be trusted)
    hit = None
    for q in range(p, end):
        if all(q + d in r2h and r2h[q + d] == r2h[q] + d for d in range(3)): hit = q; break
    t.append(round(ht[r2h[hit]] - (hit - p) * 0.06, 1) if hit is not None else None)
# keep monotonic; drop out-of-order
last = -1
for i, v in enumerate(t):
    if v is not None and v < last: t[i] = None
    elif v is not None: last = v
for i, (s, v) in enumerate(zip(txt['sections'], t)): print(i, v, (s.get('ar') or s.get('h') or '')[:50])
json.dump(t, open(sys.argv[3], 'w'))
