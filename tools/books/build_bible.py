# «دیگر کتب مقدس»: عهد عتیق (books/atiq) و عهد جدید (books/jadid) از متن‌های آزاد eBible.org.
# متن اصلی هر آیه ترجمه قدیم فارسی (۱۸۹۵، مالکیت عمومی) است و زیر آن ترجمه‌ای که خواننده برگزیده:
#   فارسی معاصر Biblica (CC BY-SA 4.0، در خود فایل باب)، و در فایل‌های جدا (books/<کتاب>/tr/<مترجم>/<بخش>/<باب>.json):
#   متن عبری (کدکس لنینگراد وست‌مینستر، مالکیت عمومی) یا یونانی (SBLGNT، CC BY 4.0)، عربی ون‌دایک (مالکیت عمومی)،
#   انگلیسی World English Bible و King James (هر دو مالکیت عمومی).
# همه آیه‌ها به شماره‌گذاری رایج ترجمه‌های فارسی و انگلیسی (KJV) هم‌تراز شده‌اند؛ متن عبری که شماره‌گذاری دیگری دارد
# (مثل عنوان مزمورها، ملاکی ۴، یوئیل ۳) با جدول VerseMap.xml پروژه OpenScriptures (morphhb) جابه‌جا می‌شود.
#
# استفاده: python3 tools/books/build_bible.py <پوشه منبع>
#   پوشه منبع: <id>/<id>_vpl.txt از https://ebible.org/Scriptures/<id>_vpl.zip برای
#   pesOPV pesopcb hebwlc grcsbl arb-vd engwebp eng-kjv2006، و pesopcb_usfm/ از pesopcb_usfm.zip (عنوان باب‌ها)،
#   و VerseMap.xml از github.com/openscriptures/morphhb/blob/master/wlc/VerseMap.xml
import collections, glob, json, os, re, shutil, sys

SRC = sys.argv[1]
OUT = 'books'

# [کد eBible، شناسه بخش (فقط حروف لاتین، برای پیوند ?book=atiq&n=gen-1)، نام فارسی، OSIS، گروه]
OT = [
 ('GEN','gen','پیدایش','Gen','تورات (اسفار پنج‌گانه موسی)'),('EXO','exo','خروج','Exod','تورات (اسفار پنج‌گانه موسی)'),
 ('LEV','lev','لاویان','Lev','تورات (اسفار پنج‌گانه موسی)'),('NUM','num','اعداد','Num','تورات (اسفار پنج‌گانه موسی)'),
 ('DEU','deu','تثنیه','Deut','تورات (اسفار پنج‌گانه موسی)'),
 ('JOS','jos','یوشع','Josh','کتاب‌های تاریخی'),('JDG','jdg','داوران','Judg','کتاب‌های تاریخی'),('RUT','rut','روت','Ruth','کتاب‌های تاریخی'),
 ('1SA','sama','اول سموئیل','1Sam','کتاب‌های تاریخی'),('2SA','samb','دوم سموئیل','2Sam','کتاب‌های تاریخی'),
 ('1KI','kina','اول پادشاهان','1Kgs','کتاب‌های تاریخی'),('2KI','kinb','دوم پادشاهان','2Kgs','کتاب‌های تاریخی'),
 ('1CH','chra','اول تواریخ','1Chr','کتاب‌های تاریخی'),('2CH','chrb','دوم تواریخ','2Chr','کتاب‌های تاریخی'),
 ('EZR','ezr','عزرا','Ezra','کتاب‌های تاریخی'),('NEH','neh','نحمیا','Neh','کتاب‌های تاریخی'),('EST','est','استر','Esth','کتاب‌های تاریخی'),
 ('JOB','job','ایوب','Job','کتاب‌های حکمت و شعر'),('PSA','psa','مزامیر (زبور)','Ps','کتاب‌های حکمت و شعر'),
 ('PRO','pro','امثال سلیمان','Prov','کتاب‌های حکمت و شعر'),('ECC','ecc','جامعه','Eccl','کتاب‌های حکمت و شعر'),
 ('SOL','sol','غزل غزل‌های سلیمان','Song','کتاب‌های حکمت و شعر'),
 ('ISA','isa','اشعیا','Isa','کتاب‌های پیامبران'),('JER','jer','ارمیا','Jer','کتاب‌های پیامبران'),('LAM','lam','مراثی ارمیا','Lam','کتاب‌های پیامبران'),
 ('EZE','eze','حزقیال','Ezek','کتاب‌های پیامبران'),('DAN','dan','دانیال','Dan','کتاب‌های پیامبران'),('HOS','hos','هوشع','Hos','کتاب‌های پیامبران'),
 ('JOE','joe','یوئیل','Joel','کتاب‌های پیامبران'),('AMO','amo','عاموس','Amos','کتاب‌های پیامبران'),('OBA','oba','عوبدیا','Obad','کتاب‌های پیامبران'),
 ('JON','jon','یونس','Jonah','کتاب‌های پیامبران'),('MIC','mic','میکاه','Mic','کتاب‌های پیامبران'),('NAH','nah','ناحوم','Nah','کتاب‌های پیامبران'),
 ('HAB','hab','حبقوق','Hab','کتاب‌های پیامبران'),('ZEP','zep','صفنیا','Zeph','کتاب‌های پیامبران'),('HAG','hag','حجی','Hag','کتاب‌های پیامبران'),
 ('ZEC','zec','زکریا','Zech','کتاب‌های پیامبران'),('MAL','mal','ملاکی','Mal','کتاب‌های پیامبران')]
NT = [
 ('MAT','mat','انجیل متی','','انجیل‌ها'),('MAR','mar','انجیل مرقس','','انجیل‌ها'),('LUK','luk','انجیل لوقا','','انجیل‌ها'),('JOH','joh','انجیل یوحنا','','انجیل‌ها'),
 ('ACT','act','اعمال رسولان','','اعمال رسولان'),
 ('ROM','rom','رومیان','','نامه‌های پولس'),('1CO','cora','اول قرنتیان','','نامه‌های پولس'),('2CO','corb','دوم قرنتیان','','نامه‌های پولس'),
 ('GAL','gal','غلاطیان','','نامه‌های پولس'),('EPH','eph','افسسیان','','نامه‌های پولس'),('PHI','phi','فیلیپیان','','نامه‌های پولس'),
 ('COL','col','کولسیان','','نامه‌های پولس'),('1TH','thea','اول تسالونیکیان','','نامه‌های پولس'),('2TH','theb','دوم تسالونیکیان','','نامه‌های پولس'),
 ('1TI','tima','اول تیموتائوس','','نامه‌های پولس'),('2TI','timb','دوم تیموتائوس','','نامه‌های پولس'),('TIT','tit','تیتوس','','نامه‌های پولس'),
 ('PHM','phm','فلیمون','','نامه‌های پولس'),
 ('HEB','heb','عبرانیان','','نامه‌های دیگر'),('JAM','jam','یعقوب','','نامه‌های دیگر'),('1PE','peta','اول پطرس','','نامه‌های دیگر'),
 ('2PE','petb','دوم پطرس','','نامه‌های دیگر'),('1JO','joha','اول یوحنا','','نامه‌های دیگر'),('2JO','johb','دوم یوحنا','','نامه‌های دیگر'),
 ('3JO','johc','سوم یوحنا','','نامه‌های دیگر'),('JUD','jud','یهودا','','نامه‌های دیگر'),
 ('REV','rev','مکاشفه یوحنا','','مکاشفه')]

RLM = '\u200f'
def vpl(tid):
    """{(book, ch, v): text} و برای ترجمه‌هایی که چند آیه را با هم آورده‌اند (‎5:3‏‎ یعنی ۳ تا آیه پیش از بعدی) bridged."""
    d, bridged = {}, set()
    for line in open(f'{SRC}/{tid}/{tid}_vpl.txt', encoding='utf-8-sig'):
        line = line.rstrip('\n')
        if not line.strip(): continue
        b, ref, txt = (line.split(' ', 2) + [''])[:3]
        if ref.endswith(RLM): bridged.add((b, *map(int, ref[:-1].split(':')))); ref = ref[:-1]
        c, v = map(int, ref.split(':'))
        d[(b, c, v)] = txt.strip()
    return d, bridged

fa_d = lambda n: str(n).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

# ---------- ترجمه قدیم: پاک‌سازی ----------
WORD = re.compile(r'[\u0621-\u064A\u0670-\u06D3\u200c]+')
SUF = set('ها های هایی هایش هایشان هایت ای ی یم ید ند م ت ش مان تان شان اند ام ات اش ان گان ست است تر ترین ستان وار مند یی'.split())
def build_glue(opv, opcb):
    """در نسخه دیجیتال ترجمه قدیم بسیاری از فاصله‌ها (جای شکستن سطر در چاپ) افتاده‌اند: «خداروشنایی»، «آبهارا».
    واژه‌ای که در کل ترجمه قدیم کمتر از ۴ بار و در ترجمه معاصر هیچ‌بار نیامده و از دو واژه پرکاربرد (هرکدام دست‌کم ۴۰ بار)
    ساخته می‌شود که اولی به حرف نچسب (ا د ذ ر ز ژ و) تمام می‌شود، از هم جدا می‌شود."""
    c_opv = collections.Counter(w for t in opv.values() for w in WORD.findall(t))
    c_opcb = collections.Counter(w for t in opcb.values() for w in WORD.findall(t))
    allc = c_opv + c_opcb
    fix = {}
    for t, n in c_opv.items():
        if c_opcb[t] or n > 3 or len(t) < 4 or '\u200c' in t: continue
        best = None
        for i in range(1, len(t)):
            a, b = t[:i], t[i:]
            if a[-1] not in 'اآأدذرزژو' or b in SUF: continue
            if a in ('بر', 'در', 'فرا', 'وا') and b[0] in 'نمب': continue  # پیشوند فعل: «برنداشته»، «درنیامد»
            fa_, fb = (10**6 if a == 'و' else allc[a]), allc[b]
            if fa_ >= 40 and fb >= 40 and (not best or min(fa_, fb) > best[0]): best = (min(fa_, fb), a, b)
        if best: fix[t] = best[1] + ' ' + best[2]
    return fix

def clean_opv(t, glue):
    t = t.replace('ي', 'ی').replace('§', '').replace('´', '').replace('انحیر', 'انجیر')
    return WORD.sub(lambda m: glue.get(m.group(0), m.group(0)), t)

def clean(tid, t):
    if tid == 'grcsbl':  # نشانه‌های دستگاه نسخه‌بدل (⸀⸂⸃…) و برچسب‌های قالب‌بندی
        t = re.sub(r'‘[^’]*/[^’]*’', '', t); t = re.sub('[⸀⸁⸂⸃⸄⸅]', '', t)
    if tid == 'eng-kjv2006':  # [ ] واژه‌های افزوده مترجم (در چاپ: کج) و ¶ نشان بند
        t = t.replace('¶', '').replace('[', '').replace(']', '')
    return re.sub(r'\s+', ' ', t).strip()

# ---------- عبری: شماره‌گذاری لنینگراد → KJV ----------
def hebrew_kjv(heb):
    osis = {o[3]: o[0] for o in OT}
    m = {}
    for w, k in re.findall(r'wlc="([^"]+)" kjv="([^"]+)"', open(f'{SRC}/VerseMap.xml', encoding='utf-8').read()):
        w = w.split('!')[0]; k = k.split('!')[0]
        wb, wc, wv = w.split('.'); kb, kc, kv = k.split('.')
        m.setdefault((osis[wb], int(wc), int(wv)), (osis[kb], int(kc), int(kv)))
    out = {}
    for key in sorted(heb, key=lambda x: ([o[0] for o in OT].index(x[0]), x[1], x[2])):
        to = m.get(key, key)
        out[to] = (out[to] + ' ' + heb[key]) if to in out else heb[key]  # عنوان مزمور (آیه ۱ عبری) به آیه ۱ می‌چسبد
    return out

# ---------- عنوان باب‌ها از ترجمه معاصر (\s1 نخست هر باب) ----------
def headings():
    files = sorted(glob.glob(f'{SRC}/pesopcb_usfm/*.usfm'))
    files = [f for f in files if re.match(r'\d\d-', os.path.basename(f)) and int(os.path.basename(f)[:2]) >= 2]
    codes = [o[0] for o in OT + NT]
    assert len(files) == 66, len(files)
    h = {}
    for code, f in zip(codes, files):
        c = 0
        for line in open(f, encoding='utf-8-sig'):
            mm = re.match(r'\\c (\d+)', line)
            if mm: c = int(mm.group(1)); continue
            mm = re.match(r'\\(s1?|d) (.+)', line)
            if c and mm and ((code, c) not in h or h[(code, c)][0] == 'd' and mm.group(1) != 'd'):
                if (code, c) in h and h[(code, c)][0] != 'd': continue
                t = re.sub(r'\\f .*?\\f\*|\\x .*?\\x\*', '', mm.group(2)); t = re.sub(r'\\[a-z0-9]+\*? ?', '', t)
                t = re.sub(r'\s+', ' ', t.replace(RLM, '')).strip()
                if mm.group(1) == 'd' and len(t) > 48: t = t[:46].rsplit(' ', 1)[0] + '…'
                h[(code, c)] = (mm.group(1)[0], t)
    return {k: v[1] for k, v in h.items()}

# ---------- ترجمه قدیم: شماره آیه‌های جابه‌جا ----------
# در نسخه دیجیتال ترجمه قدیم چند باب شماره‌گذاری‌اش با ترجمه‌های دیگر نمی‌خواند: دو آیه در یک شماره آمده، آیه‌ای
# دو تکه شده یا آیه‌ای افتاده و بقیه یکی جابه‌جا شده‌اند. این باب‌ها یکی‌یکی با متن انگلیسی و عربی مقایسه و این‌جا
# ثبت شدند: شماره آیه در ترجمه قدیم -> آیه (یا آیه‌های) همان متن در شماره‌گذاری رایج. بقیه آیه‌ها همان شماره را دارند.
def _sh(a, b, d): return {v: [v + d] for v in range(a, b + 1)}
REMAP = {
 ('GEN', 15): {19: [19, 20], 20: [21]},
 ('GEN', 21): _sh(29, 33, 1),                       # آیه ۲۹ (پرسش ابی‌ملک) در نسخه دیجیتال نیامده
 ('EXO', 29): {36: [36], 37: [36], **_sh(38, 47, -1)},
 ('1SA', 8): {21: [21, 22]},
 ('2SA', 24): {22: [22, 23], 23: [24], 24: [25]},
 ('1KI', 10): {9: [9], 10: [9], **_sh(11, 16, -1), 17: [16, 17]},
 ('2CH', 14): {7: [7], 8: [7], **_sh(9, 16, -1)},
 ('PSA', 68): {33: [33], 34: [33], 35: [34], 36: [35]},
 ('PSA', 72): {19: [19, 20]},
 ('PSA', 94): {4: [4, 5], **_sh(5, 22, 1)},
 ('ISA', 45): {24: [24, 25]},
 ('EZE', 6): {4: [4, 5], **_sh(5, 13, 1)},
 ('EZE', 25): {4: [4, 5]},
 ('DAN', 6): {1: [('DAN', 5, 31)], **_sh(2, 29, -1)},  # ترجمه قدیم دانیال ۵:۳۱ را مثل متن آرامی ۶:۱ شمرده
 ('MAT', 2): {17: [17, 18], **_sh(18, 22, 1)},
 ('MAT', 9): {37: [37, 38]},
 ('JOH', 5): _sh(4, 46, 1),                         # آیه ۴ (فرشته و حرکت آب) در نسخه دیجیتال نیامده
 ('JOH', 7): {52: [52, 53]},
 ('ROM', 16): _sh(24, 26, 1),                       # آیه ۲۴ در نسخه دیجیتال نیامده
 ('PHI', 1): {29: [29, 30]},
 ('1JO', 3): {22: [22, 23], 23: [24]},
 ('3JO', 1): {6: [6, 7], **_sh(7, 12, 1), 13: [14], 14: [14]},
 ('REV', 15): {8: [8], 9: [8]},
}
def remap_opv(opv):
    """{کلید رایج: متن} و spans: {(کتاب، باب، آیه نخست): آیه آخر} برای آیه‌هایی که در ترجمه قدیم یکی شده‌اند."""
    out, spans = {}, {}
    for (b, c, v) in sorted(opv, key=lambda k: (k[0], k[1], k[2])):
        t = opv[(b, c, v)]
        tg = REMAP.get((b, c), {}).get(v, [v])
        tg = [x if isinstance(x, tuple) else (b, c, x) for x in tg]
        k = tg[0]
        out[k] = (out[k] + ' ' + t).strip() if k in out else t
        if len(tg) > 1: spans[k] = tg[-1][2]
    return out, spans

def dump(o, f):
    os.makedirs(os.path.dirname(f), exist_ok=True)
    with open(f, 'w', encoding='utf-8') as fh: json.dump(o, fh, ensure_ascii=False, separators=(',', ':'))

def main():
    opv, _ = vpl('pesOPV'); opcb, opcb_br = vpl('pesopcb')
    glue = build_glue(opv, opcb)
    opv = {k: clean_opv(v, glue) for k, v in opv.items()}
    opv, spans = remap_opv(opv)
    # یادداشت نسخه دیجیتال درباره مزمور ۱۲۱:۱ از متن جدا و یادداشت آیه می‌شود.
    notes = {}
    for k, v in opv.items():
        mm = re.search(r'\s*\[\*(.+?)\]\s*$', v)
        if mm: opv[k] = v[:mm.start()].strip(); notes[k] = 'یادداشت نسخه دیجیتال ترجمه قدیم: ' + mm.group(1).strip()
    others = {t: {k: clean(t, v) for k, v in vpl(t)[0].items()} for t in ('hebwlc', 'grcsbl', 'arb-vd', 'engwebp', 'eng-kjv2006')}
    others['hebwlc'] = hebrew_kjv(others['hebwlc'])
    heads = headings()
    print('glue fixes:', len(glue))

    SRC_TXT = ('متن اصلی: «ترجمه قدیم» کتاب مقدس فارسی (۱۸۹۵ میلادی، ترجمه رابرت بروس و همکاران، چاپ انجمن کتاب مقدس بریتانیا)، مالکیت عمومی (Public Domain)، از ebible.org/pesOPV. '
               'در نسخه دیجیتال بسیاری از فاصله‌های میان واژه‌ها افتاده بود که به‌طور خودکار درست شد. '
               'ترجمه معاصر: Biblica® Open Persian Contemporary Bible 2022، © 1995، 2005، 2018، 2022 Biblica, Inc.، با مجوز CC BY-SA 4.0 (متن تغییرنیافته؛ نسخه رایگان در biblica.com و open.bible)؛ عنوان باب‌ها هم از همین ترجمه است. ')
    BOOKS = {
      'atiq': dict(title='عهد عتیق', parts=OT, orig=('hebwlc', 'he', 'متن عبری (کدکس لنینگراد)'),
                   about='کتاب مقدس یهودیان و بخش نخست کتاب مقدس مسیحیان (تَنَخ): تورات (پنج سِفر موسی)، کتاب‌های تاریخی، مزامیر داود (زبور) و کتاب‌های حکمت، و کتاب‌های پیامبران؛ ۳۹ کتاب.',
                   src=SRC_TXT + 'متن عبری: Westminster Leningrad Codex (مؤسسه عبری وست‌مینستر)، مالکیت عمومی، از ebible.org/hebwlc؛ شماره آیه‌ها با جدول VerseMap پروژه OpenScriptures (morphhb) به شماره‌گذاری ترجمه‌ها برگردانده شده. '),
      'jadid': dict(title='عهد جدید', parts=NT, orig=('grcsbl', 'grc', 'متن یونانی (SBLGNT)'),
                   about='بخش دوم کتاب مقدس مسیحیان: چهار انجیل (متی، مرقس، لوقا و یوحنا)، اعمال رسولان، نامه‌ها و مکاشفه یوحنا؛ ۲۷ کتاب.',
                   src=SRC_TXT + 'متن یونانی: The Greek New Testament: SBL Edition، © 2010 Society of Biblical Literature و Logos Bible Software، با مجوز CC BY 4.0 (نشانه‌های نسخه‌بدل حذف شده)، از ebible.org/grcsbl. '),
    }
    TAIL = 'ترجمه عربی: ون‌دایک (۱۸۶۵)، مالکیت عمومی، از ebible.org/arb-vd. انگلیسی: World English Bible و King James Version (۱۷۶۹)، هر دو مالکیت عمومی، از ebible.org.'
    for key, B in BOOKS.items():
        root = f'{OUT}/{key}'
        if os.path.isdir(root): shutil.rmtree(root)
        oid, olang, oname = B['orig']
        osrc = 'مالکیت عمومی' if oid == 'hebwlc' else '© 2010 SBL و Logos Bible Software، مجوز CC BY 4.0'
        trs = [('opcb', 'ترجمه معاصر (Biblica)', 'fa', '© Biblica, Inc.، مجوز CC BY-SA 4.0'), (oid, oname, olang, osrc), ('vd', 'ون‌دایک (۱۸۶۵)', 'ar', 'مالکیت عمومی'),
               ('web', 'World English Bible', 'en', 'مالکیت عمومی'), ('kjv', 'King James Version (1769)', 'en', 'مالکیت عمومی')]
        tsrc = {'opcb': opcb, oid: others[oid], 'vd': others['arb-vd'], 'web': others['engwebp'], 'kjv': others['eng-kjv2006']}
        parts, stats = [], collections.Counter()
        for code, pid, name, _, group in B['parts']:
            chs = sorted({c for (b, c, v) in opv if b == code})
            items = []
            for c in chs:
                # آیه‌های این باب: همه آیه‌های ترجمه قدیم و هر آیه‌ای که فقط در ترجمه دیگری آمده.
                vs = sorted({v for d in [opv, *tsrc.values()] for (b, cc, v) in d if b == code and cc == c})
                covered = {w for (b, cc, v), e in spans.items() if b == code and cc == c for w in range(v + 1, e + 1)}
                vs = [v for v in vs if v not in covered]
                secs = []
                for i, v in enumerate(vs):
                    s = {'v': v, 'ar': opv.get((code, c, v), '')}
                    if (code, c, v) in spans: s['ve'] = spans[(code, c, v)]
                    if not s['ar']: stats['no-opv'] += 1
                    if (code, c, v) in notes: s['note'] = notes[(code, c, v)]
                    t = ' '.join(x for x in (opcb.get((code, c, w)) for w in range(v, s.get('ve', v) + 1)) if x)
                    if t:
                        if (code, c, v) in opcb_br:  # چند آیه با هم: تا آیه پیش از آیه بعدیِ همین ترجمه
                            nxt = [w for w in vs[i + 1:] if (code, c, w) in opcb]
                            end = (nxt[0] - 1) if nxt else vs[-1]
                            if end > v: t = f'(آیه‌های {fa_d(v)} تا {fa_d(end)}) {t}'
                        s['fa'] = t
                    secs.append(s)
                dump({'title': heads.get((code, c), ''), 'bism': False, 'sections': secs}, f'{root}/{pid}/{c:03d}.json')
                for tid, *_ in trs[1:]:
                    d = tsrc[tid]
                    arr = [' '.join(x for x in (d.get((code, c, w)) for w in range(s['v'], s.get('ve', s['v']) + 1)) if x) or None for s in secs]
                    stats[tid + ' missing'] += arr.count(None)
                    dump({'n': len(secs), 't': arr}, f'{root}/tr/{tid}/{pid}/{c:03d}.json')
                items.append([c, heads.get((code, c), '')])
            parts.append({'id': pid, 'title': name, 'one': 'مزمور' if pid == 'psa' else 'باب', 'group': group, 'items': items})
        ix = {'key': key, 'title': B['title'], 'about': B['about'], 'src': B['src'] + TAIL,
              'main': {'lang': 'fa', 'name': 'ترجمه قدیم', 'src': '۱۸۹۵ میلادی، مالکیت عمومی'}, 'trFiles': True,
              'translations': [{'id': i, 'name': n, 'lang': l, 'src': sr} for i, n, l, sr in trs], 'parts': parts}
        with open(f'{root}/index.json', 'w', encoding='utf-8') as fh: json.dump(ix, fh, ensure_ascii=False, indent=1)
        print(key, len(parts), 'books', sum(len(p['items']) for p in parts), 'chapters', dict(stats))

main()
