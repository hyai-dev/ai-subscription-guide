#!/usr/bin/env python3
"""Recompute the fictional CSV exercise with Python's standard library.

No network, no writes, and no model calls. This supports only the exercise's
declared fields, row grain, currency, duplicate rule, and payment statuses.
It is not a general-purpose accounting or spreadsheet auditing program.
"""
import csv
import json
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

FIELDS = ["record_id", "category", "status", "quantity", "unit_price", "refund_amount"]


def money(value):
    return format(value, ".2f")


def calculate(path):
    with path.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != FIELDS:
            raise ValueError("字段或字段顺序与练习约定不一致")
        rows = list(reader)

    result = {"example": "Synthetic teaching records; not real sales", "currency": "CNY",
              "input_rows": len(rows), "included_records": 0, "duplicate_rows": 0,
              "unpaid_rows": 0, "needs_review_rows": 0}
    seen = {}
    included = []
    category_net = {}
    gross = refund = Decimal("0")
    for line, row in enumerate(rows, start=2):
        if None in row or any(row.get(field) is None for field in FIELDS):
            raise ValueError(f"CSV第{line}行列数不一致")
        key = row["record_id"]
        if not key or not row["category"]:
            raise ValueError(f"CSV第{line}行缺少记录ID或分类")
        if key in seen:
            if row != seen[key]:
                raise ValueError(f"同ID不同内容：{key}；先核对，不能输出正式合计")
            result["duplicate_rows"] += 1
            continue
        seen[key] = row
        if row["status"] == "unpaid":
            result["unpaid_rows"] += 1
            continue
        if row["status"] != "paid":
            raise ValueError(f"CSV第{line}行付款状态未知")
        if any(row[field] == "" for field in ("quantity", "unit_price", "refund_amount")):
            result["needs_review_rows"] += 1
            continue
        try:
            quantity = Decimal(row["quantity"])
            price = Decimal(row["unit_price"])
            returned = Decimal(row["refund_amount"])
        except InvalidOperation as exc:
            raise ValueError(f"CSV第{line}行不是有效十进制数字") from exc
        if not all(x.is_finite() for x in (quantity, price, returned)):
            raise ValueError(f"CSV第{line}行含非有限数值")
        if quantity <= 0 or quantity != quantity.to_integral_value() or price < 0:
            raise ValueError(f"CSV第{line}行数量或单价超出练习规则")
        if any(x != x.quantize(Decimal("0.01")) for x in (price, returned)):
            raise ValueError(f"CSV第{line}行金额超过两位小数")
        amount = quantity * price
        if returned < 0 or returned > amount:
            raise ValueError(f"CSV第{line}行退款超出原金额")
        net = amount - returned
        gross += amount
        refund += returned
        category_net[row["category"]] = category_net.get(row["category"], Decimal("0")) + net
        included.append({"record_id": key, "gross": money(amount),
                         "refund": money(returned), "net": money(net)})
    result["included_records"] = len(included)
    if len(rows) != sum(result[x] for x in ("included_records", "duplicate_rows", "unpaid_rows", "needs_review_rows")):
        raise ValueError("分流行数不守恒")
    if sum(category_net.values(), Decimal("0")) != gross - refund:
        raise ValueError("分类与总计不一致")
    result.update({"gross": money(gross), "refund": money(refund), "net": money(gross - refund),
                   "category_net": {key: money(value) for key, value in sorted(category_net.items())},
                   "included": included})
    return result


if __name__ == "__main__":
    source_path = Path(sys.argv[1]) if len(sys.argv) == 2 else Path(__file__).with_name("sample-sales.csv")
    if len(sys.argv) > 2:
        raise SystemExit("用法：python3 verify-sample-sales.py [sample-sales.csv]")
    try:
        answer = calculate(source_path)
    except (OSError, ValueError, InvalidOperation) as exc:
        raise SystemExit(str(exc))
    print(json.dumps(answer, ensure_ascii=False, indent=2))
