# Missing practice records — start here

The same login, folder and localhost address were confirmed. Do not reset the app, delete `data`, recreate the missing accounts, or upload your database or `.env` files.

1. Leave LedgerBot's running terminal alone. In VS Code, open your original LedgerBot folder and choose Terminal → New Terminal (the + button also works).
2. After updating to this branch, run `node scripts/local-data-check.mjs` in that new terminal. A separately downloaded copy can also be run from Downloads using the supplied START-HERE instructions.
3. Enter the practice login email when asked. Do not enter a password. The email is used only for a local lookup and is not included in the report.
4. Open `LedgerBot-Local-Data-Summary.txt` beside the script. It contains record counts, database filename/existence and a short reference when available. Share that summary privately with the section marked BLOCKED.
5. If Settings is accessible, compare Your saved data → signed-in email and data reference. The script checks this terminal's configured/default SQLite path; it does not read private `.env` configuration. A custom path must be reconciled before concluding that data is gone.

If the file exists but the login is absent, investigate login identity and other existing data locations without creating records. If the login exists with records, investigate the API/display/logging path. If the checked file has no records, that alone does not establish that no older file or consistent backup exists elsewhere. If it cannot be read, stop and preserve the folder.

OneDrive is a possible availability factor, not a proven cause. Keep the original folder available offline. Do not move or overwrite individual live SQLite/WAL/SHM files. Recovery must use a consistent backup and should be reviewed before replacing anything.

The diagnostic opens existing SQLite read-only and does not run migrations or repairs. It writes only its summary text file. Synthetic verification confirmed unchanged fixture bytes, no email in the report and no database created at a missing path. No actual owner records have been inspected or recovered in this update.
