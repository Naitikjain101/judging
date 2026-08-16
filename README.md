# Hackathon Judging Platform

A standalone web platform for hackathon judging. Organizers create hackathons, manage rounds/teams/judges, and judges log in to score only the teams assigned to them and leave feedback. Styled to match the Hacker's Unity site theme (dark, terminal-inspired accents).

## Features

### Organizer
- Create and manage hackathons (multiple organizer accounts, shared access to all hackathons)
- Add teams — manually or via CSV bulk import (headers: `name`, `members`, `projectLink`)
- Add judges — each gets a unique ID + password you set
- Create rounds within a hackathon, each with its own judging criteria
- Assign teams to judges per round
- Advance teams to the next round — manually, or via auto top-N selection based on the previous round's scores
- View a judge-view list, filterable by judge / submission status
- View the overall leaderboard per round

### Judge
- Log in with the ID + password issued by the organizer
- See a dropdown of only the teams assigned to them (per round)
- Score a team against that round's criteria and leave feedback
- Edit a submitted score/feedback at any time — not locked after submission

## Scoring Logic
- Each round defines its own criteria
- A team's final score for a round:
  - **One judge assigned** → that judge's score is final
  - **Multiple judges assigned** → average across their scores (computed live wherever it's shown — leaderboard and top-N advancement)

## Tech Stack
- Next.js 14 (App Router), plain JavaScript
- Supabase (Postgres + Auth)
- Deployed on Vercel

## Setup

**1. Create a Supabase project**, then in the SQL editor run everything in `supabase/schema.sql`. This creates all tables plus row-level security policies.

**2. Environment variables** — copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page — **server-only, never expose this** |
| `JUDGE_AUTH_DOMAIN` | Any placeholder domain, e.g. `judge.hu.local` (see note below) |

**3. Install and run**
```bash
npm install
npm run dev
```

**4. Deploy** — push to a repo and import into Vercel, adding the same env vars there.

## How judge login works
Judges don't get a normal signup flow — the organizer issues an ID + password when adding a judge. Under the hood, that creates a real Supabase Auth user with a synthetic email (`{judge_code}@{JUDGE_AUTH_DOMAIN}`) via the admin API, so judges get proper sessions and row-level security without a second auth system. This needs the **service role key**, which is only ever used server-side in `src/app/organizer/hackathons/actions.js`.

## Known simplifications (worth revisiting before a big/public event)
- Judge passwords are stored in plain text in the `judges` table so the organizer UI can display them back for sharing. Fine for an internal tool; swap for a "generate and show once" flow if you want tighter security.
- Organizer signup is open (anyone can create an account). Add an invite code or admin approval step if that's a concern.
- No email notifications — judges and organizers need to be told their credentials/links out of band.

## Project Structure
```
src/
  app/
    organizer/          # organizer auth, dashboard, hackathon/round management
    judge/               # judge auth, scoring dashboard
  components/
    hackathon/           # teams/judges/rounds management panels
    round/                # criteria, team selection, judge assignment, results
    judge/                # scoring form
  lib/supabase/          # browser/server/admin Supabase clients
supabase/schema.sql       # full DB schema + RLS policies
```
