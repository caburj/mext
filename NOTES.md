# Notes

- Can I create a class registry inside this mext framework? How?


**Checkpoints**

- How to test installed module to only include its dependencies and exclude
   other extensions even if other modules are installed?

If we want to test M3Main, we should also make sure that all the classes that
used M3Main should only compile up to M3. Since Main is using Foo at module0,
and at module3 Foo is also extended, any extension beyond module3 should not
also be included in Foo.

The only way to do this is that when compiling M3Main, it should somehow inform
all succeeding compiles to only include its dependencies.

```
m0 <- m1
^     ^
|     |
m2 <- m3
^
|
m4

[Main] => M3Main -> M2Main -> M1Main -> Main
[Foo] => M3Foo -> M1Foo -> Foo
```

When testing M2Main even if all modules are installed, the following should be
the inheritance chain for both Main and Foo.

```
[Main] => M2Main -> Main
[Foo] => Foo
```

This is impossible if not too complex to implement. Simple solution is to test
without loading other modules and install only the dependencies. There will be
separation between `all-modules-installed` and `only-this-module-installed`
tests.

- looks like this is possible if we track the compilation tree.

**Adding types**

If we typed `compile` such that it has a type of the returned class, we can then
have a typed version of mext.
- this appears to be not impossible but it will be difficult.


**Modular Framework**

I need a modular framework using this mext.
1. Each module should have an entry point where we do cleanup when loading a module,
   also, it is where we import declared extensions/classes.
2. class Main should be the starting point. Or, there should be an core module
   responsible for running the application.
   - config -> App -> running app
   - perhaps in the backend we say, here is my app configuration, return me my app.
