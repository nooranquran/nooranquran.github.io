# هم‌خوانی متن دعا با صوت

خواننده دعا (chelleh.js) برای صوت `audio/x.mp3` فایل `audio/sync/x.json` را می‌خواند: `{"t":[...]}` که `t[i]` زمان شروع بند `i` از `sections` است (ثانیه؛ `null` یعنی آن بند در صوت خوانده نشده یا یادداشت است).

ساختن فایل زمان‌بندی برای یک صوت تازه (روی CPU، بدون هزینه):

```
pip install faster-whisper
python3 transcribe.py audio/x.mp3 /tmp/x.words.json medium   # تشخیص گفتار عربی با زمان هر کلمه
python3 align.py chelleh/x.json /tmp/x.words.json /tmp/x.t.json   # تطبیق حرف‌به‌حرف با متن و چاپ زمان هر بند
python3 -c "import json;json.dump({'t':json.load(open('/tmp/x.t.json'))},open('audio/sync/x.json','w'),separators=(',',':'))"
```

`align.py` نسبت حروف جورشده را چاپ می‌کند (بالای ۰٫۹ خوب است) و کنار زمان هر بند آغاز متن را نشان می‌دهد تا با چشم چک شود.

صوت‌ها: زیارت عاشورا علی فانی (از قبل در سایت). دعای عهد علی فانی از بازنشر SoundCloud همان نسخه کانال رسمی علی فانی (YouTube: ZKKeRGROaoo)، با ۶۴kbps مونو.
