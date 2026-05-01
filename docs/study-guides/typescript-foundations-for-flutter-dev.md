# TypeScript Foundations For A Flutter Developer

This guide is for learning the TypeScript ideas that usually feel the most unfamiliar when you come from Flutter and Dart.

It focuses on:

- compile time vs runtime
- static types vs real runtime values
- what `as` actually does
- generics like `T`
- `Promise` vs Dart `Future`
- a practical reading path
- a short 7-day study plan

## Why This Matters

When you work in NestJS, Prisma, DTOs, queues, and tests, TypeScript will constantly show up in places like:

```ts
async get<T>(key: string): Promise<T | null>
```

or:

```ts
const user = JSON.parse(raw) as User;
```

These are easy to copy without really understanding them. The goal of this guide is to make those patterns feel predictable.

## Compile Time Vs Runtime

This is the most important distinction to learn first.

### Compile time

Compile time is when TypeScript checks your code before it runs.

Examples of compile-time concerns:

- does this variable match its declared type?
- does this function return the right kind of value?
- are you calling a method that exists on this type?

Example:

```ts
const name: string = 'Kai';
```

TypeScript checks at compile time that `'Kai'` is compatible with `string`.

### Runtime

Runtime is when JavaScript actually executes.

At runtime, the program deals with real values:

- strings
- numbers
- objects
- arrays
- HTTP request bodies
- database records
- JSON from outside your code

The important point: most TypeScript type information does not exist at runtime.

So this:

```ts
const name: string = 'Kai';
```

becomes just a JavaScript value at runtime. The `: string` is gone.

## Static Types Vs Real Values

TypeScript helps the compiler understand your code, but it does not automatically validate outside data.

Example:

```ts
type User = {
  id: string;
  name: string;
};

const user = JSON.parse(raw) as User;
```

At compile time:

- TypeScript now treats `user` as a `User`

At runtime:

- `JSON.parse(raw)` can still return invalid data
- TypeScript does not inspect the real shape for you here

So this can still be wrong:

```ts
const user = JSON.parse('{"id":123}') as User;
```

TypeScript may accept it, but the real runtime value is still:

```ts
{ id: 123 }
```

## What `as` Actually Does

`as` is a type assertion.

It means:

"Treat this value as this type."

It does **not** mean:

"Convert this value into this type."

### Example 1

```ts
const raw = JSON.parse('{"id":"1","name":"Kai"}') as User;
```

This tells TypeScript to trust you that `raw` is a `User`.

### Example 2

```ts
const input = document.getElementById('email') as HTMLInputElement;
```

This tells TypeScript:

- "I know this element is an `HTMLInputElement`"

### Example 3

```ts
const role = 'ADMIN' as 'ADMIN' | 'USER';
```

This narrows the type TypeScript should use for that value.

### Important warning

This is legal TypeScript:

```ts
const value = 123 as unknown as string;
```

But runtime is still `123`, not a string.

So the best mental model is:

- annotation: "this is the intended type"
- assertion with `as`: "trust me"
- validation: "prove it"

## When `as` Is Fine Vs Risky

### Usually okay

- DOM element access when you know the exact element
- interoperability with a library that gives a broad type
- narrowing something you created yourself in typed code

### Risky

- `JSON.parse(...) as Something`
- request body data
- environment variables
- unknown API responses
- anything from outside your codebase

Rule:

If the value came from outside your code, do not trust `as` alone.

## What `T` Means In Generics

In TypeScript, `T` is a generic type parameter.

Example:

```ts
async get<T>(key: string): Promise<T | null> {
  const raw = await this.redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}
```

`T` means:

- "the caller decides what type this function should return"

If you call:

```ts
const user = await cache.get<User>('user:123');
```

then `T` becomes `User`, so the return type is:

```ts
Promise<User | null>
```

Another small example:

```ts
function identity<T>(value: T): T {
  return value;
}
```

Usage:

```ts
const name = identity<string>('Kai');
const age = identity<number>(25);
```

The caller supplies the type.

## Promise Vs Dart Future

Yes, `Promise<T>` is broadly the JavaScript/TypeScript equivalent of Dart `Future<T>`.

Rough mapping:

- `Promise<User>` ~= `Future<User>`
- `Promise<User | null>` ~= `Future<User?>`
- `await` works similarly in both languages

Example:

```ts
const user = await service.getUser();
```

This is conceptually similar to:

```dart
final user = await service.getUser();
```

The main difference to remember is not `Promise` itself. The bigger difference is that TypeScript types are easier to bypass with assertions like `as`.

## How To Figure Things Out Without AI

When a Nest error mentions a provider token like:

```ts
BullQueue_notification-queue
```

you can usually trace it by:

1. reading the constructor dependency that failed
2. opening the decorator being used
3. searching the installed package source in `node_modules`

Example search:

```bash
rg "InjectQueue|getQueueToken" node_modules/@nestjs/bullmq node_modules/@nestjs/bull-shared
```

This is a good general TypeScript/Nest habit:

- read the error literally
- inspect the decorator source
- inspect the installed package types/source

## Reading Path

Read these in order:

1. **TypeScript Handbook**
   - Everyday Types
   - Narrowing
   - More on Functions
   - Object Types
   - Generics
2. **Exploring TypeScript** by Dr. Axel Rauschmayer
   - focus on assertions, `unknown`, generics, and type guards
3. **You Don’t Know JS Yet**
   - focus on the JavaScript runtime side: values, objects, scope, and behavior

Links:

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Exploring TypeScript: https://exploringjs.com/tackling-ts/
- You Don’t Know JS Yet: https://github.com/getify/You-Dont-Know-JS

## What To Learn First

Study these in this order:

1. compile time vs runtime
2. static types vs runtime values
3. `any`, `unknown`, and `as`
4. union types like `string | null`
5. narrowing with `if`, `typeof`, and guards
6. generics like `T`
7. validation vs assertion

## 7-Day Study Plan

This is meant to be short and practical, not academic.

### Day 1: Compile Time Vs Runtime

Read:

- TypeScript Handbook: intro + Everyday Types

Practice:

```ts
const name: string = 'Kai';
const age: number = 25;
```

Ask yourself:

- what does TypeScript check?
- what will still exist at runtime?

Goal:

- understand that types help before execution, not during execution

### Day 2: `any`, `unknown`, And `as`

Read:

- TypeScript Handbook: Everyday Types
- Exploring TypeScript sections on assertions and `unknown`

Practice:

```ts
const raw: unknown = JSON.parse('{"name":"Kai"}');
```

Try:

```ts
const user = raw as { name: string };
```

Ask:

- what did `as` change?
- what did it not change?

Goal:

- understand that `as` affects TypeScript’s trust, not runtime data

### Day 3: Union Types And Narrowing

Read:

- TypeScript Handbook: Narrowing

Practice:

```ts
function printName(name: string | null) {
  if (!name) return;
  console.log(name.toUpperCase());
}
```

Goal:

- understand how TypeScript learns more inside conditionals

### Day 4: Object Types And Function Types

Read:

- TypeScript Handbook: Object Types
- More on Functions

Practice:

```ts
type User = {
  id: string;
  name: string;
};

function greet(user: User): string {
  return `Hello, ${user.name}`;
}
```

Goal:

- get comfortable reading DTOs, service signatures, and typed return values

### Day 5: Generics

Read:

- TypeScript Handbook: Generics

Practice:

```ts
function identity<T>(value: T): T {
  return value;
}
```

Then relate it to:

```ts
async get<T>(key: string): Promise<T | null>
```

Goal:

- understand that `T` is chosen by the caller

### Day 6: Promise, Async/Await, And External Data

Read:

- review async function examples in your codebase
- read JavaScript runtime material from You Don’t Know JS Yet

Practice:

```ts
async function getUser(): Promise<{ id: string } | null> {
  return { id: '1' };
}
```

Goal:

- connect `Promise<T>` to Dart `Future<T>`
- understand where runtime values actually come from

### Day 7: Apply It To RunHop

Open these kinds of files in the project:

- DTOs
- services
- guards
- tests
- cache helpers

Look for:

- `as`
- `Promise<...>`
- `T`
- `string | null`
- request DTO validation

Ask for each one:

- is this compile-time only?
- is this runtime validated?
- is this safe, or just asserted?

Goal:

- stop reading TypeScript as syntax only
- start reading it as "what the compiler knows vs what the app actually guarantees"

## Fast Rules To Remember

- `as` does not convert data
- `Promise<T>` is like `Future<T>`
- `T` is a placeholder chosen by the caller
- TypeScript types mostly disappear at runtime
- outside data must be validated, not just asserted

## Good Next Questions

After this guide, the most useful next topics are:

- DTO validation in NestJS
- `class-validator` and `class-transformer`
- `unknown` vs `any`
- custom type guards
- schema validation libraries like `zod`
