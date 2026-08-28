import { Effect, pipe } from "effect";

const program = pipe(
  Effect.succeed("asdf"),
  Effect.andThen((state) =>
    Effect.gen(function* () {
      console.log("runs successfully:", state);
    }),
  ),
);

Effect.runPromise(program);
