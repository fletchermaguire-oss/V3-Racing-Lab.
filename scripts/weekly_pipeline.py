
#!/usr/bin/env python3
"""Verified racing evidence importer. No fabricated form data."""

import json
import os
import urllib.request
import datetime
import pathlib
import sys
from urllib.parse import urlencode

BASE = "appEBALFjxF1Uxqfj"
TABLE = "tblgd0S8yuysxmsVk"


def get(url, token=None):
    headers = {
        "User-Agent": "RacingLab/1.0",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = "Bearer " + token

    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def patch(record, fields, token):
    url = f"https://api.airtable.com/v0/{BASE}/{TABLE}/{record}"
    request = urllib.request.Request(
        url,
        data=json.dumps({"fields": fields}).encode(),
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        method="PATCH"
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def main():
    url = os.getenv("RACING_DATA_JSON_URL", "")
    token = os.getenv("AIRTABLE_PAT", "")

    if not url:
        sys.exit("RACING_DATA_JSON_URL not configured. No changes made.")

    if not token:
        sys.exit("AIRTABLE_PAT missing. No changes made.")

    data = get(url)
    asof = data.get("asOf")
    runners = data.get("runners")

    if not isinstance(asof, str) or not isinstance(runners, list) or not runners:
        sys.exit("Invalid or empty provider feed. No changes made.")

    output = []
    errors = []

    for row in runners:
        try:
            race = row["raceId"]
            horse = row["horse"]
            source = row["sourceUrl"]
            evidence = row["evidence"]

            if not all(
                isinstance(v, str) and v.strip()
                for v in [race, horse, source]
            ):
                raise ValueError("Missing runner identity or source")

            if not isinstance(evidence, dict):
                raise ValueError("Missing evidence")

            def lines(key):
                items = evidence.get(key, [])
                if not isinstance(items, list):
                    raise ValueError("Invalid evidence: " + key)

                return "\n".join(
                    str(item["text"]).strip()
                    + " [source: "
                    + str(item["url"]).strip()
                    + "]"
                    for item in items
                    if isinstance(item, dict)
                    and item.get("text")
                    and item.get("url")
                )

            fields = {
                "Recent form and class": lines("form"),
                "Distance and track evidence": lines("distance"),
                "Sectionals and speed evidence": lines("sectionals"),
                "Map and tempo position": lines("pace"),
                "Strengths": lines("positives"),
                "Weaknesses / contradictory evidence": lines("negatives"),
                "Official runner source URL": source,
                "Last checked at": datetime.datetime.now(
                    datetime.timezone.utc
                ).isoformat()
            }

            fields["Missing evidence"] = (
                "Insufficient verified positives/negatives"
                if not fields["Strengths"]
                or not fields["Weaknesses / contradictory evidence"]
                else ""
            )

            if (
                row.get("status") == "Scratched"
                and row.get("statusSourceUrl")
                and row.get("statusAsOf")
            ):
                fields["Status"] = "Scratched"

            formula = (
                'AND({Race ID}="'
                + race.replace('"', "")
                + '",{Horse}="'
                + horse.replace('"', "")
                + '")'
            )

            lookup_url = (
                f"https://api.airtable.com/v0/{BASE}/{TABLE}?"
                + urlencode({
                    "filterByFormula": formula,
                    "maxRecords": 2
                })
            )

            records = get(lookup_url, token).get("records", [])

            if len(records) != 1:
                raise ValueError(
                    f"Expected exactly one existing runner, got {len(records)}"
                )

            patch(records[0]["id"], fields, token)

            output.append({
                "raceId": race,
                "horse": horse,
                "status": "updated"
            })

        except Exception as error:
            errors.append({
                "horse": row.get("horse"),
                "error": str(error)
            })

    pathlib.Path("generated").mkdir(exist_ok=True)

    pathlib.Path("generated/weekly-research.json").write_text(
        json.dumps({
            "asOf": asof,
            "updated": output,
            "errors": errors
        }, indent=2)
    )

    print(f"Updated {len(output)} runners; {len(errors)} errors")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
