import importlib.util
import json
import pathlib
import sys
import types

import pytest


class UserError(Exception):
    pass


class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _item):
        return cls


class Public:
    view = staticmethod(lambda function: function)
    write = staticmethod(lambda function: function)


class Return:
    def __init__(self, calldata):
        self.calldata = calldata


class Vm:
    Return = Return

    @staticmethod
    def run_nondet_unsafe(leader, validator):
        result = leader()
        assert validator(Return(result))
        return result


class Nondet:
    response = {"v": 1, "labels": []}

    @classmethod
    def exec_prompt(cls, _prompt, response_format=None):
        assert response_format == "json"
        return cls.response


fake = types.ModuleType("genlayer")
fake.gl = types.SimpleNamespace(
    Contract=object,
    UserError=UserError,
    public=Public(),
    message=types.SimpleNamespace(sender_address="0x" + "1" * 40),
    vm=Vm(),
    nondet=Nondet(),
)
fake.gl.contract = types.SimpleNamespace(Contract=object)
fake.gl.storage = types.SimpleNamespace(TreeMap=TreeMap)
fake.TreeMap = TreeMap
fake.u256 = int
fake.Address = str
fake.__all__ = ["gl", "TreeMap", "u256", "Address"]
sys.modules.setdefault("genlayer", fake)

path = pathlib.Path(__file__).parents[1] / "contracts" / "main.py"
spec = importlib.util.spec_from_file_location("contract", path)
contract = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(contract)


def resolver(authority="0x" + "a" * 40):
    fake.gl.message.sender_address = authority
    value = contract.ModerationAppealPrecedentResolver()
    value.cases = TreeMap()
    value.nonce_index = TreeMap()
    value.actor_index = TreeMap()
    value.child_index = TreeMap()
    value.version_index = TreeMap()
    value.history = TreeMap()
    value.precedents = TreeMap()
    value.rule_index = TreeMap()
    return value


def as_sender(address):
    fake.gl.message.sender_address = address


def base(**changes):
    value = {
        "rule_id": "harassment",
        "original_disposition": "REMOVED",
        "content": "A public synthetic moderation example.",
        "rationale": "The rule was applied too broadly.",
    }
    value.update(changes)
    return json.dumps(value, separators=(",", ":"))


def add(resolver_value, holding="UPHOLD", rule="harassment", text="Material example"):
    as_sender("0x" + "a" * 40)
    return resolver_value.add_precedent(rule, text, "REMOVED", holding, resolver_value.registry_revision)


def create(resolver_value, nonce="0" * 32):
    as_sender("0x" + "1" * 40)
    return resolver_value.create_appeal(nonce, base(), 0)


def freeze(resolver_value, case_id=1):
    as_sender("0x" + "1" * 40)
    record = json.loads(resolver_value.get_case(case_id))
    resolver_value.freeze_appeal(case_id, int(record["revision"]))


def test_strict_json_rejects_duplicate_keys_constants_and_extra_fields():
    with pytest.raises(UserError, match="BAD_JSON"):
        contract._loads('{"a":1,"a":2}')
    with pytest.raises(UserError, match="BAD_JSON"):
        contract._loads('{"a":NaN}')
    with pytest.raises(UserError, match="BAD_BASE"):
        contract._base(base(extra=True))


def test_fixed_removed_origin_and_bounds():
    with pytest.raises(UserError, match="BAD_DISPOSITION"):
        contract._base(base(original_disposition="ALLOWED"))
    with pytest.raises(UserError, match="BAD_RULE"):
        contract._base(base(rule_id="Bad Rule"))
    with pytest.raises(UserError, match="BAD_TEXT"):
        contract._base(base(content="x" * 1537))


@pytest.mark.parametrize(
    ("snapshot", "labels", "expected"),
    [
        ([], [], "NO_CONTROLLING_PRECEDENT"),
        ([{"holding": "UPHOLD"}], ["DISTINGUISHABLE"], "NO_CONTROLLING_PRECEDENT"),
        ([{"holding": "UPHOLD"}], ["MATERIAL"], "REMOVED"),
        ([{"holding": "REVERSE"}], ["MATERIAL"], "RESTORED"),
        ([{"holding": "UPHOLD"}, {"holding": "REVERSE"}], ["MATERIAL", "MATERIAL"], "CONFLICTING_PRECEDENTS"),
        ([{"holding": "UPHOLD"}], ["UNKNOWN"], "UNRESOLVED"),
    ],
)
def test_absolute_outcome_reducer(snapshot, labels, expected):
    assert contract._outcome(snapshot, labels) == expected


def test_registry_authority_cas_retire_and_readback():
    value = resolver()
    precedent_id = add(value, "REVERSE")
    assert precedent_id == 1
    assert json.loads(value.get_registry()) == {
        "authority": "0x" + "a" * 40,
        "revision": "1",
        "count": "1",
    }
    as_sender("0x" + "2" * 40)
    with pytest.raises(UserError, match="UNAUTHORIZED"):
        value.retire_precedent(1, 1)
    as_sender("0x" + "a" * 40)
    with pytest.raises(UserError, match="STALE_REVISION"):
        value.retire_precedent(1, 0)
    value.retire_precedent(1, 1)
    record = json.loads(value.get_precedent(1))
    assert record["active"] is False
    assert record["retired_revision"] == "2"


def test_create_snapshots_all_active_records_and_replay_is_idempotent():
    value = resolver()
    add(value, "UPHOLD", text="First")
    add(value, "REVERSE", text="Second")
    case_id = create(value)
    record = json.loads(value.get_case(case_id))
    assert record["domain"]["snapshot_revision"] == "2"
    assert [item["id"] for item in record["domain"]["snapshot"]] == ["1", "2"]
    assert value.create_appeal("0" * 32, base(), 0) == case_id
    assert value.get_count() == 1
    assert json.loads(value.get_case(case_id))["revision"] == "1"


def test_late_registry_change_cannot_change_existing_snapshot():
    value = resolver()
    add(value, "UPHOLD", text="First")
    create(value)
    add(value, "REVERSE", text="Later")
    snapshot = json.loads(value.get_case(1))["domain"]["snapshot"]
    assert [item["text"] for item in snapshot] == ["First"]


def test_replace_preserves_rule_and_freeze_blocks_further_edits():
    value = resolver()
    create(value)
    as_sender("0x" + "1" * 40)
    value.replace_appeal(1, base(content="Revised public example"), 1)
    with pytest.raises(UserError, match="BAD_RULE"):
        value.replace_appeal(1, base(rule_id="spam"), 2)
    value.freeze_appeal(1, 2)
    frozen = json.loads(value.get_case(1))
    assert frozen["phase"] == "FROZEN"
    assert frozen["base_locked"] and frozen["response_locked"]
    with pytest.raises(UserError, match="BAD_STATE"):
        value.replace_appeal(1, base(), 3)


def test_resolve_compares_full_label_vector_and_commits_historical_readback():
    value = resolver()
    add(value, "UPHOLD")
    create(value)
    freeze(value)
    Nondet.response = {"v": 1, "labels": ["MATERIAL"]}
    as_sender("0x" + "3" * 40)
    value.resolve_appeal(1, 2)
    record = json.loads(value.get_case(1))
    assert record["phase"] == "DONE"
    assert record["outcome"] == "REMOVED"
    assert json.loads(value.get_version(1, 3))["last_operation"]["method"] == "resolve_appeal"


def test_result_vector_rejects_wrong_shape_length_and_label():
    with pytest.raises(UserError, match="BAD_RESULT"):
        contract._result({"v": 1, "labels": []}, 1)
    with pytest.raises(UserError, match="BAD_RESULT"):
        contract._result({"v": 1, "labels": ["RELEVANT"]}, 1)
    with pytest.raises(UserError, match="BAD_RESULT"):
        contract._result({"v": 1, "labels": ["MATERIAL"], "reason": "x"}, 1)


def test_pagination_and_missing_reads_are_bounded():
    value = resolver()
    assert value.get_case(1) == "null"
    assert value.get_version(1, 1) == "null"
    assert json.loads(value.list_cases(1, 4)) == {"ids": [], "next": "0"}
    with pytest.raises(UserError, match="BAD_PAGE"):
        value.list_cases(0, 4)


def test_address_normalizes_runtime_calldata_address():
    class RuntimeAddress:
        as_hex = "0x" + "ab" * 20

    assert contract._address(RuntimeAddress()) == "0x" + "ab" * 20
