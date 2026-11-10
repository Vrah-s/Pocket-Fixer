# Pocket Workshop — Game Plan

## Game idea

Play as a young fixer in a cozy top-down workshop. Walk around the room, meet customers, carry broken objects to the right bench, repair them, and return them. Each completed job brings another customer, so the shift has no final mission.

## Controls

- Desktop: arrow keys or WASD to walk; E to interact.
- Mobile: on-screen joystick to walk; Interact button to talk to customers, use a bench, or return an item.
- Respawn button returns the player to the workshop entrance without cancelling a job.

## Main loop

1. Find the customer marked with an exclamation bubble and talk to them.
2. Read their request and find the matching workbench marked by a ring.
3. Complete a short repair puzzle: clean an object, connect wires, or set a gear.
4. Carry the fixed item back to the customer.
5. Earn coins and welcome the next customer.

## Current playable version

- Walkable workshop with shelves, reception counter, sofa, door, and three distinct benches.
- Arrow-key/WASD movement, collision, mobile joystick, and interaction button.
- Endless customer rotation with generated object names, requests, and customer appearances.
- Three repair puzzle types; later jobs add more dusty spots and wire pairs and change gear targets.
- Coins and repair count save locally; an active repair stage is also preserved across reloads.
- Installable PWA with offline asset caching after a successful online load.

## Future ideas

- Let customers walk in from the door and wait in a visible queue.
- Add more workbench types such as sewing, painting, and toy assembly.
- Spend earned coins on shop decorations, new tools, and room expansions.
- Give repeat customers short story arcs and favorite objects.
- Add optional daily challenges without blocking the endless shift.

## Design constraints

- Keep repairs short and easy to understand on a phone.
- No energy timer or punitive failure.
- Always let the player pause a repair and return to it later.
- Keep the core play loop usable offline after the initial online load.

