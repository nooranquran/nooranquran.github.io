"""Match timed ASR words to a text's sections; returns start second per section (None = not found).
usage: align.py text.json words.json out.json [ar|fa]"""
import json, re, sys, difflib

def norm(s):
    s = re.sub(r'[ً-ٰٟـۖ-ۭ‌]', '', s)
    s = re.sub('[أإآٱا]', 'ا', s); s = re.sub('[ىيی]', 'ي', s)
    s = s.replace('ة', 'ه').replace('ک', 'ك').replace('ؤ', 'و').replace('ئ', 'ي').replace('ء', '')
    return re.sub(r'[^ء-يپچژگ]', '', s)

def _sim(a, b):
    if a == b: return 2.0
    if len(a) > 2 and len(b) > 2 and (a[:3] == b[:3] or a[-3:] == b[-3:]): return 1.0
    return -1.0

def align(sections, words, field='ar'):
    """Word-level global alignment (Needleman-Wunsch) of the text against the ASR words;
    a section starts at the first ASR word matched to one of its first words."""
    import numpy as np
    ref, sec_of = [], []
    for i, s in enumerate(sections):
        if not s.get('ar'): continue
        for w in (s.get(field) or '').split():
            n = norm(w)
            if n: ref.append(n); sec_of.append(i)
    hyp = [(a, norm(w)) for a, b, w in words if norm(w)]
    R, H = len(ref), len(hyp)
    if not R or not H: return [None] * len(sections), 0.0
    G = -0.6
    S = np.zeros((R + 1, H + 1), np.float32); P = np.zeros((R + 1, H + 1), np.int8)
    S[:, 0] = np.arange(R + 1) * G; S[0, :] = 0  # leading ASR words (intro, basmala) are free
    P[1:, 0] = 1; P[0, 1:] = 2
    hw = [h for _, h in hyp]
    for i in range(1, R + 1):
        r = ref[i - 1]; prev = S[i - 1]; cur = S[i]
        sims = np.fromiter((_sim(r, h) for h in hw), np.float32, H)
        diag = prev[:-1] + sims; up = prev[1:] + G
        best = np.maximum(diag, up); p = np.where(diag >= up, 0, 1).astype(np.int8)
        # left moves (skip ASR word) need a sequential pass
        for j in range(1, H + 1):
            v = best[j - 1]; l = cur[j - 1] + (0 if i == R else G)
            if l > v: cur[j] = l; P[i, j] = 2
            else: cur[j] = v; P[i, j] = p[j - 1]
    i, j, pair = R, H, {}
    while i > 0 and j > 0:
        m = P[i, j]
        if m == 0:
            if _sim(ref[i - 1], hw[j - 1]) > 0: pair[i - 1] = j - 1
            i -= 1; j -= 1
        elif m == 1: i -= 1
        else: j -= 1
    t, first = [None] * len(sections), {}
    for k, sec in enumerate(sec_of): first.setdefault(sec, k)
    count = {}
    for k, sec in enumerate(sec_of): count[sec] = count.get(sec, 0) + 1
    for sec, k0 in first.items():
        span = range(k0, min(k0 + max(4, int(count[sec] * 0.4)), k0 + count[sec]))
        hits = [k for k in span if k in pair]
        # trust a start only when at least two of its opening words were heard (one for very short sections)
        if len(hits) >= min(2, len(span)):
            k = hits[0]; t[sec] = round(max(0.0, hyp[pair[k]][0] - (k - k0) * 0.35), 1)
    last = -1
    for i, v in enumerate(t):
        if v is not None and v < last: t[i] = None
        elif v is not None: last = v
    return t, len(pair) / R

if __name__ == '__main__':
    txt = json.load(open(sys.argv[1])); words = json.load(open(sys.argv[2]))
    t, ratio = align(txt['sections'], words, sys.argv[4] if len(sys.argv) > 4 else 'ar')
    print('matched', round(ratio, 3))
    for i, (s, v) in enumerate(zip(txt['sections'], t)): print(i, v, (s.get('ar') or s.get('h') or '')[:50])
    json.dump(t, open(sys.argv[3], 'w'))
