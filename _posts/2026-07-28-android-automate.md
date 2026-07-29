---
title: "july 28"
date: 2026-07-28
tags: [automation, android, kakao-automation, learning]
layout: post
---

_This is part of the [kakao-agent](/blog/about-kakao-agent) project — a loose collection of automation tools that plug into KakaoTalk via agent-messenger._

## [kakao-news-automation]

as part of the automation workflow i've been building, i'm using the [Automate](https://llamalab.com/automate/) app by llamalab to run the automation loop. the logic is pretty dead simple: every 40 minutes, run a shell script via [Termux](https://termux.dev/en/) + the [Termux Tasker](https://github.com/termux/termux-tasker) plugin, which sends the message to the kakaotalk chatroom.

![automate loop](/assets/images/2026-07-28-1.png)

as with all things, once it was implemented, the ideas for improvement started flooding in:
- support sending to multiple chatrooms
- set start / stop windows
- automatically re-auth
- automatically pull new branch (new news source)

the point with the most immediate and highest return would be to automate the start and stop times. right now the workflow needs to be manually started at 8am and stopped at 9pm. if this is automated then the whole thing would be mostly hands-free (sans when there are errors or agent-messenger requires re-auth).

<span class="inline-tag i-t-goal">[goal]</span> make the flow process only during specific time windows with an even posting frequency depending on the number of files available.

the Automate app is, in every sense, really fucking cool. there's a [`TimeWindow`](https://llamalab.com/automate/doc/block/time_window.html) block that seems to do exactly what i needed. it took a little while and some testing to wrap my head around how it worked.

the `proceed` option gives two different behaviours:
- `immediately` does a check to see if the current time is within the bounds of `Time of day + Duration`. it proceeds with the flow and has a `yes/no` branch.
- `exact` pauses the flow until the current time is within the bounds of `Time of day + Duration`.

that core logic was simple enough. but now the complex part: what does the requirement of having the flow operate during specific time windows _actually_ mean?

let's break it down:
- the flow needs to begin at 8am
- the posts need to be spaced evenly based on the number of files
- the frequency depends on the number of files that are on the branch for **the current day**
- need to keep track of the day
- need the frequency to be recalculated each **new** day
- need the frequency to stay the same on the same day

this made things a wee bit more complicated. now there's a lot more state to keep track of.

i had to use a few new blocks i haven't used before, so i started breaking down the problem into smaller pieces.

how do we get the list of files? easy — use the [`FileList`](https://llamalab.com/automate/doc/block/file_list.html) block. it writes an array of file names to an output variable. to count the array, Automate has a dedicated [`#` operator](https://llamalab.com/automate/doc/expression.html) for length. clean.

how do we get the current day and keep track of it? Automate has a basic [`set`](https://llamalab.com/automate/doc/block/variable_assign.html) block. using the built-in [`Now` variable](https://llamalab.com/automate/doc/variable.html) and the [`DateFormat` function](https://llamalab.com/automate/doc/function/date_format.html) we can easily get the day value.

initially i used the [`Goto`](https://llamalab.com/automate/doc/block/goto.html) and [`Label`](https://llamalab.com/automate/doc/block/label.html) blocks to try organise the smaller workflows i was building. but the more i pieced things together, i realised it wasn't necessary and just made things more messy. also, the free version has a limit of 30 blocks lol.

![final workflow](/assets/images/2026-07-28-2.png)

after some fiddling, the final workflow panned out as follows:
- on flow start, set some constants + calculate the current day in date form
- if the current day is different to the stored day, then it's a new day — recalculate the sending frequency (`delayMins`)
- if the current time is not within the time window, pause the flow until it is

the flow will need more testing, but it's fun to see how tools like Automate and Termux make it easy to build simple low-code automation workflows. doing this on the phone was tedious, so i used [scrcpy](https://github.com/Genymobile/scrcpy) to do it from the desktop (unfortunately the app can't be used through samsung dex).

끝
