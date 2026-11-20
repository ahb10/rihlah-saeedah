"""Build ur/*.html (Urdu, RTL) from the English pages. Usage: python3 build_ur.py <site_dir>"""
import sys, os, re, glob, html
from urllib.parse import quote, unquote
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dict import D, WA

site = sys.argv[1]
out = os.path.join(site, 'ur')
os.makedirs(out, exist_ok=True)

MONTH = {'Jan':'جنوری','Feb':'فروری','Mar':'مارچ','Apr':'اپریل','May':'مئی','Jun':'جون'}
TIER = {'Budget':'بجٹ','Executive':'ایگزیکٹو','Platinum':'پلاٹینم'}
MEAL = {
 'Full board':'تینوں وقت کا کھانا',
 'Breakfast & dinner (international buffet)':'ناشتہ اور رات کا کھانا (انٹرنیشنل بوفے)',
 'Half board (international buffet)':'ناشتہ اور رات کا کھانا (انٹرنیشنل بوفے)',
 'Half board (breakfast & dinner)':'ناشتہ اور رات کا کھانا',
}
ORDER = {'Madinah first':'پہلے مدینہ','Makkah first':'پہلے مکہ',
         'Madinah first, Azizia after Hajj':'پہلے مدینہ، حج کے بعد عزیزیہ',
         'Madinah first, Makkah hotel stay':'پہلے مدینہ، مکہ ہوٹل میں قیام'}
KEEP = re.compile(r'^((SAR|USD) [\d,]+|\+[\d x]+|[\w.]+@[\w.]+|noindex, nofollow|Photos via Wikimedia Commons:.*)$')
missing = set()

def rules(s):
    m = re.fullmatch(r'(\d+) days', s)
    if m: return f'{m[1]} دن'
    m = re.fullmatch(r'(\d+)(?:–(\d+))? (Jan|Feb|Mar|Apr|May|Jun)', s)
    if m: return (f'{m[1]}–{m[2]}' if m[2] else m[1]) + ' ' + MONTH[m[3]]
    m = re.fullmatch(r'(\d+) (Apr|May) – (\d+) (Apr|May)', s)
    if m: return f'{m[1]} {MONTH[m[2]]} – {m[3]} {MONTH[m[4]]}'
    m = re.fullmatch(r'(\d+(?:–\d+)?) Dhul (Hijjah|Qadah)', s)
    if m: return f'{m[1]} ' + ('ذوالحجہ' if m[2]=='Hijjah' else 'ذوالقعدہ')
    m = re.fullmatch(r'(\d+) Dhul Qadah – (\d+)(?: Dhul Hijjah)?', s)
    if m: return f'{m[1]} ذوالقعدہ – {m[2]} ذوالحجہ'
    m = re.fullmatch(r'(\d+) nights · (.+)', s)
    if m and m[2] in MEAL: return f'{m[1]} راتیں · {MEAL[m[2]]}'
    m = re.fullmatch(r'≈ PKR ([\d.]+) lac(?: · (.+))?', s)
    if m:
        r = f'≈ {m[1]} لاکھ روپے'
        tail = m[2]
        if tail:
            t = {'quad room':'چار بیڈ کمرہ','10, 14, 17 or 22 days':'10، 14، 17 یا 22 دن',
                 '10 to 25 days':'10 سے 25 دن','14 days':'14 دن'}.get(tail)
            if t is None: return None
            r += ' · ' + t
        return r
    m = re.fullmatch(r'Ask about the (\d+) days (Budget|Executive|Platinum)', s)
    if m: return f'{m[1]} دن والے {TIER[m[2]]} پیکج کے بارے میں پوچھیں'
    return None

LRI, PDI = '⁦', '⁩'
def isolate(s):
    # keep phone numbers and number ranges reading left-to-right inside Urdu text
    s = re.sub(r'\+\d[\d ]*\d', lambda m: LRI+m[0]+PDI, s)
    s = re.sub(r'(?<![\d⁦])\d[\d,.]*\s?[–-]\s?\d[\d,.]*', lambda m: LRI+m[0]+PDI, s)
    return s

def tr(raw):
    lead = raw[:len(raw)-len(raw.lstrip())]; trail = raw[len(raw.rstrip()):]
    core = html.unescape(raw.strip())
    if not core or not re.search('[A-Za-z]', core): return raw
    if core in D: u = D[core]
    elif KEEP.match(core): return raw
    else:
        u = rules(core)
        if u is None:
            missing.add(core); return raw
    return lead + html.escape(isolate(u), quote=False) + trail

def wa_text(t):
    if t in WA: return WA[t]
    m = re.fullmatch(r'Assalam o Alaikum, I would like details of the (\d+) days (Budget|Executive|Platinum) Hajj 2027 package \((.+)\)\.', t)
    if m: return f'السلام علیکم، مجھے {m[1]} دن والے {TIER[m[2]]} حج 2027 پیکج ({ORDER.get(m[3], m[3])}) کی تفصیلات چاہئیں۔'
    m = re.fullmatch(r'Assalam o Alaikum, I would like details of the (?:(Budget|Executive|Platinum) Hajj 2027 packages|Hajj 2027 (Budget|Executive|Platinum) package)\.', t)
    if m: return f'السلام علیکم، مجھے {TIER[m[1] or m[2]]} حج 2027 پیکج کی تفصیلات چاہئیں۔'
    missing.add('WA: '+t); return t

ATTR = re.compile(r'\b(alt|placeholder|aria-label|title|content)="([^"]*)"')
def tr_attrs(tag):
    def f(m):
        k, v = m[1], m[2]
        if k == 'content' and not (' ' in v and re.search('[a-z]{3}', v)): return m[0]
        if k == 'content' and v.startswith('width='): return m[0]
        return f'{k}="{tr(v).replace(chr(34), "&quot;")}"'
    tag = ATTR.sub(f, tag)
    tag = re.sub(r'(wa\.me/923328886878\?text=)([^"]*)', lambda m: m[1]+quote(wa_text(unquote(m[2])), safe=''), tag)
    return tag

for path in sorted(glob.glob(os.path.join(site, '*.html'))):
    name = os.path.basename(path)
    s = open(path, encoding='utf-8').read()
    # language switch
    s = re.sub(r'<a class="lang" href="[^"]*" lang="ur"(?: hreflang="ur")?>اردو</a>', f'<a class="lang" href="../{name}" lang="en" hreflang="en">English</a>', s)
    # asset paths
    s = s.replace('href="styles.css"', 'href="../styles.css"').replace('href="anim.css"', 'href="../anim.css"')
    s = s.replace('src="anim.js"', 'src="../anim.js"').replace('src="menu.js"', 'src="../menu.js"')
    s = re.sub(r'(src|content)="img/', r'\1="../img/', s)
    s = s.replace('<html lang="en">', '<html lang="ur" dir="rtl">')
    s = s.replace('<link rel="stylesheet" href="../anim.css">',
        '<link rel="stylesheet" href="../anim.css">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap">\n<link rel="stylesheet" href="../ur.css">', 1)
    s = s.replace("||'there'", "||''")
    # split into protected blocks and markup
    parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<svg\b.*?</svg>)', s, flags=re.S)
    res = []
    for p in parts:
        if re.match(r'<(script|style|svg)\b', p):
            if p.startswith('<svg') and 'symbol' not in p and 'aria-hidden' not in p: pass
            res.append(p); continue
        p = re.sub(r'<[^>]+>', lambda m: tr_attrs(m[0]), p)
        p = re.sub(r'>([^<]+)<', lambda m: '>' + tr(m[1]) + '<', p)
        p = re.sub(r'^([^<]+)(?=<)', lambda m: tr(m[1]), p)
        res.append(p)
    open(os.path.join(out, name), 'w', encoding='utf-8').write(''.join(res))

print('built', len(glob.glob(os.path.join(out, '*.html'))), 'pages')
for x in sorted(missing): print('MISSING:', x)
