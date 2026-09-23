"""Offline JSON Schema gate for the preparation pilot, not the production site build.

Requires Python 3.10+, jsonschema from requirements-dev.txt, and Node for conversion.
Run from any directory: python scripts/check_preparation_pair.py --emit
Only .build/preparation is written; source files, dist, and live HTML are untouched.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "training/datasets/yijian.json"


def no_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f"non-finite JSON number: {value}")


def parse_json(text: str):
    return json.loads(text, object_pairs_hook=no_duplicate_keys, parse_constant=reject_constant)


def validators():
    schemas = [parse_json(p.read_text(encoding="utf-8")) for p in sorted((ROOT / "schemas").glob("*.schema.json"))]
    registry = Registry().with_resources((s["$id"], Resource.from_contents(s)) for s in schemas)
    result = {}
    for schema in schemas:
        Draft202012Validator.check_schema(schema)
        name = schema["$id"].rsplit("/", 1)[-1]
        result[name] = Draft202012Validator(schema, registry=registry)
    return result


def check_schema(validator, value, label: str):
    errors = list(validator.iter_errors(value))
    if errors:
        descriptions = ["/".join(map(str, e.absolute_path)) + ": " + e.message[:200] for e in errors[:5]]
        raise ValueError(f"{label} schema failed ({len(errors)}):\n" + "\n".join(descriptions))


def convert(source: dict, script=False):
    command = ["node", str(ROOT / "scripts/compile-data.mjs")]
    if script:
        command.append("--script")
    run = subprocess.run(command, input=json.dumps(source, ensure_ascii=False, allow_nan=False),
                         text=True, capture_output=True, check=False, timeout=20)
    if run.returncode:
        raise ValueError("conversion failed: " + run.stderr.strip())
    return run.stdout if script else parse_json(run.stdout)


def verify_preservation(source, deployed):
    # Complement structural validation with direct field-by-field comparisons.
    assert deployed["meta"]["datasetRevision"] == source["revision"]
    for key, state in deployed["states"].items():
        expected = {field: source["states"][key][field] for field in
                    ["id", "coordinateFrameId", "feet", "center", "body", "arms"]}
        assert state == expected, f"state meaning changed: {key}"
    for key, motion in source["motions"].items():
        view = deployed["views"][key + "-view"]
        assert view["instruction"] == motion["instruction"], key
        assert view["checks"] == motion["checks"], key
    for key, interpretation in deployed["interpretations"].items():
        assert interpretation == source["interpretations"][key], key
    assert "authoring" not in deployed
    for public in deployed["sources"].values():
        assert set(public) == {"id", "title", "url", "note"}


def run(emit=False):
    original = SOURCE.read_bytes()
    source = parse_json(original.decode("utf-8"))
    rules = validators()
    check_schema(rules["training.schema.json"], source, "training")
    deployed = convert(source)
    check_schema(rules["deployment.schema.json"], deployed, "deployment")
    verify_preservation(source, deployed)
    assert deployed == convert(source), "nondeterministic conversion"
    script = convert(source, script=True)
    assert original == SOURCE.read_bytes(), "source file changed"
    report = {"scope": "preparation-pilot", "trainingSchema": "pass", "deploymentSchema": "pass",
              "preservation": "pass", "determinism": "pass", "sourceUnchanged": True,
              "sourceFileDigest": hashlib.sha256(original).hexdigest(),
              "inputDigest": deployed["meta"]["inputDigest"],
              "postures": len(deployed["catalog"]["postures"]),
              "motions": sum(p["motionCount"] for p in deployed["catalog"]["postures"].values()),
              "views": len(deployed["views"]),
              "notTested": ["upstream martial-content accuracy", "browser layout", "Pages deployment"]}
    if emit:
        output = ROOT / ".build/preparation"
        output.mkdir(parents=True, exist_ok=True)
        # Diagnostic pair only. No dist promotion, deploy action, or stale-output fallback.
        (output / "deployment.json").write_text(json.dumps(deployed, ensure_ascii=False, indent=2, sort_keys=True)+"\n", encoding="utf-8")
        (output / "taiji-data.js").write_text(script, encoding="utf-8")
        (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--emit", action="store_true", help="write the checked example pair to .build/preparation")
    options = parser.parse_args()
    try:
        print(json.dumps(run(options.emit), ensure_ascii=False, indent=2))
    except (ValueError, AssertionError, OSError, subprocess.TimeoutExpired) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
