---
title: "june 27"
date: 2026-06-27
tags: [word-game, debugging, learning, fuckup, shipping, ai, frustration, goal, rants, derail, typescript]
layout: post
---

_This is part of the [end-word](/blog/about-end-word) project — a multiplayer word game built with React and Supabase._

## [end-word]

in the 끝말잇기/word chain game, a room is created by a host. this makes the host automatically the 1st player in the round. The feature to add was to allow the host to toggle between being a spectator (watch-only) and player. Otherwise creating the room forces the host to play the game too, which is dumb. lol.

![host room creation flow](/assets/images/2026-06-27-2.gif)

_host is automatically a player_

![player room join flow](/assets/images/2026-06-27-3.gif)

_however players joining the room can choose to spectate or play_

initially I gave the task to opencode + deepseek to do. however, compared to cursor the harness isn't as sophisticated, so the implementation only delivered 70% of what was needed. I created the UI for the toggling and wanted the AI to wire the server logic, but it ended up redoing the UI and also botched the server implementation.

<span class="inline-tag i-t-goal">[goal]</span> fix the host <> spectator toggle.

there were a bunch of issues with toggling between host and spectator. the biggest issue was that I didn't even know what was happening, since (drumroll) I didn't write jackshit :D 

i looked through the code and had a very shaky understanding of what's going on. I see familiar code, stuff before the supabase refactor. and I see a lot of newer code, which I don't get.

this reminds me of a struggle i've always had with libraries and codebases of things i'm new to. there are always "fixes" to "problems" in the library/code, but the fixes seem so convoluted and difficult to understand, because I haven't experienced the problem. I find this exists a lot with web technology. _"pass this middleware function to deal with that security thing otherwise you'll fumble on this specific edge case"_. this is sort of what I was feeling here, the AI code covered edge cases by doing things in certain ways which made it harder for me to understand what's going on.

anyhow, the best (and conversely most primitive) way I know to go about this is to smack my head against the wall until it makes sense. in other words, run the app, manually go through the flow and debug things endlessly until it clicks. while I started this gruelsome process, I wondered if there was a better way to do this... aha, of course there is. my playwright tests (which I conveniently have not updated since I made a bunch of UI changes some weeks back).

so I opened up my tests. and immediately, became sidetracked.

the tests look like this:
```typescript
test(roomFlowTestNames.testName, async ({ browser, request }, testInfo) => {
	// skips the test if it's not run through the custom runnner, because the test requires specific env vars to be enabled.
    if (envGet("CUSTOM_PLAYWRIGHT_RUNNER") !== "true")
        test.skip(true, "CUSTOM_PLAYWRIGHT_RUNNER not set to true");

    // setup the browser pages
    const {
    	pages,
    	contexts,
    	clientLogs,
    	log,
    	dom
    } = await setupPages(browser, 2);

    try {
       // test logic
    } catch (err) {
        log(`TEST ERROR: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
    } finally {
        await testCleanUp(contexts, clientLogs, request, log);
    }
});

```

<span class="inline-tag i-t-derail">[derail]</span> the test logic for every test is wrapped in this try/catch block. kinda gross no? especially when there's a dozen or so tests. so I thought maybe I can just do a quiiiiick little refactor before I continue with the main quest of fixing the host/spectator toggling. hah...

so I asked gpt what's the standard way of implementing something like a decorator in typescript.

so this was my implementation:

```typescript
async function _errorHandle(
    f: (...args: unknown[]) => unknown,
    log: (msg: string) => void,
    contexts: BrowserContext[],
    clientLogs: LogEntry[],
    request: APIRequestContext,
) {
    try {
        f();
    } catch (err) {
        log(`TEST ERROR: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
    } finally {
        await testCleanUp(contexts, clientLogs, request, log);
    }
}
```

idk if it was good or not, but it seems like it should work. right...?

and so the annoyances started stacking...

<span class="inline-tag i-t-derail">[derail]</span> fuck knows what was wrong with cursor, but the auto format wasn't working. that's pretty irritating. I spent a bit tinkering with the ide (the last thing you want to do... when you're taking a *quick detour* before addressing the **actual problem**). didn't work. I said fuck it and opened zed instead.

i run the test using the npm command, but the test just wouldn't work. it just kept skipping...?! super strange. I spent quite some time trying to figure out what on earth is going on. why is it just skipping the test. what did I do wrong in the refactor that just messed up everything. maybe an hour or so later, aha. I used the wrong npm command :D

now using the correct npm command of `npm run test:playwright:custom` I run the test with this new error handler. aaaaand it doesn't work. at this point I spent half the energy I had in me. screw this tangent, let me just get on with the real work.

alright. back to the actual problem.

i wanted to write an e2e test for the toggling so that I didn't have to manually run the entire user flow. when starting to write the test logic I realised that there was no visual indicator to tell if the toggle has worked, after clicking the host/spectator button. so I added status text showing if the host is "playing" or "spectating". felt a little silly for not having noticed that, but one thing I realised is that I have so many oversights when developing things, and every end-user testing session always has me thinking "ooh, I didn't think of that!"

![updated host view](/assets/images/2026-06-27-4.png)

in the zed file browser panel, there are coloured indicators to show different things. green means a new file was added since the last commit, orange means something was updated or there's a warning detected by the LSP, red means something was deleted or there's an error detected by the LSP. the `components` folder was bright red. naturally, that means there's an error. the file tree doesn't say which file is the offending one, the `problems` panel doesn't point to any errors... it was really, _really_ getting on my nerves.

![zed error](/assets/images/2026-06-27-1.png)

<span class="inline-tag i-t-derail">[derail]</span> and so... I started going through all the files. there were errors that the LSP was showing me (which didn't appear in cursor) around react. a few different ones. some were simple to resolve, but the biggest pain in the arse was about not using `setState` inside of a `useEffect`. I have no fucking idea what it's about. but they were errors. 

![set state in effect](/assets/images/2026-06-27-5.png)
_react-hooks/set-state-in-effect. I understood that it didn't want me to use setState inside of an effect, but no matter how much I search/ask gpt, I just didn't get why..._

i had gpt rewrite the ThemeToggle component to avoid updating state inside an effect — thought that would fix whatever eslint config was flagging those folders red. it didn't. then I went down a rabbit hole trying to find every eslint error in the project. I have no idea why I thought this was productive. the folders stayed red.

at this point I was starting to feel irritated and exhausted. every tangent creates more disorganised changes, and none of the tangents are resolving into anything satisfying. I ended up just adding eslint ignore statements and guess what... the folder's still fucking red.

after a bit I realised that the playwright tests aren't going to be useful. the tests aren't setup in a way where I can directly see the server output logs, so i'm not able to debug the server code. so after all this, I ended up back to square one. manually running the app.

i made some progress, the host is able to switch to a spectator as far as the UI and game state is concerned. but then the switch back from spectator to host was bugging out. 

more debugging later:
	- the `players` array is emptied after HOST > SPEC
	- this is a property of the server game state which tracks all the players of the game. it being emptied after the host switches to a spectator breaks everything

at this point I was slightly more informed about the server logic, but I still wasn't 100% sure about exactly what's happening. it seems like values are not being passed properly in the `hostRoleService.ts` file. I juggled between some ideas:
	- maybe the server code doesn't need to change. the host changing to a spectator is basically the same as a player "disconnecting".
	- when they join back, it should just be like a player has "connected"
	- the difference is that the host client should send the userId on the reconnect
	- the code is trying to get the userId from the socketMap, but the entry is deleted from there... so surely the data can just come from the client?
	- I think that's missing?

my brain was just kaput at this point. and my room was 35 degrees...

끝
