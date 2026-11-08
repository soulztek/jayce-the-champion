"""Convert the approved, user-supplied clip; source stays outside the repository.
Usage: python3 scripts/convert-real-crossover.py /path/to/approved-source.mp4
Requires ffmpeg, ffprobe, Pillow. No cropping/mirroring/mark removal.
"""
from pathlib import Path
import json, subprocess, sys, hashlib
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);out=root/'public/demos'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height','-of','json',str(source)]))
assert float(probe['format']['duration'])>=3
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(source),'-t','3','-an','-filter_complex','[0:v]fps=15,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle','-loop','0',str(out/'crossover-real.gif')],check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss','0.6','-i',str(source),'-frames:v','1',str(out/'crossover-real.png')],check=True)
with Image.open(out/'crossover-real.gif') as im:
 durations=[];hashes=[]
 for i in range(im.n_frames):
  im.seek(i);durations.append(im.info['duration']);hashes.append(hashlib.sha256(im.convert('RGB').tobytes()).hexdigest())
 report={'width':im.width,'height':im.height,'frames':im.n_frames,'distinctFrames':len(set(hashes)),'durationMs':sum(durations),'loop':im.info['loop'],'bytes':(out/'crossover-real.gif').stat().st_size,'excerptSeconds':[0,3],'originalDurationSeconds':float(probe['format']['duration']),'originalFps':25,'sampledFps':15,'framing':'Full native framing, no crop, no mirror, original visible marks retained','review':'Parent watchVideo review: right-to-left crossover then explosive drive; no layup/pull-up finish.'}
 assert report['width']==480 and report['height']==270 and report['frames']==45 and report['distinctFrames']>=35 and report['durationMs']==3000
 (root/'scripts/real-crossover-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
