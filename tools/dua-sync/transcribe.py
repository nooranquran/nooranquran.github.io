import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "medium", device="cpu", compute_type="int8", cpu_threads=4)
import subprocess, numpy as np
a=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-f","f32le","-ac","1","-ar","16000","-"],capture_output=True).stdout,np.float32)
segs, _ = m.transcribe(a, language="ar", word_timestamps=True, vad_filter=True, beam_size=1)
out=[]
for s in segs:
    for w in s.words: out.append([round(w.start,2), round(w.end,2), w.word.strip()])
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False)
print("done", len(out))
