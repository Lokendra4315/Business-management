# Business Manager add-on features

The mobile app opens these tools from a business dashboard:

- **Recurring transactions:** weekly or monthly schedules create income/expense records on the API server. The first run date is included. Monthly schedules stay on their original day where possible (for example, a schedule started on the 31st runs on the last day of shorter months).
- **Invoices and receipts:** create invoices, share them as PDFs, mark them sent, and record payments. Recording a payment creates one matching income transaction. Invoice delivery is manual; the app does not send email.
- **Budgets and alerts:** create monthly category limits. The budget screen shows spending and displays an in-app alert at 80% or more of a limit. These are not push notifications.
- **Backup and exports:** share a JSON backup of owned business records, restore by merging missing records without deleting existing data, or share transaction CSV files. Team membership is not included in backups.
- **Team access:** add registered users by email and assign Admin, Editor, or Viewer access. Invitations are immediate account access, not email invitations. Owners and admins manage the team; viewers can read but cannot change business records.
- **Dashboard insights:** the dashboard compares monthly income and expenses for the last six months.
- **Transaction history:** transactions show who recorded them; authorized owners, admins, and editors can move eligible entries to deleted history unless linked to a paid invoice. Deleted entries remain visible but are excluded from totals and budgets. Attach up to five private photo/PDF files per transaction (10 MB each).
- **Filtered exports:** choose a date range and a team member to filter the on-screen history and export matching PDF or CSV reports, including each transaction's active/deleted status.

## Database update

After updating the project, apply the additive Prisma schema changes and regenerate the client from the `backend` directory:

```bash
npx prisma db push
npx prisma generate
```

Restart the API server after applying the schema. Keep the API process running for recurring schedules; if it is offline, due transactions are caught up when it runs again. Run one API server process for this scheduler.

Backups contain account-owned businesses and their transactions, recurring rules, invoices, and budgets. Restores merge records and never delete current data. Store backup files securely because they contain financial and customer information.

Transaction attachment files are stored privately under `backend/storage/transaction-attachments`; do not serve this directory as a public static folder. Backups currently do not include attachment file contents.
