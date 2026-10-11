# Scope 005b: see where you are (street names and a small map)

Status: asked for by Daramola (owner), 2026-10-11, after his first drive:
"How am I supposed to know where the junctions are?"

## Goal

While driving, the player always knows where they are: the name of the
street they are on, and a small map of the area with their car on it, so
they can drive to a junction they know and compare it with the real one.

## The player's story

Daramola drives off from his house. At the top of the screen it says
"Babatunde Ladega Street". In a corner, a small round map shows the roads
around him, north up, with a dot and arrow for his car and the names of the
nearby streets. He turns onto another road and the top line changes to its
name. He drives to the junction of two streets he knows and checks the shape
against the real one. On a phone in portrait or landscape, the map and the
name never cover the thumb controls.

## In scope

1. The bake also writes `places/<id>/streets.json`: every named road as its
   name and its centre line in metres (the same projection as the chunks),
   deterministic, small (report its size). Re-bake Omole from
   raw-data/omole/omole-highways.opl.
2. A street-name line at the top of the screen: the name of the nearest named
   road within about 15 m of the car (rule written in the design), or nothing
   when off any named road. Changes only when the car has been on the new road
   for a moment, so it does not flicker at junctions.
3. A corner mini-map (2D canvas, north up, about 300 m across, car dot and
   heading arrow, roads drawn from streets.json and road names on the bigger
   roads), placed so it never covers the touch controls; tap to make it bigger
   or smaller.
4. Tests for the street-finding rule, the bake output and the layout rule
   (fast, pure). Designs for every new function, written together with the
   code (owner's lighter process for non-physics work; the orchestrator
   approves them in the same pass).

## Out of scope

Turn-by-turn directions, sat nav voice, landmarks.

## Done when

`npm run check` passes; on a phone-sized screen the name and map show and
the street name is right on Babatunde Ladega Street at the start; small
commits with Story:. Do not push.
