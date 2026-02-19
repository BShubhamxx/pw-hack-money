"""
CSV Parser & Validator for transaction data.

Expected CSV columns:
    transaction_id  (str)
    sender_id       (str)
    receiver_id     (str)
    amount          (float)
    timestamp       (datetime — YYYY-MM-DD HH:MM:SS)
"""

import csv
import io
from datetime import datetime
from dataclasses import dataclass
from typing import List


@dataclass
class Transaction:
    """A single parsed transaction record."""
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: datetime


REQUIRED_COLUMNS = {"transaction_id", "sender_id", "receiver_id", "amount", "timestamp"}


class CSVParseError(Exception):
    """Raised when the CSV file is invalid or malformed."""
    pass


def parse_csv(content: bytes) -> List[Transaction]:
    """
    Parse raw CSV bytes into a list of validated Transaction objects.

    Args:
        content: Raw CSV file bytes.

    Returns:
        List of Transaction objects.

    Raises:
        CSVParseError: If the CSV is malformed, missing columns, or has invalid data.
    """
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise CSVParseError("File is not valid UTF-8 encoded text.")

    reader = csv.DictReader(io.StringIO(text))

    if reader.fieldnames is None:
        raise CSVParseError("CSV file is empty or has no header row.")

    # Normalize column names (strip whitespace, lowercase)
    cleaned_fieldnames = [f.strip().lower() for f in reader.fieldnames]
    missing = REQUIRED_COLUMNS - set(cleaned_fieldnames)
    if missing:
        raise CSVParseError(f"Missing required columns: {', '.join(sorted(missing))}")

    # Build column index mapping (handle case/whitespace variations)
    col_map = {}
    for original, cleaned in zip(reader.fieldnames, cleaned_fieldnames):
        if cleaned in REQUIRED_COLUMNS:
            col_map[cleaned] = original

    transactions: List[Transaction] = []
    seen_ids: set = set()

    for line_num, row in enumerate(reader, start=2):
        try:
            txn_id = row[col_map["transaction_id"]].strip()
            sender = row[col_map["sender_id"]].strip()
            receiver = row[col_map["receiver_id"]].strip()
            amount_str = row[col_map["amount"]].strip()
            ts_str = row[col_map["timestamp"]].strip()

            # Validate non-empty
            if not all([txn_id, sender, receiver, amount_str, ts_str]):
                continue  # Skip rows with empty critical fields

            # Skip duplicates
            if txn_id in seen_ids:
                continue
            seen_ids.add(txn_id)

            # Skip self-loops (sender == receiver)
            if sender == receiver:
                continue

            # Parse amount
            amount = float(amount_str)
            if amount <= 0:
                continue  # Skip zero/negative amounts

            # Parse timestamp
            timestamp = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")

            transactions.append(Transaction(
                transaction_id=txn_id,
                sender_id=sender,
                receiver_id=receiver,
                amount=amount,
                timestamp=timestamp,
            ))
        except (ValueError, KeyError):
            continue  # Skip malformed rows silently

    if not transactions:
        raise CSVParseError("No valid transactions found in the CSV file.")

    return transactions
