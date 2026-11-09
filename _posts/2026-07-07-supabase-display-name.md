---
title: "supabase display name"
date: 2026-07-07
tags: [word-game, debugging, learning]
layout: post
---

_This is part of the [end-word](/blog/about-end-word) project - a multiplayer word game built with React and Supabase._

<div class="ai-summary" markdown="1">
While writing e2e tests for the host/spectator switch, a missing UX indicator surfaced: there was no way to confirm a player's role ("playing" vs "spectating") changed. Digging in, `user_metadata.display_name` was expected by the game channel service, but the display name was never written during signup - so hosts rejoining after spectating always got a fallback name. The agent had added the expectation and let it fail silently, a pattern that may be hiding elsewhere.
</div>

## host spectator locators

i started adding the dom locators for the host to spectator switch feature in the e2e tests. but i realised i needed a ui element that indicates the player's role ("playing" or "spectating"). this is because after clicking the button there is no way to confirm if it worked or not. i was so caught up with the logic side of this feature, that i totally missed this obvious UX error, and only noticed when implementing the playwright test.

## display name fix

following the last debugging session for the host to spectator switch feature, i found another issue.

`user_metadata.display_name` was being mentioned in the service which sets up the game room supabase channels. `user_metadata` is a supabase user object - this meant that the code is expecting that the players `display_name` is available in the user object. however, the display name is never actually written to supabase during the player signup.

the server expects the client's display name in the supabase user object, otherwise it falls back to defaults. this meant when the host rejoined after spectating, their name was always being set to the fallback, since this value is not passed to supabase.

there are a number of issues which this highlighted. the first being that the player's name will never properly appear, since the value is missing from supabase and the fallback will always be chosen. the second, more concerning, issue is that the ai agent added this expectation into the code however also made it fail silently. perhaps this was mentioned in one of the many summaries after the agent made some code changes. however the fact of the matter was that i was totally unaware of it.

it's a scary indication that there may be many other ways the code is expecting to work, yet silently failing through a fallback, which i'm not aware of.

afterwards i asked ai to confirm if `user_metadata` was set anywhere in the code, and unsurprisingly it wasn't. i had ai implement `display_name` being set during the player registration, and to be the required mock stubs for the supabase mocks.
