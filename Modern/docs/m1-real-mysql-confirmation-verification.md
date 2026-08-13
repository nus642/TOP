# M1 real-MySQL confirmation verification

The repository does not currently provide an automated real-MySQL test harness.
`npm test` uses Node test doubles and does not provision a MySQL server. The
transaction integration test therefore exercises `matchOperationsService.confirmResult()`
with the real domain, service, and repository implementations against a stateful
transaction connection that models commit and rollback.

Use the following procedure against the existing rehearsal database to verify the
real driver and schema for competition `2`, match `1`, and score `11–7`.

## Preconditions

Configure the application with `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`,
`MYSQL_PASS`, and `MYSQL_DB`, then start it with `npm start`. Establish a Master
session through the deployment's normal authentication flow so that the request
is resolved as `{ actorId: "master-1", actorType: "master" }`.

Confirm the rehearsal row is ready and capture the initial Official Record count:

```sql
SELECT id, tournament_id, status, score1, score2,
       result_confirmed_at, result_confirmed_by
FROM matches
WHERE tournament_id = 2 AND id = 1;

SELECT COUNT(*) AS official_record_count_before
FROM match_official_records
WHERE tournament_id = 2 AND match_id = 1;
```

The match must report `scored`, `11`, `7`, `NULL`, and `NULL` for the confirmation
fields. Record `official_record_count_before` for comparison.

## Confirm through the application

Using the authenticated Master session cookie or token required by the deployment:

```bash
curl --fail-with-body -X POST \
  -H 'Cookie: top_actor_session=<master-1-session>' \
  http://localhost:3000/api/master-workflow/2/matches/1/confirm-result
```

Verify the committed database state:

```sql
SELECT status, score1, score2, result_confirmed_at, result_confirmed_by
FROM matches
WHERE tournament_id = 2 AND id = 1;

SELECT id, score1, score2, confirmed_at, confirmed_by
FROM match_official_records
WHERE tournament_id = 2 AND match_id = 1
ORDER BY id;
```

Expected results:

- the request succeeds rather than returning the MySQL datetime error;
- the match is `confirmed`, remains `11–7`, has a non-NULL
  `result_confirmed_at`, and has `result_confirmed_by = 'master-1'`;
- the Official Record count is exactly `official_record_count_before + 1`;
- the new record is `11–7`, has a valid `confirmed_at`, and has
  `confirmed_by = 'master-1'`.

Repeat the same `curl` command. It must be rejected with HTTP 400. Run the two
queries again and verify that the match is unchanged and the Official Record
count has not increased.
