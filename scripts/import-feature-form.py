#!/usr/bin/env python3
"""Import Racing & Sports Feature Form PDFs without inventing missing evidence.

Usage: python scripts/import-feature-form.py --as-of 2026-11-02 \
  --output v5/cards/2026-11-03/research.json first.pdf second.pdf

The summary inventory is reconciled with every detailed horse heading. Historical
starts, trials and table statistics remain separate, with page/hash provenance.
No prices, preview prose, trials or trainer strike rates enter V5 scoring.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from datetime import date, datetime
from pathlib import Path

import pymupdf


def canonical(value):
    return re.sub(r"[^A-Z0-9]", "", unicodedata.normalize(
        "NFKD", re.sub(r"\([^)]*\)", "", value).upper()))


def tidy(value):
    return re.sub(r"\s+", " ", value).strip()


def triple(value):
    if value == "-":
        return {"wins": 0, "other_places": 0, "starts": 0}
    wins, places, starts = map(int, re.findall(r"\d+", value))
    if wins + places > starts:
        raise ValueError("Invalid statistical record: " + value)
    return {"wins": wins, "other_places": places, "starts": starts}


def import_pdf(path, as_of):
    # Word coordinates preserve table columns; title height distinguishes the
    # detailed horse headings from summary rows and historical race results.
    with pymupdf.open(path) as pdf:
        pages = [{"text": p.get_text(),
                  "words": [{"text":w[4],"x0":w[0],"x1":w[2],"top":w[1],
                             "size":w[3]-w[1]} for w in p.get_text('words')]}
                 for p in pdf]
    starts = []
    for i, p in enumerate(pages):
        match = re.search(r"Race No\s+(\d+)\s+(\d{2} [A-Za-z]{3} \d{2})\s+"
                          r"(\d{1,2}:\d{2}[ap]m)\s+(RANDWICK|FLEMINGTON)\s+(\d+)m", p["text"])
        if match:
            starts.append((i, match))
    if not starts:
        raise ValueError("No supported race headers in " + path.name)
    races, runners = [], []
    for index, (page_no, head) in enumerate(starts):
        end_page = starts[index + 1][0] if index + 1 < len(starts) else len(pages)
        race_num, raw_date, clock, meeting, distance = head.groups()
        race_date = datetime.strptime(raw_date, "%d %b %y").date().isoformat()
        if as_of >= race_date:
            raise ValueError("Import must be pre-race; as-of is not earlier than " + race_date)
        race_id = f"{race_date}_{meeting}_R{int(race_num):02d}"
        page = pages[page_no]
        lines = page["text"].splitlines()
        header_line = next(i for i, s in enumerate(lines) if raw_date in s)
        title = lines[header_line + 1].strip()
        race_class = lines[header_line + 2].strip()
        words = page["words"]
        table_y = next(w["top"] for w in words if w["text"] == "Tab")
        detail_y = min(w["top"] for w in words if 0 <= w["x0"] < 5
                       and w["size"] > 18 and re.fullmatch(r"\d+\.", w["text"]))
        summary_words = [w for w in words if table_y + 3 < w["top"] < detail_y - 10]
        row_tops = sorted(w["top"] for w in summary_words
                          if w["x0"] < 20 and re.fullmatch(r"\d+\.", w["text"]))
        rows = []
        table_pattern = re.compile(r'(\d+)\.\s*([^\n]*?(?:\n[^\n]*)?)\n(\d+[a-z])\n([\d.]+)kg\n(\d+)\s*([^\n]*)\n([^\n]+)\n\s*(\d+\s*-\s*\d+\s*-\s*\d+)\n(\$[\d,]+)\n([^\n]+)\n([^\n]+)\n([^\n]+)',re.I)
        table_rows = table_pattern.findall(page['text'])
        if len(table_rows) != len(row_tops):
            raise ValueError('Summary row extraction mismatch: ' + race_id)
        for values in table_rows:
            tab, combined, age, weight, draw, jockey, trainer, career_text, _, _, _, _ = values
            tab = int(tab)
            combined = tidy(combined)
            fm = re.match(r'^([0-9xX]+)\s*(.*)$',combined)
            form, name = (fm[1],fm[2]) if fm else ('',combined)
            if not name:
                raise ValueError(f"Missing table name {race_id} tab {tab}")
            wt = float(weight)
            barrier = int(draw)
            claim = re.search(r"\(a([\d.]+)\)", jockey)
            stats = triple(career_text)
            rows.append({"tab": tab, "horse": name, "recent_form": form,
                         "age_sex": age, "weight_kg": wt,
                         "barrier": barrier, "jockey": jockey,
                         "claim_kg": float(claim[1]) if claim else 0,
                         "trainer": trainer.strip(), "career": stats})
        if [h["tab"] for h in rows] != list(range(1, len(rows) + 1)):
            raise ValueError("Non-contiguous summary inventory: " + race_id)
        # Horse titles are uppercase at x=78.7, larger than the summary text.
        headings = []
        names = {canonical(h["horse"]): h for h in rows}
        for pno in range(page_no, end_page):
            ws = pages[pno]["words"]
            ys = sorted(set(w["top"] for w in ws if 76 < w["x0"] < 82 and w["size"] >= 9))
            for y in ys:
                line = [w for w in ws if abs(w["top"] - y) < .6 and 76 <= w["x0"] < 265 and w["size"] >= 9]
                text = tidy(" ".join(w["text"] for w in line))
                key = canonical(text)
                if key in names:
                    headings.append((pno, y, key))
        headings.sort()
        if [h[2] for h in headings] != [canonical(h["horse"]) for h in rows]:
            raise ValueError(f"Detail inventory mismatch {race_id}: "
                             f"{len(headings)}/{len(rows)}; missing {set(names)-{h[2] for h in headings}}")
        races.append({"id": race_id, "meeting": meeting, "race": int(race_num),
                      "title": title, "distance_m": int(distance), "race_class": race_class,
                      "field_count": len(rows), "field_verified": False,
                      "scheduled_local": f"{race_date}T{datetime.strptime(clock, '%I:%M%p').strftime('%H:%M')}:00+11:00",
                      "source_notes": f"{path.name} pp{page_no+1}-{end_page}; PDF-listed entries only.",
                      "qa_notes": "Final starters, reserves, scratchings, rail and going need current official verification."})
        for i, row in enumerate(rows):
            pno, y, _ = headings[i]
            next_p, next_y, _ = headings[i+1] if i+1 < len(headings) else (end_page, 0, "")
            detail_lines, used_pages, comment_lines = [], [], []
            for j in range(pno, min(next_p + 1, end_page)):
                lo, hi = (y-.5 if j == pno else 0), (next_y-.5 if j == next_p else 10000)
                groups = {}
                for w in pages[j]["words"]:
                    if lo <= w["top"] < hi:
                        groups.setdefault(round(w["top"], 1), []).append(w)
                if groups:
                    used_pages.append(j+1)
                for _, group in sorted(groups.items()):
                    text=tidy(" ".join(w["text"] for w in sorted(group,key=lambda w:w["x0"])))
                    detail_lines.append(text)
                    if (min(w['x0'] for w in group)<10 and re.match(r'^(?:[A-Za-z]|\d+U;|\[)',text)
                            and not re.match(r'^(?:Trial\b|CarPM/s\b|G1\b)',text)):
                        comment_lines.append(text)
            raw = "\n".join(detail_lines)
            # Statistics occupy columns on their own rows, above the race form.
            records = {}
            for label, aliases in [("career", "Car"), ("course", "Crs"), ("distance", "Dist"),
                                   ("good", "Good"), ("soft", "Soft"), ("heavy", "Heavy")]:
                found = []
                for j in range(pno, min(next_p + 1, end_page)):
                    lo, hi = (y-.5 if j == pno else 0), (next_y-.5 if j == next_p else 10000)
                    ws = [w for w in pages[j]["words"] if lo <= w["top"] < hi]
                    for lab in [w for w in ws if w["text"] == aliases]:
                        center = (lab["x0"]+lab["x1"])/2
                        vals = [w for w in ws if 3 < w["top"]-lab["top"] < 13
                                and abs((w["x0"]+w["x1"])/2-center) < 14
                                and re.fullmatch(r"\d+-\d+-\d+|-",w["text"])]
                        if vals:
                            found.append(triple(vals[0]["text"]))
                if len(found) != 1:
                    raise ValueError(f"Missing or ambiguous {label} statistics: {race_id} {row['horse']}")
                records[label] = found[0]
            if records["career"] != row["career"]:
                raise ValueError("Career summary/detail mismatch: " + row["horse"])
            flat = tidy(raw)
            form_rows = []
            raw_starts = []
            start_pattern = re.compile(r"(\d+)(?:st|nd|rd|th) of (\d+) (\d{1,2}/\d{1,2}/\d{4}) ")
            matches = list(start_pattern.finditer(flat))
            maps, sectionals = [], []
            unsupported = []
            for k, m in enumerate(matches):
                pos, field, dt = m.groups()
                iso = datetime.strptime(dt,"%d/%m/%Y").date().isoformat()
                if iso >= as_of:
                    raise ValueError("Post-cutoff or same-day form in source: " + row["horse"] + " " + dt)
                stop = matches[k+1].start() if k+1<len(matches) else len(flat)
                segment = flat[m.start():stop]
                parsed=re.search(r'\d{1,2}/\d{1,2}/\d{4} (.+?) Margin ([\d.]+) Lengths? Distance (\d+)m SOT ([A-Z]+) (.*?) Race\b',segment)
                if not parsed:
                    raise ValueError('Unparsed dated start: '+race_id+' '+row['horse']+' '+dt)
                venue,margin,trip,surface,grade=parsed.groups()
                grade=re.sub(r'^RST\s+','',grade)
                # Trial lines are retained in source detail, never parsed as race starts.
                valid_finish=1<=int(pos)<=int(field)
                flat_race=not re.search(r'\b(?:HDLE|HURDLE|STPLE|STEEPLE|CHASE)\b',grade,re.I)
                model_eligible=surface in ('G','S','H') and valid_finish and flat_race
                if model_eligible:
                    form_rows.append(f"{dt} {venue} {trip}m ({surface}), {grade}: {pos}/{field}, PDF margin {margin}L")
                else:
                    why='non-standard finish code '+pos if not valid_finish else 'jump race' if not flat_race else 'surface '+surface
                    unsupported.append(f"{dt}: {why} (retained in source; excluded from V5 recent-start scoring)")
                raw_starts.append({"date":iso,"venue":venue,"finish":int(pos),"field":int(field),
                                   "margin_l":float(margin),"distance_m":int(trip),"surface":surface,"race_class":grade,
                                   "used_in_model":model_eligible})
                settle = re.search(r"\b800m (\d+)(?:st|nd|rd|th)\b",segment)
                if settle and model_eligible:
                    maps.append(f"Settled {settle[1]}th 800m ({dt})")
                sec = re.search(r"Sec Time ([\d.]+) \((\d+)\)", segment)
                if sec:
                    sectionals.append({"date":iso,"race_time_last_split_seconds":float(sec[1]),
                                       "split_m":int(sec[2]),"horse_specific":False})
            trial_pattern = re.compile(r"Trial (\d+)(?:st|nd|rd|th) (\d{1,2}/\d{1,2}/\d{4}) (\S+) (\d+)m Race Time ([\d:.]+)")
            trials = [{"finish":int(m[1]),"date":datetime.strptime(m[2],"%d/%m/%Y").date().isoformat(),
                       "venue":m[3],"distance_m":int(m[4]),"time":m[5],"used_in_model":False}
                      for m in trial_pattern.finditer(flat)]
            if any(t["date"] >= as_of for t in trials):
                raise ValueError("Post-cutoff trial: " + row["horse"])
            stats_text = "\n".join(f"{label.title()} {s['wins']}-{s['other_places']}-{s['starts']};"
                                    for label,s in records.items())
            risks = []
            if len(form_rows)<3:
                risks.append(f"Only {len(form_rows)} supported dated race starts; trials are not race wins")
            if int(row["weight_kg"]) >= 60:
                risks.append("Published weight/claim and weight relative to rivals need checking")
            if row["barrier"]>=10:
                risks.append("Wide draw: effect depends on pace and race-day lane pattern")
            if unsupported:
                risks.extend(unsupported)
            source = {"file":path.name,"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
                      "pages":used_pages,
                      "summary_page":page_no+1}
            # Narrative gear notes are kept as source statements, not a coefficient.
            notes=tidy(' '.join(comment_lines))
            gear = [s.strip() for s in re.split(r";",notes) if re.search(r"\b(?:FIRST TIME|AGAIN|OFF FIRST|Blinkers|Winkers|Tongue Tie|Lugging Bit)\b",s)]
            gear = [s[-550:] for s in gear if len(s)<700][-8:]
            runners.append({**row,"id":f"{race_id}_{row['tab']:02d}","race_id":race_id,
                            "status":"PDF_LISTED_UNVERIFIED","original_pick":False,
                            "form":"\n".join(form_rows),"statistics":stats_text,
                            "strengths":f"PDF records: career {records['career']['wins']} wins from {records['career']['starts']} starts. "
                                         +(f"Latest race: {form_rows[0]}." if form_rows else "No supported dated race result in the PDF."),
                            "risks":"; ".join(risks) or "Final field, pace, track pattern and current gear not independently verified.",
                            "historical_map":"; ".join(maps),
                            "outstanding":"Current official fields/going/rail/gear, replays, trainer comments and horse-specific adjusted sectionals remain unverified.",
                            "source":source,"source_detail":raw,"source_commentary":notes,"historical_starts":raw_starts,
                            "trials":trials,"gear_source_notes":gear,"sectional_evidence":sectionals})
    return races, runners, {"file":path.name,"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
                            "pages":len(pages),"meeting":races[0]["meeting"],"races":len(races),"runners":len(runners)}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of",required=True)
    parser.add_argument("--output",required=True,type=Path)
    parser.add_argument("--library-file-id",action="append",default=[],help="Optional source identity, in PDF argument order")
    parser.add_argument("pdf",nargs="+",type=Path)
    args=parser.parse_args()
    date.fromisoformat(args.as_of)
    races,runners,sources=[],[],[]
    for path in args.pdf:
        rr,hh,ss=import_pdf(path,args.as_of)
        races.extend(rr);runners.extend(hh);sources.append(ss)
    if args.library_file_id and len(args.library_file_id)!=len(sources):
        raise ValueError('Supply one source identity per PDF')
    for source,identity in zip(sources,args.library_file_id):
        source['library_file_id']=identity
    identities={}
    for h in runners:
        identities.setdefault(canonical(h['horse']),[]).append(h)
    cross_entries=[]
    for entries in identities.values():
        if len(entries)>1:
            ids=[h['race_id'] for h in entries]
            cross_entries.append({'horse':entries[0]['horse'],'race_ids':ids})
            for h in entries:
                h['cross_entries']=[x for x in ids if x!=h['race_id']]
                h['risks']+='; Cross-entered in '+', '.join(h['cross_entries'])+'; final engagement is unverified'
    for race in races:
        field=[h for h in runners if h['race_id']==race['id']]
        race['unraced_count']=sum(h['career']['starts']==0 for h in field)
        race['cross_entered_count']=sum(bool(h.get('cross_entries')) for h in field)
        race['source_flags']=(['UNRACED_RIVALS_NOT_RATED_FROM_TRIALS'] if race['unraced_count'] else [])+(['CROSS_ENTRIES_REQUIRE_FINAL_FIELD_CHECK'] if race['cross_entered_count'] else [])
    dates={r["id"][:10] for r in races}
    if len(dates)!=1 or len({r["id"] for r in races})!=len(races):
        raise ValueError("Mixed race dates or duplicated meetings")
    event_date=dates.pop()
    result={"schema":"racing-lab-v5-feature-form/v1","date":event_date,"saved_at":args.as_of,
            "publication":{"approved":False,"model_probabilities_published":False,"status":"RESEARCH_ONLY"},
            "notice":"User-supplied Feature Form import; listed entries, not verified final starters. Good 4 is an explicit comparison scenario, not a sourced track observation.",
            "source_import":{"kind":"FEATURE_FORM_PDF","as_of":args.as_of,"sources":sources},
            "expected_inventory":{"races":len(races),"runners":len(runners)},
            "cross_entries":cross_entries,
            "meetings":[{"meeting":m,"baseline":"Good 4 (comparison scenario only)","scenario_going":"Good 4",
                         "rail":"Not independently verified","source":next(s["file"] for s in sources if s["meeting"]==m)}
                        for m in dict.fromkeys(r["meeting"] for r in races)],
            "races":races,"runners":runners,"market_audit":[],"market_benchmarks":[]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({"date":event_date,"races":len(races),"runners":len(runners),"sources":sources},indent=2))


if __name__=="__main__":
    main()
