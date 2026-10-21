---
title: "About: kakao-auto-sender"
date: 2026-10-21
tags: [android, project-overview]
layout: post
---

<div class="ai-summary" markdown="1">
The post describes **kakao-auto-sender**, an Android app that schedules and runs python "jobs" on a phone with the screen off. It is the intended replacement for an earlier low-code automation flow, which is still the live one.

 The workflow being automated pulls news summaries and pushes them into a KakaoTalk chat. The previous implementation used the **Automate** app driving **Termux** through the Termux Tasker plugin - the flow counted the files in the `new` directory, worked out when each of them should be sent so they were evenly spaced between the start and stop times, and slept until the next one was due. It worked, but it randomly kept breaking - not sending messages, silently failing, sending one message several times, not moving the file when it should after sending - and it was hard to debug when it did, because adding logging blocks was cumbersome, the output sometimes didn't pipe to the logs, and the debug block is a text field where longer expressions got messy. The Automate app also doesn't work on Samsung DeX, so being forced to do it on mobile became quite annoying. The new app re-implements the same scheduling model - a daily window, posts spaced evenly by the number of files available, a frequency recalculated each new day - as a real application instead. It also records what every run did, which the flow could not: per-job state, a live countdown to the next run, and the exact command, input context, stdout and stderr for each one.

 Technically it is **Kotlin + Jetpack Compose + Room**. Scheduling is `AlarmManager.setAndAllowWhileIdle` into a foreground `ExecService` holding a `PARTIAL_WAKE_LOCK`, deliberately inexact so no exact-alarm permission is needed. Jobs run through **Termux** via a `RUN_COMMAND` intent into `termux-chroot`, and results come back through a `PendingIntent` bundle carrying stdout, stderr and the exit code. The script reports its own state on stdout (`DAY=`, `COUNT=`, `INDEX=`, `DONE=`, `DELAY=`) and receives the previous run's facts back as `--prev-*` arguments. The timing and day-rollover rules are pure functions over an injectable clock, covered by JVM unit tests.

 The project is explicitly WIP - the Automate flow is still the live one, the job script hasn't been ported to the app's protocol yet, and the app has not yet replaced the flow in practice.

 **In short:** the same automation, rebuilt as an app - because the flow kept breaking in ways that were hard to pin down, and even harder to debug from a phone screen.
</div>

## What is kakao-auto-sender?

an android app that schedules and runs python "jobs" on the phone. the jobs run with the screen off, inside a daily time window, and the app keeps track of what is supposed to run when.

it's what will replace the automation flow i built in july - the one where the [Automate](/blog/android-automate) app drove Termux through the Termux Tasker plugin to push a news summary into a kakaotalk chat, spaced evenly across the day's window.

the requirements are the same ones from that post:
- the flow starts at a set time in the morning and stops at a set time in the evening
- the posts are spaced evenly, based on how many files are available
- the spacing is recalculated on each new day, and stays the same within a day

what's different is that it's an app now, instead of a low-code flow.

## The flow it replaces

the flow was the [Automate](/blog/android-automate) app driving Termux through the Termux Tasker plugin. it counted the files in the `new` directory, worked out when each of them should be sent so they were evenly spaced between the start and stop times, and slept until the next one was due. when it woke up, it ran a shell script to push a news summary into the kakaotalk chatroom.

it worked, but it randomly kept breaking:
- not sending messages
- silently failing
- sending one message several times
- not moving the file when it should after sending

and it was hard to debug when it did:
- adding logging blocks became a bit cumbersome
- the output sometimes didn't pipe to the logs
- the debug block is a text field where you write expressions, and writing anything longer in there started to get really messy
- and it was hardest of all when the script was python rather than bash

the thing that made it the worst part was that the Automate app doesn't work on samsung dex, so being forced to do it on mobile became quite annoying.

automate's free tier also caps you at 30 blocks, and by the time i'd broken the problem into smaller pieces i'd outgrown that.

the scheduling model itself wasn't what was broken though. the flow already recalculated the delay on a new day, spaced the posts evenly by how many files there were, and paused outside the window. the app implements the same model - and records what every run did.

that flow is still running. this app is what replaces it.

## Why not just cron in Termux?

the obvious alternative is to skip the app entirely and let a cron job run the script inside termux. i went the other way, for a set of reasons:
- i'm not familiar with cron jobs, and i wasn't sure they were the right tool for the job in the first place
- it was too hacky
- the lifecycle of the workflow was hard to monitor - when did the last one run, did it work, what's the next one
- logs were hard to collect, and harder to debug from
- i didn't know how it interacted with android's power saving mechanisms
- it wasn't user friendly
- and underneath it was all bash, which i don't enjoy. kotlin is a language i can read much more easily
- i'm not sure how extensible it would have been

## How it works

### scheduling

the job has to run on a phone that's sitting idle with the screen off, which is the awkward part of doing this on android. the app uses `AlarmManager.setAndAllowWhileIdle` to wake up at the next slot, then a foreground `ExecService` picks it up and holds a `PARTIAL_WAKE_LOCK` while the job runs. a `BootReceiver` re-arms everything after a reboot.

it's deliberately inexact. ±5 minutes is fine, and `setAndAllowWhileIdle` avoids needing `SCHEDULE_EXACT_ALARM`, which on android 12+ is both a permission prompt and a Play review problem.

### the timing rules

the requirements from the old post - start at a set time, space the posts evenly by the number of files, recalculate on a new day, hold steady within the day - turn into pure functions in `ScheduleMath.kt`, with the clock injected rather than read from the system. that's what made them testable: the day-rollover and timing rules are covered by 40 JVM unit tests, instead of waiting for a real day to pass.

two of those rules took some working out:
- the new-day check compares the day the *script* reported against the stored one, not "today minus one". if the phone is off for two days, a "one less" check would wrongly treat it as the same day and never re-initialise.
- the interval is measured from the *end* of the previous run, not from the moment the app happened to schedule it. and the first task of the day starts at the start time, not at "now plus interval".

### running the job

the app doesn't run python itself, it hands the job to Termux:

```
app → ExecService → TermuxRunner fires com.termux.RUN_COMMAND
                     at com.termux.app.RunCommandService
      → termux-chroot → launcher.sh → the python script
      ← PendingIntent bundle: stdout, stderr, exitCode
      → TermuxResultReceiver → ResultBus → the app
```

the chroot has one wrinkle worth knowing about: `/sdcard` doesn't exist inside `termux-chroot`, so paths are rewritten to Termux's own `~/storage/shared` before being sent.

this started out as a file poll - the script writes to `out.txt` and the app polls for it - which needed `MANAGE_EXTERNAL_STORAGE` and a pile of permission wrangling. then the Termux wiki obsoleted it: since 0.109, Termux returns stdout, stderr and the exit code directly through the `PendingIntent`. so the shared-file business went away entirely.

### the protocol

the script is the source of truth for what's still outstanding. it reports on stdout:
- `DAY=` the day it ran
- `COUNT=` how many items are pending
- `INDEX=` which item it just handled
- `DONE=`
- `DELAY=` optional, the interval for the day

the app parses only an explicit `DELAY=`. that used to fall back to "the first integer in stdout", which quietly overwrote the configured interval whenever the script happened to print a number - a `30` in the output would reset a 1 minute interval to 30 minutes. there are regression tests covering exactly that now.

### the run context

the other half of the protocol is what goes *in*. the app passes the previous run's facts back to the script as arguments:

```
--prev-started --prev-ended --prev-duration --prev-ok
--prev-exit --prev-day --prev-failures
--job-id --job-name
```

the point is that the script doesn't need to read the app's database to know how last time went. what gets passed is small and structured - if a script needs its own output, that's a file the script writes itself.

### seeing what happened

the app has a UI for it. each job card shows its state - never run, last run ok, last run failed, disabled, running - and a live countdown to the next run. the history is per job, every run is its own row, and expanding a row gives you the full record: the exact command that was sent, the input context, and stdout and stderr untruncated.

the dev tooling follows the same idea. `dev/tui.py` is a numbered menu for build, emulator, install, push and follow-logs, and it tracks the child processes so nothing is left detached when it exits.

## Where it is now

this is WIP - it's pre-MVP, and the Automate flow is still the live one.

what's built is the whole loop: scheduling, execution, the day-rollover state machine, the run context and the history. the app → Termux → script → result round trip works on the phone. 40 JVM unit tests cover the timing and day rules, and 5 instrumented tests cover the running state.

what isn't done:
- **the job script.** the script that does the actual sending already exists - it finds the oldest file in `new/`, claims it, sends it with `agent-messenger` and moves it to `sent/`. but it's a bash script, and it doesn't speak this app's protocol. `daily_job.py` is a stub in the meantime - it does the day checks and the tracker, and nothing else.
- **proving it survives the night.** Doze, a reboot, and the app being killed mid-run are all still open questions.

## Screenshots

![job list](/assets/images/2026-10-21-about-kakao-auto-sender-3.png)
the job list. each card shows the schedule, the script, the last run, and a countdown to the next one.

![job editor](/assets/images/2026-10-21-about-kakao-auto-sender-2.png)
the job editor. the daily window, and the interval the first run of the day works out from how many files are pending.

![empty state](/assets/images/2026-10-21-about-kakao-auto-sender-1.png)
and with nothing configured yet, that's the whole app.

## Project Posts

- [2026-07-28: Automate + Termux news workflow](/blog/android-automate)
