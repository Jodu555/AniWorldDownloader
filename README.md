# AniWorldDownloader

Just a simple little program to download the aniworld videos

## TODO

- [x] Implement a provider Switch from VOE to some other
- [ ] Work out a way to switch the languages for Aniworld
- [x] Add some socket integration so the instance can be treated in an stack of unique servers
- [ ] Add some java stop assurance
- [ ] Work on some code splitting (all in one file is awful)
- [ ] Rename the NewInterceptor to PuppeteerInterceptor
- [ ] Rename the OldInterceptor to LegacyInterceptor
- [ ] Rename some variables and function collect is everything that calls the interceptors every thing else is Interceptor
- [ ] Work out a way to only use on lang and if it isnt supported use the other but with the option too always download everything

## Weird Copy Error

```

stderr: `thread 'main' panicked at 'Error: Could not paste from clipboard: Error { repr: Os { code:
5, message: "Zugriff verweigert" } }', src\\libcore\\result.rs:906:4\n` +
    'note: Run with `RUST_BACKTRACE=1` for a backtrace.\n',
  failed: true,
  timedOut: false,
  isCanceled: false,
  killed: false

```
