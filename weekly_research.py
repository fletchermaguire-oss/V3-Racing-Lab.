#!/usr/bin/env python3
"""Conservative, repeatable PDF -> Airtable evidence pipeline.
Requires a runner manifest CSV; never guesses runner boundaries from PDFs.
"""
import csv, io, json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone
import pdfplumber

BASE='appEBALFjxF1Uxqfj'; TABLE='tblgd0S8yuysxmsVk'
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'incoming'/'runners.csv'
OUTPUT=ROOT/'generated'/'weekly-research.json'
FIELDS=['Runner ID','Race ID','Horse','Recent form and class','Distance and track evidence','Sectionals and speed evidence','Map and tempo position','Strengths','Weaknesses / contradictory evidence','Missing evidence','Official runner source URL','Last checked at','Status']
# Only source-anchored patterns; never treat a trial as a race result.
RUN_RE=re.compile(r'\b(\d{1,2})(?:st|nd|rd|th)\s*(?:of|/)\s*(\d{1,2})\b',re.I)
DIST_RE=re.compile(r'\b(\d{3,4})\s*m\b',re.I)
BEAT_RE=re.compile(r'\b(?:beaten|btn)\s*(\d+(?:\.\d+)?)\s*(?:L|lengths?)\b',re.I)
WIN_RE=re.compile(r'\bwon\s+by\s+(\d+(?:\.\d+)?)\s*(?:L|lengths?)\b',re.I)
TRIAL_RE=re.compile(r'\btrial\b|\bjump\s*out\b',re.I)

def request_json(url, method='GET', data=None, token=None):
    headers={'Accept':'application/json','User-Agent':'RacingLabResearch/1.0'}
    if token: headers['Authorization']='Bearer '+token
    if data is not None: headers['Content-Type']='application/json'
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method),timeout=25) as res:
                return json.load(res)
        except urllib.error.HTTPError as e:
            if e.code in (429,500,502,503) and attempt<3:
                time.sleep(2**attempt);continue
            raise RuntimeError(f'HTTP {e.code} from provider') from e
    raise RuntimeError('Provider unavailable')

def get_pdf_text(path):
    with pdfplumber.open(path) as pdf:
        return [(page.extract_text(layout=False) or '') for page in pdf.pages]

def extract_runner(row,cache):
    pdfname=Path(row['pdf_file']).name
    path=ROOT/'incoming'/pdfname
    if not path.is_file(): raise ValueError(f'Missing PDF: {pdfname}')
    if pdfname not in cache: cache[pdfname]=get_pdf_text(path)
    page=int(row['page'])
    if page<1 or page>len(cache[pdfname]): raise ValueError(f'Invalid page {page} in {pdfname}')
    content=cache[pdfname][page-1]
    # Required explicit markers delimit the exact runner's section on the page.
    start=row['start_marker'].strip();end=row['end_marker'].strip()
    if not start or not end or start==end: raise ValueError('Unique start_marker and end_marker required')
    if content.count(start)!=1 or content.count(end)!=1: raise ValueError('Runner markers must each occur exactly once on the page')
    a=content.index(start)+len(start);b=content.index(end,a)
    if b<=a: raise ValueError('Runner markers out of order')
    block=content[a:b].strip()
    if len(block)<30: raise ValueError('Runner section too short; check PDF markers')
    return block

def analyze(block):
    pos=[];neg=[];form=[];distance=[];sectionals=[];pace=[]
    for raw in block.splitlines():
        line=' '.join(raw.split())
        if not line: continue
        m=RUN_RE.search(line)
        if m:
            rank,total=map(int,m.groups())
            if total<rank or total<2: continue
            form.append(line)
            if TRIAL_RE.search(line): continue
            # Positives/risks explicitly conditional on the observed result, not an invented suitability rating.
            if rank==1: pos.append('Recorded race win: '+line)
            elif rank<=3 and rank/total<=0.4: pos.append('Recorded placing: '+line)
            if rank/total>=0.7 and total>=5: neg.append('Recorded unplaced finish: '+line)
            beaten=BEAT_RE.search(line)
            if beaten and float(beaten.group(1))>=4: neg.append('Recorded defeat by '+beaten.group(1)+' lengths: '+line)
        if re.search(r'\b(?:sectional|last\s*600|last\s*400|L600|L400)\b',line,re.I): sectionals.append(line)
        if re.search(r'\b(?:settled|in running|on pace|led|backmarker)\b',line,re.I): pace.append(line)
        if re.search(r'\b(?:track|distance|good\s*[34]|soft\s*[567]|heavy\s*[89])\b',line,re.I) and DIST_RE.search(line): distance.append(line)
    # Deduplicate; retain exact lines as provenance; no unsupported interpretation.
    unique=lambda a:list(dict.fromkeys(a))[:6]
    return {'positives':unique(pos),'negatives':unique(neg),'form':unique(form),'distance':unique(distance),'sectionals':unique(sectionals),'pace':unique(pace)}

def load_scratchings():
    url=os.getenv('SCRATCHINGS_JSON_URL','').strip()
    if not url: return {},'not_configured'
    # Provider must return {"asOf":"ISO-8601","scratchings":[{"raceId":"...","horse":"...","status":"Scratched"}]}.
    obj=request_json(url)
    if not isinstance(obj,dict) or not isinstance(obj.get('scratchings'),list) or not obj.get('asOf'):
        raise ValueError('Scratching feed schema invalid; no statuses changed')
    d={}
    for item in obj['scratchings']:
        if not isinstance(item,dict) or item.get('status')!='Scratched' or not item.get('raceId') or not item.get('horse'):
            continue
        d[(str(item['raceId']).strip(),str(item['horse']).strip().casefold())]='Scratched'
    return d,obj['asOf']

def airtable_find(race_id,horse,token):
    from urllib.parse import urlencode
    formula='AND({Race ID}="'+race_id.replace('\\','').replace('"','')+'",{Horse}="'+horse.replace('\\','').replace('"','')+'")'
    url=f'https://api.airtable.com/v0/{BASE}/{TABLE}?'+urlencode({'filterByFormula':formula,'maxRecords':2})
    items=request_json(url,token=token).get('records',[])
    if len(items)!=1: raise ValueError(f'Expected one existing Airtable runner for {race_id} / {horse}, found {len(items)}; not overwriting')
    return items[0]['id']

def main():
    if not MANIFEST.is_file(): raise SystemExit('Upload incoming/runners.csv and referenced PDFs first')
    token=os.getenv('AIRTABLE_PAT','').strip()
    scratch,asof=load_scratchings()
    cache={};out=[];failures=[]
    with MANIFEST.open(newline='',encoding='utf-8-sig') as fh:
        for row in csv.DictReader(fh):
            try:
                race_id=row['race_id'].strip();horse=row['horse'].strip()
                if not re.fullmatch(r'\d{4}-\d{2}-\d{2}_[A-Z ]+_R\d{2}',race_id): raise ValueError('race_id must use YYYY-MM-DD_TRACK_R01')
                if not horse: raise ValueError('horse missing')
                block=extract_runner(row,cache)
                a=analyze(block)
                source=f"PDF: {Path(row['pdf_file']).name}, p.{row['page']}; {row.get('source_url','').strip()}".strip()
                status=scratch.get((race_id,horse.casefold()))
                item={'raceId':race_id,'horse':horse,'source':source,'status':status,'positives':a['positives'],'negatives':a['negatives'],'recentForm':a['form'],'distanceTrack':a['distance'],'sectionals':a['sectionals'],'pace':a['pace'],'missing':([] if a['positives'] and a['negatives'] else ['Insufficient verified positive/negative evidence; requires analyst review'])}
                out.append(item)
                if token:
                    record_id=airtable_find(race_id,horse,token)
                    fields={
                        'Recent form and class':'\n'.join(a['form']),
                        'Distance and track evidence':'\n'.join(a['distance']),
                        'Sectionals and speed evidence':'\n'.join(a['sectionals']),
                        'Map and tempo position':'\n'.join(a['pace']),
                        'Strengths':'\n'.join(a['positives']),
                        'Weaknesses / contradictory evidence':'\n'.join(a['negatives']),
                        'Missing evidence':'\n'.join(item['missing']),
                        'Last checked at':datetime.now(timezone.utc).isoformat()
                    }
                    # Only update status when an authenticated provider explicitly says scratched.
                    if status: fields['Status']=status
                    request_json(f'https://api.airtable.com/v0/{BASE}/{TABLE}/{record_id}',method='PATCH',data={'fields':fields},token=token)
            except Exception as e:
                failures.append({'raceId':row.get('race_id'),'horse':row.get('horse'),'error':str(e)})
    if not out and not failures: raise SystemExit('No runner rows found in incoming/runners.csv')
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps({'generatedAt':datetime.now(timezone.utc).isoformat(),'scratchingsAsOf':asof,'runners':out,'errors':failures},indent=2),encoding='utf-8')
    print(f'Processed {len(out)} runner dossiers, {len(failures)} errors; wrote {OUTPUT}')
    if failures: print(json.dumps(failures,indent=2),file=sys.stderr);sys.exit(1)

if __name__=='__main__':main()
