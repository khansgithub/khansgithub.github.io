---
title: "october 11"
date: 2026-10-11
tags: [remotion, debugging, audio, learning]
layout: post
---

_This is part of the [remotion-shadowing](/blog/about-remotion-shadowing) project - a tool for building english shadowing lesson videos programmatically, without touching a timeline._

i've been working on a small tool to programmatically build videos, without directly touching a timeline or any video editor tools. it uses [Remotion](https://www.remotion.dev/) and the video is controlled mostly with a `config` object. 

## extended track

i had gemini generate an audio file for some background audio. however when i aligned it to the rest of the video, it was just a few seconds short. i tried to get gemini to recreate it longer but it couldn't exactly reproduce it. so it made a track with the same bpm and similar sounding sounds. i pulled the two tracks into Audacity, and tried different ways to extend the original track, using the second generated audio.

i took a section from the second audio track, and aligned it with the end of the original audio track by the kicks. i added a crossfade to blend the audio. after this i decided to clip off the rest of the audio as the track would have been much longer than i needed. i also wanted to minimise how many features i'm adding to the tool with ai as it would teeter the project into a culmination of tools which slowly turn into a mess.

the result was good enough to use, especially since it was being played at low volume - the difference between the original track and extended section didn't stand out too much.

## fade clip

while working with the audio more, i noticed that the extended track would have an audible clip when faded out, instead of fading out smoothly. but this only happened in the rendered output. i was totally confused. playback in Remotion Studio is smooth but the export has an audible sudden cutoff, where i expected the audio to gradually fade to silence. i wrecked my brain against this - i had ai troubleshoot this and pinpoint the error but it just kept going in circles.

### segment render

i tried to render just the specific segment, and compare it to the output video. turns out, they're both exactly the same - both had the audio clip.

### gain table

i thought that maybe the reduction in volume wasn't smooth enough, or it was being rounded to too few significant figures. so i asked ai to list the exact db value it applied to the audio each frame. ai printed out a table with the volume values for each frame in that segment. the gain levels looked fine - they were granular and gradual.

### overlay insert

there is another part of the config where audio snippets can be overlayed. in that section, there was a sound effect which occurred at a similar time to the background music fade out segment.

```
inserts:[
    {
        after: "Your coffee will be ready down the end",
        kind: "audio",
        src: "walking_hallway.wav",
        offsetSecs: 1,
        seconds: 6,
        gapAfterSecs: 1.2,
        volume: 1, // debug
        transitionIn: "fade",
        transitionOut: "fade",
        transitionOutSecs: 1.2,
    },
    ...
]
```

i thought maybe it was covering the fade out or interfering with it...? i don't fucking know lol. so i set the volume to 0 and re-rendered the segment. unsurprisingly, the clipping was still there.

### keyframes

i wasn't sure where to look next. the code has keyframes which control the audio volume:

```
keyframes: [
    { atSecs: 0, volume: 0 },
    { atSecs: 5.9, volume: 0 },
    { atSecs: 6, volume: 1 },
    { atSecs: 8, volume: 7 },
    { atSecs: 9, volume: 9 },
    { atSecs: 15, volume: 6 },
    { atSecs: 17, volume: 3 },
    { atSecs: 60, volume: 3 },
    { atSecs: minToSec(1.22), volume: 3 },
    { atSecs: minToSec(1.27), volume: 0 },
    ...
]
```

i moved around the keyframes trying to see if perhaps the duration for the fadeout was just too short. however, increasing the fadeout duration to 2s+ still didn't make a difference.

### audacity fade

i then went to Audacity and said fuck it, let me just render the video and then edit this fade out manually. i noticed something odd. the waveform was small since the volume of the background music was low, so that's expected. however, using the fade out plugin just didn't fade it out as expected. no matter what i did, even with audacity, the audio simply would not cleanly fade into silence without the clip.

this was perplexing but i didn't know what to do with this information. i just mindlessly looked around things hoping to just suddenly figure it out.

<!-- add image -->

### tail cut

the fix i decided was to directly add the fadeout into the audio file. it's not nice but at this point i don't really have any other option. this is where it all made sense.

the `bgm2-extended` audio file was the original audio that gemini generated, plus the extended version that glued on to it. and i also cutoff the tail end of the track as i needed it to be a certain length (i didn't want to add a start/end config per bgm audio file feature). the audio ended on a snare hit, with lots of midrange frequencies and high end melodic frequencies. of course this won't cleanly fade out. the frequencies aren't working in a way to help it fade out cleanly.

### sweeping low pass

i had a hunch which sounds were the offenders, but i struggled to EQ the right frequencies. so instead i thought to just add a low pass filter at 1kHz. however, this had to be a sweeping filter, but Audacity doesn't support filter automation. i asked ai to see if there happened to be any existing tool precisely for this, but there didn't seem to be. so i just stuck with ffmpeg. i asked ai to apply a sweeping low pass filter + volume filter for the last few seconds of the audio.

i swapped out the edited audio into the timeline, and viola, the cut disappeared.
