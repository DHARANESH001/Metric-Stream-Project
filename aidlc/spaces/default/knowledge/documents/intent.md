# Intent

Workshop template. Fill in the sections marked (fill in) and leave the
rest as-is. Keep it small --- one service, one or two features.

## How to run

Save this file as aidlc/spaces/default/knowledge/documents/intent.md

Start the workflow:

/aidlc express --depth minimal --test-strategy minimal --review advisory
--guard-policy off --summary-confirmation off

Then send:

Read aidlc/spaces/default/knowledge/documents/intent.md and build what
it describes

When the agent asks a question, "recommended" is almost always the right
answer. You'll still hit a few approval gates and one Plan Approval
before any code is written --- read them, then approve.

Prerequisites: Python 3 only. No Docker required --- the app and its
tests run locally with plain pytest.

## Run configuration --- leave as-is

Standing instruction to the agent: accept all recommended options by
default; only ask when a decision is genuinely blocking and has no
reasonable default. Record assumptions and keep going --- never stop
just to confirm one.

## What to build

Build a small Inventory Counter API that lets users create inventory
items and check each item's current stock. Users can increase or
decrease stock quantities, and the service reports when an item reaches
or falls below its low-stock threshold.

## Who uses it

Small-shop staff or developers calling a local JSON API.

## Must-have behaviors

- Create an inventory item with a name, initial quantity, and low-stock threshold.
- Increase or decrease an item's stock and return the updated quantity and low-stock status.
- No authentication, web UI, or cloud deployment.
- Reject a stock decrease that would make the quantity negative; stock must never drop below zero.

## Out of scope

- No authentication, web UI, or cloud deployment.

## Decisions already made --- leave as-is (adjust only if you care)

- Stack: Python with a file-based SQLite database (or a simple in-memory store) --- no Docker, no database server to install. Any cloud/Terraform is authored, not applied.
- Tests: plain pytest, run locally. Do not require Docker, testcontainers, or an external database.
- Auth: none for now (keep it simple).
- Performance, availability, retention, compliance, other non-functional targets: accept recommended defaults.

## Assumptions --- leave as-is

Accept all reasonable assumptions; record them in the artifacts and keep
moving. Do not stop to confirm an assumption.
