"""Original deterministic basketball diagrams. No downloaded art or video.
Requires Pillow (python3 -m pip install Pillow). Run from any directory.
Assets: 480x360, 60 frames x 80ms = 4.8s, infinite loop, static PNG posters.
"""
from pathlib import Path
import json, math, hashlib
from PIL import Image, ImageDraw, ImageFont, ImageColor
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/demos'
OUT.mkdir(exist_ok=True)
W,H,N = 480,360,60
BG='#f1f5f1';INK='#163326';GREEN='#19784d';LIGHT='#c9d9ce';ORANGE='#f2a155';WHITE='#ffffff';GRAY='#75877b'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(size=15,bold=False):return ImageFont.truetype(BOLD if bold else FONT,size)
def lerp(a,b,t):return a+(b-a)*max(0,min(1,t))
def smooth(t):return (1-math.cos(math.pi*max(0,min(1,t))))/2

def text(d,xy,s,size=14,fill=INK,bold=False,anchor=None):d.text(xy,s,font=font(size,bold),fill=fill,anchor=anchor)
def line(d,pts,color=INK,width=5):d.line([(int(x),int(y)) for x,y in pts],fill=color,width=width,joint='curve')
def circle(d,x,y,r,fill,outline=None,width=1):d.ellipse((int(x-r),int(y-r),int(x+r),int(y+r)),fill=fill,outline=outline,width=width)
def ball(d,x,y,r=9):
 circle(d,x,y,r,ORANGE,INK,2);line(d,[(x-r+2,y),(x+r-2,y)],INK,1);line(d,[(x,y-r+2),(x,y+r-2)],INK,1)
def arrow(d,pts,color=GREEN,width=3):
 line(d,pts,color,width);a,b=pts[-2:];ang=math.atan2(b[1]-a[1],b[0]-a[0]);line(d,[(b[0]-9*math.cos(ang-.5),b[1]-9*math.sin(ang-.5)),b,(b[0]-9*math.cos(ang+.5),b[1]-9*math.sin(ang+.5))],color,width)
def dotted(d,pts,color=LIGHT):
 for a,b in zip(pts,pts[1:]):
  dist=math.dist(a,b)
  for n in range(0,int(dist),13):
   u=n/dist if dist else 0;v=min(1,(n+6)/dist) if dist else 1;line(d,[(lerp(a[0],b[0],u),lerp(a[1],b[1],u)),(lerp(a[0],b[0],v),lerp(a[1],b[1],v))],color,2)
def base(meta,p):
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 d.rounded_rectangle((10,9,470,351),18,fill=WHITE)
 text(d,(24,20),meta['title'],20,bold=True)
 subtitle=('Back view • '+meta['side'].upper()+' attack • start '+meta['startHand'].upper()+' hand') if meta['side'] else ('Side-view illustration' if meta['kind']=='form' else 'Gentle warm-up • move at your pace')
 text(d,(24,49),subtitle,12,GRAY)
 phase=(0 if p<.44 else 1 if p<.70 else 2) if meta["kind"] in ["layup","pullup"] else min(2,int(p*3));
 for i,label in enumerate(meta['phases']):
  x=24+i*145;d.rounded_rectangle((x,301,x+137,329),8,fill=GREEN if i==phase else BG)
  text(d,(x+68,315),str(i+1)+'. '+label,10,WHITE if i==phase else INK,bold=True,anchor='mm')
 text(d,(240,339),'ORIGINAL ANIMATED DRILL DIAGRAM • NOT TO SCALE',9,GRAY,anchor='mm')
 return im,d

def player(d,x,y,*,hand=1,ballxy=None,low=True,run=0,lift=0,finish=None,shoot=False,labels=False):
 # Back view: anatomical left/right agree with screen left/right.
 # y is hips; a wide, bent-knee stance keeps low dribble motion legible.
 heady=y-61; shoulder=y-43
 circle(d,x,heady,11,INK)
 d.rounded_rectangle((x-14,shoulder-2,x+14,y-4),5,fill=GREEN)
 text(d,(x,y-24),'J',15,WHITE,bold=True,anchor='mm')
 if finish:
  side=1 if finish=='right' else -1
  # Opposite planted foot, approach-side knee lifted.
  line(d,[(x-side*7,y-4),(x-side*16,y+17),(x-side*21,y+42)],INK,6)
  line(d,[(x+side*7,y-4),(x+side*26,y+10),(x+side*17,y+22)],INK,6)
  circle(d,x-side*21,y+44,5,GREEN)
 elif shoot:
  for side in [-1,1]:line(d,[(x+side*7,y-4),(x+side*14,y+17),(x+side*17,y+37)],INK,6)
 else:
  for side in [-1,1]:
   shift=math.sin(run)*8*side if run else 0
   line(d,[(x+side*7,y-4),(x+side*22,y+12),(x+side*31+shift,y+(31 if low else 44))],INK,6)
 # Hands/arms: only the working hand follows the dribble; opposite hand is free.
 if shoot:
  sy=y-84-lift
  line(d,[(x-13,shoulder),(x-24,shoulder-17),(x-6,sy+7)],INK,5)
  line(d,[(x+13,shoulder),(x+25,shoulder-21),(x+8,sy)],INK,5)
 elif finish:
  side=1 if finish=='right' else -1
  line(d,[(x+side*13,shoulder),(x+side*29,shoulder-19),(x+side*31,y-91)],INK,5)
  line(d,[(x-side*13,shoulder),(x-side*26,shoulder+14),(x-side*35,shoulder+8)],INK,5)
 else:
  target=ballxy or (x+hand*43,y+7)
  line(d,[(x+hand*13,shoulder),(x+hand*30,shoulder+18),(target[0],min(target[1]-10,y+7))],INK,5)
  line(d,[(x-hand*13,shoulder),(x-hand*29,shoulder+10),(x-hand*39,shoulder+3)],INK,5)
 if labels:
  text(d,(x-55,y-18),'L',11,GRAY,bold=True,anchor='mm');text(d,(x+55,y-18),'R',11,GRAY,bold=True,anchor='mm')

def draw_court(d,side):
 d.rounded_rectangle((85,78,395,288),10,outline=LIGHT,width=2)
 line(d,[(177,79),(177,160),(303,160),(303,79)],LIGHT,2)
 d.arc((177,125,303,196),0,180,fill=LIGHT,width=2)
 line(d,[(215,82),(265,82)],GRAY,3)
 d.ellipse((229,87,251,95),outline=ORANGE,width=3)
 text(d,(320,87),'RIM',10,GRAY)
 # A ghost defender, not a real opponent to collide with.
 circle(d,240,180,14,'#e4ebe6',GRAY,2)
 line(d,[(219,180),(261,180)],GRAY,3);text(d,(285,176),'defender',10,GRAY)
 sign=1 if side=='right' else -1
 dotted(d,[(240,265),(240+sign*91,213),(240+sign*55,140)])
 arrow(d,[(240+sign*63,228),(240+sign*91,213)],'#8fb09b',2)

def drill(meta,p):
 im,d=base(meta,p);side=1 if meta['side']=='right' else -1;start=1 if meta['startHand']=='right' else -1
 draw_court(d,meta['side'])
 # The 4.8s loop reserves 0–44% for hand action, 44–70% for drive, remainder finish.
 u=min(1,p/.44)
 if meta['motion']=='crossover':hand=lerp(start,side,smooth((u-.15)/.65))
 elif meta['motion']=='double-crossover':
  hand=lerp(side,-side,smooth((u-.08)/.36)) if u<.5 else lerp(-side,side,smooth((u-.51)/.36))
 else:
  # Never crosses into the opposite hand. The fake moves inward, then returns.
  hand=side*(1-.72*math.sin(math.pi*min(1,max(0,(u-.12)/.75))))
 if p<.44:
  x,y=240,245;bx=x+hand*46;by=y+4+25*abs(math.sin(u*math.pi*(2 if meta['motion']=='double-crossover' else 1)))
  player(d,x,y,hand=1 if hand>=0 else -1,ballxy=(bx,by),labels=True)
  ball(d,bx,by)
  text(d,(24,112),'BALL HAND',10,GRAY,bold=True)
  text(d,(24,130),meta['handPath'],12,GREEN,bold=True)
  text(d,(24,152),'Low, controlled',10,GRAY)
  text(d,(24,166),'bounce',10,GRAY)
 elif p<.70:
  v=smooth((p-.44)/.26);x=lerp(240,240+side*91,v);y=lerp(245,217,v)
  bx=x+side*36;by=y+8+12*abs(math.sin(v*math.pi*3))
  player(d,x,y,hand=side,ballxy=(bx,by),run=v*math.pi*4)
  ball(d,bx,by);arrow(d,[(x-side*28,y+10),(x+side*2,y-10)],GREEN,3)
  text(d,(24,115),'PUSH → GO',12,GREEN,bold=True)
 else:
  v=min(1,(p-.70)/.26)
  if meta['kind']=='layup':
   x=lerp(240+side*91,240+side*57,smooth(min(1,v*1.6)));y=lerp(217,198,smooth(min(1,v*1.6)))
   jump=10*math.sin(math.pi*min(1,v));y-=jump
   player(d,x,y,finish=meta['side'])
   release=max(0,(v-.35)/.65)
   sx,sy=x+side*31,y-98
   bx=lerp(sx,240,release);by=lerp(sy,91,release)-34*math.sin(math.pi*release)
   ball(d,bx,max(78,by),8)
   text(d,(24,115),meta['side'].upper()+' HAND',12,GREEN,bold=True)
   text(d,(24,135),'Off '+('LEFT' if side==1 else 'RIGHT')+' foot',11,GRAY)
   text(d,(24,153),'Soft touch',11,GRAY)
  else:
   x=240+side*91;y=217-13*math.sin(math.pi*min(1,v))
   player(d,x,y,shoot=True,lift=8*min(1,v*2))
   # Two-hand set becomes normal release; jumper is never cued as one-hand-only.
   release=max(0,(v-.32)/.68);sx,sy=x+8,y-93
   bx=lerp(sx,240,release);by=lerp(sy,91,release)-54*math.sin(math.pi*release)
   ball(d,bx,max(78,by),8)
   text(d,(24,112),'STOP BALANCED',11,GREEN,bold=True)
   text(d,(24,132),'Gather: both hands',10,GRAY)
   text(d,(24,150),'Usual shooting',10,GRAY)
   text(d,(24,164),'+ guide hand',10,GRAY)
 # A side-specific caption remains visible throughout, not hidden in an unlabeled flip.
 footer=meta['finish']
 text(d,(240,287),footer,11,INK,bold=True,anchor='mm')
 return im

def form(meta,p):
 im,d=base(meta,p);line(d,[(58,276),(420,276)],LIGHT,2)
 # Side view, right-facing. Close range, guide hand visibly separate from release.
 hoopx,hoopy=365,126;line(d,[(397,86),(397,164)],GRAY,4);line(d,[(365,126),(397,126)],ORANGE,4);d.rectangle((384,107,396,124),outline=GRAY,width=2)
 text(d,(348,177),'RIM',10,GRAY)
 u=smooth(min(1,p/.65));x,y=157,224-13*u
 circle(d,x,y-70,12,INK);line(d,[(x,y-55),(x-3,y-12)],GREEN,17)
 for sign in [-1,1]:line(d,[(x-3,y-10),(x+sign*14,y+15),(x+sign*20,274)],INK,6)
 handx=lerp(188,198,u);handy=lerp(y-50,y-105,u)
 line(d,[(x,y-47),(x+32,y-36-u*25),(handx,handy)],INK,5)
 # Quiet guide hand at side initially; after release it stops rather than pushing the ball.
 gx=lerp(181,184,u);gy=lerp(y-56,y-82,u)
 line(d,[(x-6,y-45),(x+12,y-28),(gx,gy)],'#708778',4)
 if p>.6:line(d,[(handx,handy),(handx+8,handy+4)],INK,4)
 release=max(0,min(1,(p-.47)/.43));bx=lerp(handx+5,hoopx,release);by=lerp(handy-8,hoopy,release)-64*math.sin(math.pi*release)
 ball(d,bx,max(78,by),9)
 text(d,(35,89),'SHOOTING HAND',11,GREEN,bold=True);text(d,(35,105),'supports → releases',11,GRAY)
 text(d,(35,134),'GUIDE HAND',11,GRAY,bold=True);text(d,(35,150),'light & quiet',11,GRAY)
 text(d,(240,285),'Start close • smooth release • hold the finish',11,INK,anchor='mm')
 return im

def warmup(meta,p):
 im,d=base(meta,p);t=p*math.pi*4;motion=meta['motion'];x=240;y=221
 line(d,[(90,278),(390,278)],LIGHT,2)
 if motion=='ankle':
  # Side-on heel remains on the same floor point while knee moves forward.
  rock=(math.sin(t)+1)/2
  heel=(209,275);toe=(259,275);knee=(lerp(226,248,rock),229)
  line(d,[heel,toe],INK,7);circle(d,*heel,5,GREEN)
  line(d,[heel,knee,(212,198)],INK,7)
  line(d,[(212,198),(lerp(213,224,rock),154)],GREEN,17)
  circle(d,lerp(213,224,rock),132,12,INK)
  line(d,[(lerp(213,224,rock),167),(255,187)],INK,5)
  arrow(d,[(277,223),(296,223)],GREEN,3)
  text(d,(300,210),'Knee rocks',11,GRAY);text(d,(300,226),'gently forward',11,GRAY)
  text(d,(150,281),'Heel stays down',11,GREEN,bold=True)
 elif motion=='squat':
  depth=(1-math.cos(t))/2;y=lerp(212,236,depth)
  circle(d,x,y-76,12,INK);line(d,[(x,y-60),(x-4,y-14)],GREEN,18)
  for sign in [-1,1]:line(d,[(x-4,y-15),(x+sign*(20+depth*10),y+7),(x+sign*30,276)],INK,6)
  line(d,[(x,y-52),(x-30,y-38),(x-49,y-52)],INK,5);line(d,[(x,y-52),(x+30,y-38),(x+49,y-52)],INK,5)
  text(d,(240,101),'A small, comfortable bend',13,GREEN,anchor='mm')
 elif motion=='lateral':
  x=240+55*math.sin(t/2);y=222
  player(d,x,y,hand=1,low=True,run=t)
  arrow(d,[(136,268),(103,268)],GREEN,3);arrow(d,[(344,268),(377,268)],GREEN,3)
  text(d,(240,106),'Step sideways • feet stay apart',13,GREEN,anchor='mm')
 elif motion=='march':
  circle(d,x,145,12,INK);line(d,[(x,164),(x,213)],GREEN,18)
  for sign in [-1,1]:
   lift=max(0,math.sin(t)*sign);line(d,[(x+sign*7,212),(x+sign*23,242-29*lift),(x+sign*21,275-35*lift)],INK,6)
   line(d,[(x+sign*7,170),(x+sign*31,196),(x+sign*42,184+12*math.sin(t)*sign)],INK,5)
  text(d,(240,101),'One knee, then the other • easy pace',13,GREEN,anchor='mm')
 else:
  # Hand transition passes low across; each side has several easy bounces.
  hand=math.cos(p*math.pi*2);bx=x+48*hand;by=226+42*abs(math.sin(p*math.pi*6))
  player(d,x,y,hand=1 if hand>=0 else -1,ballxy=(bx,by),labels=True);ball(d,bx,by)
  text(d,(240,101),'Easy dribbles • both hands • no rush',13,GREEN,anchor='mm')
 return im

def render(meta,p):return warmup(meta,p) if meta['kind']=='warmup' else form(meta,p) if meta['kind']=='form' else drill(meta,p)
def main():
 records=json.loads((ROOT/'src/drillMedia.json').read_text());report=[]
 for meta in records:
  frames=[render(meta,i/(N-1)) for i in range(N)]
  # A shared fixed palette removes per-frame color drift and makes output reproducible.
  palette=Image.new('RGB',(16,1));palette.putdata([ImageColor.getrgb(c) for c in [BG,INK,GREEN,LIGHT,ORANGE,WHITE,GRAY,'#e4ebe6','#8fb09b','#708778']+['#ffffff']*6])
  pal=palette.quantize(colors=16)
  frames=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in frames]
  dest=OUT/(meta['id']+'.gif')
  frames[0].save(dest,save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=False,disposal=2)
  render(meta,.18).save(OUT/(meta['id']+'.png'),optimize=True)
  with Image.open(dest) as im:
   hashes=[];duration=0
   for n in range(im.n_frames):im.seek(n);hashes.append(hashlib.sha256(im.convert('RGB').tobytes()).hexdigest());duration+=im.info.get('duration',0)
   assert im.n_frames>=30 and len(set(hashes))>=15 and im.info.get('loop')==0 and duration==4800
   assert dest.stat().st_size<1_000_000
   report.append(dict(id=meta['id'],frames=im.n_frames,distinctFrames=len(set(hashes)),durationMs=duration,width=W,height=H,bytes=dest.stat().st_size,loop=0))
 # Selected storyboard frames, not screenshots. Parent can inspect without browser automation.
 chosen=['warmup-march','warmup-ankle','warmup-squat','form-shot','crossover-layup-right','double-crossover-layup-left','in-and-out-layup-right','crossover-pullup-right','in-and-out-pullup-left']
 sheet=Image.new('RGB',(W*3,H*len(chosen)),WHITE)
 for row,id in enumerate(chosen):
  m=next(m for m in records if m['id']==id)
  for col,p in enumerate([.18,.56,.87]):sheet.paste(render(m,p),(col*W,row*H))
 screens=Path('/workspace/screens/jayce');screens.mkdir(parents=True,exist_ok=True)
 sheet.save(screens/'drill-gif-contact-sheet.png',optimize=True)
 (ROOT/'scripts/media-validation.json').write_text(json.dumps(report,indent=2)+'\n')
 print(f'{len(report)} GIFs, {sum(r["bytes"] for r in report):,} GIF bytes; {min(r["frames"] for r in report)}–{max(r["frames"] for r in report)} encoded frames (identical frames coalesced), 4.8s, infinite loop, 480×360.');print('Contact sheet:',screens/'drill-gif-contact-sheet.png')
if __name__=='__main__':main()
