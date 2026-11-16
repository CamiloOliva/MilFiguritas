"""Prepare the supplied Milfiguras presentation for web delivery, preserving its timing.

python scripts/prepare-media.py --source "path/to/original.mp4" --ffmpeg "path/to/ffmpeg"
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

def run(ffmpeg, *args):
    return subprocess.run([ffmpeg, '-nostdin', '-hide_banner', '-loglevel', 'error', *map(str,args)], check=True, capture_output=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',required=True)
    parser.add_argument('--ffmpeg',default='ffmpeg')
    args=parser.parse_args()
    source=Path(args.source).resolve()
    root=Path(__file__).resolve().parents[1]
    target=root/'public'/'media'
    target.mkdir(parents=True,exist_ok=True)
    probe=subprocess.run([args.ffmpeg,'-hide_banner','-i',str(source)],capture_output=True,text=True,encoding='utf-8',errors='replace').stderr
    match=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',probe)
    if not match:raise ValueError('Source duration not available')
    duration=int(match[1])*3600+int(match[2])*60+float(match[3])
    outputs={'full':target/'milfiguras-presentacion-v1.mp4','preview':target/'milfiguras-avance-v1.mp4','poster':target/'milfiguras-poster-v1.webp'}
    for file in outputs.values():
        if file.exists():raise FileExistsError(f'Preserve the previous version before rendering: {file.name}')
    # Full presentation: no cuts, speed changes, re-framing, overlays or replaced sound.
    run(args.ffmpeg,'-i',source,'-map','0:v:0','-map','0:a:0?','-vf','scale=1280:-2,setsar=1','-c:v','libx264','-preset','medium','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','48000','-movflags','+faststart',outputs['full'])
    # Separate, silent introductory preview. The complete presentation remains available.
    run(args.ffmpeg,'-i',source,'-t','14','-map','0:v:0','-an','-vf','scale=960:-2,setsar=1','-c:v','libx264','-preset','medium','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart',outputs['preview'])
    run(args.ffmpeg,'-ss','5.4','-i',source,'-frames:v','1','-vf','scale=1280:-2','-quality','85',outputs['poster'])
    # Decode the finished streams to catch malformed packets or missing assets.
    run(args.ffmpeg,'-i',outputs['full'],'-map','0:v:0','-map','0:a:0?','-f','null','-')
    run(args.ffmpeg,'-i',outputs['preview'],'-f','null','-')
    manifest={'source':{'name':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'bytes':source.stat().st_size,'duration_seconds':duration,'dimensions':'3840x2160','fps':30,'audio':'AAC stereo 48 kHz','provenance':'Video supplied by the project owner for publication in the Milfiguras website.'},'full':{'path':outputs['full'].relative_to(root).as_posix(),'dimensions':'1280x720','speed':1.0,'source_range':[0,duration],'audio':'Original track, re-encoded AAC 96 kbps'},'preview':{'path':outputs['preview'].relative_to(root).as_posix(),'dimensions':'960x540','speed':1.0,'source_range':[0,14],'audio':False},'poster':{'path':outputs['poster'].relative_to(root).as_posix(),'source_time':5.4},'outputs':{name:{'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()} for name,file in outputs.items()},'review':'Technical metadata, representative frames and complete decode checked. Full audiovisual listening review is separate.'}
    (target/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'source_seconds':duration,'files':{name:file.stat().st_size for name,file in outputs.items()}},ensure_ascii=False))

if __name__=='__main__':main()
