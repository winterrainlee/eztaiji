"""Executable input/output schema checks using the current eztaiji partial dataset."""
import copy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_preparation_pair import validators, parse_json, SOURCE, convert, verify_preservation


class SchemaContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules = validators()
        cls.source = parse_json(SOURCE.read_text(encoding="utf-8"))
        cls.deployed = convert(cls.source)

    def good(self, name, value):
        self.assertEqual(list(self.rules[name + ".schema.json"].iter_errors(value)), [])

    def bad(self, name, value):
        self.assertTrue(list(self.rules[name + ".schema.json"].iter_errors(value)))

    def test_real_pair_validates(self):
        self.good("training", self.source)
        self.good("deployment", self.deployed)

    def test_semantics_preserved(self):
        verify_preservation(self.source, self.deployed)

    def test_zero_motion_preparation_is_valid(self):
        self.assertEqual(self.source["postures"]["p001"]["motionIds"], [])
        self.assertEqual(self.deployed["catalog"]["postures"]["p001"]["motionCount"], 0)

    def test_explicit_qishi_coordinate_start_is_valid(self):
        self.assertEqual(self.source["postures"]["p002"]["start"]["kind"], "explicitState")
        self.assertEqual(self.deployed["views"]["p002-start-view"]["stateId"], "p002-start")
        self.assertEqual(self.deployed["states"]["p002-start"]["feet"]["left"]["position"]["basis"], "illustration")

    def test_unknown_cannot_contain_value(self):
        x = copy.deepcopy(self.source)
        x["states"]["p001-start"]["feet"]["left"]["position"]["value"] = {"x": 0, "y": 0}
        self.bad("training", x)

    def test_string_coordinate_rejected(self):
        x = copy.deepcopy(self.source)
        x["states"]["p003-m01-end"]["feet"]["left"]["position"]["value"]["x"] = "0"
        self.bad("training", x)

    def test_inference_without_explanation_rejected(self):
        x = copy.deepcopy(self.source)
        del x["postures"]["p002"]["introduction"]["note"]
        self.bad("training", x)

    def test_inference_without_evidence_rejected(self):
        x = copy.deepcopy(self.source)
        x["postures"]["p002"]["introduction"]["evidence"] = []
        self.bad("training", x)

    def test_measurement_without_method_rejected(self):
        x = copy.deepcopy(self.source)
        x["states"]["p003-m01-end"]["feet"]["left"]["position"]["precision"] = "measured"
        self.bad("training", x)

    def test_profile_version_rejected(self):
        x = copy.deepcopy(self.source)
        x["schemaVersion"] = "99.0"
        self.bad("training", x)

    def test_source_metadata_not_allowed_in_deployment(self):
        x = copy.deepcopy(self.deployed)
        x["sources"]["tsaifucius-yijian64"]["location"] = "internal/path"
        self.bad("deployment", x)

    def test_start_cannot_replay_events(self):
        x = copy.deepcopy(self.deployed)
        x["views"]["p002-start-view"]["events"] = x["views"]["p002-m01-view"]["events"]
        self.bad("deployment", x)

    def test_pending_interpretation_cannot_carry_content(self):
        x = copy.deepcopy(self.source)
        item = x["interpretations"]["p002-m01-principle"]
        item["availability"] = "pending"
        item["reason"] = "test"
        self.bad("training", x)

    def test_unsupported_group_scope_rejected(self):
        x = copy.deepcopy(self.source)
        x["interpretations"]["p002-m01-principle"]["scope"] = {"kind": "group", "groupId": "g"}
        self.bad("training", x)

    def test_daily_training_notes_are_merged(self):
        self.assertIn("sifu-2026-09-23", self.source["sources"])
        self.assertNotIn("sifu-2026-09-23-prep1", self.source["sources"])
        self.assertNotIn("legacy-preparation", self.source["sources"])

    def test_duplicate_json_keys_fail_before_parsing(self):
        with self.assertRaisesRegex(ValueError, "duplicate JSON key"):
            parse_json('{"x":1,"x":2}')

    def test_nonfinite_json_is_not_silently_allowed(self):
        with self.assertRaisesRegex(ValueError, "non-finite"):
            parse_json('{"x":NaN}')


if __name__ == "__main__":
    unittest.main(verbosity=2)
